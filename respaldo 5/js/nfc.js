/* ===============================
   ===== NFC VIA SUPABASE (STABLE) =====
=============================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let canalNFC = null;
let ultimoTiempo = 0;
let activo = false;

const COOLDOWN_MS = 500;

/* ===============================
   ===== INICIAR NFC =====
=============================== */
function iniciarNFCControlado({ onUID } = {}) {
  detenerNFC(); // 🔥 SIEMPRE limpiar antes

  activo = true;
  ultimoTiempo = 0;

  canalNFC = supabaseClient
    .channel("nfc-events-login")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "nfc_events"
      },
      payload => {
        if (!activo) return;

        const uid = payload.new?.uid;
        if (!uid) return;

        const ahora = Date.now();
        if (ahora - ultimoTiempo < COOLDOWN_MS) return;

        ultimoTiempo = ahora;
        onUID && onUID(uid);
      }
    )
    .subscribe();
}

/* ===============================
   ===== DETENER NFC =====
=============================== */
function detenerNFC() {
  if (canalNFC) {
    try {
      supabaseClient.removeChannel(canalNFC);
    } catch {}
    canalNFC = null;
  }
  activo = false;
  ultimoTiempo = 0;
}
