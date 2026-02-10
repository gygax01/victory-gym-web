/* ======================================================
   ===== SUPABASE REALTIME (FINAL CORRECTO) ============
====================================================== */

const SUPABASE_URL = "https://pdzfnmrkxfyzhusmkljt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkemZubXJreGZ5emh1c21rbGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTQ2MTcsImV4cCI6MjA4NTk5MDYxN30.juvLQ83pjdckK1MqkKu0JsFjtpcTPNfEwG65op_5YEI";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

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

  guardarProductos(data || []);
  bc.postMessage("productos");
}

/* ================= UPDATE STOCK (CLAVE) ================= */
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

/* ================= INSERT / DELETE ================= */
async function insertarProducto(prod) {
  await supabaseClient.from("productos").insert(prod);
}

async function borrarProducto(id) {
  await supabaseClient.from("productos").delete().eq("id", id);
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
        let productos = obtenerProductos();

        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const i = productos.findIndex(p => p.id === payload.new.id);
          if (i >= 0) productos[i] = payload.new;
          else productos.push(payload.new);
        }

        if (payload.eventType === "DELETE") {
          productos = productos.filter(p => p.id !== payload.old.id);
        }

        guardarProductos(productos);
        bc.postMessage("productos");
      }
    )
    .subscribe();
}

/* ================= INIT ================= */
window.addEventListener("load", () => {
  if (navigator.onLine) {
    cargarProductosIniciales();
    iniciarRealtime();
  }
});
