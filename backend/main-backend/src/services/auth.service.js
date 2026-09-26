const crypto = require("crypto");
const User = require("../models/User");
const Session = require("../models/Session");

const SESSION_DAYS = 7;

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`scrypt:${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

function verifyPassword(password, stored) {
  return new Promise((resolve, reject) => {
    const [, salt, expectedHex] = String(stored).split(":");
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      const expected = Buffer.from(expectedHex, "hex");
      resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey));
    });
  });
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  return { id: String(user._id || user.id), name: user.name, email: user.email };
}

async function createSession(user) {
  const token = crypto.randomBytes(32).toString("base64url");
  await Session.create({ userId: user._id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000) });
  return { token, user: publicUser(user) };
}

async function signup({ name, email, password }) {
  if (!name || !email || !password || password.length < 8) {
    const error = new Error("name, email, and a password of at least 8 characters are required");
    error.code = "INVALID_SIGNUP";
    throw error;
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (await User.findOne({ email: normalizedEmail })) {
    const error = new Error("An account with this email already exists");
    error.code = "EMAIL_IN_USE";
    throw error;
  }
  const user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash: await hashPassword(password) });
  return createSession(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() }).select("+passwordHash");
  if (!user || !(await verifyPassword(password || "", user.passwordHash))) {
    const error = new Error("Invalid email or password");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }
  return createSession(user);
}

async function getUserForToken(token) {
  if (!token) return null;
  const session = await Session.findOne({ tokenHash: tokenHash(token), expiresAt: { $gt: new Date() } }).populate("userId");
  return session?.userId || null;
}

async function logout(token) {
  if (token) await Session.deleteOne({ tokenHash: tokenHash(token) });
}

module.exports = { signup, login, getUserForToken, logout, publicUser };
