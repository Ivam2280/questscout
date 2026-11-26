const clients = new Map();

const loadFirebase = () => Promise.all([import("firebase/app"), import("firebase/auth")]);

export async function createFirebaseGoogleClient(config, loadSdk = loadFirebase) {
  if (!config?.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    throw new Error("Google sign-in is temporarily unavailable.");
  }
  const [appSdk, authSdk] = await loadSdk();
  const name = `questscout-google-${config.projectId}`;
  const app = appSdk.getApps().find((candidate) => candidate.name === name) || appSdk.initializeApp(config, name);
  const auth = authSdk.initializeAuth(app, {
    persistence: authSdk.inMemoryPersistence,
    popupRedirectResolver: authSdk.browserPopupRedirectResolver,
  });
  auth.languageCode = "en";
  const provider = new authSdk.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return {
    signIn() {
      // Open the popup directly from the click handler, before asynchronous work.
      return authSdk.signInWithPopup(auth, provider)
        .then((result) => result.user.getIdToken())
        .finally(() => authSdk.signOut(auth));
    },
  };
}

export function getFirebaseGoogleClient(config) {
  const key = JSON.stringify(config);
  if (!clients.has(key)) {
    clients.set(key, createFirebaseGoogleClient(config).catch((error) => {
      clients.delete(key);
      throw error;
    }));
  }
  return clients.get(key);
}

export function googleSignInError(error) {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return null;
    case "auth/popup-blocked": return "Allow popups in your browser to sign in with Google.";
    case "auth/unauthorized-domain": return "Google sign-in is not available at this website address.";
    case "auth/operation-not-allowed": return "Google sign-in is not enabled for this application.";
    case "auth/network-request-failed": return "Could not connect to Google. Check your connection and try again.";
    default: return "Google sign-in could not be completed. Please try again.";
  }
}
