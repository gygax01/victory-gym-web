/* ===============================
   ===== SUPABASE REALTIME =====
=============================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkemZubXJreGZ5emh1c21rbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQ2MTcsImV4cCI6MjA4NTk5MDYxN30.juvLQ83pjdckK1MqkKu0JsFjtpcTPNfEwG65op_5YEI";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* ===============================
   ===== CANALES =====
=============================== */

function iniciarRealtime() {
  console.log("🟢 Realtime iniciado");

  // CLIENTES
  supabase
    .channel("clientes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clientes" },
      () => {
        console.log("🔄 clientes actualizados");
        syncClientesDesdeSupabase();
      }
    )
    .subscribe();

  // ASISTENCIAS
  supabase
    .channel("asistencias")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "asistencias" },
      () => {
        console.log("🔄 asistencias actualizadas");
        syncAsistenciasDesdeSupabase();
      }
    )
    .subscribe();

  // PRODUCTOS
  supabase
    .channel("productos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "productos" },
      () => {
        console.log("🔄 productos actualizados");
        syncProductosDesdeSupabase();
      }
    )
    .subscribe();

  // VENTAS
  supabase
    .channel("ventas")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "ventas" },
      () => {
        console.log("🔄 ventas actualizadas");
        syncVentasDesdeSupabase();
      }
    )
    .subscribe();
}

/* ===============================
   ===== SYNC → LOCALSTORAGE =====
=============================== */

async function syncClientesDesdeSupabase() {
  const { data } = await supabase.from("clientes").select("*");
  if (Array.isArray(data)) {
    safeSet("clientes", data);
    if (typeof cargarClientes === "function") cargarClientes();
  }
}

async function syncAsistenciasDesdeSupabase() {
  const { data } = await supabase.from("asistencias").select("*");
  if (Array.isArray(data)) {
    safeSet("asistencias", data);
    if (typeof cargarAsistencias === "function") cargarAsistencias();
    if (typeof actualizarContador === "function") actualizarContador();
  }
}

async function syncProductosDesdeSupabase() {
  const { data } = await supabase.from("productos").select("*");
  if (Array.isArray(data)) {
    safeSet("productos", data);
    if (typeof cargarStock === "function") cargarStock();
  }
}

async function syncVentasDesdeSupabase() {
  const { data } = await supabase.from("ventas").select("*");
  if (Array.isArray(data)) {
    safeSet("ventas", data);
  }
}

/* ===============================
   ===== INIT GLOBAL =====
=============================== */
window.addEventListener("load", () => {
  if (navigator.onLine) iniciarRealtime();
});
