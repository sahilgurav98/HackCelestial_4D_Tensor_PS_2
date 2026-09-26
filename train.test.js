const request = require("supertest");
const app = require("../src/app");

describe("Train Data Provider API", () => {
  beforeEach(async () => {
    await request(app).post("/api/simulator/reset");
  });

  test("health check", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, service: "travelguard-data-provider", status: "healthy" });
  });

  test("list includes three demo trains", async () => {
    const res = await request(app).get("/api/trains");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.map((train) => train.id)).toEqual(expect.arrayContaining(["TR001", "TR002", "TR003"]));
  });

  test.each(["TR001", "TR002", "TR003"])("get %s", async (id) => {
    const res = await request(app).get(`/api/trains/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  test("unknown train returns consistent 404", async () => {
    const res = await request(app).get("/api/trains/NOPE");
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe("TRAIN_NOT_FOUND");
  });

  test("search by route", async () => {
    const res = await request(app).get("/api/trains/search?origin=NDLS&destination=JP");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveLength(3);
  });

  test("historical dataset has 200+ synthetic records", async () => {
    const res = await request(app).get("/api/trains/history");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.records.length).toBeGreaterThanOrEqual(200);
    expect(res.body.data.dataSource).toBe("SYNTHETIC_DEMO");
  });

  test("train history endpoint works", async () => {
    const res = await request(app).get("/api/trains/TR001/history");
    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test("simulates delay", async () => {
    const res = await request(app).post("/api/simulator/trains/TR001/delay").send({ delayMinutes: 120 });
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toEqual({ id: "TR001", status: "DELAYED", delayMinutes: 120 });
  });

  test("reset restores initial state", async () => {
    await request(app).post("/api/simulator/trains/TR001/delay").send({ delayMinutes: 120 });
    const reset = await request(app).post("/api/simulator/reset");
    expect(reset.statusCode).toBe(200);
    const train = await request(app).get("/api/trains/TR001");
    expect(train.body.data.status).toBe("ON_TIME");
    expect(train.body.data.delayMinutes).toBe(0);
  });

  test("rejects negative delay", async () => {
    const res = await request(app).post("/api/simulator/trains/TR001/delay").send({ delayMinutes: -1 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe("INVALID_DELAY");
  });
});
