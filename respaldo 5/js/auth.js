/* ======================================================
   ===== AUTH + SESIÓN (OFFLINE FIRST) =====
====================================================== */

const PUBLIC_PAGES = ["login.html", "usuarios.html"];

/* ================= UTIL ================= */
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

/* ================= SUPERADMIN SEED ================= */
function seedSuperAdmin() {
  let empleados = [];

  try {
    empleados = JSON.parse(localStorage.getItem("empleados")) || [];
  } catch {
    empleados = [];
  }

  if (!empleados.some(e => e.usuario === "gygax")) {
    empleados.push({
      id: "superadmin-gygax",
      nombre: "Gygax",
      usuario: "gygax",
      password: "superadmin",
      rol: "superadmin"
    });

    localStorage.setItem("empleados", JSON.stringify(empleados));
    console.log("🟢 Superadmin creado");
  }
}

/* ================= PERMISOS ================= */
///////

/* ================= LOGIN ================= */
function login(usuario, password) {
  const empleados = obtenerEmpleados();
  const emp = empleados.find(e => e.usuario === usuario);

  if (!emp) return "NO_USER";
  if (emp.password !== password) return "BAD_PASS";

  iniciarSesion(emp);
  return "OK";
}

/* ================= SESIÓN ================= */
function iniciarSesion(emp) {
  const session = {
    id: emp.id,
    nombre: emp.nombre,
    usuario: emp.usuario,
    rol: emp.rol
  };

  localStorage.setItem("session", JSON.stringify(session));
  location.href = "index.html";
}

function logout() {
  localStorage.removeItem("session");
  location.href = "login.html";
}

/* ================= GUARDIA ================= */
function verificarSesion() {
  return true;
}


/* ================= INIT ================= */
//

/* ================= MASTER PASSWORD ================= */
const MASTER_PASSWORD = "victory(profitness)";

function validarPasswordMaestra(input) {
  return input === MASTER_PASSWORD;
}

