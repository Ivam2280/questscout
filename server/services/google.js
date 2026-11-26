const { randomBytes } = require("node:crypto");
const { getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const sequelize = require("../config/connection");
const { env } = require("../config/env");
const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError, ForbiddenError, UserInputError } = require("../utils/errors");

async function verifyFirebaseIdToken(idToken) {
  if (!env.firebaseProjectId) throw new UserInputError("Google sign-in is temporarily unavailable.");
  const name = `questscout-auth-${env.firebaseProjectId}`;
  const app = getApps().find((candidate) => candidate.name === name) || initializeApp({ projectId: env.firebaseProjectId }, name);
  return getAuth(app).verifyIdToken(idToken);
}

async function signInWithGoogle(idToken, options = {}) {
  if (!env.firebaseProjectId) throw new UserInputError("Google sign-in is temporarily unavailable.");
  if (typeof idToken !== "string" || !idToken || idToken.length > 16384) throw new AuthenticationError("Google authentication failed.");
  const verify = options.verify || verifyFirebaseIdToken;
  const profile = await verify(idToken, env.firebaseProjectId);
  if (!profile?.uid || typeof profile.uid !== "string" || profile.uid.length > 128 || !profile.email_verified || !profile.email || profile.firebase?.sign_in_provider !== "google.com") {
    throw new AuthenticationError("Use a verified Google account.");
  }
  return sequelize.transaction(async (transaction) => {
    let user = await User.findOne({ where: { firebaseUid: profile.uid }, transaction, lock: transaction.LOCK.UPDATE });
    if (!user) {
      const names = (profile.name || "Google User").trim().split(/\s+/);
      [user] = await User.findOrCreate({
        where: { email: profile.email.trim().toLowerCase() },
        defaults: { firstName: names[0] || "Google", lastName: names.slice(1).join(" ") || "User", password: randomBytes(24).toString("hex"), isAdmin: false, hasPassword: false, firebaseUid: profile.uid },
        transaction,
      });
      if (user.firebaseUid && user.firebaseUid !== profile.uid) throw new ForbiddenError("This account is linked to another Google identity.");
      if (!user.firebaseUid) await user.update({ firebaseUid: profile.uid }, { transaction });
    }
    if (user.isBlocked) throw new ForbiddenError("Your account has been blocked by the administrator.");
    return { token: signToken(user) };
  });
}

module.exports = { signInWithGoogle, verifyFirebaseIdToken };
