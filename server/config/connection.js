const { Sequelize } = require("sequelize");
const { env } = require("./env");
const { postgresOptions } = require("./postgres");

const options = postgresOptions(env.databaseUrl);

module.exports = new Sequelize(options.connectionString, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: options.ssl,
    enableChannelBinding: options.enableChannelBinding,
    connectionTimeoutMillis: 15000,
    statement_timeout: 15000,
    application_name: "questscout",
  },
  pool: { max: 5, min: 0, idle: 10000, acquire: 30000, evict: 10000 },
  retry: { max: 0 },
});
