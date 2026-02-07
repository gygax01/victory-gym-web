/* ===============================
   ===== ASISTENCIAS GYM =====
=============================== */

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
      typeof a.nombre === "string" &&
      typeof a.entrada === "string"
    )
    .forEach(a => {
      const tr = document.createElement("tr");

      const tdNombre = document.createElement("td");
      tdNombre.textContent = a.nombre;

      const tdEntrada = document.createElement("td");
      tdEntrada.textContent = a.entrada;

      const tdSalida = document.createElement("td");
      tdSalida.textContent = a.salida ?? "-";

      tr.append(tdNombre, tdEntrada, tdSalida);
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


