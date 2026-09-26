const Itinerary = require("../models/Itinerary");
const DisruptionEvent = require("../models/DisruptionEvent");
const RecoveryPlan = require("../models/RecoveryPlan");

const dataProvider = require("./dataProvider.service");
const neo4j = require("./neo4j.service");
const { getDemoTransport } = require("./demoData.service");
const env = require("../config/env");

async function resolveTransport(leg) {
  const demoTransport = getDemoTransport(leg.transportId);
  if (env.demoMode && demoTransport) {
    return demoTransport;
  }

  const getter = leg.type === "FLIGHT"
    ? dataProvider.getFlight
    : leg.type === "TRAIN"
      ? dataProvider.getTrain
      : null;

  if (!getter) {
    const error = new Error(`Unsupported transport type: ${leg.type}`);
    error.code = "INVALID_TRANSPORT_TYPE";
    throw error;
  }

  try {
    return await getter(leg.transportId);
  } catch (error) {
    if (demoTransport) return demoTransport;
    throw error;
  }
}

function ownerFilter(userId) {
  return userId ? { userId } : { userId: null };
}

function graphJourneyId(tripId, userId) {
  return `${userId ? userId.toString() : "public"}:${tripId}`;
}

async function createItinerary(tripId, legs, userId = null) {
  const existing = await Itinerary.findOne({ tripId, ...ownerFilter(userId) });

  if (existing) {
    const error = new Error(
      `Itinerary ${tripId} already exists`
    );

    error.code = "ITINERARY_EXISTS";

    throw error;
  }

  const transports = await Promise.all(legs.map(resolveTransport));
  const graphLegs = legs.map((leg, index) => ({
    transport: transports[index],
    minimumTransferMinutes: leg.minimumTransferMinutes || 30
  }));

  const itinerary = await Itinerary.create({
    tripId,
    legs,
    userId: userId || null,
    status: "ACTIVE"
  });

  try {
    await neo4j.registerJourney({
      tripId: graphJourneyId(tripId, userId),
    legs: graphLegs
    });
  } catch (error) {
    // Roll back MongoDB itinerary if Neo4j registration fails.
    await Itinerary.deleteOne({ tripId, ...ownerFilter(userId) });

    error.code = "NEO4J_REGISTRATION_FAILED";

    throw error;
  }

  return itinerary;
}

async function getItinerary(tripId, userId = null) {
  const itinerary = await Itinerary.findOne({ tripId, ...ownerFilter(userId) }).lean();

  if (!itinerary) {
    const error = new Error(
      `Itinerary ${tripId} was not found`
    );

    error.code = "ITINERARY_NOT_FOUND";

    throw error;
  }

  return itinerary;
}

async function getDependencies(tripId, userId = null) {
  await getItinerary(tripId, userId);

  return neo4j.getDependencies(graphJourneyId(tripId, userId));
}

