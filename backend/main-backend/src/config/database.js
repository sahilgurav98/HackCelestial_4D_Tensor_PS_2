const mongoose = require("mongoose");
const env = require("./env");
const Itinerary = require("../models/Itinerary");

async function connectDatabase() {
  try {
    await mongoose.connect(env.mongodbUri);

    // Older deployments created a globally unique tripId_1 index. Remove it
    // so the user-scoped compound index can support the current data model.
    try {
      await Itinerary.collection.dropIndex("tripId_1");
    } catch (error) {
      if (!/index not found|ns not found/i.test(error.message)) throw error;
    }
    await Itinerary.syncIndexes();

    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    throw error;
  }
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = {
  connectDatabase,
  disconnectDatabase
};
