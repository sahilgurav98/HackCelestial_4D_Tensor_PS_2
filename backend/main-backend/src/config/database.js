const mongoose = require("mongoose");
const env = require("./env");

async function connectDatabase() {
  try {
    await mongoose.connect(env.mongodbUri);

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