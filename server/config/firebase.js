const { env } = require("./env");

function publicFirebaseConfig() {
  if (!env.firebaseApiKey || !env.firebaseAuthDomain || !env.firebaseProjectId || !env.firebaseAppId) return null;
  return {
    apiKey: env.firebaseApiKey,
    authDomain: env.firebaseAuthDomain,
    projectId: env.firebaseProjectId,
    storageBucket: env.firebaseStorageBucket,
    messagingSenderId: env.firebaseMessagingSenderId,
    appId: env.firebaseAppId,
  };
}

module.exports = { publicFirebaseConfig };
