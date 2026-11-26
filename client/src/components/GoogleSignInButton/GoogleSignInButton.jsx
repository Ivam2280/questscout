import { useEffect, useRef, useState } from "react";
import { useRuntimeConfig } from "../../config";
import { getFirebaseGoogleClient, googleSignInError } from "../../utils/firebase.mjs";

export default function GoogleSignInButton({ onCredential, onError, signUp = false }) {
  const { firebaseConfig } = useRuntimeConfig();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(Boolean(firebaseConfig));
  const [pending, setPending] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    setClient(null);
    if (!firebaseConfig) { setLoading(false); return () => { active = false; mounted.current = false; }; }
    setLoading(true);
    getFirebaseGoogleClient(firebaseConfig).then((value) => {
      if (active) setClient(value);
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [firebaseConfig]);

  const signIn = () => {
    if (!client) { onError?.("Google sign-in is temporarily unavailable. Please try again later."); return; }
    setPending(true);
    client.signIn().then((idToken) => onCredential({ idToken })).catch((error) => {
      const message = googleSignInError(error);
      if (message) onError?.(message);
    }).finally(() => { if (mounted.current) setPending(false); });
  };

  return <button type="button" onClick={signIn} disabled={loading || pending} aria-busy={loading || pending}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: "#fff", color: "#202124", border: "1px solid #dadce0", borderRadius: 20, padding: "10px 24px", width: "100%", cursor: loading || pending ? "wait" : "pointer", fontFamily: "Arial, sans-serif", fontSize: 14, opacity: loading || pending ? 0.7 : 1 }}>
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.05 46.98 31.9 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>
    {pending ? "Signing in…" : loading ? "Loading Google sign-in…" : signUp ? "Sign up with Google" : "Continue with Google"}
  </button>;
}
