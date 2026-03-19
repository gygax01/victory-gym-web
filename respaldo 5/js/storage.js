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

function normalizarUID(uid) {
  return String(uid || "").trim().toUpperCase();
}

/* ======================================================
   ===== ZONA HORARIA CORREGIDA (MEXICO / CHIAPAS) =====
====================================================== */

const APP_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/**
 * Devuelve fecha real en zona horaria Mexico
 * Formato: YYYY-MM-DD
 */
function hoy() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: APP_TIMEZONE
  });
}

/**
 * Devuelve hora real Mexico HH:mm:ss
 */
function horaActual() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: APP_TIMEZONE,
    hour12: false
  });
}

function fechaDesdeTS(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

function horaDesdeTS(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-MX", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function rangoHoyISO() {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const fin = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return {
    fechaLocal: hoy(),
    inicioISO: inicio.toISOString(),
    finISO: fin.toISOString()
  };
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

/* ================= STOCK TARJETAS ================= */

const STOCK_TARJETAS_KEY = "stock_tarjetas";

function numeroEnteroNoNegativo(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
}

function notificarCambioStockTarjetas() {
  const channelName = window.APP_CONFIG?.syncChannel || "victory-data";
  try {
    const ch = new BroadcastChannel(channelName);
    ch.postMessage("stock_tarjetas");
    ch.close();
  } catch (error) {
    console.warn("[STORAGE] No se pudo notificar stock de tarjetas:", error);
  }
}

function obtenerStockTarjetas() {
  try {
    const raw = JSON.parse(localStorage.getItem(STOCK_TARJETAS_KEY) || "{}");
    return {
      cantidad: numeroEnteroNoNegativo(raw?.cantidad, 0),
      updated_at: String(raw?.updated_at || "")
    };
  } catch {
    return {
      cantidad: 0,
      updated_at: ""
    };
  }
}

function guardarStockTarjetas(input = {}, options = {}) {
  const actual = obtenerStockTarjetas();
  const payload = {
    cantidad: numeroEnteroNoNegativo(
      input?.cantidad,
      numeroEnteroNoNegativo(actual?.cantidad, 0)
    ),
    updated_at: new Date().toISOString()
  };

  localStorage.setItem(STOCK_TARJETAS_KEY, JSON.stringify(payload));

  if (!options?.silent) {
    notificarCambioStockTarjetas();
  }

  return payload;
}

function descontarStockTarjetas(cantidad = 1) {
  const requerido = numeroEnteroNoNegativo(cantidad, 1);
  const actual = obtenerStockTarjetas();
  const disponible = numeroEnteroNoNegativo(actual?.cantidad, 0);

  if (requerido <= 0) {
    return { ok: true, stock: actual };
  }

  if (disponible < requerido) {
    return { ok: false, stock: actual };
  }

  const stock = guardarStockTarjetas({ cantidad: disponible - requerido });
  return { ok: true, stock };
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
   ===== EVENTOS GENERICOS (POS / STOCK) ================
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
    console.error("[STORAGE] agregarEvento error:", e);
  }
}

async function syncOfflineQueue() {
  const cola = obtenerColaOffline();

  if (!cola.length) {
    console.info("[SYNC] Cola offline vacia");
    return;
  }

  if (!navigator.onLine) {
    console.warn("[SYNC] Sin internet, cola pendiente:", cola.length);
    return;
  }

  console.groupCollapsed(`[SYNC] Iniciando sync offline (${cola.length})`);

  const pendientes = [];
  let exitos = 0;

  for (const ev of cola) {
    try {
      if (ev?.tipo !== "db" || !ev.tabla || !ev.accion) {
        console.warn("[SYNC] Evento inválido omitido", ev);
        exitos++;
        continue;
      }

      if (ev.tabla === "productos" && ev.accion === "update") {
        if (typeof actualizarStockSupabase !== "function") {
          throw new Error("actualizarStockSupabase no disponible");
        }

        const ok = await actualizarStockSupabase(ev.data.id, ev.data.stock);
        if (ok === false) throw new Error("update stock rechazado");

        console.info("[SYNC] Producto sincronizado:", ev.data.id);
        exitos++;
        continue;
      }

      if (ev.tabla === "empleados" && ev.accion === "add") {
        if (typeof insertarEmpleadoSupabase === "function") {
          await insertarEmpleadoSupabase(ev.data);
          console.info("[SYNC] Empleado sincronizado:", ev.data?.usuario || ev.data?.id);
        } else {
          console.info("[SYNC] Empleado guardado solo local (sin sync remoto)");
        }

        exitos++;
        continue;
      }

      console.info("[SYNC] Evento no requiere sync remoto:", ev.tabla, ev.accion);
      exitos++;
    } catch (err) {
      console.error("[SYNC] Error sincronizando evento:", ev, err);
      pendientes.push(ev);
    }
  }

  guardarColaOffline(pendientes);
  console.info(`[SYNC] Fin sync offline. Exitos: ${exitos}, Pendientes: ${pendientes.length}`);
  console.groupEnd();
}

