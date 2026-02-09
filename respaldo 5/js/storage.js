/* ======================================================
   ===== STORAGE BASE GYM (OFFLINE-FIRST + REALTIME) =====
====================================================== */

/* ======================================================
   ===== UTILIDADES BASE =====
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

function uid() {
  return crypto.randomUUID();
}

/* ======================================================
   ===== ESTADO ONLINE =====
====================================================== */
function isOnline() {
  return navigator.onLine === true;
}

/* ======================================================
   ===== COLA OFFLINE (EVENTOS ATÓMICOS) =====
====================================================== */
function obtenerColaOffline() {
  return safeGet("offline_queue", []);
}

function guardarColaOffline(lista) {
  safeSet("offline_queue", lista);
}

function agregarEvento({ tabla, accion, data }) {
  const cola = obtenerColaOffline();

  cola.push({
    id: uid(),
    tabla,          // clientes | asistencias | ventas | productos
    accion,         // add | update | delete
    data,
    ts: Date.now(),
    synced: false
  });

  guardarColaOffline(cola);
}

/* ======================================================
   ===== SINCRONIZACIÓN (LISTO PARA SUPABASE) =====
====================================================== */
async function syncOfflineQueue() {
  if (!isOnline()) return;

  const cola = obtenerColaOffline();
  const pendientes = cola.filter(e => !e.synced);

  if (!pendientes.length) return;

  console.log("🔄 Sincronizando eventos:", pendientes.length);

  // 🔥 Aquí luego entra Supabase / API
  // Por ahora solo marcamos como sincronizados

  pendientes.forEach(e => (e.synced = true));
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
}

/* ======================================================
   ===== CLIENTES =====
====================================================== */
function obtenerClientes() {
  return safeGet("clientes", []);
}

function registrarCliente(cliente) {
  const lista = obtenerClientes();

  if (!cliente.id) cliente.id = uid();
  lista.push(cliente);

  safeSet("clientes", lista);
  agregarEvento({ tabla: "clientes", accion: "add", data: cliente });
}

function actualizarCliente(cliente) {
  const lista = obtenerClientes().map(c =>
    c.id === cliente.id ? cliente : c
  );

  safeSet("clientes", lista);
  agregarEvento({ tabla: "clientes", accion: "update", data: cliente });
}

/* ======================================================
   ===== ASISTENCIAS =====
====================================================== */
function obtenerAsistencias() {
  return safeGet("asistencias", []);
}

function registrarAsistencia(asistencia) {
  const lista = obtenerAsistencias();

  if (!asistencia.id) asistencia.id = uid();
  lista.push(asistencia);

  safeSet("asistencias", lista);
  agregarEvento({ tabla: "asistencias", accion: "add", data: asistencia });
}

/* ======================================================
   ===== PRODUCTOS =====
====================================================== */
function obtenerProductos() {
  return safeGet("productos", []);
}

function registrarProducto(prod) {
  const lista = obtenerProductos();

  if (!prod.id) prod.id = uid();
  lista.push(prod);

  safeSet("productos", lista);
  agregarEvento({ tabla: "productos", accion: "add", data: prod });
}

function actualizarProducto(prod) {
  const lista = obtenerProductos().map(p =>
    p.id === prod.id ? prod : p
  );

  safeSet("productos", lista);
  agregarEvento({ tabla: "productos", accion: "update", data: prod });
}

/* ======================================================
   ===== VENTAS =====
====================================================== */
function obtenerVentas() {
  return safeGet("ventas", []);
}

function registrarVenta(venta) {
  const lista = obtenerVentas();

  if (!venta.id) venta.id = uid();
  lista.push(venta);

  safeSet("ventas", lista);
  agregarEvento({ tabla: "ventas", accion: "add", data: venta });
}

/* ======================================================
   ===== TARJETAS NFC =====
====================================================== */
function buscarEmpleadoPorTarjeta(uidTarjeta) {
  return obtenerEmpleados().find(e => e.tarjetaUID === uidTarjeta) || null;
}

function buscarClientePorTarjeta(uidTarjeta) {
  return obtenerClientes().find(c => c.tarjetaUID === uidTarjeta) || null;
}

function obtenerInfoTarjeta(uidTarjeta) {
  const emp = buscarEmpleadoPorTarjeta(uidTarjeta);
  if (emp) return { tipo: "empleado", persona: emp };

  const cli = buscarClientePorTarjeta(uidTarjeta);
  if (cli) return { tipo: "cliente", persona: cli };

  return { tipo: null, persona: null };
}

function uidYaRegistrada(uidTarjeta) {
  return obtenerInfoTarjeta(uidTarjeta).tipo !== null;
}

/* ======================================================
   ===== FECHAS / HORAS =====
====================================================== */
function hoy() {
  return new Date().toISOString().split("T")[0];
}

function horaActual() {
  return new Date().toLocaleTimeString("es-MX", { hour12: false });
}
/* ======================================================
   ===== SYNC OFFLINE → SUPABASE (REAL)
====================================================== */
async function subirEventoASupabase(e) {
  if (!window.supabase) return false;

  try {
    if (e.tipo === "clientes") {
      await supabase.from("clientes").upsert(e.payload);
    }

    if (e.tipo === "productos") {
      await supabase.from("productos").upsert(e.payload);
    }

    if (e.tipo === "asistencias") {
      await supabase.from("asistencias").insert(e.payload);
    }

    if (e.tipo === "ventas") {
      await supabase.from("ventas").insert(e.payload);
    }

    return true;
  } catch (err) {
    console.error("❌ Sync error:", err);
    return false;
  }
}

async function syncOfflineQueue() {
  if (!navigator.onLine) return;

  const cola = obtenerColaOffline();
  if (!cola.length) return;

  console.log("🔄 Subiendo offline:", cola.length);

  const pendientes = [];

  for (const e of cola) {
    const ok = await subirEventoASupabase(e);
    if (!ok) pendientes.push(e);
  }

  guardarColaOffline(pendientes);
}

window.addEventListener("online", syncOfflineQueue);

