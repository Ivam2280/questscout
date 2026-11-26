const test = require("node:test");
const assert = require("node:assert/strict");
const readiness = import("../../client/dev/wait-for-api.mjs");

test("frontend readiness waits through a closed API port and unhealthy responses", async () => {
  const { waitForApi } = await readiness;
  let attempts = 0, elapsed = 0;
  await waitForApi("http://127.0.0.1:3001/health", {
    now: () => elapsed,
    pause: async (duration) => { elapsed += duration; },
    request: async () => {
      attempts += 1;
      if (attempts === 1) throw Object.assign(new Error("Connection refused"), { code: "ECONNREFUSED" });
      if (attempts === 2) return { ok: false };
      return { ok: true, json: async () => ({ status: attempts === 3 ? "starting" : "ok" }) };
    },
  });
  assert.equal(attempts, 4);
  assert.equal(elapsed, 750);
});
test("an API that never starts produces an actionable startup failure", async () => {
  const { waitForApi } = await readiness;
  let elapsed = 0;
  await assert.rejects(waitForApi("http://127.0.0.1:3001/health", {
    timeoutMs: 500,
    now: () => elapsed,
    pause: async (duration) => { elapsed += duration; },
    request: async () => { throw new Error("Connection refused"); },
  }), /Check the \[api\] startup output and database connection/);
  assert.equal(elapsed, 500);
});
