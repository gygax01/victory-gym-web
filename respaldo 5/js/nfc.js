/* ===============================
   ===== SUPABASE NFC REALTIME =====
=============================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   ===== ESTADO NFC (IMPORTANTE)
=============================== */
/*
  🔴 OBLIGATORIO que estas variables
  estén definidas ANTES de las funciones
*/
let canalNFC = null;
let escuchando = false;
let ultimoUID = null;
let ultimoTiempo = 0;

const COOLDOWN_MS = 400;

/* ===============================
   ===== INICIAR NFC CONTROLADO
=============================== */
function iniciarNFCControlado({ onUID } = {}) {
  // evita doble suscripción
  if (escuchando && canalNFC) return;

  detenerNFC();
  escuchando = true;

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

        // cooldown anti-lecturas duplicadas
        if (uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) return;

        ultimoUID = uid;
        ultimoTiempo = ahora;

        // callback
        if (typeof onUID === "function") {
          onUID(uid);
        }
      }
    )
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("📡 NFC escuchando...");
      }
    });
}

/* ===============================
   ===== DETENER NFC
=============================== */
function detenerNFC() {
  if (canalNFC) {
    supabaseClient.removeChannel(canalNFC);
  }

  canalNFC = null;
  escuchando = false;
  ultimoUID = null;
  ultimoTiempo = 0;
}

/* ===============================
   ===== DEBUG OPCIONAL
=============================== */
window._debugNFC = () => ({
  canalNFC,
  escuchando,
  ultimoUID,
  ultimoTiempo
});
