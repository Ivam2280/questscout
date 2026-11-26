const test = require("node:test");
const assert = require("node:assert/strict");
const { createMailer, mailProvider } = require("../services/mail");

const smtp = { mailProvider: "auto", smtpHost: "smtp.gmail.com", smtpPort: 465, smtpSecure: true, smtpUser: "sender@example.test", smtpPassword: "test-only-app-password" };

test("Gmail SMTP sends verification mail with the configured sender and TLS", async () => {
  let connection, message, closed = false;
  const mailer = createMailer(smtp, { createTransport: (options) => {
    connection = options;
    return { sendMail: async (email) => { message = email; }, close: () => { closed = true; } };
  } });
  await mailer("visitor@example.test", "Verification", "Your code is 123456.");
  assert.equal(connection.secure, true);
  assert.equal(connection.host, "smtp.gmail.com");
  assert.equal(message.from, smtp.smtpUser);
  assert.equal(message.to, "visitor@example.test");
  assert.match(message.text, /123456/);
  assert.equal(closed, true);
});
test("EmailJS uses HTTPS and supplies the recipient, subject and code to the template", async () => {
  let endpoint, payload;
  const config = { ...smtp, emailjsServiceId: "service_test", emailjsTemplateId: "template_test", emailjsPublicKey: "public_test", emailjsPrivateKey: "private_test" };
  assert.equal(mailProvider(config), "emailjs");
  const mailer = createMailer(config, { fetch: async (url, options) => { endpoint = url; payload = JSON.parse(options.body); return { ok: true }; } });
  await mailer("visitor@example.test", "Reset password", "Your code is 234567.");
  assert.equal(endpoint, "https://api.emailjs.com/api/v1.0/email/send");
  assert.equal(payload.template_params.to_email, "visitor@example.test");
  assert.equal(payload.template_params.code, "234567");
  assert.equal(payload.accessToken, "private_test");
});
test("Resend remains available as an alternative email provider", async () => {
  let endpoint, payload;
  const mailer = createMailer({ mailProvider: "resend", resendApiKey: "test-only-key", emailFrom: "sender@example.test" }, {
    fetch: async (url, options) => { endpoint = url; payload = JSON.parse(options.body); return { ok: true }; },
  });
  await mailer("visitor@example.test", "Code", "345678");
  assert.equal(endpoint, "https://api.resend.com/emails");
  assert.deepEqual(payload.to, ["visitor@example.test"]);
});
test("unconfigured or failed mail delivery reports an error instead of exposing credentials", async () => {
  assert.equal(mailProvider({ mailProvider: "auto" }), null);
  await assert.rejects(createMailer({ mailProvider: "auto" })("visitor@example.test", "Code", "123456"), /temporarily unavailable/);
  const mailer = createMailer(smtp, { logError() {}, createTransport: () => ({ sendMail: async () => { throw new Error(smtp.smtpPassword); }, close() {} }) });
  await assert.rejects(mailer("visitor@example.test", "Code", "123456"), (error) => !error.message.includes(smtp.smtpPassword) && error.extensions?.code === "BAD_USER_INPUT");
});
test("SMTP authentication failures produce useful diagnostics without logging credentials or verification codes", async () => {
  const logs = [];
  let closed = false;
  const mailer = createMailer(smtp, {
    logError: (message) => logs.push(message),
    createTransport: () => ({
      async sendMail() { throw Object.assign(new Error(`${smtp.smtpPassword} visitor@example.test 123456`), { code: "EAUTH", responseCode: 535 }); },
      close() { closed = true; },
    }),
  });
  await assert.rejects(mailer("visitor@example.test", "Verification", "123456"), /email could not be sent/);
  assert.equal(closed, true);
  assert.match(logs[0], /535.*SMTP_USER.*SMTP_PASSWORD/);
  for (const secret of [smtp.smtpPassword, "visitor@example.test", "123456"]) assert.equal(logs[0].includes(secret), false);
});
test("HTTPS email errors identify provider authentication failures without exposing API credentials", async () => {
  const logs = [];
  const key = "test-private-email-api-key";
  const mailer = createMailer({ mailProvider: "resend", resendApiKey: key, emailFrom: "sender@example.test" }, {
    fetch: async () => ({ ok: false, status: 403 }),
    logError: (message) => logs.push(message),
  });
  await assert.rejects(mailer("visitor@example.test", "Code", "123456"), /email could not be sent/);
  assert.match(logs[0], /authentication or permissions/);
  assert.equal(logs[0].includes(key), false);
});
