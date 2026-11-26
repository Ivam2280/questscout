const test = require("node:test");
const assert = require("node:assert/strict");
const { postgresOptions } = require("../config/postgres");

test("Neon URLs retain verified TLS and channel binding", () => {
  const options = postgresOptions("postgresql://user:password@example.neon.tech/neondb?sslmode=require&channel_binding=require");
  assert.deepEqual(options.ssl, { rejectUnauthorized: true });
  assert.equal(options.enableChannelBinding, true);
  assert.equal(new URL(options.connectionString).searchParams.has("sslmode"), false);
});
test("local PostgreSQL can run without TLS", () => {
  assert.equal(postgresOptions("postgres://postgres:test@127.0.0.1:5432/questscout_test").ssl, false);
});
test("remote plaintext and non-PostgreSQL URLs are rejected", () => {
  assert.throws(() => postgresOptions("mysql://user:password@localhost/db"), /postgres/);
  assert.throws(() => postgresOptions("postgres://user:password@example.com/db?sslmode=disable"), /TLS/);
  assert.throws(() => postgresOptions("not a URL"), /PostgreSQL/);
});
