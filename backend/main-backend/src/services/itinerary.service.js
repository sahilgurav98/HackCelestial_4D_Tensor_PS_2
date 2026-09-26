const Itinerary = require("../models/Itinerary");
const DisruptionEvent = require("../models/DisruptionEvent");
const RecoveryPlan = require("../models/RecoveryPlan");

const dataProvider = require("./dataProvider.service");
const neo4j = require("./neo4j.service");

async function createItinerary(tripId, legs) {
  const existing = await Itinerary.findOne({ tripId });

  if (existing) {
    const error = new Error(
      `Itinerary ${tripId} already exists`
    );

    error.code = "ITINERARY_EXISTS";

    throw error;
  }

  // Validate all transports before creating itinerary.
  for (const leg of legs) {
    if (leg.type === "FLIGHT") {
      await dataProvider.getFlight(leg.transportId);
    } else if (leg.type === "TRAIN") {
      await dataProvider.getTrain(leg.transportId);
    } else {
      const error = new Error(
        `Unsupported transport type: ${leg.type}`
      );

      error.code = "INVALID_TRANSPORT_TYPE";

      throw error;
    }
  }

  const itinerary = await Itinerary.create({
    tripId,
    legs,
    status: "ACTIVE"
  });

  try {
    await neo4j.registerJourney({
      tripId,
      legs
    });
  } catch (error) {
    // Roll back MongoDB itinerary if Neo4j registration fails.
    await Itinerary.deleteOne({ tripId });

    error.code = "NEO4J_REGISTRATION_FAILED";

    throw error;
  }

  return itinerary;
}

async function getItinerary(tripId) {
  const itinerary = await Itinerary.findOne({ tripId }).lean();

  if (!itinerary) {
    const error = new Error(
      `Itinerary ${tripId} was not found`
    );

    error.code = "ITINERARY_NOT_FOUND";

    throw error;
  }

  return itinerary;
}

async function getDependencies(tripId) {
  await getItinerary(tripId);

  return neo4j.getDependencies(tripId);
}

async function checkDisruption(tripId) {
  const itinerary = await getItinerary(tripId);

  const affected = await neo4j.getAffected(tripId);

  const isAffected =
    affected?.affected === true ||
    affected?.connections?.some(
      (connection) =>
        connection.status === "BROKEN" ||
        connection.status === "AT_RISK"
    );

  let newStatus = "ACTIVE";

  if (isAffected) {
    const hasBrokenConnection =
      affected.connections?.some(
        (connection) =>
          connection.status === "BROKEN"
      );

    newStatus = hasBrokenConnection
      ? "DISRUPTED"
      : "AT_RISK";
  }

  await Itinerary.updateOne(
    { tripId },
    {
      $set: {
        status: newStatus
      }
    }
  );

  if (isAffected && affected.connections) {
    for (const connection of affected.connections) {
      if (
        connection.status === "BROKEN" ||
        connection.status === "AT_RISK"
      ) {
        await DisruptionEvent.create({
          tripId,
          transportId: connection.from,
          eventType:
            connection.status === "BROKEN"
              ? "CONNECTION_BROKEN"
              : "DELAY",
          affectedTransport: connection.to,
          connectionStatus: connection.status,
          reason:
            connection.reason ||
            "Transport disruption affected itinerary connection",
          details: connection
        });
      }
    }
  }

  return {
    tripId,
    status: newStatus,
    affected: isAffected,
    details: affected,
    itinerary
  };
}

async function getAffected(tripId) {
  await getItinerary(tripId);

  return neo4j.getAffected(tripId);
}

async function getRecovery(tripId) {
  await getItinerary(tripId);

  const recovery = await neo4j.getRecovery(tripId);

  if (
    !recovery ||
    !recovery.affectedTransport
  ) {
    return recovery;
  }

  const recoveryPlan =
    await RecoveryPlan.findOneAndUpdate(
      {
        tripId,
        originalTransport:
          recovery.affectedTransport
      },
      {
        $set: {
          options: recovery.options || [],
          recommendedOption:
            recovery.recommendedOption || null
        }
      },
      {
        upsert: true,
        new: true
      }
    );

  return {
    ...recovery,
    recoveryPlanId: recoveryPlan._id
  };
}

async function selectRecovery(tripId, transportId) {
  const itinerary = await getItinerary(tripId);

  const recoveryPlan =
    await RecoveryPlan.findOne({ tripId }).sort({
      createdAt: -1
    });

  if (!recoveryPlan) {
    const error = new Error(
      "No recovery plan exists for this itinerary"
    );

    error.code = "RECOVERY_PLAN_NOT_FOUND";

    throw error;
  }

  const selectedOption =
    recoveryPlan.options.find(
      (option) =>
        option.transportId === transportId ||
        option.id === transportId
    );

  if (!selectedOption) {
    const error = new Error(
      `Recovery option ${transportId} was not found`
    );

    error.code = "RECOVERY_OPTION_NOT_FOUND";

    throw error;
  }

  recoveryPlan.selectedOption = selectedOption;

  await recoveryPlan.save();

  // Replace affected transport with selected recovery transport.
  const updatedLegs = itinerary.legs.map(
    (leg) => {
      if (
        leg.transportId ===
        recoveryPlan.originalTransport
      ) {
        return {
          transportId:
            selectedOption.transportId,
          type:
            selectedOption.type ||
            leg.type
        };
      }

      return leg;
    }
  );

  await Itinerary.updateOne(
    { tripId },
    {
      $set: {
        legs: updatedLegs,
        status: "RECOVERED",
        selectedRecovery: {
          transportId:
            selectedOption.transportId,
          selectedAt: new Date()
        }
      }
    }
  );

  return {
    tripId,
    status: "RECOVERED",
    selectedOption,
    legs: updatedLegs
  };
}

module.exports = {
  createItinerary,
  getItinerary,
  getDependencies,
  checkDisruption,
  getAffected,
  getRecovery,
  selectRecovery
};