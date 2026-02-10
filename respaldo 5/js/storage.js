/* ======================================================
   ===== STORAGE OFFLINE FIRST (SOURCE OF TRUTH) =====
====================================================== */

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

function registrarProducto(prod) {
  enqueueOffline({
    tabla: "productos",
    accion: "upsert",
    data: prod
  });
}

function eliminarProductoLocal(id) {
  enqueueOffline({
    tabla: "productos",
    accion: "delete",
    data: { id }
  });
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
  cola.push({ ...evento, ts: Date.now() });
  guardarColaOffline(cola);
}
