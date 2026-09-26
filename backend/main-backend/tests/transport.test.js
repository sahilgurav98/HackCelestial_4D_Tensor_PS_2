const request = require("supertest");

jest.mock(
  "../src/services/dataProvider.service",
  () => ({
    getFlights: jest.fn(),
    getTrains: jest.fn(),
    getFlight: jest.fn(),
    getTrain: jest.fn()
  })
);

const dataProvider =
  require("../src/services/dataProvider.service");

const {
  app
} = require("../src/server");

describe("Transport APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/transports combines flights and trains", async () => {
    dataProvider.getFlights.mockResolvedValue([
      {
        id: "FL001",
        type: "FLIGHT"
      }
    ]);

    dataProvider.getTrains.mockResolvedValue([
      {
        id: "TR001",
        type: "TRAIN"
      }
    ]);

    const response = await request(app)
      .get("/api/transports");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveLength(2);
  });

  test("GET /api/transports/:id returns flight", async () => {
    dataProvider.getFlight.mockResolvedValue({
      id: "FL001",
      type: "FLIGHT"
    });

    const response = await request(app)
      .get("/api/transports/FL001");

    expect(response.statusCode).toBe(200);

    expect(response.body.data.id).toBe(
      "FL001"
    );
  });
});