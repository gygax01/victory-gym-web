/* ======================================================
   ===== SUPABASE REALTIME (STOCK + CLIENTES) ===========
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

window.supabaseClient = supabaseClient;

const bc = new BroadcastChannel("victory-data");
let realtimeChannel = null;

/* ======================================================
   ===== PRODUCTOS (NO TOCAR) ===========================
====================================================== */

async function cargarProductosIniciales() {
  const { data, error } = await supabaseClient
    .from("productos")
    .select("*");

  if (error) {
    console.error("❌ Error carga inicial:", error);
    return;
  }

  localStorage.setItem("productos", JSON.stringify(data || []));
  bc.postMessage("productos");
  console.log("✅ Productos iniciales:", data.length);
}

async function actualizarStockSupabase(id, nuevoStock) {
  const { error } = await supabaseClient
    .from("productos")
    .update({ stock: nuevoStock })
    .eq("id", id);

  if (error) {
    console.error("❌ Error update stock:", error);
    return false;
  }
  return true;
}

async function insertarProductoSupabase(prod) {
  const { error } = await supabaseClient
    .from("productos")
    .insert(prod);

  if (error) console.error("❌ Error insert:", error);
}

async function borrarProductoSupabase(id) {
  const { error } = await supabaseClient
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) console.error("❌ Error delete:", error);
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
      console.log("✅ Realtime productos activo");
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
    console.error("❌ Error carga clientes:", error);
    return;
  }

  const clientesNormalizados = (data || []).map(c => ({
    id: c.id,
    nombre: c.nombre,
    tarjetaUID: c.tarjeta_uid,
    fechaRegistro: c.fecha_registro,
    membresiaExpira: c.membresia_expira
  }));

  localStorage.setItem("clientes", JSON.stringify(clientesNormalizados));
  bc.postMessage("clientes");

  console.log("✅ Clientes cargados:", clientesNormalizados.length);
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
            tarjetaUID: payload.new.tarjeta_uid,
            fechaRegistro: payload.new.fecha_registro,
            membresiaExpira: payload.new.membresia_expira
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
      console.log("📡 Realtime clientes activo");
    });
}

/* ======================================================
   ===== NUEVO: REALTIME ATTENDANCE (MODELO EVENTOS)
====================================================== */

async function reconstruirAsistenciasHoy() {

  const hoyFecha = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseClient
    .from("attendance")
    .select("*")
    .gte("created_at", hoyFecha + "T00:00:00")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Error cargar attendance:", error);
    return;
  }

  const clientes = JSON.parse(localStorage.getItem("clientes") || "[]");

  const sesiones = {};
  const resultado = [];

  for (const e of data) {

    if (!sesiones[e.uid]) {
      sesiones[e.uid] = [];
    }

    sesiones[e.uid].push(e);
  }

  Object.keys(sesiones).forEach(uid => {

    const eventos = sesiones[uid];
    let entradaActiva = null;

    eventos.forEach(ev => {

      if (ev.type === "entrada") {
        entradaActiva = {
          id: ev.id,
          tarjetaUID: uid,
          nombre: clientes.find(c => c.tarjetaUID === uid)?.nombre || uid,
          fecha: hoyFecha,
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
      console.log("📡 Realtime attendance activo");
    });
}

/* ======================================================
   ===== INIT GLOBAL
====================================================== */

window.addEventListener("load", () => {
  if (navigator.onLine) {
    cargarProductosIniciales();
    cargarClientesIniciales();
    iniciarRealtime();
    iniciarRealtimeClientes();

    iniciarRealtimeAttendance();
    reconstruirAsistenciasHoy();
  }
});

/* ======================================================
   ===== HISTORIAL STOCK (NO TOCAR) =====================
====================================================== */

async function pushHistorialStock(cambios) {
  try {
    const session = JSON.parse(localStorage.getItem("session"));
    if (!session) return;

    const now = new Date();

    const payload = {
      id: crypto.randomUUID(),
      fecha: now.toISOString().slice(0, 10),
      hora: now.toTimeString().slice(0, 8),
      usuario: session.nombre,
      rol: session.rol,
      cambios: cambios,
      ts: Date.now()
    };

    const { error } = await supabaseClient
      .from("historial_stock")
      .insert(payload);

    if (error) {
      console.error("❌ Error historial stock:", error);
    } else {
      console.log("📝 Historial stock guardado");
    }

  } catch (e) {
    console.error("❌ Error pushHistorialStock:", e);
  }
}

async function insertarClienteSupabase(cliente) {
  if (!navigator.onLine || !window.supabaseClient) return;

  const payload = {
    id: cliente.id,
    nombre: cliente.nombre,
    tarjeta_uid: cliente.tarjetaUID,
    fecha_registro: cliente.fechaRegistro ?? hoy(),
    membresia_expira: cliente.membresiaExpira ?? null
  };

  const { error } = await supabaseClient
    .from("clientes")
    .insert(payload);

  if (error) {
    console.error("❌ Error insertar cliente:", error);
  } else {
    console.log("☁️ Cliente insertado en Supabase");
  }
}

async function actualizarClienteSupabase(cliente) {
  if (!navigator.onLine || !window.supabaseClient) return;

  const { error } = await supabaseClient
    .from("clientes")
    .update({
      nombre: cliente.nombre,
      tarjeta_uid: cliente.tarjetaUID,
      fecha_registro: cliente.fechaRegistro,
      membresia_expira: cliente.membresiaExpira
    })
    .eq("id", cliente.id);

  if (error) {
    console.error("❌ Error actualizar cliente:", error);
  }
}
