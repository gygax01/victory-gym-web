/* ======================================================
   ===== SUPABASE REALTIME (SINGLETON) =================
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY = "TU_KEY";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ================= SUBIR EVENTOS ================= */
async function subirEventoASupabase(e) {
  try {
    if (e.tabla === "productos") {
      if (e.accion === "delete") {
        await supabaseClient.from("productos").delete().eq("id", e.data.id);
      } else {
        await supabaseClient.from("productos").upsert(e.data);
      }
    }
    return true;
  } catch (err) {
    console.error("❌ Sync error:", err);
    return false;
  }
}

/* ================= OFFLINE → ONLINE ================= */
async function syncOfflineQueue() {
  if (!navigator.onLine) return;

  const cola = obtenerColaOffline();
  if (!cola.length) return;

  const pendientes = [];

  for (const e of cola) {
    const ok = await subirEventoASupabase(e);
    if (!ok) pendientes.push(e);
  }

  guardarColaOffline(pendientes);
}

/* ================= REALTIME ================= */
function iniciarRealtime() {
  console.log("🟢 Realtime activo");

  supabaseClient
    .channel("rt-productos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "productos" },
      async () => {
        const { data } = await supabaseClient.from("productos").select("*");
        if (Array.isArray(data)) {
          guardarProductos(data);
          new BroadcastChannel("victory-data").postMessage("productos");
        }
      }
    )
    .subscribe();
}

/* ================= INIT ================= */
window.addEventListener("online", syncOfflineQueue);

window.addEventListener("load", () => {
  if (navigator.onLine) {
    iniciarRealtime();
    syncOfflineQueue();
  }
});
