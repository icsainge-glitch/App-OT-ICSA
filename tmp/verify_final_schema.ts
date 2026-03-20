
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
  const columnsToCheck = [
    'prevencionemail',
    'prevencionname',
    'signature_token',
    'token_expiry',
    'prevencion_signature_url',
    'prevencion_signature_date'
  ];

  for (const col of columnsToCheck) {
    const { error } = await supabase.from('capacitaciones').select(col).limit(1);
    if (error) {
      console.error(`Column '${col}' is MISSING:`, error.message);
    } else {
      console.log(`Column '${col}' EXISTS.`);
    }
  }

  console.log("Checking columns for 'hpt'...");
  const hptCols = ['projectid', 'supervisorname', 'signature_token'];
  for (const col of hptCols) {
    const { error } = await supabase.from('hpt').select(col).limit(1);
    if (error) {
      console.error(`Column '${col}' is MISSING:`, error.message);
    } else {
      console.log(`Column '${col}' EXISTS.`);
    }
  }
}

test();
