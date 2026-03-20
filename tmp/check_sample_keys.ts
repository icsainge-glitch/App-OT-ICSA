
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

  console.log("Fetching sample from 'clients'...");
  const { data, error } = await supabase.from('clients').select('*').limit(1);
  if (error) {
    console.error("SELECT * failed:", error.message);
  } else {
    console.log("Clients data sample keys:", data.length > 0 ? Object.keys(data[0]) : "No data");
  }

  console.log("Fetching sample from 'personnel'...");
  const { data: pData, error: pError } = await supabase.from('personnel').select('*').limit(1);
  if (pError) {
    console.error("SELECT * from personnel failed:", pError.message);
  } else {
    console.log("Personnel data sample keys:", pData.length > 0 ? Object.keys(pData[0]) : "No data");
  }
}

test();
