const fs = require("node:fs/promises");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { Client } = require("pg");
const { env } = require("../config/env");
const { postgresOptions } = require("../config/postgres");

async function migrate(databaseUrl = env.directDatabaseUrl) {
  const client = new Client({ ...postgresOptions(databaseUrl), connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(784219633)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const directory = path.join(__dirname, "migrations");
    const names = (await fs.readdir(directory)).filter((name) => name.endsWith(".sql")).sort();
    const { rows } = await client.query("SELECT name, checksum FROM schema_migrations");
    const applied = new Map(rows.map((row) => [row.name, row.checksum]));
    for (const name of names) {
      const sql = await fs.readFile(path.join(directory, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      if (applied.has(name)) {
        if (applied.get(name) !== checksum) throw new Error(`Applied migration ${name} was changed. Add a new migration instead.`);
        continue;
      }
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)", [name, checksum]);
      console.log(`Applied migration: ${name}`);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  migrate().catch((error) => {
    console.error(`Migration failed: ${error.code || error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { migrate };
