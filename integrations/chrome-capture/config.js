// The project URL and the anon key are the same pair the public website
// ships — they are designed to be public and grant nothing on their own.
// Every table this extension could touch is behind RLS, and the one function
// it calls refuses anything without a valid capture token.
//
// THE CAPTURE TOKEN IS THE CREDENTIAL, and it is never in this file: each
// telecaller pastes their own on first use and it lives in chrome.storage.
export const SUPABASE_URL = 'https://rqgkzamuohdvttnkluzn.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZ2t6YW11b2hkdnR0bmtsdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTcwNDcsImV4cCI6MjA5NjQ5MzA0N30.d2S9YT7AtTHytz5DN067mqA4CMyxIF2KnL5awwaOoBQ';
