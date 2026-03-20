
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

  console.log("Testing INSERT into 'clients'...");
  const dummyId = "test-" + Date.now();
  const { error } = await supabase.from('clients').insert({
    id: dummyId,
    nombreCliente: "TEST CLIENT " + new Date().toISOString()
  });

  if (error) {
    console.error("INSERT failed:", error.message);
  } else {
    console.log("INSERT successful! ID:", dummyId);
    // Cleanup
    await supabase.from('clients').delete().eq('id', dummyId);
    console.log("Cleanup: Dummy client deleted.");
  }
}

test();
