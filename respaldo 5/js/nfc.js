/* ===============================
   ===== NFC VIA SUPABASE =====
   =============================== */

/* ===== SUPABASE CONFIG ===== */
const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

/* ===== CLIENT ===== */
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===== ESTADO ===== */
let canalNFC = null;
let escuchando = false;
let ultimoUID = null;
let ultimoTiempo = 0;

/* ===== CONFIG ===== */
const COOLDOWN_MS = 3000;

/* =========================================================
   ===== INICIAR LECTURA NFC (REALTIME) =====
   ========================================================= */
function iniciarNFCControlado({ onUID, onTimeout, onError } = {}) {
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
        if (uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) {
          return;
        }

        ultimoUID = uid;
        ultimoTiempo = ahora;

        if (typeof onUID === "function") {
          onUID(uid);
        }
      }
    )
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("🔵 NFC Realtime conectado");
      }
    });
}

/* ===============================
   ===== DETENER NFC =====
   =============================== */
function detenerNFC() {
  if (canalNFC) {
    supabaseClient.removeChannel(canalNFC);
    canalNFC = null;
  }
  escuchando = false;
}
