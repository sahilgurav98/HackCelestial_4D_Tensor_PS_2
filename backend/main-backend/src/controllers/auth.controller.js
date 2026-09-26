const auth = require("../services/auth.service");

async function signup(req, res, next) {
  try { res.status(201).json({ success: true, data: await auth.signup(req.body) }); } catch (error) { next(error); }
}
async function login(req, res, next) {
  try { res.json({ success: true, data: await auth.login(req.body) }); } catch (error) { next(error); }
}
async function me(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ success: false, error: { code: "AUTH_REQUIRED", message: "Sign in to continue" } });
    res.json({ success: true, data: { user: auth.publicUser(req.user) } });
  } catch (error) { next(error); }
}
async function logout(req, res, next) {
  try { await auth.logout(req.authToken); res.json({ success: true, data: { message: "Signed out" } }); } catch (error) { next(error); }
}

module.exports = { signup, login, me, logout };
