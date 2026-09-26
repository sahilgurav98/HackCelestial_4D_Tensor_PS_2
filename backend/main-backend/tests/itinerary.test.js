const request = require("supertest");

jest.mock(
  "../src/services/itinerary.service",
  () => ({
    createItinerary: jest.fn(),
    getItinerary: jest.fn(),
    getDependencies: jest.fn(),
    checkDisruption: jest.fn(),
    getAffected: jest.fn(),
    getRecovery: jest.fn(),
    selectRecovery: jest.fn()
  })
);

const itineraryService =
  require("../src/services/itinerary.service");

const {
  app
} = require("../src/server");

describe("Itinerary APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/itineraries creates itinerary", async () => {
    itineraryService.createItinerary.mockResolvedValue({
      tripId: "TG001",
      status: "ACTIVE",
      legs: [
        {
          transportId: "FL001",
          type: "FLIGHT"
        },
        {
          transportId: "TR001",
          type: "TRAIN"
        }
      ]
    });

    const response = await request(app)
      .post("/api/itineraries")
      .send({
        tripId: "TG001",
        legs: [
          {
            transportId: "FL001",
            type: "FLIGHT"
          },
          {
            transportId: "TR001",
            type: "TRAIN"
          }
        ]
      });

    expect(response.statusCode).toBe(201);

    expect(response.body.success).toBe(true);

    expect(
      response.body.data.tripId
    ).toBe("TG001");
  });

  test("GET itinerary", async () => {
    itineraryService.getItinerary.mockResolvedValue({
      tripId: "TG001",
      status: "ACTIVE"
    });

    const response = await request(app)
      .get("/api/itineraries/TG001");

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.tripId
    ).toBe("TG001");
  });

  test("GET dependencies", async () => {
    itineraryService.getDependencies.mockResolvedValue({
      tripId: "TG001",
      connections: [
        {
          from: "FL001",
          to: "TR001",
          status: "SAFE"
        }
      ]
    });

    const response = await request(app)
      .get(
        "/api/itineraries/TG001/dependencies"
      );

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.connections
    ).toHaveLength(1);
  });

  test("GET recovery", async () => {
    itineraryService.getRecovery.mockResolvedValue({
      originalStatus: "BROKEN",
      affectedTransport: "TR001",
      options: [
        {
          transportId: "TR002"
        }
      ]
    });

    const response = await request(app)
      .get(
        "/api/itineraries/TG001/recovery"
      );

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.options
    ).toHaveLength(1);
  });
});