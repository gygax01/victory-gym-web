/* ===============================
   ===== BLUETOOTH NFC (ROBUSTO)
=============================== */

let btDevice = null;
let btChar = null;
let btConectado = false;

let ultimoUID_BT = null;
let ultimoTiempo_BT = 0;
const BT_COOLDOWN = 500; // ms

/* ===============================
   ===== CONECTAR BLUETOOTH
=============================== */
async function conectarBluetooth() {
  if (!navigator.bluetooth) {
    console.warn("[BT] Bluetooth no soportado");
    return;
  }

  if (btConectado) {
    console.info("[BT] Ya conectado");
    return;
  }

  try {
    btDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [0xFFE0]
    });

    const server = await btDevice.gatt.connect();
    const service = await server.getPrimaryService(0xFFE0);
    btChar = await service.getCharacteristic(0xFFE1);

    await btChar.startNotifications();
    btChar.addEventListener("characteristicvaluechanged", onBTData);

    btConectado = true;
    console.log("[BT] Bluetooth conectado");

    btDevice.addEventListener("gattserverdisconnected", () => {
      console.warn("[BT] Bluetooth desconectado");
      btConectado = false;
      btChar = null;
    });

  } catch (err) {
    console.warn("[BT] Bluetooth cancelado o fallo", err);
  }
}

/* ===============================
   ===== DATOS RECIBIDOS
=============================== */
function onBTData(event) {
  const txt = new TextDecoder().decode(event.target.value).trim();
  if (!txt.startsWith("NFC:")) return;

  const uid = normalizarUID(txt.replace("NFC:", "").trim());
  if (!uid) return;

  const ahora = Date.now();
  if (uid === ultimoUID_BT && ahora - ultimoTiempo_BT < BT_COOLDOWN) {
    console.info(`[BT] UID ignorado por cooldown uid=${uid}`);
    return;
  }

  ultimoUID_BT = uid;
  ultimoTiempo_BT = ahora;

  console.log(`[BT] NFC Bluetooth uid=${uid}`);

  if (typeof procesarTarjeta === "function") {
    procesarTarjeta(uid);
  } else {
    console.warn("[BT] procesarTarjeta no disponible");
  }
}

/* ===============================
   ===== AUTO REINTENTO
=============================== */
window.addEventListener("online", () => {
  if (typeof syncOfflineQueue === "function") {
    syncOfflineQueue();
  } else {
    console.warn("[BT] syncOfflineQueue no disponible");
  }
});

window.addEventListener("offline", () => {
  setTimeout(() => {
    conectarBluetooth().catch(() => {});
  }, 1000);
});
