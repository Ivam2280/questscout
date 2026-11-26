const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

function positiveInteger(value, fallback, name) {
  const result = value === undefined || value === "" ? fallback : Number(value);
  if (!Number.isSafeInteger(result) || result < 1) throw new Error(`${name} must be a positive integer.`);
  return result;
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL,
  directDatabaseUrl: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: positiveInteger(process.env.PORT, 3001, "PORT"),
  timezone: process.env.APP_TIMEZONE || "Europe/Kyiv",
  seedDemo: process.env.SEED_DEMO === "true",
  demoPayments: process.env.DEMO_PAYMENTS !== "false",
  adminEmail: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD,
  firebaseApiKey: process.env.FIREBASE_API_KEY || "",
  firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "",
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
  firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
  firebaseAppId: process.env.FIREBASE_APP_ID || "",
  mailProvider: (process.env.MAIL_PROVIDER || "auto").toLowerCase(),
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: positiveInteger(process.env.SMTP_PORT, 465, "SMTP_PORT"),
  smtpSecure: process.env.SMTP_SECURE === undefined ? (process.env.SMTP_PORT || "465") === "465" : process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || "",
  emailjsServiceId: process.env.EMAILJS_SERVICE_ID || "",
  emailjsTemplateId: process.env.EMAILJS_TEMPLATE_ID || "",
  emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY || "",
  emailjsPrivateKey: process.env.EMAILJS_PRIVATE_KEY || "",
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM,
  paypalClientId: process.env.PAYPAL_CLIENT_ID || "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  paypalRate: positiveInteger(process.env.PAYPAL_UAH_PER_USD, 41, "PAYPAL_UAH_PER_USD"),
};

function validateAdminEnv() {
  if (Boolean(env.adminEmail) !== Boolean(env.adminPassword)) throw new Error("Set both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both empty.");
}

function validateServerEnv() {
  if (!env.databaseUrl) throw new Error("Set DATABASE_URL in the root .env or Render environment.");
  if (!env.jwtSecret || env.jwtSecret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  try { new Intl.DateTimeFormat("en", { timeZone: env.timezone }).format(); }
  catch { throw new Error("APP_TIMEZONE must be a valid IANA time zone."); }
  validateAdminEnv();
  if (!["auto", "smtp", "emailjs", "resend"].includes(env.mailProvider)) throw new Error("MAIL_PROVIDER must be auto, smtp, emailjs or resend.");
  if (!env.demoPayments && (!env.paypalClientId || !env.paypalClientSecret)) throw new Error("PayPal sandbox credentials are required when DEMO_PAYMENTS=false.");
}

module.exports = { env, validateServerEnv, validateAdminEnv };
