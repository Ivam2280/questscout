const { defineConfig, devices } = require("@playwright/test");

if (!process.env.TEST_DATABASE_URL || !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")) {
  throw new Error("Set TEST_DATABASE_URL to a dedicated PostgreSQL database ending in _test before running browser tests.");
}

module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45000,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:4173/health",
    timeout: 60000,
    reuseExistingServer: false,
    env: {
      NODE_ENV: "production", PORT: "4173",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      DIRECT_DATABASE_URL: process.env.TEST_DATABASE_URL,
      JWT_SECRET: "browser-test-only-secret-at-least-32-characters",
      SEED_DEMO: "true", DEMO_PAYMENTS: "true",
      ADMIN_EMAIL: "browser-admin@example.test", ADMIN_PASSWORD: "browser-admin-password",
      FIREBASE_API_KEY: "", FIREBASE_AUTH_DOMAIN: "", FIREBASE_PROJECT_ID: "",
      FIREBASE_STORAGE_BUCKET: "", FIREBASE_MESSAGING_SENDER_ID: "", FIREBASE_APP_ID: "",
      RESEND_API_KEY: "", EMAIL_FROM: "",
      MAIL_PROVIDER: "auto", SMTP_USER: "", SMTP_PASSWORD: "", SMTP_PASS: "",
      EMAILJS_SERVICE_ID: "", EMAILJS_TEMPLATE_ID: "", EMAILJS_PUBLIC_KEY: "", EMAILJS_PRIVATE_KEY: "",
      PAYPAL_CLIENT_ID: "", PAYPAL_CLIENT_SECRET: "",
    },
  },
});
