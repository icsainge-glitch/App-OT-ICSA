
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const KEY_MAPPING: { [key: string]: string } = {
    'nombrecliente': 'nombreCliente',
    'createdat': 'createdAt',
    'updatedat': 'updatedAt'
};

function fromDbPayload(data: any): any {
    if (!data) return data;
    const result: any = { ...data };
    Object.keys(data).forEach(key => {
        const mappedKey = KEY_MAPPING[key.toLowerCase()];
        if (mappedKey && mappedKey !== key) {
            result[mappedKey] = data[key];
        }
    });
    return result;
}

async function test() {
  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }

  const supabase = createClient(url, key);

  const dummyId = "test-read-" + Date.now();
  await supabase.from('clients').insert({ id: dummyId, nombrecliente: "READ TEST" });

  console.log("Fetching inserted row...");
  const { data, error } = await supabase.from('clients').select('*').eq('id', dummyId).single();

  if (error) {
    console.error("SELECT failed:", error.message);
  } else {
    console.log("Raw DB keys:", Object.keys(data));
    const normalized = fromDbPayload(data);
    console.log("Normalized keys:", Object.keys(normalized));
    
    if (normalized.nombreCliente === "READ TEST") {
      console.log("SUCCESS: Case mapping worked! 'nombreCliente' is present.");
    } else {
      console.log("FAILURE: Case mapping failed.");
    }
    
    await supabase.from('clients').delete().eq('id', dummyId);
  }
}

test();
