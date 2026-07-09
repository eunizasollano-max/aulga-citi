// Fill these in from Supabase: Project Settings -> API
const SUPABASE_URL = 'https://lqueyjuqcnkbglldgdsr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxdWV5anVxY25rYmdsbGRnZHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzAwMTAsImV4cCI6MjA5OTE0NjAxMH0.y-z9Loi8XqOgQsTQbEuH4llx8t1yPBOj7vUcsuyih70';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Google Apps Script web app URL from google-apps-script/SETUP.md.
// Leave as-is to skip email notifications (bookings still save fine).
const BOOKING_NOTIFY_URL = 'https://script.google.com/macros/s/AKfycbxDcO7kBCqbCqm4khC1uvbwwEweLwnNXQRRL34CGGu1egmFac3f9gVJlHptfvuXc2s/exec';
