
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mock the utility
function toDbPayload(data: any) {
    if (!data || typeof data !== 'object') return data;
    const payload: any = {};
    Object.keys(data).forEach(key => {
        payload[key.toLowerCase()] = data[key];
    });
    return payload;
}

async function test() {
  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }

  const supabase = createClient(url, key);

  console.log("Testing INSERT into 'clients' with camelCase keys (standardized)...");
  const dummyId = "test-" + Date.now();
  // Using 'nombreCliente' (camelCase) which failed before
  const payload = {
    id: dummyId,
    nombreCliente: "TEST CLIENT " + new Date().toISOString()
  };
  
  const standardized = toDbPayload(payload);
  console.log("Standardized payload:", JSON.stringify(standardized));

  const { error } = await supabase.from('clients').insert(standardized);

  if (error) {
    console.error("INSERT failed:", error.message);
  } else {
    console.log("INSERT successful! ID:", dummyId);
    // Cleanup
    const { error: delErr } = await supabase.from('clients').delete().eq('id', dummyId);
    if (!delErr) console.log("Cleanup: Dummy client deleted.");
  }
}

test();
