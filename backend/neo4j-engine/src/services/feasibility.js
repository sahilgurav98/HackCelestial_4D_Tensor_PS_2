const STATUS = {
  SAFE: "SAFE",
  AT_RISK: "AT_RISK",
  BROKEN: "BROKEN"
};

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && typeof value.toString === "function") {
    return new Date(value.toString());
  }
  return new Date(value);
}

function minutesBetween(later, earlier) {
  return Math.round((toDate(later) - toDate(earlier)) / 60000);
}

function classifyConnection(availableTransferMinutes, requiredTransferMinutes) {
  if (availableTransferMinutes < requiredTransferMinutes) {
    return STATUS.BROKEN;
  }

  if (availableTransferMinutes < requiredTransferMinutes + 15) {
    return STATUS.AT_RISK;
  }

  return STATUS.SAFE;
}

function calculateConnection(connection) {
  const fromScheduledArrival = toDate(connection.fromScheduledArrival);
  const toScheduledDeparture = toDate(connection.toScheduledDeparture);
  const expectedArrival = new Date(
    fromScheduledArrival.getTime() +
      Number(connection.delayMinutes || 0) * 60000
  );
  const availableTransferMinutes = minutesBetween(
    toScheduledDeparture,
    expectedArrival
  );
  const requiredTransferMinutes = Number(
    connection.requiredTransferMinutes || 30
  );

  return {
    ...connection,
    fromScheduledArrival: fromScheduledArrival.toISOString(),
    toScheduledDeparture: toScheduledDeparture.toISOString(),
    expectedArrival: expectedArrival.toISOString(),
    availableTransferMinutes,
    requiredTransferMinutes,
    bufferMinutes: availableTransferMinutes - requiredTransferMinutes,
    status: classifyConnection(
      availableTransferMinutes,
      requiredTransferMinutes
    )
  };
}

function riskForAlternative(alternative) {
  const buffer = alternative.bufferMinutes;
  if (buffer != null && buffer < 15) return "MEDIUM";
  return "LOW";
}

function rankAlternatives(alternatives) {
  return [...alternatives].sort((a, b) =>
    new Date(a.arrival) - new Date(b.arrival) ||
    a.waitingMinutes - b.waitingMinutes ||
    a.transfers - b.transfers ||
    ({ LOW: 0, MEDIUM: 1, HIGH: 2 }[a.risk] || 0) -
      ({ LOW: 0, MEDIUM: 1, HIGH: 2 }[b.risk] || 0)
  );
}

module.exports = {
  STATUS,
  toDate,
  minutesBetween,
  classifyConnection,
  calculateConnection,
  riskForAlternative,
  rankAlternatives
};
