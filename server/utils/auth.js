const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { env } = require("../config/env");

async function authMiddleware({ req }) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return { user: null };
  try {
    const { data } = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"], maxAge: "5h" });
    const user = await User.findByPk(data.id);
    if (!user || user.isBlocked) return { user: null };
    return { user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isAdmin: user.isAdmin } };
  } catch { return { user: null }; }
}

function signToken({ id, email, firstName, lastName, isAdmin }) {
  return jwt.sign({ data: { id, email, firstName, lastName, isAdmin } }, env.jwtSecret, { algorithm: "HS256", expiresIn: "5h" });
}

module.exports = { authMiddleware, signToken };
