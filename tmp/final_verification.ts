
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function verify() {
  if (!url || !key) {
    console.error("Missing env vars");
    return;
  }

  const supabase = createClient(url, key);
  console.log("--- FINAL SYSTEM VERIFICATION ---");

  // 1. Check Clients
  console.log("\n[1] Testing Clients table...");
  const dummyClientId = "test-client-" + Date.now();
  const { error: insClientErr } = await supabase.from('clients').insert({
    id: dummyClientId,
    nombrecliente: "TEST CLIENT FINAL",
    rutcliente: "11.111.111-1"
  });
  if (insClientErr) console.error("FAILED Client Insert:", insClientErr.message);
  else {
    console.log("SUCCESS: Client Inserted.");
    const { data: clientData } = await supabase.from('clients').select('*').eq('id', dummyClientId).single();
    if (clientData?.nombrecliente === "TEST CLIENT FINAL") {
        console.log("SUCCESS: Client Fetched correctly.");
    }
    await supabase.from('clients').delete().eq('id', dummyClientId);
  }

  // 2. Check Personnel (using a dummy ID or just selecting)
  console.log("\n[2] Testing Personnel table...");
  const { data: personnelData, error: personnelErr } = await supabase.from('personnel').select('nombre_t, rol_t').limit(1);
  if (personnelErr) console.error("FAILED Personnel Select:", personnelErr.message);
  else console.log("SUCCESS: Personnel accessible. Found:", personnelData.length, "records.");

  // 3. Check HPT (New columns)
  console.log("\n[3] Testing HPT table (New Columns)...");
  const { data: hptCols, error: hptErr } = await supabase.from('hpt').select('recursos, riesgos, medidas, epp, signature_token').limit(1);
  if (hptErr) console.error("FAILED HPT Column Check:", hptErr.message);
  else console.log("SUCCESS: HPT new columns detected.");

  // 4. Check Capacitaciones (New columns)
  console.log("\n[4] Testing Capacitaciones table...");
  const { data: capCols, error: capErr } = await supabase.from('capacitaciones').select('prevencionname, signature_token').limit(1);
  if (capErr) console.error("FAILED Capacitaciones Column Check:", capErr.message);
  else console.log("SUCCESS: Capacitaciones new columns detected.");

  console.log("\n--- VERIFICATION COMPLETE ---");
}

verify();
