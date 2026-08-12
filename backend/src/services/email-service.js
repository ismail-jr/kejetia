require("dotenv").config();

// ─────────────────────────────────────────────
// Transactional email via Brevo's HTTP API
// ─────────────────────────────────────────────
//
// Render (and most free-tier PaaS providers) block outbound traffic on the
// SMTP ports 25/465/587 that nodemailer + Gmail relied on, so OTP delivery
// would time out in production even with correct credentials. Brevo's REST
// API sends mail over plain HTTPS (port 443), which is never blocked, so
// it's used instead of SMTP everywhere — including local development, to
// keep behavior identical.
//
// Setup: create a free account at https://www.brevo.com, verify a sender
// email/domain under Senders & IP, then create an API key under
// SMTP & API > API Keys. Set BREVO_API_KEY and EMAIL_FROM accordingly.
// Docs: https://developers.brevo.com/reference/send-transac-email

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_ACCOUNT_URL = "https://api.brevo.com/v3/account";

const FROM_ADDRESS = process.env.EMAIL_FROM || "no-reply@kejetia.app";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Kejetia";

// .trim() guards against a trailing newline/space from copy-pasting the key
// into .env, which otherwise produces a confusing "Key not found" error.
const apiKey = () => process.env.BREVO_API_KEY?.trim();

const brevoRequest = async (url, options = {}) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey() || "",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.message || `Brevo request failed with status ${res.status}`,
    );
  }

  return res.json().catch(() => ({}));
};

const sendEmail = async ({ to, subject, text, html }) => {
  await brevoRequest(BREVO_SEND_URL, {
    method: "POST",
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_ADDRESS },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
};

// Validates the Brevo API key at startup. Logs a clear message either way;
// never throws, so a misconfigured mailer surfaces in logs without
// crashing the whole gateway on boot.
const verifyEmailService = async () => {
  if (!apiKey()) {
    console.warn(
      "[email] BREVO_API_KEY not set — OTP emails will fail. Create a key " +
        "at app.brevo.com > SMTP & API > API Keys, verify a sender under " +
        "Senders & IP, then set BREVO_API_KEY and EMAIL_FROM.",
    );
    return false;
  }

  try {
    await brevoRequest(BREVO_ACCOUNT_URL);
    console.log("[email] Brevo API key verified and ready.");
    return true;
  } catch (err) {
    console.error(
      "[email] Brevo verification failed:",
      err.message,
      err.message === "Key not found"
        ? "— usually means the key was created under SMTP & API > SMTP " +
            "(an SMTP password) instead of SMTP & API > API Keys (a v3 key " +
            "starting with xkeysib-), or a masked/partial key was copied " +
            "instead of the full key shown once at creation."
        : "",
    );
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
  try {
    await sendEmail({
      to: toEmail,
      subject: `${otpCode} is your Kejetia verification code`,
      text:
        `Your Kejetia verification code is ${otpCode}. ` +
        `It expires in ${expiryMinutes} minutes. ` +
        `If you did not request this, you can ignore this email.`,
      html: otpTemplate(otpCode, expiryMinutes),
    });
  } catch (err) {
    console.error("[email] Failed to send OTP email:", err.message);
    throw new Error("Failed to send verification email");
  }
};

// ─────────────────────────────────────────────
// Verification success email
// ─────────────────────────────────────────────

const roleLabel = (role) => (role === "provider" ? "Provider" : "Student");

const roleNextStep = (role) =>
  role === "provider"
    ? "Sign in and head to your provider dashboard to set up your profile and list your first service."
    : "Sign in and start browsing campus services from your student dashboard.";

const verificationSuccessTemplate = (fullName, role) => {
  const firstName = (fullName || "there").trim().split(/\s+/)[0];
  const workspace = roleLabel(role);

  return `
  <div style="background-color: #f7f8fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 36px; border: 1px solid #e1e4ea; border-radius: 16px; box-shadow: 0 4px 12px rgba(12, 25, 45, 0.03);">

      <div style="margin-bottom: 28px;">
        <span style="color: #a3143c; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Kejetia</span>
      </div>

      <div style="background-color: #ecfdf3; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="margin: 0; color: #166534; font-size: 15px; font-weight: 600;">
          ✓ Your email has been verified
        </p>
      </div>

      <h2 style="color: #0c192d; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 12px; letter-spacing: -0.025em;">
        Welcome to Kejetia, ${firstName}!
      </h2>

      <p style="color: #536479; font-size: 15px; line-height: 1.6; margin-bottom: 16px; margin-top: 0;">
        Great news — your verification code was accepted and your <strong style="color: #0c192d;">${workspace}</strong> account is ready to go.
      </p>

      <p style="color: #536479; font-size: 15px; line-height: 1.6; margin-bottom: 24px; margin-top: 0;">
        ${roleNextStep(role)}
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${process.env.APP_URL || "https://kejetia.app"}/login"
           style="display: inline-block; background-color: #a3143c; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 10px;">
          Sign in to Kejetia
        </a>
      </div>

      <div style="border-top: 1px solid #e1e4ea; margin-top: 32px; padding-top: 20px;">
        <p style="color: #8a99ad; font-size: 12px; line-height: 1.5; margin: 0;">
          You’re receiving this because you just completed registration on Kejetia. If this wasn’t you, please contact support right away.
        </p>
      </div>

    </div>
  </div>
`;
};

// Sent after OTP verification succeeds. Non-blocking for the API — a failed
// delivery is logged but does not roll back an already-verified account.
const sendVerificationSuccessEmail = async (toEmail, fullName, role = "student") => {
  const workspace = roleLabel(role);
  const firstName = (fullName || "there").trim().split(/\s+/)[0];
  const loginUrl = `${process.env.APP_URL || "https://kejetia.app"}/login`;

  try {
    await sendEmail({
      to: toEmail,
      subject: `You're all set, ${firstName}! Your Kejetia account is verified`,
      text:
        `Hi ${firstName},\n\n` +
        `Your email has been verified and your ${workspace} account on Kejetia is ready.\n\n` +
        `${roleNextStep(role)}\n\n` +
        `Sign in here: ${loginUrl}\n\n` +
        `— The Kejetia team`,
      html: verificationSuccessTemplate(fullName, role),
    });
  } catch (err) {
    console.error("[email] Failed to send verification success email:", err.message);
    throw new Error("Failed to send verification success email");
  }
};

module.exports = { sendOtpEmail, sendVerificationSuccessEmail, verifyEmailService };
