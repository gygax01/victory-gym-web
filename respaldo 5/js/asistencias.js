/* ======================================================
   ===== ASISTENCIAS GYM (SYNC + TS COMPATIBLE) =========
   ====================================================== */

/* ===============================
   ===== INIT GLOBAL =====
=============================== */
(function initAsistenciasSync() {

  const bc = new BroadcastChannel("victory-data");

  bc.onmessage = e => {
    if (e.data === "asistencias") {
      cargarAsistencias();
      actualizarContador();
    }
  };

  window.addEventListener("storage", e => {
    if (e.key === "asistencias") {
      cargarAsistencias();
      actualizarContador();
    }
  });

  window.addEventListener("online", () => {
    if (typeof syncOfflineQueue === "function") {
      syncOfflineQueue();
    }
    cargarAsistencias();
    actualizarContador();
  });

})();

/* ===============================
   ===== UTILIDADES INTERNAS =====
=============================== */

const APP_TZ = localStorage.getItem("APP_TIMEZONE") || "America/Mexico_City";

function obtenerTimestampSeguro(a) {
  if (a.entrada_ts) return a.entrada_ts;

  if (a.entrada && a.fecha) {
    return new Date(`${a.fecha}T${a.entrada}`).getTime();
  }

  return 0;
}

function formatearHora(a, tipo) {
  if (tipo === "entrada") {
    if (a.entrada_ts) {
      return new Date(a.entrada_ts).toLocaleTimeString("es-MX", {
        timeZone: APP_TZ,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
    return a.entrada || "-";
  }

  if (tipo === "salida") {
    if (a.salida_ts) {
      return new Date(a.salida_ts).toLocaleTimeString("es-MX", {
        timeZone: APP_TZ,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }
    return a.salida || "-";
  }

  return "-";
}

/* ===============================
   ===== CARGAR TABLA =====
=============================== */
function cargarAsistencias() {

  const asistencias = obtenerAsistencias();
  const hoyFecha = hoy();

  const tbody = document.getElementById("tablaAsistencias");
  if (!tbody || !Array.isArray(asistencias)) return;

  tbody.innerHTML = "";

  asistencias
    .filter(a =>
      a &&
      a.fecha === hoyFecha &&
      typeof a.nombre === "string"
    )
    .sort((a, b) => obtenerTimestampSeguro(b) - obtenerTimestampSeguro(a))
    .forEach(a => {

      const tr = document.createElement("tr");

      const tdNombre = document.createElement("td");
      tdNombre.textContent = a.nombre;

      const tdEntrada = document.createElement("td");
      tdEntrada.textContent = formatearHora(a, "entrada");

      const tdSalida = document.createElement("td");
      tdSalida.textContent = formatearHora(a, "salida");

      tr.append(tdNombre, tdEntrada, tdSalida);
      tbody.appendChild(tr);
    });
}

/* ===============================
   ===== CONTADOR AFORO =====
=============================== */
function actualizarContador() {

  const asistencias = obtenerAsistencias();
  const hoyFecha = hoy();

  if (!Array.isArray(asistencias)) return;

  const dentro = asistencias.filter(a =>
    a &&
    a.fecha === hoyFecha &&
    (
      (a.entrada_ts && !a.salida_ts) ||
      (a.entrada && a.salida === null)
    )
  ).length;

  const contador = document.getElementById("contadorAforo");
  if (!contador) return;

  const strong = contador.querySelector("strong");
  if (strong) strong.textContent = dentro;
  else contador.textContent = `Dentro: ${dentro}`;
}

/* ===============================
   ===== NOTIFICADOR GLOBAL =====
=============================== */
function notificarCambioAsistencias() {
  new BroadcastChannel("victory-data").postMessage("asistencias");
}
