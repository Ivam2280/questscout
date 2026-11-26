import { createContext, useContext, useEffect, useState } from "react";

const DEFAULT_CONFIG = Object.freeze({
  firebaseConfig: null,
  emailEnabled: false,
  demoPayments: true,
  paypalClientId: "",
  paypalRate: 41,
  timezone: "Europe/Kyiv",
});

const RuntimeConfigContext = createContext(null);

function ConfigLoadingScreen({ failed, onRetry }) {
  return (
    <main className="runtime-config-screen">
      <div>
        <h1>QuestScout</h1>
        <p role="status">
          {failed
            ? "We could not connect. Please try again."
            : "Preparing your adventure. The first visit may take about a minute."}
        </p>
        {failed ? (
          <button type="button" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    </main>
  );
}

export function RuntimeConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90_000);
    let active = true;

    setFailed(false);
    fetch("/api/config", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Runtime configuration is unavailable");
        const values = await response.json();
        if (active) setConfig({ ...DEFAULT_CONFIG, ...values });
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  if (!config) {
    return <ConfigLoadingScreen failed={failed} onRetry={() => setAttempt((value) => value + 1)} />;
  }

  return <RuntimeConfigContext.Provider value={config}>{children}</RuntimeConfigContext.Provider>;
}

export function useRuntimeConfig() {
  const context = useContext(RuntimeConfigContext);
  if (!context) throw new Error("useRuntimeConfig must be used within RuntimeConfigProvider");
  return context;
}
