/* ===============================
   ===== STORAGE BASE GYM (OFFLINE-FIRST PRO) =====
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
   ===== ESTADO ONLINE =====
====================================================== */
function isOnline() {
  return navigator.onLine === true;
}

/* ======================================================
   ===== COLA OFFLINE (EVENTOS) =====
====================================================== */
function obtenerColaOffline() {
  return safeGet("offline_queue", []);
}

function guardarColaOffline(lista) {
  safeSet("offline_queue", lista);
}

function agregarEvento(tipo, accion, payload) {
  const cola = obtenerColaOffline();
  cola.push({
    id: crypto.randomUUID(),
    tipo,
    accion,
    payload,
    ts: Date.now(),
    synced: false
  });
  guardarColaOffline(cola);
}

/* ======================================================
   ===== SINCRONIZACIÓN (PLACEHOLDER) =====
====================================================== */
async function syncOfflineQueue() {
  if (!isOnline()) return;

  const cola = obtenerColaOffline();
  const pendientes = cola.filter(e => !e.synced);

  if (!pendientes.length) return;

  console.log("🔄 Sync pendiente:", pendientes.length);

  // ⚠️ Aquí después irá Supabase / Bluetooth
  // Por ahora SOLO marcamos como sincronizado

  pendientes.forEach(e => e.synced = true);
  guardarColaOffline(cola);
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
  agregarEvento("empleados", "set", lista);
}

/* ======================================================
   ===== CLIENTES =====
====================================================== */
function obtenerClientes() {
  return safeGet("clientes", []);
}

function guardarClientes(lista) {
  safeSet("clientes", lista || []);
  agregarEvento("clientes", "set", lista);
}

/* ======================================================
   ===== ASISTENCIAS =====
====================================================== */
function obtenerAsistencias() {
  return safeGet("asistencias", []);
}

function registrarAsistencia(asistencia) {
  const lista = obtenerAsistencias();
  lista.push(asistencia);
  safeSet("asistencias", lista);
  agregarEvento("asistencias", "add", asistencia);
}

/* ======================================================
   ===== PRODUCTOS =====
====================================================== */
function obtenerProductos() {
  return safeGet("productos", []);
}

function guardarProductos(lista) {
  safeSet("productos", lista || []);
  agregarEvento("productos", "set", lista);
}

/* ======================================================
   ===== VENTAS =====
====================================================== */
function obtenerVentas() {
  return safeGet("ventas", []);
}

function registrarVenta(venta) {
  const lista = obtenerVentas();
  lista.push(venta);
  safeSet("ventas", lista);
  agregarEvento("ventas", "add", venta);
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
/* ======================================================
   ===== ESTADO DE CONEXIÓN =====
====================================================== */
function isOnline() {
  return navigator.onLine === true;
}

