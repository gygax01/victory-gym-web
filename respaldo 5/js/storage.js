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

/* ================= HISTORIAL DE STOCK ================= */
/*
  Cada evento representa UNA confirmación de cambios desde STOCK
  NO desde POS
*/

const HISTORIAL_STOCK_KEY = "historial_stock";

/**
 * Guarda un evento completo de stock (offline first)
 */
function guardarEventoStock(evento) {
  const historial = safeGet(HISTORIAL_STOCK_KEY);

  historial.push({
    id: evento.id || crypto.randomUUID(),
    fecha: evento.fecha,            // YYYY-MM-DD
    hora: evento.hora,              // HH:mm:ss (UTC)
    usuario: evento.usuario,        // username
    rol: evento.rol,                // admin / superadmin
    cambios: evento.cambios,        // array de cambios
    ts: Date.now(),                 // timestamp técnico
    synced: false                   // aún no sincronizado
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
 * Obtiene eventos pendientes de sincronizar
 */
function obtenerEventosStockPendientes() {
  return safeGet(HISTORIAL_STOCK_KEY).filter(e => !e.synced);
}

/* ================= OFFLINE QUEUE (YA EXISTENTE) ================= */
function obtenerColaOffline() {
  return safeGet("offlineQueue");
}

function guardarColaOffline(data) {
  safeSet("offlineQueue", data);
}

function enqueueOffline(evento) {
  const cola = obtenerColaOffline();
  cola.push({ ...evento, ts: Date.now() });
  guardarColaOffline(cola);
}

/* ================= HELPERS DE TIEMPO ================= */
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * HORA EN UTC (CRÍTICO PARA MULTI-DISPOSITIVO)
 * Devuelve HH:mm:ss en UTC
 */
function horaActual() {
  return new Date().toISOString().slice(11, 19);
}

/* ======================================================
   ===== EVENTOS GENÉRICOS (POS / STOCK) ================
====================================================== */

function agregarEvento(evento) {
  try {
    // Siempre guardar offline primero
    enqueueOffline({
      tipo: "db",
      tabla: evento.tabla,
      accion: evento.accion,
      data: evento.data
    });

    // Si hay internet y existe supabase, sincroniza
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
