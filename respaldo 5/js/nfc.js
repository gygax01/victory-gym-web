/* ===============================
   ===== NFC VIA SUPABASE (FINAL) =====
   Ultra rápido · estable · continuo
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
   ===== ESTADO GLOBAL =====
=============================== */
let canalNFC = null;
let escuchando = false;

// anti-rebote por UID
let ultimoUID = null;
let ultimoTiempo = 0;

// 🔥 MUY BAJO = sensación instantánea
const COOLDOWN_MS = 400;

/* =========================================================
   ===== INICIAR LECTURA NFC (CONTINUA REAL) =====
========================================================= */
function iniciarNFCControlado({ onUID } = {}) {
  // 🔒 nunca crear dos canales
  if (escuchando && canalNFC) return;

  detenerNFC(); // limpieza segura
  escuchando = true;
  ultimoUID = null;
  ultimoTiempo = 0;

  canalNFC = supabaseClient
    .channel("nfc-events-live")
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

        // 🔒 anti-rebote REAL (UID + tiempo)
        if (uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) {
          return;
        }

        ultimoUID = uid;
        ultimoTiempo = ahora;

        // 🧠 callback inmediato
        if (typeof onUID === "function") {
          onUID(uid);
        }
      }
    )
    .subscribe(status => {
      console.log("📡 NFC status:", status);

      // ♻️ autorreconexión dura
      if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        console.warn("♻️ NFC reconectando...");
        setTimeout(() => {
          if (escuchando) iniciarNFCControlado({ onUID });
        }, 800);
      }
    });
}

/* ===============================
   ===== DETENER NFC =====
   (login / registro / salir)
=============================== */
function detenerNFC() {
  if (canalNFC) {
    try {
      supabaseClient.removeChannel(canalNFC);
    } catch {}
    canalNFC = null;
  }

  escuchando = false;
  ultimoUID = null;
  ultimoTiempo = 0;
}

/* ===============================
   ===== DEBUG OPCIONAL =====
=============================== */
function estadoNFC() {
  return {
    escuchando,
    canalActivo: !!canalNFC,
    ultimoUID,
    ultimoTiempo
  };
}
