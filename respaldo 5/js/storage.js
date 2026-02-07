/* ===============================
   ===== STORAGE BASE GYM (FINAL) =====
   =============================== */

/* ======================================================
   ===== EMPLEADOS =====
   ====================================================== */
function obtenerEmpleados() {
  try {
    return JSON.parse(localStorage.getItem("empleados")) || [];
  } catch {
    return [];
  }
}

function guardarEmpleados(lista) {
  localStorage.setItem("empleados", JSON.stringify(lista || []));
}

/* ======================================================
   ===== CLIENTES =====
   ====================================================== */
function obtenerClientes() {
  try {
    return JSON.parse(localStorage.getItem("clientes")) || [];
  } catch {
    return [];
  }
}

function guardarClientes(lista) {
  localStorage.setItem("clientes", JSON.stringify(lista || []));
}

/* ======================================================
   ===== ASISTENCIAS =====
   ====================================================== */
function obtenerAsistencias() {
  try {
    return JSON.parse(localStorage.getItem("asistencias")) || [];
  } catch {
    return [];
  }
}

function guardarAsistencias(lista) {
  localStorage.setItem("asistencias", JSON.stringify(lista || []));
}

/* ======================================================
   ===== PRODUCTOS =====
   ====================================================== */
function obtenerProductos() {
  try {
    return JSON.parse(localStorage.getItem("productos")) || [];
  } catch {
    return [];
  }
}

function guardarProductos(lista) {
  localStorage.setItem("productos", JSON.stringify(lista || []));
}

/* ======================================================
   ===== VENTAS =====
   ====================================================== */
function obtenerVentas() {
  try {
    return JSON.parse(localStorage.getItem("ventas")) || [];
  } catch {
    return [];
  }
}

function guardarVentas(lista) {
  localStorage.setItem("ventas", JSON.stringify(lista || []));
}

/* ======================================================
   ===== TARJETAS / PERSONAS =====
   ====================================================== */

/*
  Devuelve el empleado ACTIVO asociado a una tarjeta
*/
function buscarEmpleadoPorTarjeta(uid) {
  if (!uid) return null;

  return obtenerEmpleados().find(
    e => e.tarjetaUID && e.tarjetaUID === uid
  ) || null;
}

/*
  Devuelve el cliente asociado a una tarjeta
*/
function buscarClientePorTarjeta(uid) {
  if (!uid) return null;

  return obtenerClientes().find(
    c => c.tarjetaUID && c.tarjetaUID === uid
  ) || null;
}

/*
  Devuelve información completa de la tarjeta
*/
function obtenerInfoTarjeta(uid) {
  const emp = buscarEmpleadoPorTarjeta(uid);
  if (emp) {
    return { tipo: "empleado", persona: emp };
  }

  const cli = buscarClientePorTarjeta(uid);
  if (cli) {
    return { tipo: "cliente", persona: cli };
  }

  return { tipo: null, persona: null };
}

/*
  Indica si la tarjeta está asignada actualmente
*/
function uidYaRegistrada(uid) {
  return obtenerInfoTarjeta(uid).tipo !== null;
}

/*
  Libera una tarjeta (empleado o cliente eliminado)
*/
function liberarTarjeta(uid) {
  if (!uid) return;

  const empleados = obtenerEmpleados().map(e => {
    if (e.tarjetaUID === uid) {
      delete e.tarjetaUID;
    }
    return e;
  });

  const clientes = obtenerClientes().map(c => {
    if (c.tarjetaUID === uid) {
      delete c.tarjetaUID;
    }
    return c;
  });

  guardarEmpleados(empleados);
  guardarClientes(clientes);
}

/* ======================================================
   ===== FECHAS / HORAS =====
   ====================================================== */
function hoy() {
  return new Date().toISOString().split("T")[0];
}

function horaActual() {
  return new Date().toLocaleTimeString("es-MX", {
    hour12: false
  });
}
