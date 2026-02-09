/* ===============================
   ===== NFC REALTIME (SEGURO)
=============================== */

/* ===============================
   ===== ESTADO NFC (ARRIBA)
=============================== */
let canalNFC = null;
let escuchando = false;
let ultimoUID = null;
let ultimoTiempo = 0;

const COOLDOWN_MS = 400;

let supabaseClient = null;

/* ===============================
   ===== ESPERAR SUPABASE
=============================== */
function esperarSupabase(intentos = 20) {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.supabase?.createClient) {
        resolve(window.supabase);
      } else if (intentos <= 0) {
        reject("Supabase no cargado");
      } else {
        intentos--;
        setTimeout(check, 100);
      }
    };
    check();
  });
}

/* ===============================
   ===== INIT SUPABASE NFC
=============================== */
async function initSupabaseNFC() {
  if (supabaseClient) return supabaseClient;

  const supabase = await esperarSupabase();

  const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
  const SUPABASE_ANON_KEY =
    "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

  supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  return supabaseClient;
}

/* ===============================
   ===== INICIAR NFC
=============================== */
async function iniciarNFCControlado({ onUID } = {}) {
  if (escuchando && canalNFC) return;

  await initSupabaseNFC();

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
        if (uid === ultimoUID && ahora - ultimoTiempo < COOLDOWN_MS) return;

        ultimoUID = uid;
        ultimoTiempo = ahora;

        if (typeof onUID === "function") {
          onUID(uid);
        }
      }
    )
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("📡 NFC escuchando");
      }
    });
}

/* ===============================
   ===== DETENER NFC
=============================== */
function detenerNFC() {
  if (canalNFC && supabaseClient) {
    supabaseClient.removeChannel(canalNFC);
  }

  canalNFC = null;
  escuchando = false;
  ultimoUID = null;
  ultimoTiempo = 0;
}

/* ===============================
   ===== DEBUG
=============================== */
window._debugNFC = () => ({
  escuchando,
  canalNFC,
  ultimoUID,
  ultimoTiempo,
  supabaseCargado: !!window.supabase
});
