// Deploy this as a Google Apps Script Web App tied to your own Gmail account.
// Handles two things:
// 1. A new booking request comes in on booking.html -> emails you with a
//    link straight to that request in admin.html.
// 2. You Approve/Reject a request in admin.html -> emails the customer to
//    let them know, with a link back to booking.html if they were rejected
//    so they can pick another date/time.
// Setup instructions are in google-apps-script/SETUP.md.

const NOTIFY_EMAIL = 'eunizasollano@gmail.com';

// Once the site is hosted somewhere real, set this to that URL, e.g.
// 'https://aulgaciti.com' or 'https://yourname.github.io/aulga-citi'.
const SITE_BASE_URL = 'https://eunizasollano-max.github.io/aulga-citi';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === 'status_update') {
      sendCustomerStatusEmail(data);
    } else {
      sendOwnerNewRequestEmail(data);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function hasSiteUrl() {
  return SITE_BASE_URL && !SITE_BASE_URL.startsWith('YOUR_');
}

function siteUrl(path) {
  return `${SITE_BASE_URL.replace(/\/$/, '')}/${path}`;
}

function sendOwnerNewRequestEmail(data) {
  const venueLabel = data.venue === 'sports' ? 'Aulga Citi Sports' : 'Aulga Citi Event Center';
  const court = describeCourt(data);
  const guests = data.guest_count ? String(data.guest_count) : 'n/a';
  const phone = data.phone || 'n/a';
  const message = data.message || 'n/a';

  const subject = `New booking request — ${venueLabel} — ${data.booking_date}`;
  const adminUrl = hasSiteUrl() ? siteUrl(`admin.html?id=${encodeURIComponent(data.id)}`) : null;

  const textBody = [
    'A new booking request just came in on the Aulga Citi website.',
    '',
    `Venue: ${venueLabel}${court}`,
    `Date: ${data.booking_date}`,
    `Time: ${data.start_time} for ${data.duration_hours} hour(s)`,
    `Guests: ${guests}`,
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${phone}`,
    `Message: ${message}`,
    '',
    adminUrl ? `Review and approve/reject it here: ${adminUrl}` : 'Log into admin.html to approve or reject this request.',
  ].join('\n');

  const reviewButton = adminUrl
    ? `<a href="${adminUrl}" style="display:inline-block; background:#d97706; color:#ffffff; text-decoration:none; font-weight:bold; padding:12px 22px; border-radius:999px;">Review Request</a>`
    : `<p style="color:#9ca3af; font-size:12px;">Log into admin.html to approve or reject this request.</p>`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 480px;">
      <h2 style="margin-bottom: 4px;">New booking request</h2>
      <p style="color:#6b7280; margin-top:0;">${venueLabel}${court}</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Date</td><td style="padding:4px 0;"><strong>${data.booking_date}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Time</td><td style="padding:4px 0;">${data.start_time} for ${data.duration_hours} hr(s)</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Guests</td><td style="padding:4px 0;">${guests}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Name</td><td style="padding:4px 0;">${data.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Email</td><td style="padding:4px 0;">${data.email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Phone</td><td style="padding:4px 0;">${phone}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280; vertical-align:top;">Message</td><td style="padding:4px 0;">${message}</td></tr>
      </table>
      ${reviewButton}
    </div>
  `;

  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: textBody, htmlBody: htmlBody });
}

function sendCustomerStatusEmail(data) {
  if (!data.email) return;

  const venueLabel = data.venue === 'sports' ? 'Aulga Citi Sports' : 'Aulga Citi Event Center';
  const court = describeCourt(data);
  const when = `${data.booking_date} at ${data.start_time}`;
  const isConfirmed = data.status === 'confirmed';
  const bookingUrl = hasSiteUrl() ? siteUrl('booking.html') : null;

  const subject = isConfirmed
    ? `Your Aulga Citi booking is confirmed — ${data.booking_date}`
    : `Update on your Aulga Citi booking request`;

  const textLines = isConfirmed
    ? [
        `Hi ${data.name},`,
        '',
        `Good news — your booking is confirmed!`,
        '',
        `Venue: ${venueLabel}${court}`,
        `Date: ${when}, for ${data.duration_hours} hour(s)`,
        '',
        'We look forward to hosting you. Reach out if anything changes.',
      ]
    : [
        `Hi ${data.name},`,
        '',
        `Unfortunately we're not able to accommodate your request for ${venueLabel}${court} on ${when}.`,
        '',
        "You're welcome to check availability and request a different date or time:",
        bookingUrl || '(check the booking page on our website)',
        '',
        "Sorry for the inconvenience — we'd love to have you another time.",
      ];

  const textBody = textLines.join('\n');

  const htmlBody = isConfirmed
    ? `
      <div style="font-family: Arial, sans-serif; color:#1f2937; max-width:480px;">
        <h2 style="color:#059669; margin-bottom:4px;">Booking confirmed</h2>
        <p>Hi ${data.name},</p>
        <p>Good news — your booking is confirmed!</p>
        <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Venue</td><td style="padding:4px 0;"><strong>${venueLabel}${court}</strong></td></tr>
          <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Date</td><td style="padding:4px 0;">${data.booking_date}</td></tr>
          <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Time</td><td style="padding:4px 0;">${data.start_time} for ${data.duration_hours} hr(s)</td></tr>
        </table>
        <p style="color:#6b7280; font-size:13px;">We look forward to hosting you. Reach out if anything changes.</p>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; color:#1f2937; max-width:480px;">
        <h2 style="color:#374151; margin-bottom:4px;">About your booking request</h2>
        <p>Hi ${data.name},</p>
        <p>Unfortunately we're not able to accommodate your request for <strong>${venueLabel}${court}</strong> on <strong>${when}</strong>.</p>
        ${bookingUrl
          ? `<a href="${bookingUrl}" style="display:inline-block; background:#d97706; color:#ffffff; text-decoration:none; font-weight:bold; padding:12px 22px; border-radius:999px; margin: 12px 0;">Pick another date/time</a>`
          : ''}
        <p style="color:#6b7280; font-size:13px;">Sorry for the inconvenience — we'd love to have you another time.</p>
      </div>
    `;

  MailApp.sendEmail({ to: data.email, subject: subject, body: textBody, htmlBody: htmlBody });
}

function describeCourt(data) {
  if (!data.court_type) return '';
  if (data.court_type === 'event') return ' (Event)';
  const sport = data.sport_type ? ` - ${data.sport_type}` : '';
  return ` (${data.court_type} court${sport})`;
}
