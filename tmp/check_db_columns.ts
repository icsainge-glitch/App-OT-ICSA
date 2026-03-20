
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }

  const supabase = createClient(url, key);

  console.log("Checking columns for 'capacitaciones'...");
  // Use RPC if available or a direct query if Supabase allows it via SQL
  // Since I can't run raw SQL easily without an RPC, I'll try to insert a dummy record and then delete it, or just use a known column in a filter to see if it fails.
  
  const { error: error1 } = await supabase.from('capacitaciones').select('prevencionEmail').limit(1);
  if (error1) {
    console.log("Column 'prevencionEmail' MISSING or error:", error1.message);
  } else {
    console.log("Column 'prevencionEmail' EXISTS");
  }

  const { error: error2 } = await supabase.from('capacitaciones').select('signature_token').limit(1);
  if (error2) {
    console.log("Column 'signature_token' MISSING or error:", error2.message);
  } else {
    console.log("Column 'signature_token' EXISTS");
  }

  const { error: error3 } = await supabase.from('hpt').select('projectId').limit(1);
  if (error3) {
    console.log("Column 'projectId' MISSING or error:", error3.message);
  } else {
    console.log("Column 'projectId' EXISTS");
  }
}

test();
