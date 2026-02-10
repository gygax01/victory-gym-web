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
    stock_view: true
  },
  admin: {
    stock_view: true,
    stock_add: true,
    stock_delete: true,
    products_create: true
  },
  superadmin: {
    system_all: true
  }
};

/* ======================================================
   ===== SESIÓN =====
====================================================== */
function verificarSesion() {
  if (esPaginaPublica()) return true;

  const s = localStorage.getItem("session");
  if (!s) {
    location.href = "login.html";
    return false;
  }
  return true;
}

/* ======================================================
   ===== PERMISOS =====
====================================================== */
function can(permission) {
  const s = JSON.parse(localStorage.getItem("session") || "null");
  if (!s) return false;

  if (s.rol === "superadmin") return true;
  return ROLE_PERMISSIONS[s.rol]?.[permission] === true;
}

function applyPermissions() {
  document.querySelectorAll("[data-permission]").forEach(el => {
    const perm = el.dataset.permission;
    el.style.display =
      can("system_all") || can(perm) ? "" : "none";
  });
}

/* ======================================================
   ===== LOGIN / LOGOUT =====
====================================================== */
function iniciarSesion(emp) {
  const session = {
    id: emp.id,
    nombre: emp.nombre,
    rol: emp.rol
  };

  localStorage.setItem("session", JSON.stringify(session));
  broadcastAuth({ type: "login", session });

  location.href = "index.html";
}

function logout() {
  localStorage.removeItem("session");
  broadcastAuth({ type: "logout" });
  location.href = "login.html";
}

/* ======================================================
   ===== REALTIME AUTH (MULTI TAB / DEVICE) =====
====================================================== */
const AUTH_CHANNEL = new BroadcastChannel("victory-auth");

function broadcastAuth(data) {
  AUTH_CHANNEL.postMessage(data);
}

AUTH_CHANNEL.onmessage = e => {
  if (esPaginaPublica()) return;
  const { type, session } = e.data || {};

  if (type === "logout") {
    localStorage.removeItem("session");
    location.href = "login.html";
  }

  if (type === "login") {
    localStorage.setItem("session", JSON.stringify(session));
    applyPermissions();
  }
};

/* ======================================================
   ===== STORAGE SYNC (SEGURIDAD) =====
====================================================== */
window.addEventListener("storage", e => {
  if (esPaginaPublica()) return;
  if (e.key !== "session") return;

  const existeSesion = !!localStorage.getItem("session");
  if (!existeSesion) {
    location.href = "login.html";
  }
});
