/* ===============================
   ===== NFC UNIFICADO (PRO)
=============================== */

let canalNFC = null;
let escuchando = false;

let ultimoUID = null;
let ultimoTiempo = 0;
const COOLDOWN_MS = 450;

/* ===============================
   ===== INICIAR NFC
=============================== */
function iniciarNFCControlado({ onUID, onTimeout, onError } = {}) {
  if (escuchando) return;

  if (!window.supabaseClient) {
    console.error("❌ Supabase no inicializado");
    if (typeof onError === "function") onError("Supabase no listo");
    return;
  }

  detenerNFC();
  escuchando = true;

  canalNFC = window.supabaseClient
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

        if (typeof onUID === "function") onUID(uid);
      }
    )
    .subscribe(() => {
      console.log("📡 NFC escuchando (Supabase)");
    });

  if (typeof onTimeout === "function") {
    setTimeout(() => {
      if (escuchando) onTimeout();
    }, 12000);
  }
}

/* ===============================
   ===== DETENER NFC
=============================== */
function detenerNFC() {
  if (canalNFC && window.supabaseClient) {
    window.supabaseClient.removeChannel(canalNFC);
  }

  canalNFC = null;
  escuchando = false;
  ultimoUID = null;
  ultimoTiempo = 0;
}
