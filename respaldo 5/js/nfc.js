/* ===============================
   ===== NFC VIA SUPABASE =====
=============================== */

/* ===============================
   ===== SUPABASE CONFIG =====
=============================== */
const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

/* ===============================
   ===== CLIENT =====
=============================== */
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   ===== ESTADO =====
=============================== */
let canalNFC = null;
let escuchando = false;

// anti-rebote
let ultimoUID = null;
let ultimoTiempo = 0;

/* ===============================
   ===== CONFIG =====
=============================== */
const COOLDOWN_MS = 800; // solo anti-rebote real

/* =========================================================
   ===== INICIAR LECTURA NFC (CONTINUA) =====
========================================================= */
function iniciarNFCControlado({ onUID } = {}) {
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

        // 🔒 anti-rebote (NO bloqueo)
        if (uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) {
          return;
        }

        ultimoUID = uid;
        ultimoTiempo = ahora;

        if (typeof onUID === "function") {
          onUID(uid);

          // liberar UID después del rebote
          setTimeout(() => {
            ultimoUID = null;
            ultimoTiempo = 0;
          }, COOLDOWN_MS);
        }
      }
    )
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("🔵 NFC escuchando (modo continuo)");
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
  ultimoUID = null;
  ultimoTiempo = 0;
}
