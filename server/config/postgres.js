function postgresOptions(value) {
  if (!value) throw new Error("DATABASE_URL is missing. See .env.example.");
  let url;
  try { url = new URL(value); }
  catch { throw new Error("DATABASE_URL must be a PostgreSQL connection URL."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("DATABASE_URL must use postgres:// or postgresql://.");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const mode = url.searchParams.get("sslmode");
  if (!local && mode === "disable") throw new Error("Remote database connections require TLS.");
  const ssl = local && (!mode || mode === "disable") ? false : { rejectUnauthorized: true };
  // Keep pg-connection-string from replacing the verified TLS settings.
  for (const key of ["ssl", "sslmode", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat"]) url.searchParams.delete(key);
  return { connectionString: url.toString(), ssl, enableChannelBinding: true };
}

module.exports = { postgresOptions };
