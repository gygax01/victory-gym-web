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
    console.warn("❌ Bluetooth no soportado");
    return;
  }

  if (btConectado) return;

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
    console.log("🔵 Bluetooth conectado");

    btDevice.addEventListener("gattserverdisconnected", () => {
      console.warn("🔵 Bluetooth desconectado");
      btConectado = false;
      btChar = null;
    });

  } catch (err) {
    console.warn("⚠️ Bluetooth cancelado o falló", err);
  }
}

/* ===============================
   ===== DATOS RECIBIDOS
=============================== */
function onBTData(event) {
  const txt = new TextDecoder().decode(event.target.value).trim();
  if (!txt.startsWith("NFC:")) return;

  const uid = txt.replace("NFC:", "").trim();
  if (!uid) return;

  const ahora = Date.now();
  if (uid === ultimoUID_BT && ahora - ultimoTiempo_BT < BT_COOLDOWN) return;

  ultimoUID_BT = uid;
  ultimoTiempo_BT = ahora;

  console.log("🔵 NFC Bluetooth:", uid);

  // 🔥 Usar MISMO flujo que NFC normal
  if (typeof procesarTarjeta === "function") {
    procesarTarjeta(uid);
  } else {
    console.warn("⚠️ procesarTarjeta no disponible");
  }
}

/* ===============================
   ===== AUTO REINTENTO
=============================== */
window.addEventListener("online", () => {
  // cuando vuelve internet, ya no necesitamos BT,
  // pero dejamos conectado por estabilidad
  syncOfflineQueue();
});

window.addEventListener("offline", () => {
  // si se va internet, intentamos BT
  setTimeout(() => {
    conectarBluetooth().catch(() => {});
  }, 1000);
});
