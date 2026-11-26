const test = require("node:test");
const assert = require("node:assert/strict");

process.env.FIREBASE_PROJECT_ID = "questscout-auth-test";
process.env.DATABASE_URL = "postgresql://postgres:test@127.0.0.1:5432/questscout_test";
process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL;
const { verifyFirebaseIdToken } = require("../services/google");

const config = { apiKey: "test-api-key", authDomain: "test.firebaseapp.com", projectId: "test", appId: "test-web-app" };
const clientModule = import("../../client/src/utils/firebase.mjs");

function mockSdk({ popupError, tokenError } = {}) {
  const state = { apps: [], popups: 0, signOuts: 0, tokenRequests: 0 };
  const appSdk = {
    getApps: () => state.apps,
    initializeApp(value, name) {
      state.config = value;
      const app = { name };
      state.apps.push(app);
      return app;
    },
  };
  const authSdk = {
    inMemoryPersistence: { type: "NONE" },
    browserPopupRedirectResolver: {},
    initializeAuth(app, options) { state.persistence = options.persistence; return {}; },
    GoogleAuthProvider: class { setCustomParameters(parameters) { state.parameters = parameters; } },
    signInWithPopup() {
      state.popups += 1;
      if (popupError) return Promise.reject(popupError);
      return Promise.resolve({ user: { async getIdToken() {
        state.tokenRequests += 1;
        if (tokenError) throw tokenError;
        return "firebase-id-token";
      } } });
    },
    async signOut() { state.signOuts += 1; },
  };
  return { state, load: async () => [appSdk, authSdk] };
}

test("Google popup opens synchronously and exchanges the Firebase ID token without persisting a Firebase session", async () => {
  const { createFirebaseGoogleClient } = await clientModule;
  const sdk = mockSdk();
  const client = await createFirebaseGoogleClient(config, sdk.load);
  const result = client.signIn();
  assert.equal(sdk.state.popups, 1);
  assert.equal(await result, "firebase-id-token");
  assert.equal(sdk.state.tokenRequests, 1);
  assert.equal(sdk.state.persistence.type, "NONE");
  assert.deepEqual(sdk.state.parameters, { prompt: "select_account" });
  assert.equal(sdk.state.signOuts, 1);
});
test("cancelled popups and failed token retrieval clean up the Firebase session", async () => {
  const { createFirebaseGoogleClient, googleSignInError } = await clientModule;
  for (const option of ["popupError", "tokenError"]) {
    const error = { code: "auth/popup-closed-by-user" };
    const sdk = mockSdk({ [option]: error });
    const client = await createFirebaseGoogleClient(config, sdk.load);
    await assert.rejects(client.signIn(), (actual) => actual === error);
    assert.equal(sdk.state.signOuts, 1);
    assert.equal(googleSignInError(error), null);
  }
});
test("missing Firebase settings fail before loading the SDK and setup failures have useful messages", async () => {
  const { createFirebaseGoogleClient, googleSignInError } = await clientModule;
  await assert.rejects(createFirebaseGoogleClient(null, () => assert.fail("SDK must not load")), /temporarily unavailable/);
  assert.match(googleSignInError({ code: "auth/popup-blocked" }), /Allow popups/);
  assert.match(googleSignInError({ code: "auth/unauthorized-domain" }), /website address/);
  assert.match(googleSignInError({ code: "auth/operation-not-allowed" }), /not enabled/);
});

function token(claims) {
  const header = { alg: "RS256", kid: "test-key" };
  return [header, claims].map((value) => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".dGVzdC1zaWduYXR1cmU";
}
test("the official Firebase verifier rejects malformed tokens and tokens from another project or issuer", async () => {
  await assert.rejects(verifyFirebaseIdToken("invalid-token"), /Decoding Firebase ID token failed/);
  const claims = { aud: "another-project", iss: "https://securetoken.google.com/questscout-auth-test", sub: "test-user" };
  await assert.rejects(verifyFirebaseIdToken(token(claims)), /incorrect "aud"/);
  claims.aud = "questscout-auth-test";
  claims.iss = "https://accounts.google.com";
  await assert.rejects(verifyFirebaseIdToken(token(claims)), /incorrect "iss"/);
});
