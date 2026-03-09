/* ======================================================
   ===== SUPABASE REALTIME (STOCK + CLIENTES) ===========
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
window.supabaseClient = supabaseClient;

const bc = new BroadcastChannel("victory-data");
let realtimeChannel = null;
const AUTO_CIERRE_LAST_OK_KEY = "auto_cierre_last_ok_date";
const AUTO_CIERRE_SEGUNDO = 2;
let autoCierreTimer = null;
let autoCierreEnProceso = false;

async function logEstadoSupabase() {
  if (!navigator.onLine) {
    console.warn("[SUPABASE] Offline: no se puede validar conexion");
    return;
  }

  try {
    const { error } = await supabaseClient
      .from("productos")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("[SUPABASE] Conexion con error:", error.message || error);
      return;
    }

    console.info("[SUPABASE] Conexion OK");
  } catch (err) {
    console.error("[SUPABASE] Error de red/SDK:", err);
  }
}

/* ======================================================
   ===== PRODUCTOS (NO TOCAR) ===========================
====================================================== */

async function cargarProductosIniciales() {
  const { data, error } = await supabaseClient
    .from("productos")
    .select("*");

  if (error) {
    console.error("[PRODUCTOS] Error carga inicial:", error);
    return;
  }

  localStorage.setItem("productos", JSON.stringify(data || []));
  bc.postMessage("productos");
  console.log("[PRODUCTOS] Productos iniciales:", data.length);
}

async function actualizarStockSupabase(id, nuevoStock) {
  const { error } = await supabaseClient
    .from("productos")
    .update({ stock: nuevoStock })
    .eq("id", id);

  if (error) {
    console.error("[PRODUCTOS] Error update stock:", error);
    return false;
  }
  return true;
}

async function insertarProductoSupabase(prod) {
  const { error } = await supabaseClient
    .from("productos")
    .insert(prod);

  if (error) console.error("[PRODUCTOS] Error insert:", error);
}

async function borrarProductoSupabase(id) {
  const { error } = await supabaseClient
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) console.error("[PRODUCTOS] Error delete:", error);
}

function iniciarRealtime() {
  if (realtimeChannel) return;

  realtimeChannel = supabaseClient
    .channel("rt-productos")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "productos" },
      payload => {
        let productos = JSON.parse(localStorage.getItem("productos") || "[]");

        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const i = productos.findIndex(p => p.id === payload.new.id);
          if (i >= 0) productos[i] = payload.new;
          else productos.push(payload.new);
        }

        if (payload.eventType === "DELETE") {
          productos = productos.filter(p => p.id !== payload.old.id);
        }

        localStorage.setItem("productos", JSON.stringify(productos));
        bc.postMessage("productos");
      }
    )
    .subscribe(() => {
      console.log("[PRODUCTOS] Realtime activo");
    });
}

/* ======================================================
   ===== CLIENTES (NO TOCAR) ============================
====================================================== */

async function cargarClientesIniciales() {
  const { data, error } = await supabaseClient
    .from("clientes")
    .select("*");

  if (error) {
    console.error("[CLIENTES] Error carga inicial:", error);
    return;
  }

  const clientesNormalizados = (data || []).map(c => ({
    id: c.id,
    nombre: c.nombre,
    tarjetaUID: normalizarUID(c.tarjeta_uid),
    fechaRegistro: c.fecha_registro,
    membresiaExpira: c.membresia_expira,
    telefono: c.telefono ?? "0",
    peso: c.peso ?? 0,
    altura: c.altura ?? 0
  }));

  localStorage.setItem("clientes", JSON.stringify(clientesNormalizados));
  bc.postMessage("clientes");

  console.log("[CLIENTES] Clientes cargados:", clientesNormalizados.length);
}

function iniciarRealtimeClientes() {
  supabaseClient
    .channel("rt-clientes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "clientes" },
      payload => {
        let clientes = JSON.parse(localStorage.getItem("clientes") || "[]");

        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const nuevo = {
            id: payload.new.id,
            nombre: payload.new.nombre,
            tarjetaUID: normalizarUID(payload.new.tarjeta_uid),
            fechaRegistro: payload.new.fecha_registro,
            membresiaExpira: payload.new.membresia_expira,
            telefono: payload.new.telefono ?? "0",
            peso: payload.new.peso ?? 0,
            altura: payload.new.altura ?? 0
          };

          const i = clientes.findIndex(c => c.id === nuevo.id);
          if (i >= 0) clientes[i] = nuevo;
          else clientes.push(nuevo);
        }

        if (payload.eventType === "DELETE") {
          clientes = clientes.filter(c => c.id !== payload.old.id);
        }

        localStorage.setItem("clientes", JSON.stringify(clientes));
        bc.postMessage("clientes");
      }
    )
    .subscribe(() => {
      console.log("[CLIENTES] Realtime activo");
    });
}

