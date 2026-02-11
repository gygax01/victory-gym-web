/* ======================================================
   ===== STORAGE OFFLINE FIRST (SOURCE OF TRUTH) =====
====================================================== */

/* ================= UTIL BASE ================= */

function safeGet(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function safeSet(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ======================================================
   ===== ZONA HORARIA CORREGIDA (MÉXICO / CHIAPAS) =====
====================================================== */

const APP_TIMEZONE = "America/Mexico_City";

/**
 * Devuelve fecha real en zona horaria México
 * Formato: YYYY-MM-DD
 */
function hoy() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: APP_TIMEZONE
  });
}

/**
 * Devuelve hora real México HH:mm:ss
 */
function horaActual() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: APP_TIMEZONE,
    hour12: false
  });
}

/**
 * Timestamp absoluto (NO depende de zona)
 */
function ahoraTimestamp() {
  return Date.now();
}

/* ================= EMPLEADOS ================= */

function obtenerEmpleados() {
  return safeGet("empleados");
}

function guardarEmpleados(data) {
  safeSet("empleados", data);
}

/* ================= PRODUCTOS ================= */

function obtenerProductos() {
  return safeGet("productos");
}

function guardarProductos(data) {
  safeSet("productos", data);
}

/* ================= ASISTENCIAS ================= */

function obtenerAsistencias() {
  return safeGet("asistencias");
}

function guardarAsistencias(data) {
  safeSet("asistencias", data);
}

/* ================= HISTORIAL DE STOCK ================= */

const HISTORIAL_STOCK_KEY = "historial_stock";

/**
 * Guarda un evento completo de stock (offline first)
 */
function guardarEventoStock(evento) {

  const historial = safeGet(HISTORIAL_STOCK_KEY);

  historial.push({
    id: evento.id || crypto.randomUUID(),
    fecha: evento.fecha || hoy(),
    hora: evento.hora || horaActual(),
    usuario: evento.usuario,
    rol: evento.rol,
    cambios: evento.cambios,
    ts: Date.now(),
    synced: false
  });

  safeSet(HISTORIAL_STOCK_KEY, historial);
}

/**
 * Devuelve TODO el historial de stock
 */
function obtenerHistorialStock() {
  return safeGet(HISTORIAL_STOCK_KEY);
}

/**
 * Marca un evento como sincronizado
 */
function marcarEventoStockSincronizado(idEvento) {
  const historial = safeGet(HISTORIAL_STOCK_KEY);
  const idx = historial.findIndex(e => e.id === idEvento);

  if (idx >= 0) {
    historial[idx].synced = true;
    safeSet(HISTORIAL_STOCK_KEY, historial);
  }
}

/**
 * Obtiene eventos pendientes
 */
function obtenerEventosStockPendientes() {
  return safeGet(HISTORIAL_STOCK_KEY).filter(e => !e.synced);
}

/* ================= OFFLINE QUEUE ================= */

function obtenerColaOffline() {
  return safeGet("offlineQueue");
}

function guardarColaOffline(data) {
  safeSet("offlineQueue", data);
}

function enqueueOffline(evento) {

  const cola = obtenerColaOffline();

  cola.push({
    ...evento,
    ts: Date.now()
  });

  guardarColaOffline(cola);
}

/* ======================================================
   ===== EVENTOS GENÉRICOS (POS / STOCK) ================
====================================================== */

function agregarEvento(evento) {

  try {

    enqueueOffline({
      tipo: "db",
      tabla: evento.tabla,
      accion: evento.accion,
      data: evento.data
    });

    if (
      navigator.onLine &&
      window.supabase &&
      typeof actualizarStockSupabase === "function"
    ) {
      if (evento.tabla === "productos" && evento.accion === "update") {
        actualizarStockSupabase(evento.data.id, evento.data.stock);
      }
    }

  } catch (e) {
    console.error("❌ agregarEvento error:", e);
  }
}
