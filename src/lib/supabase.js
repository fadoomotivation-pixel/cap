import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqgkzamuohdvttnkluzn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxZ2t6YW11b2hkdnR0bmtsdXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTcwNDcsImV4cCI6MjA5NjQ5MzA0N30.d2S9YT7AtTHytz5DN067mqA4CMyxIF2KnL5awwaOoBQ'; // anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
