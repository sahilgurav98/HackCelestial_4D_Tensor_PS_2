const mongoose = require("mongoose");

const disruptionEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    tripId: {
      type: String,
      required: true,
      index: true
    },

    transportId: {
      type: String,
      required: true
    },

    eventType: {
      type: String,
      enum: [
        "DELAY",
        "CANCELLATION",
        "CONNECTION_BROKEN",
        "OTHER"
      ],
      required: true
    },

    delayMinutes: {
      type: Number,
      default: 0
    },

    affectedTransport: {
      type: String,
      default: null
    },

    connectionStatus: {
      type: String,
      enum: ["SAFE", "AT_RISK", "BROKEN", null],
      default: null
    },

    reason: {
      type: String,
      default: null
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "DisruptionEvent",
  disruptionEventSchema
);
