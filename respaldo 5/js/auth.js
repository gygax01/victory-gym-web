/* ======================================================
   ===== MODO SIN LOGIN (COMPATIBILIDAD) ================
====================================================== */

function esPaginaPublica() {
  return true;
}

function getSession() {
  return null;
}

function seedSuperAdmin() {}

function login() {
  location.href = "index.html";
  return "OK";
}

function iniciarSesion() {
  location.href = "index.html";
}

function logout() {
  location.href = "index.html";
}

function verificarSesion() {
  return true;
}

function validarPasswordMaestra() {
  return true;
}
