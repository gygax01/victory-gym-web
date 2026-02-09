/* ===============================
   ===== BLUETOOTH NFC =====
=============================== */

let btDevice = null;
let btChar = null;

async function conectarBluetooth() {
  btDevice = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [0xFFE0]
  });

  const server = await btDevice.gatt.connect();
  const service = await server.getPrimaryService(0xFFE0);
  btChar = await service.getCharacteristic(0xFFE1);

  await btChar.startNotifications();
  btChar.addEventListener("characteristicvaluechanged", onBTData);

  console.log("🔵 Bluetooth conectado");
}

function onBTData(event) {
  const txt = new TextDecoder().decode(event.target.value).trim();

  if (txt.startsWith("NFC:")) {
    const uid = txt.replace("NFC:", "");
    console.log("🔵 NFC Bluetooth:", uid);

    if (typeof procesarTarjeta === "function") {
      procesarTarjeta(uid);
    }
  }
}
