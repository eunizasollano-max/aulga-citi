// Deploy this as a Google Apps Script Web App tied to your own Gmail account.
// It receives booking details from booking.html and emails you a notification
// with a link straight to that request in admin.html, where you Approve/Reject
// using your existing admin login.
// Setup instructions are in google-apps-script/SETUP.md.

const NOTIFY_EMAIL = 'eunizasollano@gmail.com';

// Once the site is hosted somewhere real, set this to that URL, e.g.
// 'https://aulgaciti.com' or 'https://yourname.github.io/aulga-citi'.
// Leave as-is until then — the email will still arrive, it just won't have
// a working "Review Request" button.
const SITE_BASE_URL = 'YOUR_HOSTED_SITE_URL';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const venueLabel = data.venue === 'sports' ? 'Aulga Citi Sports' : 'Aulga Citi Event Center';
    const court = describeCourt(data);
    const guests = data.guest_count ? String(data.guest_count) : 'n/a';
    const phone = data.phone || 'n/a';
    const message = data.message || 'n/a';

    const subject = `New booking request — ${venueLabel} — ${data.booking_date}`;
    const hasSiteUrl = SITE_BASE_URL && !SITE_BASE_URL.startsWith('YOUR_');
    const adminUrl = hasSiteUrl
      ? `${SITE_BASE_URL.replace(/\/$/, '')}/admin.html?id=${encodeURIComponent(data.id)}`
      : null;

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
      hasSiteUrl
        ? `Review and approve/reject it here: ${adminUrl}`
        : 'Log into admin.html to approve or reject this request.',
    ].join('\n');

    const reviewButton = hasSiteUrl
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

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      subject: subject,
      body: textBody,
      htmlBody: htmlBody,
    });

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function describeCourt(data) {
  if (!data.court_type) return '';
  if (data.court_type === 'event') return ' (Event)';
  const sport = data.sport_type ? ` - ${data.sport_type}` : '';
  return ` (${data.court_type} court${sport})`;
}
