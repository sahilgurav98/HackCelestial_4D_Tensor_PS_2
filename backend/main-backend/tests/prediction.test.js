const request = require("supertest");

jest.mock(
  "../src/services/ml.service",
  () => ({
    predictDelay: jest.fn()
  })
);

const mlService =
  require("../src/services/ml.service");

const {
  app
} = require("../src/server");

describe("Prediction API", () => {
  test("POST /api/predictions/delay", async () => {
    mlService.predictDelay.mockResolvedValue({
      delayProbability: 0.78,
      predictedDelayMinutes: 38,
      risk: "HIGH"
    });

    const response = await request(app)
      .post("/api/predictions/delay")
      .send({
        transportType: "FLIGHT",
        origin: "BOM",
        destination: "DEL",
        departureHour: 10,
        dayOfWeek: 5,
        month: 10,
        distanceKm: 1150,
        durationMinutes: 120,
        currentDelayMinutes: 30,
        weatherRisk: "HIGH",
        congestionRisk: "MEDIUM"
      });

    expect(response.statusCode).toBe(200);

    expect(
      response.body.prediction
        .predictedDelayMinutes
    ).toBe(38);
  });
});