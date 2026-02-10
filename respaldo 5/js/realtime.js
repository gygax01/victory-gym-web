/* ======================================================
   ===== SUPABASE REALTIME (SINGLETON) =================
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkemZubXJreGZ5emh1c21rbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQ2MTcsImV4cCI6MjA4NTk5MDYxN30.juvLQ83pjdckK1MqkKu0JsFjtpcTPNfEwG65op_5YEI";

/* ================= CLIENT ================= */
if (!window.supabase || !window.supabase.createClient) {
  console.error("❌ Supabase JS no cargó");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ================= SUBIR EVENTOS ================= */
async function subirEventoASupabase(e) {
  try {
    if (e.tabla === "productos") {
      if (e.accion === "delete") {
        await supabaseClient
          .from("productos")
          .delete()
          .eq("id", e.data.id);
      } else {
        await supabaseClient
          .from("productos")
          .upsert(e.data, { onConflict: "id" });
      }
    }
    return true;
  } catch (err) {
    console.error("❌ Error sync productos:", err);
    return false;
  }
}

/* ================= OFFLINE → ONLINE ================= */
async function syncOfflineQueue() {
  if (!navigator.onLine) return;

  const cola = obtenerColaOffline();
  if (!cola.length) return;

  console.log("🔄 Sync offline:", cola.length);

  const pendientes = [];

  for (const e of cola) {
    const ok = await subirEventoASupabase(e);
    if (!ok) pendientes.push(e);
  }

  guardarColaOffline(pendientes);
}

/* ================= REALTIME ================= */
let realtimeChannel = null;

function iniciarRealtime() {
  if (realtimeChannel) return; // evita duplicados

  console.log("🟢 Realtime conectando...");

  realtimeChannel = supabaseClient
    .channel("rt-productos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "productos" },
      async payload => {
        console.log("📡 Realtime productos:", payload.eventType);

        const { data, error } = await supabaseClient
          .from("productos")
          .select("*");

        if (error) {
          console.error("❌ Error fetch productos:", error);
          return;
        }

        if (Array.isArray(data)) {
          guardarProductos(data);
          new BroadcastChannel("victory-data").postMessage("productos");
        }
      }
    )
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("✅ Realtime productos suscrito");
      }
      if (status === "CHANNEL_ERROR") {
        console.error("❌ Error en canal realtime");
      }
    });
}

/* ================= INIT ================= */
window.addEventListener("online", () => {
  console.log("🌐 Online");
  syncOfflineQueue();
  iniciarRealtime();
});

window.addEventListener("load", () => {
  if (navigator.onLine) {
    iniciarRealtime();
    syncOfflineQueue();
  }
});
