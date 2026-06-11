const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// DEBUG LOGS: Run npm run dev and look at these outputs!
console.log("--- SUPABASE BOOT CHECK ---");
console.log("URL Loaded:", !!supabaseUrl);
console.log(
  "Service Key Length:",
  supabaseServiceKey ? supabaseServiceKey.length : 0,
);
console.log(
  "Service Key Starts With:",
  supabaseServiceKey ? supabaseServiceKey.substring(0, 5) : "NOT FOUND",
);
console.log("----------------------------");

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabaseAdmin;
