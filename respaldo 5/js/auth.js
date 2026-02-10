/* ======================================================
   ===== AUTH + SESIÓN (OFFLINE + REALTIME READY) =====
====================================================== */

const PUBLIC_PAGES = ["login.html", "usuarios.html"];

/* ======================================================
   ===== UTILIDADES =====
====================================================== */
function esPaginaPublica() {
  return PUBLIC_PAGES.some(p => location.pathname.endsWith(p));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("session"));
  } catch {
    return null;
  }
}

/* ======================================================
   ===== SEED SUPERADMIN (CRÍTICO) =====
====================================================== */
function seedSuperAdmin() {
  let empleados = [];

  try {
    empleados = JSON.parse(localStorage.getItem("empleados")) || [];
  } catch {
    empleados = [];
  }

  const existe = empleados.some(e => e.usuario === "gygax");

  if (!existe) {
    empleados.push({
      id: "superadmin-gygax",
      nombre: "Gygax",
      usuario: "gygax",
      password: "superadmin",
      rol: "superadmin"
    });

    localStorage.setItem("empleados", JSON.stringify(empleados));
    console.log("🟢 Superadmin sembrado automáticamente");
  }
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

  const s = getSession();
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
  const s = getSession();
  if (!s) return false;

  if (s.rol === "superadmin") return true;
  return ROLE_PERMISSIONS[s.rol]?.[permission] === true;
}

function applyPermissions() {
  document.querySelectorAll("[data-permission]").forEach(el => {
    const permiso = el.dataset.permission;
    el.style.display =
      can("system_all") || can(permiso) ? "" : "none";
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

  if (type === "login" && session) {
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

  if (!localStorage.getItem("session")) {
    location.href = "login.html";
  }
});

/* ======================================================
   ===== INIT GLOBAL =====
====================================================== */
window.addEventListener("load", () => {
  seedSuperAdmin();     // 🔐 CRÍTICO
  verificarSesion();    // 🔎
  applyPermissions();   // 🎛️
});
