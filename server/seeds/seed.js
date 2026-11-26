const { randomBytes } = require("node:crypto");
const { DateTime } = require("luxon");
const sequelize = require("../config/connection");
const { env, validateAdminEnv, validateDemoUserEnv } = require("../config/env");
const { User, EscapeRoom, Booking, Review } = require("../models");
const { migrate } = require("../db/migrate");

const rooms = [
  { theme: "The Forgotten Asylum", genre: "Horror", difficulty: "Expert", ageGroup: "16+", playersMin: 2, playersMax: 6, price: 550, duration: 60, image_url: "/images/rooms/asylum.webp", description: "An abandoned ward. A missing doctor. Sixty minutes until the lights go out for good. Follow the evidence and find a way out of the forgotten asylum.", gallery: [] },
  { theme: "The Detective's Office", genre: "Detective", difficulty: "Intermediate", ageGroup: "12+", playersMin: 2, playersMax: 5, price: 450, duration: 60, image_url: "/images/rooms/detective.webp", description: "A private investigator has disappeared, leaving one final case unfinished. Decode his notes, connect the clues and expose the culprit before they return.", gallery: [] },
  { theme: "The Lost Expedition", genre: "Adventure", difficulty: "Beginner", ageGroup: "6+", playersMin: 2, playersMax: 6, price: 400, duration: 60, image_url: "/images/rooms/expedition.webp", description: "Your expedition has reached an ancient temple deep in the jungle. Work together to uncover its secrets and recover the lost artifact before the entrance seals.", gallery: [] },
  { theme: "Signal From Orbit", genre: "Sci-Fi", difficulty: "Expert", ageGroup: "12+", playersMin: 2, playersMax: 4, price: 600, duration: 90, image_url: "/images/rooms/orbit.webp", description: "A research station has gone silent. Restore power, trace the mysterious transmission and launch the escape pod before the station loses its orbit.", gallery: [] },
];
const comments = ["Atmospheric puzzles and a brilliant final reveal. Our team loved it!", "Clever clues with just the right amount of challenge. A great evening together.", "A welcoming first escape room. Everyone had a moment to shine.", "The countdown made every decision count. We are already planning our next visit."];

async function seedDatabase({ demo = true } = {}) {
  validateAdminEnv();
  validateDemoUserEnv();
  await sequelize.transaction(async (transaction) => {
    await sequelize.query("SELECT pg_advisory_xact_lock(784219634)", { transaction });
    if (env.adminEmail && env.adminPassword) {
      const admin = await User.findOne({ where: { email: env.adminEmail }, transaction });
      if (admin && !admin.isAdmin) throw new Error("ADMIN_EMAIL belongs to an existing non-admin account. Choose another email.");
      if (!admin) {
        if (env.adminPassword.length < 8) throw new Error("ADMIN_PASSWORD must contain at least 8 characters when creating a new administrator.");
        await User.create({ email: env.adminEmail, firstName: "QuestScout", lastName: "Admin", password: env.adminPassword, isAdmin: true, hasPassword: true }, { transaction });
      }
    }
    if (env.demoUserEmail && env.demoUserPassword) {
      const account = await User.findOne({ where: { email: env.demoUserEmail }, transaction });
      if (account?.isAdmin) throw new Error("DEMO_USER_EMAIL belongs to an administrator. Choose another email.");
      if (!account) {
        await User.create({ email: env.demoUserEmail, firstName: "Demo", lastName: "Visitor", password: env.demoUserPassword, isAdmin: false, isBlocked: false, hasPassword: true }, { transaction });
      } else {
        const update = { firstName: "Demo", lastName: "Visitor", isBlocked: false, hasPassword: true };
        if (!account.hasPassword || !(await account.checkPassword(env.demoUserPassword))) update.password = env.demoUserPassword;
        await account.update(update, { transaction });
      }
    }
    if (!demo) return;
    for (const [index, data] of rooms.entries()) {
      const [room] = await EscapeRoom.findOrCreate({ where: { theme: data.theme }, defaults: data, transaction });
      const [user] = await User.findOrCreate({ where: { email: `story-${index + 1}@questscout.example` }, defaults: { firstName: ["Alex", "Sam", "Jamie", "Morgan"][index], lastName: "Demo", password: randomBytes(24).toString("hex"), hasPassword: false, isBlocked: true }, transaction });
      await Review.findOrCreate({ where: { user_id: user.id, escape_room_id: room.id }, defaults: { rating: index === 1 ? 4 : 5, comment: comments[index], isRead: true }, transaction });
      await Booking.findOrCreate({ where: { user_id: user.id, escape_room_id: room.id, payment_method: "Seed Demo" }, defaults: { numberOfPlayers: 2, date: DateTime.now().setZone(env.timezone).minus({ days: index + 7 }).toISODate(), time: "10:00:00", payment_status: "completed", payment_amount: room.price * 2, status: "completed" }, transaction });
    }
  });
}

if (require.main === module) {
  (async () => {
    try {
      validateAdminEnv();
      validateDemoUserEnv();
      await migrate();
      await seedDatabase();
      console.log("Demo data and configured bootstrap accounts are ready.");
    } catch (error) {
      console.error(`Seeding failed: ${error.code || error.message}`);
      process.exitCode = 1;
    } finally { await sequelize.close(); }
  })();
}

module.exports = { seedDatabase };
