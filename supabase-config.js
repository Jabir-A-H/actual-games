const SUPABASE_URL = 'https://uuvhlvetntrlksyiqrrm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dmhsdmV0bnRybGtzeWlxcnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NzcyMDgsImV4cCI6MjA3MDI1MzIwOH0.UvRRkPp2cPbyJXKwxMZcJXo312JixBSwIAJYpN62kAw';

// Initialize Supabase client and expose it globally as the `supabase` instance.
// Using `window.supabase.createClient` avoids a TDZ error from shadowing the global.
if (window.supabase && typeof window.supabase.createClient === 'function') {
	window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
	console.error('Supabase JS failed to load. Check the CDN script tag in index.html.');
}
