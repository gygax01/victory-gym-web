/* ===============================
   ===== AUTH + SESIÓN =====
=============================== */

/*
  employee:
    - clientes: ver, crear
    - stock: ver, agregar
    - productos: crear
    - ventas
    - membresías: ver
    - historial: ver

  admin:
    - clientes: ver, crear, eliminar
    - stock: ver, agregar, eliminar
    - productos: crear
    - ventas
    - membresías: ver, extender
    - historial: ver

  superadmin:
    - acceso total
*/

const ROLE_PERMISSIONS = {
  employee: {
    // clientes
    clients_view: true,
    clients_create: true,

    // stock
    stock_view: true,
    stock_add: true,          // ✅ puede aumentar stock

    // productos
    products_create: true,    // ✅ puede crear producto

    // ventas
    sales_do: true,

    // membresías
    memberships_view: true,

    // historial
    history_view: true
  },

  admin: {
    // clientes
    clients_view: true,
    clients_create: true,
    clients_delete: true,

    // stock
    stock_view: true,
    stock_add: true,
    stock_delete: true,

    // productos
    products_create: true,

    // ventas
    sales_do: true,

    // membresías
    memberships_view: true,
    memberships_extend: true,

    // historial
    history_view: true
  },

  superadmin: {
    system_all: true
  }
};

/* ===============================
   ===== LOGIN =====
=============================== */
function login(usuario, password, delay = 0) {
  const empleados = obtenerEmpleados();
  const emp = empleados.find(e => e.usuario === usuario);

  if (!emp) return "NO_USER";
  if (emp.password !== password) return "BAD_PASS";

  setTimeout(() => iniciarSesion(emp), delay);
  return "OK";
}

/* ===============================
   ===== INICIAR SESIÓN =====
=============================== */
function iniciarSesion(emp) {
  const permisos =
    emp.rol === "superadmin"
      ? { system_all: true }
      : { ...(ROLE_PERMISSIONS[emp.rol] || {}) };

  localStorage.setItem(
    "session",
    JSON.stringify({
      usuario: emp.usuario,
      rol: emp.rol,
      permisos
    })
  );

  location.href = "index.html";
}

/* ===============================
   ===== SESIÓN =====
=============================== */
function verificarSesion() {
  if (!localStorage.getItem("session")) {
    location.href = "login.html";
    return false;
  }
  return true;
}

function obtenerSesion() {
  try {
    return JSON.parse(localStorage.getItem("session"));
  } catch {
    return null;
  }
}

/* ===============================
   ===== PERMISOS =====
=============================== */
function can(permission) {
  const s = obtenerSesion();
  if (!s || !s.permisos) return false;

  // superadmin = todo
  if (s.permisos.system_all) return true;

  return s.permisos[permission] === true;
}

/*
  Para proteger páginas completas
*/
function requirePermission(permission) {
  if (!can(permission)) {
    location.href = "index.html";
    return false;
  }
  return true;
}

/* ===============================
   ===== UI: APLICAR PERMISOS =====
=============================== */
function applyPermissions() {
  document.querySelectorAll("[data-permission]").forEach(el => {
    const permiso = el.dataset.permission;

    if (can("system_all") || can(permiso)) {
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });
}

/* ===============================
   ===== LOGOUT =====
=============================== */
function logout() {
  localStorage.removeItem("session");
  location.href = "login.html";
}
