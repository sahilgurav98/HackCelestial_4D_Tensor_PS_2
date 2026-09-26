const auth = require("../services/auth.service");

function readToken(req) {
  const header = req.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

async function optionalAuth(req, res, next) {
  try {
    req.authToken = readToken(req);
    req.user = req.authToken ? await auth.getUserForToken(req.authToken) : null;
    next();
  } catch (error) { next(error); }
}

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, error: { code: "AUTH_REQUIRED", message: "Sign in to continue" } });
  return next();
}

module.exports = { optionalAuth, requireAuth };