/* ======================================================
   ===== NUEVO: REALTIME ATTENDANCE (MODELO EVENTOS)
====================================================== */
async function reconstruirAsistenciasHoy() {

  const { fechaLocal, inicioISO, finISO } = rangoHoyISO();

  const { data, error } = await supabaseClient
    .from("attendance")
    .select("*")
    .gte("created_at", inicioISO)
    .lt("created_at", finISO)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[ATTENDANCE] Error cargar attendance:", error);
    return;
  }

  const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");

  const sesiones = {};
  const resultado = [];

  for (const e of data) {

    const key = e.cliente_id; // clave por cliente_id

    if (!sesiones[key]) {
      sesiones[key] = [];
    }

    sesiones[key].push(e);
  }

  Object.keys(sesiones).forEach(clienteId => {

    const eventos = sesiones[clienteId];
    let entradaActiva = null;

    eventos.forEach(ev => {

      const cliente = clientes.find(c => c.id === clienteId);

      if (ev.type === "entrada") {

        entradaActiva = {
          id: ev.id,
          cliente_id: clienteId,
          nombre: cliente?.nombre || "Cliente",
          fecha: fechaLocal,
          entrada_ts: new Date(ev.created_at).getTime(),
          salida_ts: null
        };

        resultado.push(entradaActiva);
      }

      if (ev.type === "salida" && entradaActiva) {
        entradaActiva.salida_ts = new Date(ev.created_at).getTime();
        entradaActiva = null;
      }

    });

  });

  localStorage.setItem("asistencias", JSON.stringify(resultado));

  if (typeof notificarCambioAsistencias === "function") {
    notificarCambioAsistencias();
  }
}

function iniciarRealtimeAttendance() {

  supabaseClient
    .channel("rt-attendance")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "attendance" },
      async () => {
        await reconstruirAsistenciasHoy();
      }
    )
    .subscribe(() => {
      console.log("[ATTENDANCE] Realtime activo");
    });
}

function cierreDiaISODesdeTS(ts) {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;

  const cierreLocal = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    23, 59, 59, 999
  );

  return cierreLocal.toISOString();
}

function yaSeEjecutoAutoCierreHoy() {
  return localStorage.getItem(AUTO_CIERRE_LAST_OK_KEY) === hoy();
}

function marcarAutoCierreHoy() {
  localStorage.setItem(AUTO_CIERRE_LAST_OK_KEY, hoy());
}

function msHastaProximoAutoCierre() {
  const ahora = new Date();
  const proximo = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1,
    0, 0, AUTO_CIERRE_SEGUNDO, 0
  );
  return Math.max(1000, proximo.getTime() - ahora.getTime());
}

function programarAutoCierreDiario() {
  if (autoCierreTimer) clearTimeout(autoCierreTimer);

  const esperaMs = msHastaProximoAutoCierre();
  autoCierreTimer = setTimeout(async () => {
    await ejecutarAutoCierreConControl({ force: true, motivo: "scheduler_00_00" });
    programarAutoCierreDiario();
  }, esperaMs);
}

async function ejecutarAutoCierreConControl({ force = false, motivo = "manual" } = {}) {
  if (autoCierreEnProceso) return false;
  if (!force && yaSeEjecutoAutoCierreHoy()) return true;

  autoCierreEnProceso = true;
  try {
    const ok = await autocerrarAsistenciasPendientes();
    if (ok) {
      marcarAutoCierreHoy();
      console.info(`[AUTO-CIERRE] Ejecutado (${motivo})`);
      await reconstruirAsistenciasHoy();
    }
    return ok;
  } finally {
    autoCierreEnProceso = false;
  }
}

