/* ===============================
   ===== AUTH + SESIÓN =====
=============================== */

const ROLE_PERMISSIONS = {
  employee: { clients_create: true },
  admin: { clients_create: true },
  superadmin: { system_all: true }
};

/* ===============================
   ===== LOGIN =====
=============================== */
function login(usuario, password, delay = 0) {
  const emp = obtenerEmpleados().find(
    e => e.usuario === usuario && e.password === password
  );

  if (!emp) {
    alert("Credenciales incorrectas");
    return false;
  }

  setTimeout(() => iniciarSesion(emp), delay);
  return true;
}

/* ===============================
   ===== INICIAR SESIÓN =====
=============================== */
function iniciarSesion(emp) {
  const permisos =
    emp.rol === "superadmin"
      ? { system_all: true }
      : (ROLE_PERMISSIONS[emp.rol] || {});

  localStorage.setItem("session", JSON.stringify({
    usuario: emp.usuario,
    rol: emp.rol,
    permisos
  }));

  location.href = "index.html";
}

/* ===============================
   ===== SESIÓN =====
=============================== */
function verificarSesion() {
  // ✅ PERMITIR REGISTRO SIN SESIÓN
  const params = new URLSearchParams(window.location.search);
  const modoRegistro = params.get("modo") === "registro";
  const pagina = location.pathname.split("/").pop();

  if (pagina === "usuarios.html" && modoRegistro) {
    return true; // 👈 CLAVE
  }

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

function requirePermission(permission) {
  if (!can(permission)) {
    alert("Acceso no autorizado");
    location.href = "index.html";
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
