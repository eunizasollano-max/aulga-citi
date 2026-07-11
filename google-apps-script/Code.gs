// Deploy this as a Google Apps Script Web App tied to your own Gmail account.
// Handles four things:
// 1. A new booking request comes in on booking.html -> emails you with a
//    link straight to that request in admin.html.
// 2. You Approve/Reject a request in admin.html -> emails the customer to
//    let them know, with a link back to booking.html if they were rejected
//    so they can pick another date/time.
// 3. Someone submits waiver.html -> emails them a copy of the signed waiver.
// 4. Someone submits the general inquiry form on index.html -> emails you.
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
    } else if (data.type === 'waiver_signed') {
      sendWaiverSignedEmail(data);
    } else if (data.type === 'general_inquiry') {
      sendGeneralInquiryEmail(data);
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

function sendGeneralInquiryEmail(data) {
  const subject = `New inquiry from the Aulga Citi website — ${data.name}`;
  const textBody = [
    'A general inquiry was submitted on the Aulga Citi website.',
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Venue of interest: ${data.venue}`,
    `Message: ${data.message}`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 480px;">
      <h2 style="margin-bottom: 4px;">New inquiry</h2>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Name</td><td style="padding:4px 0;">${data.name}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Email</td><td style="padding:4px 0;">${data.email}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Venue</td><td style="padding:4px 0;">${data.venue}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280; vertical-align:top;">Message</td><td style="padding:4px 0;">${data.message}</td></tr>
      </table>
    </div>
  `;

  // replyTo means you can just hit Reply in Gmail and it goes to the visitor,
  // even though the email itself was sent from your own address.
  MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: subject, body: textBody, htmlBody: htmlBody, replyTo: data.email });
}

