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
      async payload => {
        if (!escuchando) return;

        const uid = payload.new?.uid;
        const eventId = payload.new?.id;

        if (!uid || !eventId) return;

        /* ==========================================
           🔒 FIX MULTI-DISPOSITIVO (NO ROMPE NADA)
        ========================================== */

        const { data, error } = await window.supabaseClient
          .from("nfc_events")
          .update({ processed: true })
          .eq("id", eventId)
          .eq("processed", false)
          .select();

        if (error) {
          console.error("❌ Error marcando processed:", error);
          return;
        }

        // Si no actualizó nada, otro dispositivo ya lo tomó
        if (!data || data.length === 0) {
          return;
        }

        /* ==========================================
           SOLO EL DISPOSITIVO GANADOR PROCESA
        ========================================== */

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
