// Fill these in from Supabase: Project Settings -> API
const SUPABASE_URL = 'https://vkcxqpgqeamydyzhqfxr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrY3hxcGdxZWFteWR5emhxZnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MzYyODIsImV4cCI6MjA5OTQxMjI4Mn0.RaPN-n6Ws8I5Y4587tkFAsil7E9ctqro26W5ri9MxZE';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Google Apps Script web app URL from google-apps-script/SETUP.md.
// Leave as-is to skip email notifications (bookings still save fine).
const BOOKING_NOTIFY_URL = 'https://script.google.com/macros/s/AKfycby607iaWgFLCWDYN_VbC61MAT0xSwCCo9PvKZferH7PGFOtqa8Vy8FpL4Gm1JEua9I/exec';
