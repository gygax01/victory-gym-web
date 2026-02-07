/* ===============================
   ===== STORAGE BASE GYM (OFFLINE-FIRST) =====
=============================== */

/* ======================================================
   ===== UTIL BASE =====
====================================================== */
function safeGet(key, def = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? def;
  } catch {
    return def;
  }
}

function safeSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ======================================================
   ===== COLA OFFLINE (🔥 CLAVE) =====
====================================================== */
function obtenerColaOffline() {
  return safeGet("offline_queue", []);
}

function guardarColaOffline(lista) {
  safeSet("offline_queue", lista);
}

function agregarACola(tipo, payload) {
  const cola = obtenerColaOffline();
  cola.push({
    tipo,
    payload,
    ts: Date.now()
  });
  guardarColaOffline(cola);
}

/* ======================================================
   ===== SINCRONIZACIÓN =====
====================================================== */
async function syncOfflineQueue() {
  if (!navigator.onLine) return;

  const cola = obtenerColaOffline();
  if (cola.length === 0) return;

  console.log("🔄 Sincronizando offline queue:", cola.length);

  // ⚠️ aquí NO hacemos POST directo
  // Supabase se entera por los flujos normales (ESP / UI)
  // Esto es para futuras extensiones

  guardarColaOffline([]);
}

window.addEventListener("online", syncOfflineQueue);

/* ======================================================
   ===== EMPLEADOS =====
====================================================== */
function obtenerEmpleados() {
  return safeGet("empleados", []);
}

function guardarEmpleados(lista) {
  safeSet("empleados", lista || []);
}

/* ======================================================
   ===== CLIENTES =====
====================================================== */
function obtenerClientes() {
  return safeGet("clientes", []);
}

function guardarClientes(lista) {
  safeSet("clientes", lista || []);
  agregarACola("clientes", lista);
}

/* ======================================================
   ===== ASISTENCIAS =====
====================================================== */
function obtenerAsistencias() {
  return safeGet("asistencias", []);
}

function guardarAsistencias(lista) {
  safeSet("asistencias", lista || []);
  agregarACola("asistencias", lista);
}

/* ======================================================
   ===== PRODUCTOS =====
====================================================== */
function obtenerProductos() {
  return safeGet("productos", []);
}

function guardarProductos(lista) {
  safeSet("productos", lista || []);
  agregarACola("productos", lista);
}

/* ======================================================
   ===== VENTAS =====
====================================================== */
function obtenerVentas() {
  return safeGet("ventas", []);
}

function guardarVentas(lista) {
  safeSet("ventas", lista || []);
  agregarACola("ventas", lista);
}

/* ======================================================
   ===== TARJETAS / PERSONAS =====
====================================================== */
function buscarEmpleadoPorTarjeta(uid) {
  if (!uid) return null;
  return obtenerEmpleados().find(
    e => typeof e.tarjetaUID === "string" && e.tarjetaUID === uid
  ) || null;
}

function buscarClientePorTarjeta(uid) {
  if (!uid) return null;
  return obtenerClientes().find(
    c => typeof c.tarjetaUID === "string" && c.tarjetaUID === uid
  ) || null;
}

function obtenerInfoTarjeta(uid) {
  const emp = buscarEmpleadoPorTarjeta(uid);
  if (emp) return { tipo: "empleado", persona: emp };

  const cli = buscarClientePorTarjeta(uid);
  if (cli) return { tipo: "cliente", persona: cli };

  return { tipo: null, persona: null };
}

function uidYaRegistrada(uid) {
  if (!uid) return false;
  return obtenerInfoTarjeta(uid).tipo !== null;
}

function liberarTarjeta(uid) {
  if (!uid) return;

  guardarEmpleados(
    obtenerEmpleados().map(e => {
      if (e.tarjetaUID === uid) e.tarjetaUID = null;
      return e;
    })
  );

  guardarClientes(
    obtenerClientes().map(c => {
      if (c.tarjetaUID === uid) c.tarjetaUID = null;
      return c;
    })
  );
}

/* ======================================================
   ===== FECHAS / HORAS =====
====================================================== */
function hoy() {
  return new Date().toISOString().split("T")[0];
}

function horaActual() {
  return new Date().toLocaleTimeString("es-MX", {
    hour12: false
  });
}
