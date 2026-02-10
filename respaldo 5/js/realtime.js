/* ======================================================
   ===== SUPABASE REALTIME (OFFLINE-FIRST) ==============
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkemZubXJreGZ5emh1c21rbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQ2MTcsImV4cCI6MjA4NTk5MDYxN30.juvLQ83pjdckK1MqkKu0JsFjtpcTPNfEwG65op_5YEI";

let supabaseClient = null;

if (window.supabase?.createClient) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

/* ================= SUBIR EVENTOS ================= */
async function subirEventoASupabase(e) {
  if (!supabaseClient) return false;

  try {
    if (e.tabla === "productos") {
      if (e.accion === "delete") {
        await supabaseClient.from("productos").delete().eq("id", e.data.id);
      } else {
        await supabaseClient.from("productos").upsert(e.data);
      }
    }

    if (e.tabla === "clientes") {
      await supabaseClient.from("clientes").upsert(e.data);
    }

    if (e.tabla === "empleados") {
      await supabaseClient.from("empleados").upsert(e.data);
    }

    if (e.tabla === "ventas") {
      await supabaseClient.from("ventas").insert(e.data);
    }

    if (e.tabla === "asistencias") {
      await supabaseClient.from("asistencias").insert(e.data);
    }

    return true;
  } catch (err) {
    console.error("❌ Error sync:", e.tabla, err);
    return false;
  }
}

/* ================= SYNC OFFLINE QUEUE ================= */
async function syncOfflineQueue() {
  if (!isOnline() || !supabaseClient) return;

  const cola = obtenerColaOffline();
  if (!cola.length) return;

  console.log("🔄 Sincronizando offline:", cola.length);

  const pendientes = [];

  for (const e of cola) {
    const ok = await subirEventoASupabase(e);
    if (!ok) pendientes.push(e);
  }

  guardarColaOffline(pendientes);
}

/* ================= REALTIME ================= */
function suscribirTabla(tabla, callback) {
  supabaseClient
    .channel(`rt-${tabla}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tabla },
      callback
    )
    .subscribe();
}

function iniciarRealtime() {
  if (!supabaseClient) return;

  console.log("🟢 Realtime activo");

  suscribirTabla("productos", syncProductosDesdeSupabase);
  suscribirTabla("clientes", syncClientesDesdeSupabase);
  suscribirTabla("empleados", syncEmpleadosDesdeSupabase);
  suscribirTabla("ventas", syncVentasDesdeSupabase);
  suscribirTabla("asistencias", syncAsistenciasDesdeSupabase);
}

/* ================= BAJAR A LOCAL ================= */
async function syncProductosDesdeSupabase() {
  const { data } = await supabaseClient.from("productos").select("*");
  if (Array.isArray(data)) {
    safeSet("productos", data);
    new BroadcastChannel("victory-data").postMessage("productos");
  }
}

async function syncClientesDesdeSupabase() {
  const { data } = await supabaseClient.from("clientes").select("*");
  if (Array.isArray(data)) {
    safeSet("clientes", data);
    new BroadcastChannel("victory-data").postMessage("clientes");
  }
}

async function syncEmpleadosDesdeSupabase() {
  const { data } = await supabaseClient.from("empleados").select("*");
  if (Array.isArray(data)) {
    safeSet("empleados", data);
    new BroadcastChannel("victory-data").postMessage("empleados");
  }
}

async function syncVentasDesdeSupabase() {
  const { data } = await supabaseClient.from("ventas").select("*");
  if (Array.isArray(data)) {
    safeSet("ventas", data);
  }
}

async function syncAsistenciasDesdeSupabase() {
  const { data } = await supabaseClient.from("asistencias").select("*");
  if (Array.isArray(data)) {
    safeSet("asistencias", data);
  }
}

/* ================= ONLINE ================= */
window.addEventListener("online", () => {
  syncOfflineQueue();
  iniciarRealtime();
});

/* ================= INIT ================= */
window.addEventListener("load", () => {
  if (navigator.onLine) {
    iniciarRealtime();
    syncOfflineQueue();
  }
});
