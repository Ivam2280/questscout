const { env, validateServerEnv } = require("./config/env");

async function start() {
  validateServerEnv();
  const sequelize = require("./config/connection");
  const { migrate } = require("./db/migrate");
  const { seedDatabase } = require("./seeds/seed");
  const { createApp } = require("./app");
  await migrate();
  await seedDatabase({ demo: env.seedDemo });
  await sequelize.authenticate();
  const { httpServer, apollo } = await createApp();
  await new Promise((resolve, reject) => { httpServer.once("error", reject); httpServer.listen(env.port, "0.0.0.0", resolve); });
  console.log(`QuestScout is listening on port ${env.port}.`);
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    await apollo.stop();
    await sequelize.close();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  return { httpServer, apollo, shutdown };
}

if (require.main === module) start().catch((error) => { console.error(`Startup failed: ${error.code || error.message}`); process.exit(1); });
module.exports = { start };
