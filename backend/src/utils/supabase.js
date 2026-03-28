const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getClient() {
  if (!_client) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    }
    _client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }
  return _client;
}

// Proxy so existing code using `supabase.from(...)` still works
module.exports = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  }
});