function sendCustomerStatusEmail(data) {
  if (!data.email) return;

  const venueLabel = data.venue === 'sports' ? 'Aulga Citi Sports' : 'Aulga Citi Event Center';
  const court = describeCourt(data);
  const when = `${data.booking_date} at ${data.start_time}`;
  const isConfirmed = data.status === 'confirmed';
  const bookingUrl = hasSiteUrl() ? siteUrl('booking.html') : null;
  const waiverUrl = hasSiteUrl()
    ? siteUrl(`waiver.html?${[
        `id=${encodeURIComponent(data.id || '')}`,
        `name=${encodeURIComponent(data.name || '')}`,
        `email=${encodeURIComponent(data.email || '')}`,
        `venue=${encodeURIComponent(data.venue || '')}`,
        data.court_type ? `court_type=${encodeURIComponent(data.court_type)}` : '',
        data.sport_type ? `sport_type=${encodeURIComponent(data.sport_type)}` : '',
        `date=${encodeURIComponent(data.booking_date || '')}`,
        `start_time=${encodeURIComponent(data.start_time || '')}`,
        `duration_hours=${encodeURIComponent(data.duration_hours || '')}`,
      ].filter(Boolean).join('&')}`)
    : null;
  const paymentUrl = hasSiteUrl()
    ? siteUrl(`payment.html?${[
        `venue=${encodeURIComponent(data.venue || '')}`,
        data.court_type ? `court_type=${encodeURIComponent(data.court_type)}` : '',
        data.sport_type ? `sport_type=${encodeURIComponent(data.sport_type)}` : '',
        `date=${encodeURIComponent(data.booking_date || '')}`,
        `start_time=${encodeURIComponent(data.start_time || '')}`,
        `duration_hours=${encodeURIComponent(data.duration_hours || '')}`,
        `name=${encodeURIComponent(data.name || '')}`,
      ].filter(Boolean).join('&')}`)
    : null;

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
        'To finalize your booking, please complete payment:',
        paymentUrl || '(open the payment page on our website)',
        '',
        'Also please fill out the liability waiver for your group before your visit:',
        waiverUrl || '(open the waiver page on our website)',
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
        ${paymentUrl
          ? `<a href="${paymentUrl}" style="display:inline-block; background:#d97706; color:#ffffff; text-decoration:none; font-weight:bold; padding:12px 22px; border-radius:999px; margin: 4px 8px 4px 0;">Complete Payment</a>`
          : ''}
        ${waiverUrl
          ? `<a href="${waiverUrl}" style="display:inline-block; background:#334155; color:#ffffff; text-decoration:none; font-weight:bold; padding:12px 22px; border-radius:999px; margin: 4px 0;">Sign Liability Waiver</a>`
          : ''}
        <p style="color:#6b7280; font-size:13px; margin-top:16px;">Please complete payment and the waiver before your visit.</p>
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

const WAIVER_TEXT = [
  'Aulga Sports Gym Liability Waiver and Release Form',
  '',
  'I, the undersigned participant, voluntarily choose to use the facilities, equipment, and services provided by Aulga Sports.',
  '',
  'I understand and acknowledge that participation in gym activities, workouts, training sessions, and use of gym equipment involve inherent risks, including but not limited to: slipping or falling; muscle strains or sprains; collisions with other participants; and any other physical injury or accident that may occur while inside or within the premises.',
  '',
  'I hereby agree that I am participating at my own risk. I certify that I am physically fit and have no medical condition that would prevent me from safely using the gym facilities.',
  '',
  'I agree to follow all gym rules, safety instructions, and proper use of equipment.',
  '',
  'I hereby release, waive, discharge, and hold harmless Aulga Sports, its owners, staff, trainers, employees, and representatives from any and all liability, claims, demands, or causes of action arising from any injury, accident, loss, or damage that may occur during my use of the gym facilities.',
  '',
  'I acknowledge that this waiver is binding upon me, my heirs, assigns, and personal representatives.',
].join('\n');

function sendWaiverSignedEmail(data) {
  if (!data.lead_email) return;

  const members = (data.member_names || []).join(', ');
  const hasBooking = data.venue && data.booking_date;
  const venueLabel = data.venue === 'sports' ? 'Aulga Citi Sports' : 'Aulga Citi Event Center';
  const court = describeCourt(data);
  const signedAt = new Date().toLocaleString();

  const subject = 'Your Aulga Citi waiver has been signed';

  const textBody = [
    `Hi ${data.lead_name},`,
    '',
    'This confirms your liability waiver was submitted successfully.',
    '',
    hasBooking ? `Booking: ${venueLabel}${court} — ${data.booking_date} at ${data.start_time || ''}` : '',
    `Members covered: ${members}`,
    `Signed by: ${data.signature}`,
    `Submitted: ${signedAt}`,
    '',
    '--- Waiver text (for your records) ---',
    '',
    WAIVER_TEXT,
  ].filter(line => line !== '').join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; color:#1f2937; max-width:520px;">
      <h2 style="color:#059669; margin-bottom:4px;">Waiver signed</h2>
      <p>Hi ${data.lead_name},</p>
      <p>This confirms your liability waiver was submitted successfully.</p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
        ${hasBooking ? `<tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Booking</td><td style="padding:4px 0;"><strong>${venueLabel}${court}</strong> — ${data.booking_date} at ${data.start_time || ''}</td></tr>` : ''}
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280; vertical-align:top;">Members</td><td style="padding:4px 0;">${members}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Signed by</td><td style="padding:4px 0;">${data.signature}</td></tr>
        <tr><td style="padding:4px 12px 4px 0; color:#6b7280;">Submitted</td><td style="padding:4px 0;">${signedAt}</td></tr>
      </table>
      <p style="color:#6b7280; font-size:12px; margin-top:20px; border-top:1px solid #e5e7eb; padding-top:12px;">For your records, a copy of the waiver you agreed to:</p>
      <div style="color:#4b5563; font-size:12px; white-space:pre-line; line-height:1.6;">${WAIVER_TEXT}</div>
    </div>
  `;

  MailApp.sendEmail({ to: data.lead_email, subject: subject, body: textBody, htmlBody: htmlBody });
}

function describeCourt(data) {
  if (!data.court_type) return '';
  if (data.court_type === 'event') return ' (Event)';
  const sport = data.sport_type ? ` - ${data.sport_type}` : '';
  return ` (${data.court_type} court${sport})`;
}
