
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  console.log("URL:", url);
  console.log("Key defined:", !!key);

  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }

  const supabase = createClient(url, key);

  console.log("Checking 'capacitaciones' table...");
  const { data: capData, error: capError } = await supabase.from('capacitaciones').select('*').limit(1);
  if (capError) {
    console.error("Error fetching capacitaciones:", capError);
  } else {
    console.log("Capacitaciones column names:", capData.length > 0 ? Object.keys(capData[0]) : "No data to check columns");
  }

  console.log("Checking 'hpt' table...");
  const { data: hptData, error: hptError } = await supabase.from('hpt').select('*').limit(1);
  if (hptError) {
    console.error("Error fetching hpt:", hptError);
  } else {
    console.log("HPT column names:", hptData.length > 0 ? Object.keys(hptData[0]) : "No data to check columns");
  }

  // Check table info via RPC or just select from information_schema if possible
  // Supabase doesn't allow direct selection from information_schema via anon/service_role keys usually
}

test();
