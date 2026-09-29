const GREEN = '#1f3d2b';
const GOLD = '#c8912f';
const CREAM = '#f8f6f1';

function money(n) {
  return `KSh ${Number(n || 0).toLocaleString()}`;
}

/**
 * Shared responsive HTML email shell. Table-based layout for Outlook/Gmail
 * compatibility. `bodyHtml` is inserted as-is inside the content cell.
 */
function baseLayout({ title, bodyHtml }) {
  return `
<!doctype html>
<html>
  <body style="margin:0; padding:0; background:${CREAM}; font-family:Georgia, 'Times New Roman', serif; color:#22291f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM}; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="background:${GREEN}; padding:28px 24px; text-align:center;">
                <div style="color:#ffffff; font-size:22px; font-weight:bold; letter-spacing:1px;">MAQKA SUMMIT</div>
                <div style="color:${GOLD}; font-size:11px; letter-spacing:3px; margin-top:4px;">ADVENTURES AND TOURS</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;">
                <h2 style="color:${GREEN}; margin-top:0;">${title}</h2>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:${GREEN}; padding:18px 24px; text-align:center;">
                <p style="color:#ffffff; font-size:12px; margin:0;">Maqka Summit &middot; Nanyuki, Kenya &middot; 0713 177 186 &middot; waltermichael357@gmail.com</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailRow(label, value) {
  return `<tr>
    <td style="padding:6px 0; color:#6b7568; font-size:14px;">${label}</td>
    <td style="padding:6px 0; text-align:right; font-weight:bold; font-size:14px;">${value}</td>
  </tr>`;
}

function detailsTable(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0; border-top:1px solid #eee; border-bottom:1px solid #eee;">${rows.join('')}</table>`;
}

function ctaButton(url, label) {
  return `<div style="text-align:center; margin:24px 0;">
    <a href="${url}" style="background:${GOLD}; color:${GREEN}; text-decoration:none; padding:12px 24px; border-radius:4px; font-weight:bold; display:inline-block;">${label}</a>
  </div>`;
}

function welcomeEmail({ name, dashboardUrl }) {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Welcome to Maqka Summit! Your account has been created and you're ready to start exploring guided hikes and mountain treks across Kenya.</p>
    <p>From your dashboard you can browse adventures, make bookings, and track your payments and booking status any time.</p>
    ${ctaButton(dashboardUrl, 'Go to My Dashboard')}
    <p>See you on the trail.</p>
  `;
  return { subject: 'Welcome to Maqka Summit', html: baseLayout({ title: `Welcome, ${name}!`, bodyHtml }) };
}

function passwordResetEmail({ name, resetUrl }) {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>We received a request to reset your Maqka Summit password. Click the button below to choose a new one. This link expires in 1 hour.</p>
    ${ctaButton(resetUrl, 'Reset My Password')}
    <p style="color:#6b7568; font-size:13px;">If you didn't request this, you can safely ignore this email — your password will not change.</p>
  `;
  return { subject: 'Reset Your Maqka Summit Password', html: baseLayout({ title: 'Password Reset Request', bodyHtml }) };
}

function bookingReceivedEmail({ name, bookingNumber, adventureTitle, departure, travelers, totalPrice, amountPaid, balance, status }) {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Thanks for booking with Maqka Summit! Here's a summary of your request:</p>
    ${detailsTable([
      detailRow('Booking Number', bookingNumber),
      detailRow('Adventure', adventureTitle),
      detailRow('Departure', departure || 'To be confirmed'),
      detailRow('Travelers', travelers),
      detailRow('Total Amount', money(totalPrice)),
      detailRow('Amount Paid', money(amountPaid)),
      detailRow('Outstanding Balance', money(balance)),
      detailRow('Status', status),
    ])}
    <p>Your booking is <strong>pending confirmation</strong> — our team will review availability and confirm shortly. We'll share bank transfer/cash payment details once it's approved.</p>
  `;
  return { subject: 'Booking Received — Maqka Summit', html: baseLayout({ title: 'Booking Received', bodyHtml }) };
}

function bookingConfirmedEmail({ name, bookingNumber, adventureTitle, route, departure, travelers, totalPrice, amountPaid, balance, meetingPoint }) {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>Great news — your booking has been <strong>confirmed</strong>!</p>
    ${detailsTable([
      detailRow('Booking Number', bookingNumber),
      detailRow('Adventure', adventureTitle),
      detailRow('Route', route || '—'),
      detailRow('Departure', departure || 'To be confirmed'),
      detailRow('Travelers', travelers),
      detailRow('Total Amount', money(totalPrice)),
      detailRow('Amount Paid', money(amountPaid)),
      detailRow('Balance Due', money(balance)),
      detailRow('Meeting Point', meetingPoint || 'Details to follow'),
    ])}
    <p>Please make sure you have appropriate gear for the altitude and duration of your trek. If you have an outstanding balance, you can pay by bank transfer or cash — contact us for details.</p>
    <p>Questions? Reach us on 0713 177 186 or waltermichael357@gmail.com.</p>
  `;
  return { subject: 'Your Maqka Summit Booking is Confirmed', html: baseLayout({ title: 'Booking Confirmed', bodyHtml }) };
}

