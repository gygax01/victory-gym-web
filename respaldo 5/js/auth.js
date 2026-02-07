/* ===============================
   ===== AUTH + PERMISSIONS =====
=============================== */

const ROLE_PERMISSIONS = {
  employee: {
    clients_view: true,
    clients_create: true
  },
  admin: {
    clients_view: true,
    clients_create: true,
    clients_delete: true,
    employees_create: true
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

  setTimeout(() => iniciarSesion(emp), delay);
  return true;
}

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
  if (!s) return false;
  if (s.permisos?.system_all) return true;
  return s.permisos?.[permission] === true;
}

/* 🔴 AQUÍ ESTABA EL PROBLEMA */
function requirePermission(permission) {
  if (!can(permission)) {
    alert("Acceso no autorizado");
    location.href = "index.html"; // ✅ REDIRECCIÓN
    return false;
  }
  return true;
}

/* ===============================
   ===== LOGOUT =====
=============================== */
function logout() {
  localStorage.removeItem("session");
  location.href = "login.html";
}
