/* ======================================================
   ===== STORAGE BASE GYM (OFFLINE-FIRST REAL) =====
====================================================== */

/* ================= UTILIDADES ================= */
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

function uid() {
  return crypto.randomUUID();
}

function isOnline() {
  return navigator.onLine === true;
}

/* ================= COLA OFFLINE ================= */
function obtenerColaOffline() {
  return safeGet("offline_queue", []);
}

function guardarColaOffline(lista) {
  safeSet("offline_queue", lista);
}

function agregarEvento(tabla, accion, payload) {
  const cola = obtenerColaOffline();

  cola.push({
    id: uid(),
    tabla,          // clientes | productos | asistencias | ventas | empleados
    accion,         // add | update | delete
    payload,
    ts: Date.now(),
    synced: false
  });

  guardarColaOffline(cola);
}

/* ================= CLIENTES ================= */
function obtenerClientes() {
  return safeGet("clientes", []);
}

function guardarClientes(lista) {
  safeSet("clientes", lista);
}

function registrarCliente(cliente) {
  cliente.id ??= uid();
  const lista = obtenerClientes();
  lista.push(cliente);
  guardarClientes(lista);
  agregarEvento("clientes", "add", cliente);
}

function actualizarCliente(cliente) {
  const lista = obtenerClientes().map(c =>
    c.id === cliente.id ? cliente : c
  );
  guardarClientes(lista);
  agregarEvento("clientes", "update", cliente);
}

/* ================= PRODUCTOS ================= */
function obtenerProductos() {
  return safeGet("productos", []);
}

function registrarProducto(prod) {
  prod.id ??= uid();
  const lista = obtenerProductos();
  lista.push(prod);
  safeSet("productos", lista);
  agregarEvento("productos", "add", prod);
}

function actualizarProducto(prod) {
  const lista = obtenerProductos().map(p =>
    p.id === prod.id ? prod : p
  );
  safeSet("productos", lista);
  agregarEvento("productos", "update", prod);
}

/* ================= ASISTENCIAS ================= */
function obtenerAsistencias() {
  return safeGet("asistencias", []);
}

function guardarAsistencias(lista) {
  safeSet("asistencias", lista);
}

function registrarAsistencia(a) {
  a.id ??= uid();
  const lista = obtenerAsistencias();
  lista.push(a);
  guardarAsistencias(lista);
  agregarEvento("asistencias", "add", a);
}

/* ================= VENTAS ================= */
function obtenerVentas() {
  return safeGet("ventas", []);
}

function registrarVenta(v) {
  v.id ??= uid();
  const lista = obtenerVentas();
  lista.push(v);
  safeSet("ventas", lista);
  agregarEvento("ventas", "add", v);
}

/* ================= EMPLEADOS ================= */
function obtenerEmpleados() {
  return safeGet("empleados", []);
}

function guardarEmpleados(lista) {
  safeSet("empleados", lista);
  agregarEvento("empleados", "sync", lista);
}

/* ================= NFC HELPERS ================= */
function buscarEmpleadoPorTarjeta(uidTarjeta) {
  return obtenerEmpleados().find(e => e.tarjetaUID === uidTarjeta) || null;
}

function buscarClientePorTarjeta(uidTarjeta) {
  return obtenerClientes().find(c => c.tarjetaUID === uidTarjeta) || null;
}

function uidYaRegistrada(uidTarjeta) {
  return !!buscarEmpleadoPorTarjeta(uidTarjeta) || !!buscarClientePorTarjeta(uidTarjeta);
}

/* ================= FECHAS ================= */
function hoy() {
  return new Date().toISOString().split("T")[0];
}

function horaActual() {
  return new Date().toLocaleTimeString("es-MX", { hour12: false });
}

/* ================= SYNC REAL ================= */
async function syncOfflineQueue() {
  if (!isOnline() || !window.supabase) return;

  const cola = obtenerColaOffline();
  const pendientes = cola.filter(e => !e.synced);
  if (!pendientes.length) return;

  for (const e of pendientes) {
    try {
      if (e.tabla === "clientes" || e.tabla === "productos") {
        await supabase.from(e.tabla).upsert(e.payload);
      }

      if (e.tabla === "asistencias" || e.tabla === "ventas") {
        await supabase.from(e.tabla).insert(e.payload);
      }

      e.synced = true;
    } catch (err) {
      console.error("❌ Sync falló:", e, err);
    }
  }

  guardarColaOffline(cola);
}

window.addEventListener("online", syncOfflineQueue);
