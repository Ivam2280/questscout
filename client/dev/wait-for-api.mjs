import { setTimeout } from "node:timers/promises";

export async function waitForApi(url, { timeoutMs = 90000, request = fetch, pause = setTimeout, now = Date.now } = {}) {
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    try {
      const response = await request(url, { signal: AbortSignal.timeout(Math.min(1000, deadline - now())) });
      if (response.ok && (await response.json()).status === "ok") return;
    } catch {}
    await pause(Math.min(250, Math.max(0, deadline - now())));
  }
  throw new Error(`QuestScout API did not become ready within ${Math.ceil(timeoutMs / 1000)} seconds. Check the [api] startup output and database connection, then restart npm run dev.`);
}
