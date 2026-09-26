const request = require("supertest");
const app = require("../travelguard-data-provider/src/app");

describe("Flight Data Provider API", () => {
  beforeEach(async () => {
    await request(app).post("/api/simulator/reset");
  });

  test("GET /health returns healthy service", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe("travelguard-data-provider");
    expect(response.body.status).toBe("healthy");
  });

  test("GET /api/flights returns at least 50 flights", async () => {
    const response = await request(app).get("/api/flights");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(50);
    expect(response.body.data[0]).toHaveProperty("id");
    expect(response.body.data[0]).toHaveProperty("type", "FLIGHT");
  });

  test("GET /api/flights/FL001 returns one flight", async () => {
    const response = await request(app).get("/api/flights/FL001");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe("FL001");
  });

  test("invalid flight ID returns FLIGHT_NOT_FOUND", async () => {
    const response = await request(app).get("/api/flights/FL9999");

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("FLIGHT_NOT_FOUND");
  });

  test("search endpoint filters by origin and destination", async () => {
    const response = await request(app).get(
      "/api/flights/search?origin=BOM&destination=DEL"
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    for (const flight of response.body.data) {
      expect(flight.origin.code).toBe("BOM");
      expect(flight.destination.code).toBe("DEL");
    }
  });

  test("GET /api/flights/history returns at least 200 historical records", async () => {
    const response = await request(app).get("/api/flights/history");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(200);
    expect(response.body.data[0]).toHaveProperty("delayMinutes");
    expect(response.body.data[0]).not.toHaveProperty("targetDelayMinutes");
  });

  test("GET /api/flights/FL001/history returns history for FL001", async () => {
    const response = await request(app).get("/api/flights/FL001/history");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);

    for (const record of response.body.data) {
      expect(record.transportId).toBe("FL001");
    }
  });

  test("delay simulator updates the current flight", async () => {
    const delayResponse = await request(app)
      .post("/api/simulator/flights/FL001/delay")
      .send({ delayMinutes: 120 });

    expect(delayResponse.statusCode).toBe(200);
    expect(delayResponse.body.success).toBe(true);
    expect(delayResponse.body.data.id).toBe("FL001");
    expect(delayResponse.body.data.status).toBe("DELAYED");
    expect(delayResponse.body.data.delayMinutes).toBe(120);
    expect(delayResponse.body.data.actualDeparture).not.toBeNull();
    expect(delayResponse.body.data.actualArrival).not.toBeNull();

    const flightResponse = await request(app).get("/api/flights/FL001");
    expect(flightResponse.body.data.status).toBe("DELAYED");
    expect(flightResponse.body.data.delayMinutes).toBe(120);

    const statusResponse = await request(app).get(
      "/api/flights/FL001/status"
    );
    expect(statusResponse.body.data.status).toBe("DELAYED");
  });

  test("reset simulator restores the original flight state", async () => {
    await request(app)
      .post("/api/simulator/flights/FL001/delay")
      .send({ delayMinutes: 120 });

    const resetResponse = await request(app).post(
      "/api/simulator/reset"
    );

    expect(resetResponse.statusCode).toBe(200);
    expect(resetResponse.body.success).toBe(true);

    const flightResponse = await request(app).get("/api/flights/FL001");
    expect(flightResponse.body.data.status).toBe("ON_TIME");
    expect(flightResponse.body.data.delayMinutes).toBe(0);
    expect(flightResponse.body.data.actualDeparture).toBeNull();
    expect(flightResponse.body.data.actualArrival).toBeNull();
  });

  test("invalid delay value returns INVALID_DELAY", async () => {
    const response = await request(app)
      .post("/api/simulator/flights/FL001/delay")
      .send({ delayMinutes: -10 });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("INVALID_DELAY");
  });

  test("non-integer delay value returns INVALID_DELAY", async () => {
    const response = await request(app)
      .post("/api/simulator/flights/FL001/delay")
      .send({ delayMinutes: 12.5 });

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe("INVALID_DELAY");
  });

  test("delay of zero returns ON_TIME", async () => {
    await request(app)
      .post("/api/simulator/flights/FL001/delay")
      .send({ delayMinutes: 0 });

    const response = await request(app).get("/api/flights/FL001");

    expect(response.body.data.status).toBe("ON_TIME");
    expect(response.body.data.delayMinutes).toBe(0);
  });
});