async function checkDisruption(tripId, userId = null) {
  const itinerary = await getItinerary(tripId, userId);

  const graphId = graphJourneyId(tripId, userId);
  const affected = await neo4j.getAffected(graphId);

  const isAffected =
    affected?.affected === true ||
    affected?.affectedConnections?.some(
      (connection) =>
        connection.status === "BROKEN" ||
        connection.status === "AT_RISK"
    );

  let newStatus = "ACTIVE";

  if (isAffected) {
    const hasBrokenConnection =
      affected.affectedConnections?.some(
        (connection) =>
          connection.status === "BROKEN"
      );

    newStatus = hasBrokenConnection
      ? "DISRUPTED"
      : "AT_RISK";
  }

  await Itinerary.updateOne(
    { tripId, ...ownerFilter(userId) },
    {
      $set: {
        status: newStatus
      }
    }
  );

  if (isAffected && affected.affectedConnections) {
    for (const connection of affected.affectedConnections) {
      if (
        connection.status === "BROKEN" ||
        connection.status === "AT_RISK"
      ) {
        await DisruptionEvent.create({
          userId: userId || null,
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
    itinerary: {
      ...itinerary,
      status: newStatus
    }
  };
}

async function listItineraries(userId = null) {
  return Itinerary.find(ownerFilter(userId)).sort({ updatedAt: -1 }).lean();
}

async function getAffected(tripId, userId = null) {
  await getItinerary(tripId, userId);

  return neo4j.getAffected(graphJourneyId(tripId, userId));
}

async function monitorItinerary(tripId, userId = null) {
  const itinerary = await getItinerary(tripId, userId);
  const graphId = graphJourneyId(tripId, userId);
  const transports = await Promise.all(itinerary.legs.map((leg) => dataProvider.getLiveTransport(leg.transportId)));
  await Promise.all(transports.map((item) => neo4j.simulateDelay(graphId, item.id, item.delayMinutes)));
  const disruption = await checkDisruption(tripId, userId);
  const dependencies = await neo4j.getDependencies(graphId);
  const recovery = disruption.status === "DISRUPTED" ? await getRecovery(tripId, userId) : null;
  return { tripId, checkedAt: new Date().toISOString(), transports, dependencies, disruption, recovery };
}

async function getRecovery(tripId, userId = null) {
  await getItinerary(tripId, userId);

  let candidates = [];
  try {
    const affected = await neo4j.getAffected(graphJourneyId(tripId, userId));
    const broken = affected.affectedConnections?.[0];
    if (broken) {
      const [from, to] = await Promise.all([
        dataProvider.getTransport(broken.from),
        dataProvider.getTransport(broken.to)
      ]);
      candidates = await dataProvider.getTransports({
        origin: from.destination?.code,
        destination: to.destination?.code
      });
    }
  } catch (error) {
    if (!env.demoMode) throw error;
  }
  const recovery = await neo4j.getRecovery(graphJourneyId(tripId, userId), candidates);

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
        ...ownerFilter(userId),
        originalTransport:
          recovery.affectedTransport
      },
      {
        $set: {
          userId: userId || null,
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

async function selectRecovery(tripId, transportId, userId = null) {
  const itinerary = await getItinerary(tripId, userId);
  let candidates = [];
  try {
    const affected = await neo4j.getAffected(graphJourneyId(tripId, userId));
    const broken = affected.affectedConnections?.[0];
    if (broken) {
      const [from, to] = await Promise.all([
        dataProvider.getTransport(broken.from),
        dataProvider.getTransport(broken.to)
      ]);
      candidates = await dataProvider.getTransports({
        origin: from.destination?.code,
        destination: to.destination?.code
      });
    }
  } catch (error) {
    if (!env.demoMode) throw error;
  }
  const graphId = graphJourneyId(tripId, userId);
  const validation = await neo4j.selectRecovery(graphId, transportId, candidates);
  const recovery = await neo4j.getRecovery(graphId, candidates);
  const selectedOption = validation.selectedOption;
  const originalTransport = recovery.affectedTransport ||
    recovery.brokenConnections?.[0]?.to;

  if (!originalTransport) {
    const error = new Error("No broken connection exists for this itinerary");
    error.code = "INVALID_RECOVERY_SELECTION";
    throw error;
  }

  await RecoveryPlan.findOneAndUpdate(
    { tripId, originalTransport, ...ownerFilter(userId) },
    { $set: { userId: userId || null, options: recovery.options || recovery.alternatives || [], selectedOption } },
    { upsert: true, new: true }
  );

  // Replace affected transport with selected recovery transport.
  const updatedLegs = itinerary.legs.map(
    (leg) => {
      if (
        leg.transportId === originalTransport
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
    { tripId, ...ownerFilter(userId) },
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

  const refreshedTransports = await Promise.all(updatedLegs.map(resolveTransport));
  await neo4j.registerJourney({
    tripId: graphId,
    legs: updatedLegs.map((leg, index) => ({ transport: refreshedTransports[index], minimumTransferMinutes: leg.minimumTransferMinutes || 30 }))
  });

  return {
    tripId,
    status: "RECOVERED",
    selectedOption,
    legs: updatedLegs
  };
}

async function simulateDelay(tripId, transportId, delayMinutes, userId = null) {
  const numericDelay = Number(delayMinutes);
  if (!Number.isFinite(numericDelay) || numericDelay < 0) {
    const error = new Error("delayMinutes must be a non-negative number");
    error.code = "INVALID_DELAY";
    throw error;
  }
  await getItinerary(tripId, userId);
  try {
    await dataProvider.simulateDelay(transportId, numericDelay);
  } catch (error) {
    if (!env.demoMode) throw error;
  }
  return neo4j.simulateDelay(graphJourneyId(tripId, userId), transportId, numericDelay);
}

module.exports = {
  createItinerary,
  listItineraries,
  getItinerary,
  getDependencies,
  checkDisruption,
  getAffected,
  monitorItinerary,
  getRecovery,
  simulateDelay,
  selectRecovery
};
