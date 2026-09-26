const { driver } = require("../config/neo4j");
const {
  calculateConnection,
  minutesBetween,
  riskForAlternative,
  rankAlternatives
} = require("./feasibility");

const DEMO_ALTERNATIVES = [
  {
    id: "TR002",
    type: "TRAIN",
    operator: "TravelGuard Demo Rail",
    serviceNumber: "TR002",
    status: "ON_TIME",
    delayMinutes: 0,
    scheduledDeparture: "2026-09-26T16:30:00+05:30",
    scheduledArrival: "2026-09-26T21:00:00+05:30",
    origin: { code: "DEL", name: "Delhi Airport", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur Junction", city: "Jaipur" },
    durationMinutes: 270,
    distanceKm: 280
  },
  {
    id: "TR003",
    type: "TRAIN",
    operator: "TravelGuard Demo Rail",
    serviceNumber: "TR003",
    status: "ON_TIME",
    delayMinutes: 0,
    scheduledDeparture: "2026-09-26T18:00:00+05:30",
    scheduledArrival: "2026-09-26T22:30:00+05:30",
    origin: { code: "DEL", name: "Delhi Airport", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur Junction", city: "Jaipur" },
    durationMinutes: 270,
    distanceKm: 280
  },
  {
    id: "BUS001",
    type: "BUS",
    operator: "TravelGuard Demo Coach",
    serviceNumber: "BUS001",
    status: "ON_TIME",
    delayMinutes: 0,
    scheduledDeparture: "2026-09-26T17:00:00+05:30",
    scheduledArrival: "2026-09-26T23:00:00+05:30",
    origin: { code: "DEL", name: "Delhi", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur", city: "Jaipur" },
    durationMinutes: 360,
    distanceKm: 280
  }
];

async function registerJourney(tripId, legs) {
  const session = driver.session();

  try {
    // ------------------------------------------------
    // 1. Create Trip
    // ------------------------------------------------

    await session.run(
      `
      MERGE (t:Trip {id: $tripId})
      `,
      {
        tripId
      }
    );

    // ------------------------------------------------
    // 2. Create Transport nodes
    // ------------------------------------------------

    for (const leg of legs) {
      await session.run(
        `
        MERGE (tr:Transport {id: $id})
        SET
          tr.type = $type,
          tr.operator = $operator,
          tr.serviceNumber = $serviceNumber,
          tr.status = $status,
          tr.delayMinutes = $delayMinutes,
          tr.scheduledDeparture = datetime($scheduledDeparture),
          tr.scheduledArrival = datetime($scheduledArrival),
          tr.originCode = $originCode,
          tr.destinationCode = $destinationCode,
          tr.durationMinutes = $durationMinutes,
          tr.distanceKm = $distanceKm
        `,
        {
          id: leg.transport.id,
          type: leg.transport.type,
          operator: leg.transport.operator || null,
          serviceNumber:
            leg.transport.serviceNumber || null,

          status:
            leg.transport.status || "ON_TIME",

          delayMinutes:
            leg.transport.delayMinutes || 0,

          scheduledDeparture:
            leg.transport.scheduledDeparture,

          scheduledArrival:
            leg.transport.scheduledArrival,

          originCode:
            leg.transport.origin?.code || null,

          destinationCode:
            leg.transport.destination?.code || null,

          durationMinutes:
            leg.transport.durationMinutes || 0,

          distanceKm:
            leg.transport.distanceKm || 0
        }
      );

      // ------------------------------------------------
      // 3. Trip → Transport
      // ------------------------------------------------

      await session.run(
        `
        MATCH (t:Trip {id: $tripId})
        MATCH (tr:Transport {id: $transportId})

        MERGE (t)-[:HAS_LEG]->(tr)
        `,
        {
          tripId,
          transportId: leg.transport.id
        }
      );

      // ------------------------------------------------
      // 4. Create origin Location
      // ------------------------------------------------

      await session.run(
        `
        MERGE (l:Location {
          code: $code
        })
        SET l.name = $name,
            l.city = $city
        `,
        {
          code:
            leg.transport.origin?.code,

          name:
            leg.transport.origin?.name || null,

          city:
            leg.transport.origin?.city || null
        }
      );

      // ------------------------------------------------
      // 5. Create destination Location
      // ------------------------------------------------

      await session.run(
        `
        MERGE (l:Location {
          code: $code
        })
        SET l.name = $name,
            l.city = $city
        `,
        {
          code:
            leg.transport.destination?.code,

          name:
            leg.transport.destination?.name || null,

          city:
            leg.transport.destination?.city || null
        }
      );

      // ------------------------------------------------
      // 6. Transport → Origin
      // ------------------------------------------------

      await session.run(
        `
        MATCH (tr:Transport {id: $transportId})
        MATCH (l:Location {code: $originCode})

        MERGE (tr)-[:DEPARTS_FROM]->(l)
        `,
        {
          transportId: leg.transport.id,
          originCode:
            leg.transport.origin?.code
        }
      );

      // ------------------------------------------------
      // 7. Transport → Destination
      // ------------------------------------------------

      await session.run(
        `
        MATCH (tr:Transport {id: $transportId})
        MATCH (l:Location {code: $destinationCode})

        MERGE (tr)-[:ARRIVES_AT]->(l)
        `,
        {
          transportId: leg.transport.id,
          destinationCode:
            leg.transport.destination?.code
        }
      );
    }

    // ------------------------------------------------
    // 8. Create connections between legs
    // ------------------------------------------------

    for (let i = 0; i < legs.length - 1; i++) {
      const current = legs[i];
      const next = legs[i + 1];

      await session.run(
        `
        MATCH (a:Transport {id: $fromId})
        MATCH (b:Transport {id: $toId})

        MERGE (a)-[c:CONNECTS_TO]->(b)

        SET c.minimumTransferMinutes =
          $minimumTransferMinutes
        `,
        {
          fromId: current.transport.id,
          toId: next.transport.id,

          minimumTransferMinutes:
            next.minimumTransferMinutes || 30
        }
      );
    }

    return {
      tripId,
      legs
    };
  } finally {
    await session.close();
  }
}


async function getDependencies(tripId) {
  const session = driver.session();

  try {
    const result = await session.run(
      `
      MATCH
        (t:Trip {id: $tripId})
        -[:HAS_LEG]->
        (a:Transport)
        -[c:CONNECTS_TO]->
        (b:Transport)

      RETURN
        a.id AS from,
        b.id AS to,

        a.scheduledArrival AS fromScheduledArrival,
        a.delayMinutes AS delayMinutes,

        b.scheduledDeparture AS toScheduledDeparture,

        c.minimumTransferMinutes
          AS requiredTransferMinutes

      ORDER BY fromScheduledArrival
      `,
      {
        tripId
      }
    );

    return result.records.map((record) => calculateConnection({
      from: record.get("from"),
      to: record.get("to"),

      fromScheduledArrival:
        record.get("fromScheduledArrival"),

      delayMinutes:
        record.get("delayMinutes"),

      toScheduledDeparture:
        record.get("toScheduledDeparture"),

      requiredTransferMinutes: record.get("requiredTransferMinutes")
    }));
  } finally {
    await session.close();
  }
}

async function getAffected(tripId) {
  const connections = await getDependencies(tripId);
  const affectedConnections = connections.filter(
    (connection) => connection.status !== "SAFE"
  );

  return {
    tripId,
    affected: affectedConnections.length > 0,
    affectedConnections,
    affectedTransports: [...new Set(affectedConnections.map((connection) => connection.to))]
  };
}

async function getRecovery(tripId, externalCandidates = []) {
  const affected = await getAffected(tripId);
  const broken = affected.affectedConnections[0];

  if (!broken) {
    return {
      tripId,
      status: "NO_RECOVERY_REQUIRED",
      brokenConnections: [],
      alternatives: []
    };
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (a:Transport {id: $fromId})
      MATCH (b:Transport {id: $toId})
      MATCH (a)-[:ARRIVES_AT]->(origin:Location)
      MATCH (b)-[:ARRIVES_AT]->(destination:Location)
      RETURN origin.code AS originCode, origin.name AS originName, origin.city AS originCity,
             destination.code AS destinationCode, destination.name AS destinationName, destination.city AS destinationCity
      `,
      { fromId: broken.from, toId: broken.to }
    );
    const locations = result.records[0]?.toObject() || {};
    const candidates = await findCandidates(locations.originCode, locations.destinationCode, externalCandidates);
    const expectedArrival = new Date(broken.expectedArrival);

    const alternatives = rankAlternatives(
      candidates
        .filter((candidate) => candidate.id !== broken.to)
        .map((candidate) => {
          const departure = new Date(candidate.scheduledDeparture);
          const arrival = new Date(candidate.scheduledArrival);
          const waitingMinutes = minutesBetween(departure, expectedArrival);
          const feasible = expectedArrival.getTime() +
            broken.requiredTransferMinutes * 60000 <= departure.getTime();
          const bufferMinutes = waitingMinutes - broken.requiredTransferMinutes;
          return {
            transportId: candidate.id,
            type: candidate.type,
            operator: candidate.operator,
            origin: candidate.origin,
            destination: candidate.destination,
            departure: departure.toISOString(),
            arrival: arrival.toISOString(),
            waitingMinutes,
            durationMinutes: candidate.durationMinutes,
            totalRecoveryMinutes: minutesBetween(arrival, expectedArrival),
            transfers: 0,
            risk: riskForAlternative({ bufferMinutes }),
            feasible,
            cost: candidate.cost ?? null
          };
        })
        .filter((alternative) => alternative.feasible)
    );

    return {
      tripId,
      status: "RECOVERY_REQUIRED",
      brokenConnections: [broken],
      recoveryPoint: {
        code: locations.originCode,
        city: locations.originCity || locations.originName
      },
      destination: {
        code: locations.destinationCode,
        city: locations.destinationCity || locations.destinationName
      },
      affectedTransport: broken.to,
      alternatives,
      options: alternatives,
      recommendedOption: alternatives[0] || null
    };
  } finally {
    await session.close();
  }
}

async function findCandidates(originCode, destinationCode, externalCandidates = []) {
  if (externalCandidates.length) {
    const matching = externalCandidates.filter((candidate) =>
      candidate.origin?.code === originCode && candidate.destination?.code === destinationCode
    );
    if (matching.length) return matching;
  }

  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (tr:Transport)-[:DEPARTS_FROM]->(origin:Location),
            (tr)-[:ARRIVES_AT]->(destination:Location)
      WHERE origin.code = $originCode AND destination.code = $destinationCode
      RETURN tr
      ORDER BY tr.scheduledArrival
      `,
      { originCode, destinationCode }
    );
    const candidates = result.records.map((record) => record.get("tr").properties);
    const merged = [...candidates, ...DEMO_ALTERNATIVES];
    return merged.filter((candidate, index, all) =>
      all.findIndex((item) => item.id === candidate.id) === index
    );
  } finally {
    await session.close();
  }
}

async function simulateDelay(tripId, transportId, delayMinutes) {
  const session = driver.session();
  try {
    const result = await session.run(
      `
      MATCH (t:Trip {id: $tripId})-[:HAS_LEG]->(tr:Transport {id: $transportId})
      SET tr.delayMinutes = $delayMinutes,
          tr.status = CASE WHEN $delayMinutes > 0 THEN 'DELAYED' ELSE 'ON_TIME' END
      RETURN tr.id AS transportId, tr.delayMinutes AS delayMinutes, tr.status AS status
      `,
      { tripId, transportId, delayMinutes: Number(delayMinutes) }
    );
    if (!result.records.length) {
      const error = new Error(`Transport ${transportId} was not found on itinerary ${tripId}`);
      error.code = "TRANSPORT_NOT_FOUND";
      throw error;
    }
    return result.records[0].toObject();
  } finally {
    await session.close();
  }
}

async function selectRecovery(tripId, transportId, candidates = []) {
  const recovery = await getRecovery(tripId, candidates);
  const selected = recovery.alternatives.find((option) => option.transportId === transportId);
  if (!selected) {
    const error = new Error(`Recovery option ${transportId} is not feasible for ${tripId}`);
    error.code = "INVALID_RECOVERY_SELECTION";
    throw error;
  }
  return { tripId, selectedTransport: transportId, status: "SELECTED", selectedOption: selected };
}


module.exports = {
  registerJourney,
  getDependencies,
  getAffected,
  getRecovery,
  simulateDelay,
  selectRecovery
};
