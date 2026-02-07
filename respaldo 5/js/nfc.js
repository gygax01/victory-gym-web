/* ===============================
   ===== NFC VIA SUPABASE =====
=============================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let canalNFC = null;
let escuchando = false;
let ultimoUID = null;
let ultimoTiempo = 0;

const COOLDOWN_MS = 400;

function iniciarNFCControlado({ onUID } = {}) {
  if (escuchando && canalNFC) return;

  detenerNFC();
  escuchando = true;
  ultimoUID = null;
  ultimoTiempo = 0;

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
        if (!escuchando) return;

        const uid = payload.new?.uid;
        if (!uid) return;

        const ahora = Date.now();
        if (uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) return;

        ultimoUID = uid;
        ultimoTiempo = ahora;

        onUID?.(uid);
      }
    )
    .subscribe();
}

function detenerNFC() {
  if (canalNFC) {
    supabaseClient.removeChannel(canalNFC);
    canalNFC = null;
  }
  escuchando = false;
  ultimoUID = null;
  ultimoTiempo = 0;
}

/* 🔧 DEBUG (renombrado, NO choca) */
function debugEstadoNFC() {
  return {
    escuchando,
    canalActivo: !!canalNFC,
    ultimoUID,
    ultimoTiempo
  };
}
