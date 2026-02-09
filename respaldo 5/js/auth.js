/* ======================================================
   ===== AUTH + SESIÓN (OFFLINE + REALTIME READY) =====
====================================================== */

const PUBLIC_PAGES = ["login.html", "usuarios.html"];

function esPaginaPublica() {
  return PUBLIC_PAGES.some(p => location.pathname.endsWith(p));
}

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
  broadcastAuth({ type: "login", session });
  location.href = "index.html";
}

/* ======================================================
   ===== SESIÓN =====
====================================================== */
function verificarSesion() {
  if (esPaginaPublica()) return true;

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

/* ======================================================
   ===== LOGOUT =====
====================================================== */
function logout() {
  localStorage.removeItem("session");
  broadcastAuth({ type: "logout" });
  location.href = "login.html";
}

/* ======================================================
   ===== REALTIME AUTH =====
====================================================== */
const AUTH_CHANNEL = new BroadcastChannel("victory-auth");

function broadcastAuth(data) {
  AUTH_CHANNEL.postMessage(data);
}

AUTH_CHANNEL.onmessage = e => {
  if (esPaginaPublica()) return;

  const { type } = e.data || {};

  if (type === "logout") {
    localStorage.removeItem("session");
    location.href = "login.html";
  }

  if (type === "login") {
    localStorage.setItem("session", JSON.stringify(e.data.session));
  }
};

/* ======================================================
   ===== STORAGE SYNC =====
====================================================== */
window.addEventListener("storage", e => {
  if (esPaginaPublica()) return;
  if (e.key !== "session") return;

  const existeSesion = !!localStorage.getItem("session");
  if (!existeSesion) {
    location.href = "login.html";
  }
});
