const ROLE_PERMISSIONS = {
  employee: { clients_create: true },
  admin: { clients_create: true },
  superadmin: { system_all: true }
};

function login(usuario, password, delay = 0) {
  const emp = obtenerEmpleados().find(
    e => e.usuario === usuario && e.password === password
  );
  if (!emp) {
    alert("Credenciales incorrectas");
    return;
  }
  setTimeout(() => iniciarSesion(emp), delay);
}

function iniciarSesion(emp) {
  const permisos = emp.rol === "superadmin"
    ? { system_all: true }
    : ROLE_PERMISSIONS[emp.rol];

  localStorage.setItem("session", JSON.stringify({
    usuario: emp.usuario,
    rol: emp.rol,
    permisos
  }));

  location.href = "index.html";
}

function verificarSesion() {
  if (!localStorage.getItem("session")) {
    location.href = "login.html";
    return false;
  }
  return true;
}

function obtenerSesion() {
  return JSON.parse(localStorage.getItem("session"));
}

function can(permission) {
  const s = obtenerSesion();
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

function logout() {
  localStorage.removeItem("session");
  location.href = "login.html";
}