function paymentReceivedEmail({ name, bookingNumber, amount, reference, totalPaid, balance, paymentDate }) {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>We've recorded a payment on your Maqka Summit booking. Thank you!</p>
    ${detailsTable([
      detailRow('Booking Number', bookingNumber),
      detailRow('Amount Paid Now', money(amount)),
      detailRow('Reference', reference || '—'),
      detailRow('Payment Date', paymentDate),
      detailRow('Total Paid So Far', money(totalPaid)),
      detailRow('Remaining Balance', money(balance)),
    ])}
    ${balance > 0 ? '<p>You still have a balance outstanding — you can pay this in installments any time before departure.</p>' : '<p>Your booking is now fully paid. See you on the trail!</p>'}
  `;
  return { subject: 'Payment Received — Maqka Summit', html: baseLayout({ title: 'Payment Received', bodyHtml }) };
}

function paymentReminderEmail({ name, bookingNumber, adventureTitle, balance, departure }) {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>This is a friendly reminder that your booking for <strong>${adventureTitle}</strong> has an outstanding balance.</p>
    ${detailsTable([
      detailRow('Booking Number', bookingNumber),
      detailRow('Departure', departure || 'To be confirmed'),
      detailRow('Balance Due', money(balance)),
    ])}
    <p>You can pay by bank transfer or cash — contact us on 0713 177 186 or waltermichael357@gmail.com to arrange payment.</p>
  `;
  return { subject: 'Payment Reminder — Maqka Summit', html: baseLayout({ title: 'Payment Reminder', bodyHtml }) };
}

function bookingStatusUpdateEmail({ name, bookingNumber, adventureTitle, newStatus }) {
  const bodyHtml = `
    <p>Hi ${name},</p>
    <p>The status of your Maqka Summit booking has been updated.</p>
    ${detailsTable([
      detailRow('Booking Number', bookingNumber),
      detailRow('Adventure', adventureTitle),
      detailRow('New Status', newStatus),
    ])}
    <p>Log in to your dashboard any time to see the full details of your booking.</p>
  `;
  return { subject: 'Booking Status Update — Maqka Summit', html: baseLayout({ title: 'Booking Status Updated', bodyHtml }) };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function contactReplyEmail({ name, replyText }) {
  const bodyHtml = `
    <p>Hello ${name},</p>
    <p>Thank you for contacting Maqka Summit.</p>
    <div style="background:${CREAM}; border-radius:6px; padding:16px; margin:16px 0; white-space:pre-wrap;">${escapeHtml(replyText)}</div>
    <p>Regards,<br/>Maqka Summit<br/>Nanyuki, Kenya<br/>0713 177 186<br/>waltermichael357@gmail.com</p>
  `;
  return { subject: 'Reply from Maqka Summit', html: baseLayout({ title: 'A Reply From Maqka Summit', bodyHtml }) };
}

module.exports = {
  welcomeEmail,
  passwordResetEmail,
  bookingReceivedEmail,
  bookingConfirmedEmail,
  paymentReceivedEmail,
  paymentReminderEmail,
  bookingStatusUpdateEmail,
  contactReplyEmail,
};
