const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOtpEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"Kejetia" <${process.env.EMAIL_FROM}>`,
    to: toEmail,
    subject: `${otpCode} is your Kejetia Verification Code`,
    html: `
      <div style="background-color: #f7f8fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; min-height: 100%;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 36px; border: 1px solid #e1e4ea; border-radius: 16px; box-shadow: 0 4px 12px rgba(12, 25, 45, 0.03);">
          
          <div style="margin-bottom: 28px;">
            <span style="color: #a3143c; font-size: 13px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">Kejetia</span>
          </div>

          <h2 style="color: #0c192d; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 12px; letter-spacing: -0.025em;">Verify your email address</h2>
          
          <p style="color: #536479; font-size: 15px; line-height: 1.6; margin-bottom: 24px; margin-top: 0;">
            Thank you for joining Kejetia. Use the verification code below to complete your application profile. For your security, this code will automatically expire in <strong style="color: #0c192d;">30 minutes</strong>.
          </p>
          
          <div style="background-color: #fdf0f3; border: 1px solid #f9d3dc; padding: 24px; border-radius: 12px; text-align: center; margin: 28px 0;">
            <span style="font-size: 38px; font-weight: 800; letter-spacing: 8px; color: #a3143c; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: block; margin-left: 8px;">${otpCode}</span>
          </div>
          
          <p style="color: #536479; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            Enter this code on the verification screen to securely activate your student portal access.
          </p>

          <div style="border-top: 1px solid #e1e4ea; margin-top: 32px; padding-top: 20px;">
            <p style="color: #8a99ad; font-size: 12px; line-height: 1.5; margin: 0;">
              If you did not initiate this registration request, you can safely ignore this automated message. Someone may have typed your campus handle by mistake.
            </p>
          </div>

        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
