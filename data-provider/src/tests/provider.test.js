const test = require("node:test");
const assert = require("node:assert/strict");
const transport = require("../transport.service");

test("returns a shared transport shape for flights and trains", () => {
  const [flight] = transport.search({ type: "FLIGHT", origin: "BOM", destination: "DEL" });
  const [train] = transport.search({ type: "TRAIN", origin: "DEL", destination: "JP" });
  for (const item of [flight, train]) {
    assert.ok(item.id);
    assert.ok(item.type);
    assert.ok(item.origin.code);
    assert.ok(item.destination.code);
    assert.equal(typeof item.delayMinutes, "number");
  }
});

test("normalizes NDLS to DEL and applies a deterministic delay", () => {
  const delayed = transport.applyDelay("FL001", 80);
  assert.equal(delayed.origin.code, "BOM");
  assert.equal(delayed.destination.code, "DEL");
  assert.equal(delayed.status, "DELAYED");
  assert.equal(delayed.delayMinutes, 80);
  transport.reset();
});
