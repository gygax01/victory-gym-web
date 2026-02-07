/* ===============================
   ===== NFC ESP32 (CONTROL CENTRAL) =====
   =============================== */

// ⚠️ IP DEL ESP32
const ESP32_URL = "http://192.168.1.2/nfc";

/* ===== ESTADO GLOBAL ===== */
let intervaloNFC = null;
let timeoutHandle = null;
let leyendo = false;
let ultimoUID = null;
let ultimoTiempo = 0;

/* ===== CONFIGURACIÓN ===== */
const INTERVALO_MS = 250;   // lectura rápida (casi instantánea)
const COOLDOWN_MS  = 3000;  // evita lecturas dobles
const TIMEOUT_MS   = 10000; // máximo 10s esperando tarjeta

/* =========================================================
   ===== INICIAR LECTURA NFC (CONTROLADA Y SEGURA) =====
   =========================================================
   iniciarNFCControlado({
     onUID(uid),        // cuando se lee tarjeta válida
     onTimeout(),       // si pasan 10s sin tarjeta
     onError(error)     // error de red u otro
   })
*/
function iniciarNFCControlado(
  { onUID, onTimeout, onError } = {},
) {
  detenerNFC(); // 🔒 asegura 1 solo lector activo

  leyendo = true;
  ultimoUID = null;
  ultimoTiempo = 0;

  /* ===== TIMEOUT GLOBAL ===== */
  timeoutHandle = setTimeout(() => {
    if (!leyendo) return;
    leyendo = false;
    detenerNFC();
    if (typeof onTimeout === "function") {
      onTimeout();
    }
  }, TIMEOUT_MS);

  /* ===== LECTURA PERIÓDICA ===== */
  intervaloNFC = setInterval(async () => {
    if (!leyendo) return;

    try {
      const res = await fetch(ESP32_URL, { cache: "no-store" });
      if (!res.ok) return;

      const data = await res.json();
      if (!data || data.status !== "ok" || !data.uid) return;

      const ahora = Date.now();

      // 🔁 Evitar doble lectura de la misma tarjeta
      if (data.uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) {
        return;
      }

      ultimoUID = data.uid;
      ultimoTiempo = ahora;

      leyendo = false;
      detenerNFC();

      if (typeof onUID === "function") {
        onUID(data.uid);
      }

    } catch (err) {
      leyendo = false;
      detenerNFC();
      if (typeof onError === "function") {
        onError(err);
      }
    }
  }, INTERVALO_MS);
}

/* ===============================
   ===== DETENER LECTURA NFC =====
   =============================== */
function detenerNFC() {
  if (intervaloNFC) {
    clearInterval(intervaloNFC);
    intervaloNFC = null;
  }

  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
    timeoutHandle = null;
  }

  leyendo = false;
}
