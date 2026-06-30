const nodemailer = require("nodemailer");
require("dotenv").config();

// ─────────────────────────────────────────────
// Transport configuration
// ─────────────────────────────────────────────
//
// Supports two ways to configure SMTP:
//   1. A well-known service via SMTP_SERVICE (e.g. "gmail"), which lets
//      nodemailer pick the right host/port/security automatically. With
//      Gmail you MUST use an App Password, not your normal password.
//   2. Explicit SMTP_HOST / SMTP_PORT (+ SMTP_SECURE) for any provider.
//
// `secure` is true for port 465 (implicit TLS) and false otherwise
// (STARTTLS on 587/25). It can be forced with SMTP_SECURE=true|false.

const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);

const resolveSecure = () => {
  if (typeof process.env.SMTP_SECURE === "string") {
    return process.env.SMTP_SECURE.toLowerCase() === "true";
  }
  return SMTP_PORT === 465;
};

const FROM_ADDRESS =
  process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@kejetia.app";

let transporter;

const buildTransporter = () => {
  const base = {
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // A small pool keeps OTP delivery snappy under load without opening a
    // fresh connection per email.
    pool: true,
    maxConnections: 3,
  };

  if (process.env.SMTP_SERVICE) {
    return nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      ...base,
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: SMTP_PORT,
    secure: resolveSecure(),
    ...base,
  });
};

const getTransporter = () => {
  if (!transporter) {
    transporter = buildTransporter();
  }
  return transporter;
};

// Validates the SMTP configuration/credentials at startup. Logs a clear
// message either way; never throws, so a misconfigured mailer surfaces in
// logs without crashing the whole gateway on boot.
const verifyTransporter = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(
      "[email] SMTP_USER / SMTP_PASS not set — OTP emails will fail. " +
        "Set SMTP_SERVICE (e.g. gmail) or SMTP_HOST/SMTP_PORT plus " +
        "SMTP_USER/SMTP_PASS and EMAIL_FROM.",
    );
    return false;
  }

  try {
    await getTransporter().verify();
    console.log("[email] SMTP transport verified and ready.");
    return true;
  } catch (err) {
    console.error("[email] SMTP verification failed:", err.message);
    return false;
  }
};

// ─────────────────────────────────────────────
// OTP email
// ─────────────────────────────────────────────

const otpTemplate = (otpCode, expiryMinutes) => `
  <div style="background-color: #f7f8fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 36px; border: 1px solid #e1e4ea; border-radius: 16px; box-shadow: 0 4px 12px rgba(12, 25, 45, 0.03);">

      <div style="margin-bottom: 28px;">
        <span style="color: #a3143c; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Kejetia</span>
      </div>

      <h2 style="color: #0c192d; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 12px; letter-spacing: -0.025em;">Verify your email address</h2>

      <p style="color: #536479; font-size: 15px; line-height: 1.6; margin-bottom: 24px; margin-top: 0;">
        Thank you for joining Kejetia. Use the verification code below to complete your registration. For your security, this code will expire in <strong style="color: #0c192d;">${expiryMinutes} minutes</strong>.
      </p>

      <div style="background-color: #fdf0f3; border: 1px solid #f9d3dc; padding: 24px; border-radius: 12px; text-align: center; margin: 28px 0;">
        <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #a3143c; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: block; margin-left: 8px;">${otpCode}</span>
      </div>

      <p style="color: #536479; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
        Enter this code on the verification screen to securely activate your student portal access.
      </p>

      <div style="border-top: 1px solid #e1e4ea; margin-top: 32px; padding-top: 20px;">
        <p style="color: #8a99ad; font-size: 12px; line-height: 1.5; margin: 0;">
          If you did not initiate this registration request, you can safely ignore this automated message.
        </p>
      </div>

    </div>
  </div>
`;

// Sends a 6-digit OTP. Throws on failure so callers can react (e.g. roll
// back a half-created account and tell the user delivery failed) instead
// of silently proceeding as if the email went out.
const sendOtpEmail = async (toEmail, otpCode, expiryMinutes = 10) => {
  const mailOptions = {
    from: `"Kejetia" <${FROM_ADDRESS}>`,
    to: toEmail,
    subject: `${otpCode} is your Kejetia verification code`,
    text:
      `Your Kejetia verification code is ${otpCode}. ` +
      `It expires in ${expiryMinutes} minutes. ` +
      `If you did not request this, you can ignore this email.`,
    html: otpTemplate(otpCode, expiryMinutes),
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (err) {
    console.error("[email] Failed to send OTP email:", err.message);
    throw new Error("Failed to send verification email");
  }
};

module.exports = { sendOtpEmail, verifyTransporter };
