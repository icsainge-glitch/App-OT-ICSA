
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkPending() {
  if (!url || !key) return;
  const supabase = createClient(url, key);
  
  console.log("--- TESTING PENDING ORDERS RETRIEVAL ---");

  // Mimic getWorkOrders query for non-admin
  // .not('status', 'in', '("Completed", "Completado")')
  // .order('updatedat', { ascending: false })
  // .or('projectid.is.null,projectid.eq.""')

  const { data, error } = await supabase
    .from('ordenes')
    .select('id, folio, status, updatedat, projectid')
    .not('status', 'in', '("Completed", "Completado")')
    .or('projectid.is.null')
    .order('updatedat', { ascending: false });

  if (error) {
    console.error("FAILED Query:", error.message);
  } else {
    console.log("SUCCESS: Found", data.length, "pending orders (without project).");
    if (data.length > 0) {
        console.log("Latest Order:", data[0]);
    }
  }

  console.log("\n--- TEST COMPLETE ---");
}

checkPending();
