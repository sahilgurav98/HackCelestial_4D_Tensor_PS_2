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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    tripId: {
      type: String,
      required: true
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

// A trip id is unique inside a user's workspace, not across all users.
itinerarySchema.index(
  { userId: 1, tripId: 1 },
  {
    unique: true,
    partialFilterExpression: { userId: { $type: "objectId" } }
  }
);

module.exports = mongoose.model("Itinerary", itinerarySchema);
