/* ======================================================
   ===== SUPABASE REALTIME (STOCK FINAL) ================
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_uV1OQab8AfWE3SzNkuleQw_W0xgyfER";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 👇 EXPONER GLOBAL (CLAVE PARA NFC)
window.supabaseClient = supabaseClient;

const bc = new BroadcastChannel("victory-data");
let realtimeChannel = null;

/* ================= CARGA INICIAL ================= */
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

/* ================= UPDATE STOCK ================= */
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

/* ================= INSERT ================= */
async function insertarProductoSupabase(prod) {
  const { error } = await supabaseClient
    .from("productos")
    .insert(prod);

  if (error) console.error("❌ Error insert:", error);
}

/* ================= DELETE ================= */
async function borrarProductoSupabase(id) {
  const { error } = await supabaseClient
    .from("productos")
    .delete()
    .eq("id", id);

  if (error) console.error("❌ Error delete:", error);
}

/* ================= REALTIME ================= */
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

/* ================= INIT ================= */
window.addEventListener("load", () => {
  if (navigator.onLine) {
    cargarProductosIniciales();
    iniciarRealtime();
  }
});

/* ======================================================
   ===== HISTORIAL STOCK (AUDITORÍA PRO) =================
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
