const { driver } = require("../config/neo4j");

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

    return result.records.map((record) => ({
      from: record.get("from"),
      to: record.get("to"),

      fromScheduledArrival:
        record.get("fromScheduledArrival"),

      delayMinutes:
        record.get("delayMinutes"),

      toScheduledDeparture:
        record.get("toScheduledDeparture"),

      requiredTransferMinutes:
        record.get(
          "requiredTransferMinutes"
        )
    }));
  } finally {
    await session.close();
  }
}


module.exports = {
  registerJourney,
  getDependencies
};