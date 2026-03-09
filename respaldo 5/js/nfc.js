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
function iniciarNFCControlado({ onUID, onTimeout, onError, onStatus, onHeartbeat } = {}) {
  if (escuchando) {
    console.info("[NFC] Ya estaba escuchando");
    return;
  }

  if (!window.supabaseClient) {
    console.error("[NFC] Supabase no inicializado");
    if (typeof onError === "function") onError("Supabase no listo");
    if (typeof onStatus === "function") onStatus("ERROR_NO_SUPABASE");
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

        const uid = normalizarUID(payload.new?.uid);
        const eventId = payload.new?.id;

        if (!uid || !eventId) {
          console.warn("[NFC] Evento incompleto recibido", payload.new);
          return;
        }

        console.info(`[NFC] Evento recibido id=${eventId} uid=${uid}`);
        if (typeof onHeartbeat === "function") {
          onHeartbeat({ ts: Date.now(), uid, eventId });
        }

        const { data, error } = await window.supabaseClient
          .from("nfc_events")
          .update({ processed: true })
          .eq("id", eventId)
          .eq("processed", false)
          .select();

        if (error) {
          console.error("[NFC] Error marcando processed:", error);
          return;
        }

        if (!data || data.length === 0) {
          console.info(`[NFC] Evento ya procesado por otro dispositivo id=${eventId}`);
          return;
        }

        const ahora = Date.now();
        if (uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) {
          console.info(`[NFC] UID ignorado por cooldown uid=${uid}`);
          return;
        }

        ultimoUID = uid;
        ultimoTiempo = ahora;

        if (typeof onUID === "function") {
          console.info(`[NFC] UID aceptado uid=${uid}`);
          onUID(uid);
        }
      }
    )
    .subscribe(status => {
      console.log(`[NFC] Canal nfc-events: ${status}`);
      if (typeof onStatus === "function") {
        onStatus(status);
      }
      if (
        ["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(String(status || "")) &&
        typeof onError === "function"
      ) {
        onError(status);
      }
    });

  if (typeof onTimeout === "function") {
    setTimeout(() => {
      if (escuchando) {
        console.warn("[NFC] Timeout de lectura");
        onTimeout();
      }
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
  console.info("[NFC] Lectura detenida");
}
