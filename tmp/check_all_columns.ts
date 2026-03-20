
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

  // We can use the Postgres function to list columns if we have permission
  // or just try to select * and see if it fails with full detail, 
  // but since they are empty, we might not see anything.
  // Actually, we can use RPC to run a query if we have an RPC set up, but probably not.
  
  // Best way to see columns of empty table:
  const { data: colsCap, error: errCap } = await supabase.from('capacitaciones').select('*').limit(0);
  console.log("Capacitaciones error (if any):", errCap);
  
  const { data: colsHPT, error: errHPT } = await supabase.from('hpt').select('*').limit(0);
  console.log("HPT error (if any):", errHPT);
}

test();
