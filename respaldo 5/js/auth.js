/* ===============================
   ===== AUTH + PERMISSIONS =====
   =============================== */

/*
  ROLES:
  - employee
  - admin
  - superadmin
*/

/* ===== PERMISOS POR ROL ===== */
const ROLE_PERMISSIONS = {
  employee: {
    clients_view: true,
    clients_create: true,
    clients_edit: true,

    attendances_register: true,
    attendances_view: true,

    memberships_view: true,
    memberships_extend: true,

    stock_view: true,
    stock_add: true,

    products_view: true,
    products_create: true,

    sales_do: true,
    sales_view: true
  },

  admin: {
    clients_view: true,
    clients_create: true,
    clients_edit: true,
    clients_delete: true,

    attendances_register: true,
    attendances_view: true,
    attendances_close_manual: true,

    memberships_view: true,
    memberships_extend: true,
    memberships_reduce: true,
    memberships_edit_manual: true,

    stock_view: true,
    stock_add: true,
    stock_reduce_manual: true,
    stock_delete: true,

    products_view: true,
    products_create: true,
    products_edit: true,
    products_delete: true,

    sales_do: true,
    sales_view: true,
    sales_cancel: true,
    sales_totals: true,

    employees_view: true,
    employees_create: true,
    employees_edit: true,
    employees_delete: true
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

  const emp = empleados.find(
    e => e.usuario === usuario && e.password === password
  );

  if (!emp) {
    alert("Credenciales incorrectas");
    return false;
  }

  delay
    ? setTimeout(() => iniciarSesion(emp), delay)
    : iniciarSesion(emp);

  return true;
}

/* ===============================
   ===== INICIAR SESIÓN =====
   =============================== */
function iniciarSesion(emp) {
  const rol = emp.rol;

  const permisos =
    rol === "superadmin"
      ? { system_all: true }
      : { ...ROLE_PERMISSIONS[rol] };

  localStorage.setItem(
    "session",
    JSON.stringify({
      usuario: emp.usuario,
      rol,
      permisos
    })
  );

  location.href = "index.html";
}

/* ===============================
   ===== SESIÓN =====
   =============================== */
function verificarSesion() {
  // 🔒 FIX: solo redirige si realmente se invoca esta función
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
  if (s.permisos.system_all) return true;
  return s.permisos[permission] === true;
}

/*
  🔥 FIX CRÍTICO
  - NO lanza errores
  - NO rompe JS
*/
function requirePermission(permission) {
  if (!can(permission)) {
    alert("Acceso no autorizado");
    return false;
  }
  return true;
}

/* ===============================
   ===== BLOQUEO POR ROL =====
   =============================== */
function requireRole(roles) {
  const s = obtenerSesion();
  if (!s || !roles.includes(s.rol)) {
    alert("Acceso no autorizado");
    location.href = "login.html";
    return false;
  }
  return true;
}

/* ===============================
   ===== UI =====
   =============================== */
function applyPermissions() {
  document.querySelectorAll("[data-permission]").forEach(el => {
    if (!can(el.dataset.permission)) {
      el.remove();
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
