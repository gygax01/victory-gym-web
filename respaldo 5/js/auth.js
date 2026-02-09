/* ======================================================
   ===== AUTH + SESIÓN (OFFLINE + REALTIME READY) =====
====================================================== */

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

/* ======================================================
   ===== PERMISOS POR ROL =====
====================================================== */
const ROLE_PERMISSIONS = {
  employee: {
    clients_view: true,
    clients_create: true,

    stock_view: true,
    stock_add: true,

    products_create: true,

    sales_do: true,

    memberships_view: true,

    history_view: true
  },

  admin: {
    clients_view: true,
    clients_create: true,
    clients_delete: true,

    stock_view: true,
    stock_add: true,
    stock_delete: true,

    products_create: true,

    sales_do: true,

    memberships_view: true,
    memberships_extend: true,

    history_view: true
  },

  superadmin: {
    system_all: true
  }
};

/* ======================================================
   ===== LOGIN =====
====================================================== */
function login(usuario, password, delay = 0) {
  const empleados = obtenerEmpleados();
  const emp = empleados.find(e => e.usuario === usuario);

  if (!emp) return "NO_USER";
  if (emp.password !== password) return "BAD_PASS";

  setTimeout(() => iniciarSesion(emp), delay);
  return "OK";
}

/* ======================================================
   ===== INICIAR SESIÓN =====
====================================================== */
function iniciarSesion(emp) {
  const permisos =
    emp.rol === "superadmin"
      ? { system_all: true }
      : { ...(ROLE_PERMISSIONS[emp.rol] || {}) };

  const session = {
    usuario: emp.usuario,
    rol: emp.rol,
    permisos,
    ts: Date.now()
  };

  localStorage.setItem("session", JSON.stringify(session));

  // 🔥 notifica a otras pestañas
  broadcastAuth({ type: "login", session });

  location.href = "index.html";
}

/* ======================================================
   ===== SESIÓN =====
====================================================== */
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

/* ======================================================
   ===== PERMISOS =====
====================================================== */
function can(permission) {
  const s = obtenerSesion();
  if (!s || !s.permisos) return false;

  if (s.permisos.system_all) return true;

  return s.permisos[permission] === true;
}

/*
  Protección de páginas completas
*/
function requirePermission(permission) {
  if (!can(permission)) {
    location.href = "index.html";
    return false;
  }
  return true;
}

/* ======================================================
   ===== UI: APLICAR PERMISOS =====
====================================================== */
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

/* ======================================================
   ===== LOGOUT =====
====================================================== */
function logout() {
  localStorage.removeItem("session");

  // 🔥 logout global
  broadcastAuth({ type: "logout" });

  location.href = "login.html";
}

/* ======================================================
   ===== REALTIME: SINCRONIZACIÓN ENTRE PESTAÑAS =====
====================================================== */
const AUTH_CHANNEL = new BroadcastChannel("victory-auth");

function broadcastAuth(data) {
  AUTH_CHANNEL.postMessage(data);
}

AUTH_CHANNEL.onmessage = e => {
  const { type } = e.data || {};

  if (type === "logout") {
    localStorage.removeItem("session");
    location.href = "login.html";
  }

  if (type === "login") {
    localStorage.setItem("session", JSON.stringify(e.data.session));
    applyPermissions();
  }
};

/* ======================================================
   ===== CAMBIOS EXTERNOS (localStorage) =====
====================================================== */
window.addEventListener("storage", e => {
  if (e.key === "session" && !e.newValue) {
    location.href = "login.html";
  }
});
