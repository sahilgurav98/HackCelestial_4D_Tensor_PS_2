const request = require("supertest");

const {
  app
} = require("../src/server");

describe("Health API", () => {
  test("GET /health returns healthy", async () => {
    const response = await request(app)
      .get("/health");

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.status).toBe(
      "healthy"
    );
  });
});