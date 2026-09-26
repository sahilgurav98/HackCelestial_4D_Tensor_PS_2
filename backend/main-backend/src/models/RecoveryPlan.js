const mongoose = require("mongoose");

const recoveryPlanSchema = new mongoose.Schema(
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

    originalTransport: {
      type: String,
      required: true
    },

    options: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },

    recommendedOption: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    selectedOption: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "RecoveryPlan",
  recoveryPlanSchema
);
