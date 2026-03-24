import nodemailer from "nodemailer";

/**
 * Password reset OTP email.
 * Configure either:
 * - EMAIL_USER + EMAIL_PASS (Gmail: uses smtp.gmail.com:587), optional EMAIL_FROM
 * - Or SMTP_HOST + SMTP_USER + SMTP_PASS (+ optional SMTP_PORT, EMAIL_FROM)
 * Without credentials in production, throws; in dev, logs OTP to console.
 */
export async function sendPasswordResetOtp(to, otp) {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_FROM,
  } = process.env;

  const user = SMTP_USER || EMAIL_USER;
  const passRaw = SMTP_PASS || EMAIL_PASS;
  const pass = passRaw ? String(passRaw).replace(/\s/g, "") : "";

  const host =
    SMTP_HOST || (user ? "smtp.gmail.com" : undefined);
  const port = Number(SMTP_PORT) || 587;

  const from = EMAIL_FROM || user || "noreply@localhost";

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email delivery is not configured");
    }
    console.log(`[dev] Password reset OTP for ${to}: ${otp}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    subject: "Your password reset code",
    text: `Your password reset code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your password reset code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}
