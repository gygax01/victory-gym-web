/* ======================================================
   ===== ASISTENCIAS GYM (COMPATIBLE STORAGE NUEVO) =====
====================================================== */

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

})();

/* ======================================================
   ===== UTILIDADES ===============================
====================================================== */

/**
 * Devuelve timestamp seguro para ordenar
 */
function obtenerTimestampSeguro(a) {
  if (typeof a.entrada_ts === "number") return a.entrada_ts;
  return 0;
}

/**
 * Formatea hora desde timestamp
 */
function formatearHoraTS(ts) {
  if (!ts || typeof ts !== "number") return "-";

  return new Date(ts).toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

/* ======================================================
   ===== CARGAR TABLA ===================================
====================================================== */

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
    .sort((a, b) =>
      obtenerTimestampSeguro(b) - obtenerTimestampSeguro(a)
    )
    .forEach(a => {

      const tr = document.createElement("tr");

      const tdNombre = document.createElement("td");
      tdNombre.textContent = a.nombre;

      const tdEntrada = document.createElement("td");
      tdEntrada.textContent = formatearHoraTS(a.entrada_ts);

      const tdSalida = document.createElement("td");
      tdSalida.textContent = formatearHoraTS(a.salida_ts);

      tr.append(tdNombre, tdEntrada, tdSalida);
      tbody.appendChild(tr);
    });
}

/* ======================================================
   ===== CONTADOR AFORO ================================
====================================================== */

function actualizarContador() {

  const asistencias = obtenerAsistencias();
  const hoyFecha = hoy();

  if (!Array.isArray(asistencias)) return;

  const dentro = asistencias.filter(a =>
    a &&
    a.fecha === hoyFecha &&
    typeof a.entrada_ts === "number" &&
    !a.salida_ts
  ).length;

  const contador = document.getElementById("contadorAforo");
  if (!contador) return;

  const strong = contador.querySelector("strong");
  if (strong) {
    strong.textContent = dentro;
  } else {
    contador.textContent = `Dentro: ${dentro}`;
  }
}

/* ======================================================
   ===== NOTIFICADOR GLOBAL =============================
====================================================== */

function notificarCambioAsistencias() {
  new BroadcastChannel("victory-data").postMessage("asistencias");
}
