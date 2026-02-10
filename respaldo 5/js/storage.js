/* ======================================================
   ===== SUPABASE REALTIME (OFFLINE-FIRST SAFE) =====
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkemZubXJreGZ5emh1c21rbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQ2MTcsImV4cCI6MjA4NTk5MDYxN30.juvLQ83pjdckK1MqkKu0JsFjtpcTPNfEwG65op_5YEI";

if (window.supabase?.createClient) {
  window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

/* ======================================================
   ===== INIT REALTIME =====
====================================================== */
function iniciarRealtime() {
  if (!window.supabaseClient) return;

  console.log("🟢 Realtime conectado");

  suscribirTabla("clientes", syncClientesDesdeSupabase);
  suscribirTabla("productos", syncProductosDesdeSupabase);
  suscribirTabla("asistencias", syncAsistenciasDesdeSupabase);
  suscribirTabla("ventas", syncVentasDesdeSupabase);
  suscribirTabla("empleados", syncEmpleadosDesdeSupabase);
}

/* ======================================================
   ===== SUBSCRIPCIÓN GENÉRICA =====
====================================================== */
function suscribirTabla(tabla, callback) {
  window.supabaseClient
    .channel(`rt-${tabla}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: tabla },
      () => {
        console.log(`🔄 ${tabla} actualizado`);
        callback();
      }
    )
    .subscribe();
}

/* ======================================================
   ===== SYNC → LOCALSTORAGE =====
====================================================== */
async function syncClientesDesdeSupabase() {
  const { data } = await window.supabaseClient
    .from("clientes")
    .select("*");

  if (Array.isArray(data)) {
    safeSet("clientes", data);
    new BroadcastChannel("victory-data").postMessage("clientes");
    if (typeof cargarClientes === "function") cargarClientes();
  }
}

async function syncProductosDesdeSupabase() {
  const { data } = await window.supabaseClient
    .from("productos")
    .select("*");

  if (Array.isArray(data)) {
    safeSet("productos", data);
    new BroadcastChannel("victory-data").postMessage("productos");
    if (typeof cargarStock === "function") cargarStock();
    if (typeof cargarProductos === "function") cargarProductos();
  }
}

async function syncAsistenciasDesdeSupabase() {
  const { data } = await window.supabaseClient
    .from("asistencias")
    .select("*");

  if (Array.isArray(data)) {
    safeSet("asistencias", data);
    new BroadcastChannel("victory-data").postMessage("asistencias");
    if (typeof cargarAsistencias === "function") cargarAsistencias();
    if (typeof actualizarContador === "function") actualizarContador();
  }
}

async function syncVentasDesdeSupabase() {
  const { data } = await window.supabaseClient
    .from("ventas")
    .select("*");

  if (Array.isArray(data)) {
    safeSet("ventas", data);
    new BroadcastChannel("victory-data").postMessage("ventas");
  }
}

async function syncEmpleadosDesdeSupabase() {
  const { data } = await window.supabaseClient
    .from("empleados")
    .select("*");

  if (Array.isArray(data)) {
    safeSet("empleados", data);
    new BroadcastChannel("victory-data").postMessage("empleados");
  }
}

/* ======================================================
   ===== ONLINE / OFFLINE =====
====================================================== */
window.addEventListener("online", () => {
  console.log("🌐 Online → sincronizando");
  syncOfflineQueue();
  iniciarRealtime();
});

/* ======================================================
   ===== INIT GLOBAL =====
====================================================== */
window.addEventListener("load", () => {
  if (navigator.onLine) {
    iniciarRealtime();
    syncOfflineQueue();
  }
});
