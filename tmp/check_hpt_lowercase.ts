
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

  const { error: error1 } = await supabase.from('hpt').select('projectid').limit(1);
  if (error1) {
    console.log("Column 'projectid' MISSING or error:", error1.message);
  } else {
    console.log("Column 'projectid' EXISTS");
  }

  const { error: error2 } = await supabase.from('hpt').select('supervisorname').limit(1);
  if (error2) {
    console.log("Column 'supervisorname' MISSING or error:", error2.message);
  } else {
    console.log("Column 'supervisorname' EXISTS");
  }
}

test();
