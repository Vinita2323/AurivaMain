import nodemailer from 'nodemailer';
import env from '../config/env.js';

/**
 * Whether SMTP is fully configured for outbound email.
 */
export function isSmtpConfigured() {
  return Boolean(env.SMTP.HOST && env.SMTP.USER && env.SMTP.PASS);
}

/**
 * Missing SMTP / recovery env keys (for clear operator errors).
 */
export function getMissingEmailConfigKeys() {
  const missing = [];
  if (!env.SMTP.HOST) missing.push('SMTP_HOST');
  if (!env.SMTP.PORT) missing.push('SMTP_PORT');
  if (!env.SMTP.USER) missing.push('SMTP_USER');
  if (!env.SMTP.PASS) missing.push('SMTP_PASS');
  if (!env.ADMIN_RECOVERY_EMAIL) missing.push('ADMIN_RECOVERY_EMAIL');
  if (!env.FRONTEND_URL && !env.CLIENT_URL) missing.push('FRONTEND_URL or CLIENT_URL');
  return missing;
}

let cachedTransporter = null;

function createTransporter() {
  if (!isSmtpConfigured()) {
    const missing = getMissingEmailConfigKeys().filter((k) => k.startsWith('SMTP_'));
    const err = new Error(
      `Email delivery is not configured. Set these environment variables: ${missing.join(', ')}.`
    );
    err.statusCode = 503;
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  if (cachedTransporter) return cachedTransporter;

  const port = Number(env.SMTP.PORT) || 465;
  cachedTransporter = nodemailer.createTransport({
    host: env.SMTP.HOST,
    port,
    secure: env.SMTP.SECURE === true || port === 465,
    auth: {
      user: env.SMTP.USER,
      pass: env.SMTP.PASS
    }
  });

  return cachedTransporter;
}

/**
 * Allow tests to inject a mock transporter.
 */
export function setEmailTransporter(transporter) {
  cachedTransporter = transporter;
}

export function resetEmailTransporter() {
  cachedTransporter = null;
}

/**
 * Verify SMTP credentials / connectivity (does not send mail).
 */
export async function verifySmtpConnection() {
  const transporter = createTransporter();
  await transporter.verify();
  return {
    ok: true,
    host: env.SMTP.HOST,
    port: Number(env.SMTP.PORT) || 465,
    secure: env.SMTP.SECURE === true || Number(env.SMTP.PORT) === 465,
    user: env.SMTP.USER
  };
}

/**
 * Send a plain SMTP health-check email (no reset tokens).
 */
export async function sendSmtpTestEmail({ to } = {}) {
  const recipient = String(to || env.ADMIN_RECOVERY_EMAIL || '').trim().toLowerCase();
  if (!recipient) {
    const err = new Error('ADMIN_RECOVERY_EMAIL is not configured.');
    err.statusCode = 503;
    err.code = 'RECOVERY_EMAIL_MISSING';
    throw err;
  }

  const transporter = createTransporter();
  const from = env.SMTP.FROM || env.SMTP.USER;

  await transporter.sendMail({
    from: `"Auriva Foods Admin" <${from}>`,
    to: recipient,
    subject: 'Auriva Foods — SMTP test email',
    text: [
      'Auriva Foods SMTP test',
      '',
      'This message confirms Gmail SMTP is configured for the admin panel.',
      `Sender: ${from}`,
      `Time: ${new Date().toISOString()}`
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;color:#182019;padding:20px;">
        <h2 style="color:#0E2A1B;">Auriva Foods SMTP test</h2>
        <p>This message confirms Gmail SMTP is configured for the admin panel.</p>
        <p style="font-size:12px;color:#5A6B60;">Sender: ${from}<br/>Time: ${new Date().toISOString()}</p>
      </div>
    `
  });

  return { ok: true, to: recipient };
}

/**
 * Send admin password reset email to the configured recovery address.
 * Never logs the raw reset token or SMTP credentials.
 */
export async function sendAdminPasswordResetEmail({ to, resetUrl, expiresMinutes = 15 }) {
  if (!to) {
    const err = new Error('ADMIN_RECOVERY_EMAIL is not configured.');
    err.statusCode = 503;
    err.code = 'RECOVERY_EMAIL_MISSING';
    throw err;
  }

  const transporter = createTransporter();
  const from = env.SMTP.FROM || env.SMTP.USER;
  const loginEmail = env.ADMIN_LOGIN_EMAIL || 'Indgroup26@gmail.com';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Georgia,serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FAF7F2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #E8E2D5;overflow:hidden;">
          <tr>
            <td style="background:#0E2A1B;padding:24px 28px;text-align:center;">
              <p style="margin:0;color:#D4AF37;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Auriva Foods</p>
              <h1 style="margin:8px 0 0;color:#F7F3E9;font-size:22px;">Admin Password Reset</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#182019;font-size:15px;line-height:1.55;font-family:Arial,sans-serif;">
              <p style="margin:0 0 14px;">We received a request to reset the password for the Auriva Foods admin account (<strong>${loginEmail}</strong>).</p>
              <p style="margin:0 0 22px;">This link expires in <strong>${expiresMinutes} minutes</strong> and can be used only once.</p>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${resetUrl}" style="display:inline-block;background:#0E2A1B;color:#D4AF37;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;">
                  Reset Password
                </a>
              </p>
              <p style="margin:0 0 10px;font-size:12px;color:#5A6B60;">If the button does not work, copy and paste this URL into your browser:</p>
              <p style="margin:0;font-size:12px;word-break:break-all;color:#0E2A1B;">${resetUrl}</p>
              <p style="margin:22px 0 0;font-size:12px;color:#5A6B60;">If you did not request this, you can ignore this email. Your password will stay unchanged.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'Auriva Foods — Admin Password Reset',
    '',
    `We received a request to reset the password for ${loginEmail}.`,
    `This link expires in ${expiresMinutes} minutes and can be used only once.`,
    '',
    `Reset link: ${resetUrl}`,
    '',
    'If you did not request this, ignore this email.'
  ].join('\n');

  try {
    await transporter.sendMail({
      from: `"Auriva Foods Admin" <${from}>`,
      to,
      subject: 'Reset your Auriva Foods admin password',
      text,
      html
    });
  } catch (sendErr) {
    const err = new Error('Unable to send recovery email right now. Please try again later.');
    err.statusCode = 503;
    err.code = 'EMAIL_SEND_FAILED';
    err.cause = sendErr;
    throw err;
  }
}

export default {
  isSmtpConfigured,
  getMissingEmailConfigKeys,
  verifySmtpConnection,
  sendSmtpTestEmail,
  sendAdminPasswordResetEmail,
  setEmailTransporter,
  resetEmailTransporter
};