async function autocerrarAsistenciasPendientes() {
  if (!navigator.onLine || !window.supabaseClient) return false;

  const { inicioISO } = rangoHoyISO();

  const { data, error } = await supabaseClient
    .from("attendance")
    .select("id, uid, created_at, type, cliente_id")
    .lt("created_at", inicioISO)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[AUTO-CIERRE] Error leyendo attendance:", error);
    return false;
  }

  const abiertas = {};

  for (const ev of data || []) {
    const key = ev.cliente_id || ev.uid;
    if (!abiertas[key]) abiertas[key] = [];

    if (ev.type === "entrada") {
      abiertas[key].push(ev);
      continue;
    }

    if (ev.type === "salida") {
      if (abiertas[key].length > 0) {
        abiertas[key].pop();
      }
    }
  }

  const pendientes = Object.values(abiertas).flat();
  const cierres = pendientes.map(entrada => ({
    id: crypto.randomUUID(),
    uid: entrada.uid,
    created_at: cierreDiaISODesdeTS(new Date(entrada.created_at).getTime()),
    type: "salida",
    source: "auto_cierre",
    device_id: "sistema_nocturno",
    cliente_id: entrada.cliente_id
  })).filter(x => !!x.created_at);

  if (!cierres.length) {
    console.info("[AUTO-CIERRE] Sin asistencias pendientes por cerrar");
    return true;
  }

  const { error: insertError } = await supabaseClient
    .from("attendance")
    .insert(cierres);

  if (insertError) {
    console.error("[AUTO-CIERRE] Error insertando cierres:", insertError);
    return false;
  }

  console.info(`[AUTO-CIERRE] Cierres automaticos generados: ${cierres.length}`);
  return true;
}

/* ======================================================
   ===== INIT GLOBAL
====================================================== */

window.addEventListener("load", () => {
  logEstadoSupabase();
  programarAutoCierreDiario();

  if (navigator.onLine) {
    cargarProductosIniciales();
    cargarClientesIniciales();
    iniciarRealtime();
    iniciarRealtimeClientes();

    iniciarRealtimeAttendance();
    ejecutarAutoCierreConControl({ force: false, motivo: "load" });
  }
});

window.addEventListener("online", () => {
  console.info("[APP] Conexion restablecida");
  logEstadoSupabase();
  ejecutarAutoCierreConControl({ force: false, motivo: "online" });
});

window.addEventListener("offline", () => {
  console.warn("[APP] Sin conexion a internet");
});

/* ======================================================
   ===== HISTORIAL STOCK (NO TOCAR) =====================
====================================================== */
function generarFolioStock() {
  const baseFecha = hoy().replace(/-/g, "");
  const sufijo = Date.now().toString(36).toUpperCase().slice(-4);
  return `STK-${baseFecha}-${sufijo}`;
}

function generarFolioVenta() {
  const baseFecha = hoy().replace(/-/g, "");
  const sufijo = Date.now().toString(36).toUpperCase().slice(-4);
  return `VTA-${baseFecha}-${sufijo}`;
}

async function pushHistorialStock(cambios, meta = {}) {
  try {
    const folio = String(meta.folio || generarFolioStock()).trim().toUpperCase();
    const referencia = String(meta.referencia || "").trim().slice(0, 120);
    const tipoEvento = String(meta.tipo || "edicion_manual").trim();
    const cambiosConMeta = (Array.isArray(cambios) ? cambios : []).map(c => ({
      ...c,
      _folio: folio,
      _referencia: referencia,
      _tipo_evento: tipoEvento
    }));

    const payload = {
      id: crypto.randomUUID(),
      fecha: hoy(),
      hora: horaActual(),
      usuario: "Admin",
      rol: "admin",
      cambios: cambiosConMeta,
      ts: Date.now()
    };

    const { error } = await supabaseClient
      .from("historial_stock")
      .insert(payload);

    if (error) {
      console.error("[STOCK] Error historial stock:", error);
    } else {
      console.log("[STOCK] Historial stock guardado");
    }

  } catch (e) {
    console.error("[STOCK] Error pushHistorialStock:", e);
  }
}

function guardarVentaLocal(payload) {
  try {
    const key = "historial_ventas_local";
    const actual = safeGet(key);
    const idx = actual.findIndex(v => v.id === payload.id);
    if (idx >= 0) actual[idx] = { ...actual[idx], ...payload };
    else actual.push(payload);
    safeSet(key, actual);
  } catch (e) {
    console.error("[VENTAS] Error guardando historial local:", e);
  }
}

async function pushHistorialVenta(venta, meta = {}) {
  try {
    const folio = String(meta.folio || generarFolioVenta()).trim().toUpperCase();
    const referencia = String(meta.referencia || "").trim().slice(0, 120);

    const payload = {
      id: crypto.randomUUID(),
      fecha: hoy(),
      hora: horaActual(),
      usuario: "Admin",
      rol: "admin",
      folio,
      referencia,
      total: Number(venta?.total) || 0,
      pago: Number(venta?.pago) || 0,
      cambio: Number(venta?.cambio) || 0,
      items: Array.isArray(venta?.items) ? venta.items : [],
      ts: Date.now()
    };

    // Offline-first real: siempre persiste local antes de remoto.
    guardarVentaLocal({ ...payload, synced: false });

    const { error } = await supabaseClient
      .from("historial_ventas")
      .insert(payload);

    if (error) {
      console.error("[VENTAS] Error historial ventas remoto:", error);
      return false;
    }

    guardarVentaLocal({ ...payload, synced: true });
    return true;
  } catch (e) {
    console.error("[VENTAS] Error pushHistorialVenta:", e);
    return false;
  }
}

