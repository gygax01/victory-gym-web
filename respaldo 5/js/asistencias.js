/* ======================================================
   ===== ASISTENCIAS GYM (COMPATIBLE STORAGE + REALTIME) =====
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
   ===== UTILIDADES =====================================
====================================================== */

/**
 * Devuelve timestamp seguro (number)
 * Soporta number o ISO string
 */
function obtenerTimestampSeguro(a) {
  if (!a || !a.entrada_ts) return 0;

  if (typeof a.entrada_ts === "number") {
    return a.entrada_ts;
  }

  if (typeof a.entrada_ts === "string") {
    const t = new Date(a.entrada_ts).getTime();
    return isNaN(t) ? 0 : t;
  }

  return 0;
}

/**
 * Convierte timestamp (number o ISO) a hora formateada
 */
function formatearHoraTS(ts) {

  if (!ts) return "-";

  const h = horaDesdeTS(ts);
  return h || "-";
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

  const filasHoy = asistencias
    .filter(a =>
      a &&
      a.fecha === hoyFecha &&
      typeof a.nombre === "string"
    )
    .sort((a, b) =>
      obtenerTimestampSeguro(b) - obtenerTimestampSeguro(a)
    );

  if (!filasHoy.length) {
    const trVacio = document.createElement("tr");
    const tdVacio = document.createElement("td");
    tdVacio.colSpan = 3;
    tdVacio.className = "small muted";
    tdVacio.style.textAlign = "center";
    tdVacio.style.padding = "14px";
    tdVacio.textContent = "Sin asistencias registradas hoy";
    trVacio.appendChild(tdVacio);
    tbody.appendChild(trVacio);
    return;
  }

  filasHoy.forEach(a => {

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
   ===== CONTADOR AFORO =================================
====================================================== */

function actualizarContador() {

  const asistencias = obtenerAsistencias();
  const hoyFecha = hoy();

  if (!Array.isArray(asistencias)) return;

  const dentro = asistencias.filter(a =>
    a &&
    a.fecha === hoyFecha &&
    a.entrada_ts &&
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
