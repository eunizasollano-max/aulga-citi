# Email notification setup (Google Apps Script)

This makes the site send you an email at eunizasollano@gmail.com every time
someone submits a booking request on booking.html, with a **Review
Request** button that takes you straight to that request in `admin.html` —
where you already log in and click Approve/Reject. It runs on your own
Google account — no new third-party service to sign up for, and no secret
keys to manage.

If you already did the original setup, just replace your existing script's
code with the current `Code.gs` and redeploy (see **"Updating an existing
setup"** below) — you don't start over.

## 1. Create the script

1. Go to https://script.google.com and click **New project**.
2. Delete the default `myFunction() {}` code and paste in the contents of
   `Code.gs` (in this same folder).
3. Rename the project (top left) to something like "Aulga Citi Booking Notifier".
4. Click the **Save** icon.

## 2. Deploy it as a web app

1. Click **Deploy** (top right) → **New deployment**.
2. Click the gear icon next to "Select type" → choose **Web app**.
3. Set:
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Google will ask you to authorize the script (since it sends email on
   your behalf) — click **Advanced** → **Go to (project name) (unsafe)**
   if you see the "unverified app" warning (normal for your own script),
   then **Allow**.
6. Copy the **Web app URL** it gives you (looks like
   `https://script.google.com/macros/s/AKfycb.../exec`).

## 3. Connect it to the site

Open `js/supabase-client.js` and paste the URL into the
`BOOKING_NOTIFY_URL` constant at the top.

## 4. Once the site has a real web address

Right now `Code.gs` has `SITE_BASE_URL` set to a placeholder, so the email
still arrives but without a working "Review Request" button (it just tells
you to log into admin.html directly). Once you host the site somewhere
(your own domain, Netlify, GitHub Pages, etc.):

1. Open your Apps Script project, edit the `SITE_BASE_URL` constant near
   the top of `Code.gs` to your real site URL, e.g.
   `https://aulgaciti.com` (no trailing slash, no `/admin.html`).
2. Follow **"Updating an existing setup"** below to redeploy.

## Updating an existing setup

1. Open your existing project at script.google.com.
2. Replace all the code with the current contents of `Code.gs`.
3. Click **Deploy** → **Manage deployments** → click the **pencil/edit
   icon** on your existing deployment → under "Version" choose **New
   version** → **Deploy**. This keeps the same `/exec` URL, so you don't
   need to touch `js/supabase-client.js` again.

## Notes

- The notification is best-effort: if it fails for any reason, the booking
  request itself is unaffected — it's already safely stored in Supabase and
  will still show up in `admin.html`.
- The "Review Request" link just opens `admin.html?id=...`, which scrolls to
  and highlights that specific request — you still need to log in normally
  to approve or reject it. Nothing in the email itself can change a booking.
