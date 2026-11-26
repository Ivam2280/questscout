const nodemailer = require("nodemailer");
const { UserInputError } = require("../utils/errors");

function configuredProviders(config) {
  return {
    smtp: Boolean(config.smtpHost && config.smtpUser && config.smtpPassword),
    emailjs: Boolean(config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey),
    resend: Boolean(config.resendApiKey && config.emailFrom),
  };
}

function mailProvider(config) {
  const available = configuredProviders(config);
  if (config.mailProvider && config.mailProvider !== "auto") return available[config.mailProvider] ? config.mailProvider : null;
  return ["emailjs", "resend", "smtp"].find((provider) => available[provider]) || null;
}

function createSmtpTransport(config, createTransport = nodemailer.createTransport) {
  return createTransport({
    host: config.smtpHost, port: config.smtpPort, secure: config.smtpSecure,
    requireTLS: !config.smtpSecure,
    auth: { user: config.smtpUser, pass: config.smtpPassword },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
  });
}

function describeMailError(provider, error) {
  if (provider === "smtp" && (error?.code === "EAUTH" || error?.responseCode === 535)) {
    return "SMTP authentication rejected (535). Check SMTP_USER and SMTP_PASSWORD. Gmail requires a valid Google App Password.";
  }
  if (["ETIMEDOUT", "ESOCKET", "ECONNECTION", "ECONNREFUSED", "ENOTFOUND"].includes(error?.code) || ["TimeoutError", "AbortError"].includes(error?.name)) {
    return "Email connection failed or timed out. Check the mail host, port, TLS settings and network access. Render Free requires an HTTPS mail provider.";
  }
  if (error?.status === 401 || error?.status === 403) return "Email provider rejected authentication or permissions. Check its API keys and sender settings.";
  if (error?.status === 429) return "Email provider rate limit or quota reached. Check the provider dashboard and try again later.";
  return "Email provider rejected delivery. Check the configured provider, sender and recipient settings.";
}

function createMailer(config, dependencies = {}) {
  const fetchRequest = dependencies.fetch || ((...args) => fetch(...args));
  const createTransport = dependencies.createTransport || nodemailer.createTransport;
  const logError = dependencies.logError || console.error;
  return async (to, subject, text) => {
    const provider = mailProvider(config);
    if (!provider) throw new UserInputError("Email delivery is temporarily unavailable. Please try again later or sign in with your password.");
    try {
      if (provider === "smtp") {
        const transport = createSmtpTransport(config, createTransport);
        try { await transport.sendMail({ from: config.emailFrom || config.smtpUser, to, subject, text }); }
        finally { transport.close?.(); }
        return true;
      }
      const emailjs = provider === "emailjs";
      const response = await fetchRequest(emailjs ? "https://api.emailjs.com/api/v1.0/email/send" : "https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(!emailjs ? { Authorization: `Bearer ${config.resendApiKey}` } : {}) },
        body: JSON.stringify(emailjs ? {
          service_id: config.emailjsServiceId,
          template_id: config.emailjsTemplateId,
          user_id: config.emailjsPublicKey,
          ...(config.emailjsPrivateKey ? { accessToken: config.emailjsPrivateKey } : {}),
          template_params: { to_email: to, subject, message: text, code: text.match(/\b\d{6}\b/)?.[0] || "" },
        } : { from: config.emailFrom, to: [to], subject, text }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw Object.assign(new Error("Email provider rejected the request."), { status: response.status });
      return true;
    } catch (error) {
      logError(`[mail:${provider}] ${describeMailError(provider, error)}`);
      throw new UserInputError("The email could not be sent. Please try again later.");
    }
  };
}

module.exports = { createMailer, mailProvider, createSmtpTransport, describeMailError };
