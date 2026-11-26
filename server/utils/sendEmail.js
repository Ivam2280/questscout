const { env } = require("../config/env");
const { createMailer, mailProvider } = require("../services/mail");

function emailEnabled() { return Boolean(mailProvider(env)); }

async function sendEmail(to, subject, text) {
  return createMailer(env)(to, subject, text);
}

module.exports = sendEmail;
module.exports.emailEnabled = emailEnabled;
