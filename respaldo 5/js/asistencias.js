/* ===============================
   ===== ASISTENCIAS GYM (PRO) =====
=============================== */

/* ===============================
   ===== INIT SYNC =====
=============================== */
(function initAsistenciasSync() {

  // 🔁 broadcast entre pestañas / dispositivos
  const bc = new BroadcastChannel("victory-data");

  bc.onmessage = e => {
    if (e.data === "asistencias") {
      cargarAsistencias();
      actualizarContador();
    }
  };

  // 🔁 cambios directos en localStorage
  window.addEventListener("storage", e => {
    if (e.key === "asistencias") {
      cargarAsistencias();
      actualizarContador();
    }
  });

  // 🌐 vuelve internet
  window.addEventListener("online", () => {
    syncOfflineQueue();
    cargarAsistencias();
    actualizarContador();
  });

})();

/* ===============================
   ===== CARGAR TABLA =====
=============================== */
function cargarAsistencias() {
  const asistencias = obtenerAsistencias();
  const hoyFecha = hoy();

  const tbody = document.getElementById("tablaAsistencias");
  if (!tbody || !Array.isArray(asistencias)) return;

  // 🔥 render limpio
  tbody.innerHTML = "";

  asistencias
    .filter(a =>
      a &&
      a.fecha === hoyFecha &&
      typeof a.nombre === "string"
    )
    .sort((a, b) => a.entrada.localeCompare(b.entrada))
    .forEach(a => {
      const tr = document.createElement("tr");

      const tdNombre = document.createElement("td");
      tdNombre.textContent = a.nombre;

      const tdEntrada = document.createElement("td");
      tdEntrada.textContent = a.entrada || "-";

      const tdSalida = document.createElement("td");
      tdSalida.textContent = a.salida || "-";

      tr.appendChild(tdNombre);
      tr.appendChild(tdEntrada);
      tr.appendChild(tdSalida);

      tbody.appendChild(tr);
    });
}

/* ===============================
   ===== CONTADOR AFORO =====
=============================== */
function actualizarContador() {
  const hoyFecha = hoy();
  const asistencias = obtenerAsistencias();

  if (!Array.isArray(asistencias)) return;

  const dentro = asistencias.filter(a =>
    a &&
    a.fecha === hoyFecha &&
    a.salida === null
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

/* ===============================
   ===== NOTIFICADOR GLOBAL =====
   (llamar cuando se modifica asistencia)
=============================== */
function notificarCambioAsistencias() {
  new BroadcastChannel("victory-data").postMessage("asistencias");
}
