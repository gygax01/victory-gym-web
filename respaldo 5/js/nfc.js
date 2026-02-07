/* ===============================
   ===== NFC VIA SUPABASE =====
=============================== */

/* ===== SUPABASE CONFIG ===== */
const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

/* ===== CLIENT ===== */
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===== ESTADO ===== */
let canalNFC = null;
let escuchando = false;

/* ===== ANTI-REBOTE GLOBAL ===== */
let ultimoTiempo = 0;
const COOLDOWN_MS = 1200; // 1.2s realista para NFC

/* =========================================================
   ===== INICIAR LECTURA NFC (CONTINUA REAL) =====
========================================================= */
function iniciarNFCControlado({ onUID } = {}) {
  detenerNFC();
  escuchando = true;
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

        // 🔒 anti-rebote SOLO POR TIEMPO
        if (ahora - ultimoTiempo < COOLDOWN_MS) return;

        ultimoTiempo = ahora;

        if (typeof onUID === "function") {
          onUID(uid);
        }
      }
    )
    .subscribe(status => {
      console.log("NFC status:", status);

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("♻️ Reconectando NFC...");
        setTimeout(() => {
          if (escuchando) iniciarNFCControlado({ onUID });
        }, 1500);
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
  ultimoTiempo = 0;
}
