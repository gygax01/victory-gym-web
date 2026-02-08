/* ===============================
   ===== AUTH + SESIÓN =====
=============================== */

const ROLE_PERMISSIONS = {
  employee: { clients_create: true },
  admin: { clients_create: true },
  superadmin: { system_all: true }
};

function login(usuario, password, delay = 0) {
  const empleados = obtenerEmpleados();

  const emp = empleados.find(e => e.usuario === usuario);
  if (!emp) return "NO_USER";

  if (emp.password !== password) return "BAD_PASS";

  setTimeout(() => iniciarSesion(emp), delay);
  return "OK";
}

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

function verificarSesion() {
  const params = new URLSearchParams(window.location.search);
  const modoRegistro = params.get("modo") === "registro";
  const pagina = location.pathname.split("/").pop();

  if (pagina === "usuarios.html" && modoRegistro) return true;

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

function can(permission) {
  const s = obtenerSesion();
  if (!s || !s.permisos) return false;
  if (s.permisos.system_all) return true;
  return s.permisos[permission] === true;
}

function logout() {
  localStorage.removeItem("session");
  location.href = "login.html";
}
