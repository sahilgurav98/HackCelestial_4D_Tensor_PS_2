const test = require("node:test");
const assert = require("node:assert/strict");
const {
  classifyConnection,
  calculateConnection,
  rankAlternatives
} = require("../src/services/feasibility");

test("classifies safe, at-risk, and broken connections deterministically", () => {
  assert.equal(classifyConnection(120, 30), "SAFE");
  assert.equal(classifyConnection(40, 30), "AT_RISK");
  assert.equal(classifyConnection(20, 30), "BROKEN");
});

test("calculates expected arrival and transfer buffer from delay", () => {
  const result = calculateConnection({
    from: "FL001",
    to: "TR001",
    fromScheduledArrival: "2026-09-26T12:00:00+05:30",
    delayMinutes: 100,
    toScheduledDeparture: "2026-09-26T14:00:00+05:30",
    requiredTransferMinutes: 30
  });

  assert.equal(result.availableTransferMinutes, 20);
  assert.equal(result.bufferMinutes, -10);
  assert.equal(result.status, "BROKEN");
});

test("ranks recovery alternatives by arrival, waiting, transfers, then risk", () => {
  const ranked = rankAlternatives([
    { transportId: "LATE", arrival: "2026-09-26T22:00:00Z", waitingMinutes: 100, transfers: 0, risk: "LOW" },
    { transportId: "EARLY", arrival: "2026-09-26T21:00:00Z", waitingMinutes: 200, transfers: 1, risk: "MEDIUM" },
    { transportId: "EARLY_LOW_WAIT", arrival: "2026-09-26T21:00:00Z", waitingMinutes: 100, transfers: 0, risk: "LOW" }
  ]);

  assert.deepEqual(ranked.map((option) => option.transportId), ["EARLY_LOW_WAIT", "EARLY", "LATE"]);
});