function payloadClienteBaseInsert(cliente) {
  return {
    id: cliente.id,
    nombre: cliente.nombre,
    tarjeta_uid: normalizarUID(cliente.tarjetaUID),
    fecha_registro: cliente.fechaRegistro ?? hoy(),
    membresia_expira: cliente.membresiaExpira ?? null
  };
}

function payloadClienteBaseUpdate(cliente) {
  return {
    nombre: cliente.nombre,
    tarjeta_uid: normalizarUID(cliente.tarjetaUID),
    fecha_registro: cliente.fechaRegistro ?? hoy(),
    membresia_expira: cliente.membresiaExpira ?? null
  };
}

function payloadClienteExtendidoInsert(cliente) {
  return {
    ...payloadClienteBaseInsert(cliente),
    telefono: cliente.telefono ?? null,
    peso: cliente.peso === "" ? null : (cliente.peso ?? null),
    altura: cliente.altura === "" ? null : (cliente.altura ?? null)
  };
}

function payloadClienteExtendidoUpdate(cliente) {
  return {
    ...payloadClienteBaseUpdate(cliente),
    telefono: cliente.telefono ?? null,
    peso: cliente.peso === "" ? null : (cliente.peso ?? null),
    altura: cliente.altura === "" ? null : (cliente.altura ?? null)
  };
}

function esErrorCamposOpcionalesCliente(error) {
  const raw = [
    error?.message || "",
    error?.details || "",
    error?.hint || "",
    error?.code || ""
  ].join(" ").toLowerCase();

  return /(telefono|peso|altura)/.test(raw) &&
    /(column|schema cache|could not find|does not exist|pgrst)/.test(raw);
}

async function insertarClienteSupabase(cliente) {
  if (!navigator.onLine || !window.supabaseClient) return;

  let { error } = await supabaseClient
    .from("clientes")
    .insert(payloadClienteExtendidoInsert(cliente));

  if (error && esErrorCamposOpcionalesCliente(error)) {
    console.warn("[CLIENTES] Columnas opcionales no disponibles, insertando en modo compatible");

    const retry = await supabaseClient
      .from("clientes")
      .insert(payloadClienteBaseInsert(cliente));

    error = retry.error;
  }

  if (error) {
    console.error("[CLIENTES] Error insertar cliente:", error);
  } else {
    console.log("[CLIENTES] Cliente insertado en Supabase");
  }
}

async function actualizarClienteSupabase(cliente) {
  if (!navigator.onLine || !window.supabaseClient) return;

  let { error } = await supabaseClient
    .from("clientes")
    .update(payloadClienteExtendidoUpdate(cliente))
    .eq("id", cliente.id);

  if (error && esErrorCamposOpcionalesCliente(error)) {
    console.warn("[CLIENTES] Columnas opcionales no disponibles, actualizando en modo compatible");

    const retry = await supabaseClient
      .from("clientes")
      .update(payloadClienteBaseUpdate(cliente))
      .eq("id", cliente.id);

    error = retry.error;
  }

  if (error) {
    console.error("[CLIENTES] Error actualizar cliente:", error);
  }
}
async function borrarClienteSupabase(id) {
  if (!navigator.onLine || !window.supabaseClient) return;

  const { error } = await supabaseClient
    .from("clientes")
    .delete()
    .eq("id", id);   // borrar por id real

  if (error) {
    console.error("[CLIENTES] Error borrando en Supabase:", error);
  } else {
    console.log("[CLIENTES] Cliente borrado en Supabase");
  }
}

async function migrarUIDEnAttendance(uidAnterior, uidNuevo) {
  if (!navigator.onLine || !window.supabaseClient) return;
  if (!uidAnterior || !uidNuevo || uidAnterior === uidNuevo) return;

  const { error } = await supabaseClient
    .from("attendance")
    .update({ uid: uidNuevo })
    .eq("uid", uidAnterior);

  if (error) {
    console.error("[ATTENDANCE] Error migrando UID:", error);
  } else {
    console.info(`[ATTENDANCE] UID migrado ${uidAnterior} -> ${uidNuevo}`);
  }
}


