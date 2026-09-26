const mongoose = require("mongoose");

const legSchema = new mongoose.Schema(
  {
    transportId: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["FLIGHT", "TRAIN", "BUS"],
      required: true
    }
  },
  {
    _id: false
  }
);

const itinerarySchema = new mongoose.Schema(
  {
    tripId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    legs: {
      type: [legSchema],
      required: true,
      validate: {
        validator: function (legs) {
          return legs.length > 0;
        },
        message: "Itinerary must contain at least one leg"
      }
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "AT_RISK",
        "DISRUPTED",
        "RECOVERING",
        "RECOVERED",
        "COMPLETED"
      ],
      default: "ACTIVE"
    },

    selectedRecovery: {
      transportId: {
        type: String,
        default: null
      },

      selectedAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Itinerary", itinerarySchema);