/* ======================================================
   ===== SUPABASE REALTIME (ULTRA FAST + SAFE) ==========
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkemZubXJreGZ5emh1c21rbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQ2MTcsImV4cCI6MjA4NTk5MDYxN30.juvLQ83pjdckK1MqkKu0JsFjtpcTPNfEwG65op_5YEI";

/* ================= CLIENT ================= */
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const bc = new BroadcastChannel("victory-data");
let realtimeChannel = null;

/* ================= SUBIR EVENTOS ================= */
async function subirEventoASupabase(e) {
  try {
    if (e.tabla !== "productos") return true;

    if (e.accion === "delete") {
      const { error } = await supabaseClient
        .from("productos")
        .delete()
        .eq("id", e.data.id);

      if (error) throw error;
    } else {
      const { error } = await supabaseClient
        .from("productos")
        .upsert(e.data, { onConflict: "id" });

      if (error) throw error;
    }

    return true;
  } catch (err) {
    console.error("❌ Error subiendo a Supabase:", err);
    return false;
  }
}

/* ================= CARGA INICIAL ================= */
async function cargarProductosIniciales() {
  const { data, error } = await supabaseClient
    .from("productos")
    .select("*");

  if (error) {
    console.error("❌ Error carga inicial:", error);
    return;
  }

  guardarProductos(data || []);
  bc.postMessage("productos");

  console.log("✅ Productos iniciales:", data.length);
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

/* ================= REALTIME (SIN FETCH) ================= */
function iniciarRealtime() {
  if (realtimeChannel) return;

  console.log("🟢 Realtime conectando...");

  realtimeChannel = supabaseClient
    .channel("rt-productos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "productos" },
      payload => {
        let productos = obtenerProductos();

        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const nuevo = payload.new;
          const idx = productos.findIndex(p => p.id === nuevo.id);

          if (idx >= 0) productos[idx] = nuevo;
          else productos.push(nuevo);
        }

        if (payload.eventType === "DELETE") {
          productos = productos.filter(p => p.id !== payload.old.id);
        }

        guardarProductos(productos);
        bc.postMessage("productos");
      }
    )
    .subscribe(status => {
      if (status === "SUBSCRIBED") {
        console.log("✅ Realtime productos activo");
      }
    });
}

/* ================= INIT ================= */
window.addEventListener("online", async () => {
  await syncOfflineQueue();
});

window.addEventListener("load", async () => {
  if (navigator.onLine) {
    await cargarProductosIniciales();
    iniciarRealtime();
    syncOfflineQueue();
  }
});
