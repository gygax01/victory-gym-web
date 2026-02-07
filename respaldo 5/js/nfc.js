const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let canalNFC = null;
let ultimoTiempo = 0;
const COOLDOWN_MS = 500;

function iniciarNFCControlado({ onUID } = {}) {
  if (canalNFC) return; // 🔒 nunca duplicar

  canalNFC = supabaseClient
    .channel("nfc-events")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "nfc_events"
      },
      payload => {
        const uid = payload.new?.uid;
        if (!uid) return;

        const ahora = Date.now();
        if (ahora - ultimoTiempo < COOLDOWN_MS) return;

        ultimoTiempo = ahora;
        onUID?.(uid);
      }
    )
    .subscribe();
}

function detenerNFC() {
  // ❌ NO se usa en index
}
