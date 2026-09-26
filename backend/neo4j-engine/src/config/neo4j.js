const neo4j = require("neo4j-driver");
require("dotenv").config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD
  )
);

async function verifyConnection() {
  const session = driver.session();

  try {
    await session.run("RETURN 1 AS result");
    console.log("Neo4j connected");
  } finally {
    await session.close();
  }
}

async function closeDriver() {
  await driver.close();
}

module.exports = {
  driver,
  verifyConnection,
  closeDriver
};