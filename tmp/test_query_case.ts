
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkQueries() {
  if (!url || !key) return;
  const supabase = createClient(url, key);
  
  console.log("--- TESTING CASE SENSITIVITY IN FILTERS ---");

  // Test 1: Case sensitive order
  console.log("\n[1] Testing .order('updatedAt')...");
  const { data: d1, error: e1 } = await supabase.from('ordenes').select('id').order('updatedAt', { ascending: false }).limit(1);
  if (e1) console.log("FAILED (camelCase):", e1.message);
  else console.log("SUCCESS (camelCase):", d1.length);

  const { data: d2, error: e2 } = await supabase.from('ordenes').select('id').order('updatedat', { ascending: false }).limit(1);
  if (e2) console.log("FAILED (lowercase):", e2.message);
  else console.log("SUCCESS (lowercase):", d2.length);

  // Test 2: Case sensitive .or()
  console.log("\n[2] Testing .or('projectId.is.null')...");
  const { data: d3, error: e3 } = await supabase.from('ordenes').select('id').or('projectId.is.null').limit(1);
  if (e3) console.log("FAILED (camelCase):", e3.message);
  else console.log("SUCCESS (camelCase):", d3.length);

  const { data: d4, error: e4 } = await supabase.from('ordenes').select('id').or('projectid.is.null').limit(1);
  if (e4) console.log("FAILED (lowercase):", e4.message);
  else console.log("SUCCESS (lowercase):", d4.length);

  console.log("\n--- TEST COMPLETE ---");
}

checkQueries();
