const { env } = require("../server/config/env");
const { mailProvider, createSmtpTransport, describeMailError } = require("../server/services/mail");

async function checkMail() {
  const provider = mailProvider(env);
  if (!provider) {
    console.error("No email provider is configured. See docs/authentication.md.");
    process.exitCode = 1;
    return;
  }
  console.log(`Configured email provider: ${provider}.`);
  if (provider !== "smtp") {
    console.log("HTTPS provider settings are present. Delivery cannot be verified without sending a message; no message was sent.");
    return;
  }
  const transport = createSmtpTransport(env);
  try {
    await transport.verify();
    console.log("SMTP connection and authentication succeeded. No email was sent.");
  } catch (error) {
    console.error(describeMailError(provider, error));
    process.exitCode = 1;
  } finally {
    transport.close();
  }
}

checkMail();
