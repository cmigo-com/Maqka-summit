const nodemailer = require('nodemailer');

let transporter = null;
let configured = false;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    configured = false;
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  configured = true;
  return transporter;
}

/**
 * Send an email. If SMTP is not configured (no .env values set), this logs the
 * email to the console instead of throwing -- so the rest of the app (bookings,
 * registration, etc.) keeps working in development without a mail server.
 */
async function sendEmail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || 'Maqka Summit <waltermichael357@gmail.com>';
  const t = getTransporter();

  if (!t) {
    console.log('--------------------------------------------------');
    console.log('[email] SMTP not configured -- logging email instead of sending.');
    console.log('[email] To:', to);
    console.log('[email] Subject:', subject);
    console.log('--------------------------------------------------');
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    await t.sendMail({ from, to, subject, html });
    return { sent: true };
  } catch (err) {
    console.error('[email] Failed to send email to', to, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendEmail };
