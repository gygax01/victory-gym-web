/* ===============================
   ===== ASISTENCIAS GYM =====
   =============================== */

/* ===== CARGAR TABLA ===== */
function cargarAsistencias() {
  const asistencias = obtenerAsistencias();
  const hoyFecha = hoy();

  const tbody = document.getElementById("tabla-asistencias");
  if (!tbody) return;

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

      tr.innerHTML = `
        <td>${a.nombre}</td>
        <td>${a.entrada}</td>
        <td>${a.salida ?? "-"}</td>
      `;

      tbody.appendChild(tr);
    });
}

/* ===== CONTADOR AFORO ===== */
function actualizarContador() {
  const hoyFecha = hoy();

  const asistencias = obtenerAsistencias();
  if (!Array.isArray(asistencias)) return;

  const dentro = asistencias.filter(a =>
    a &&
    a.fecha === hoyFecha &&
    a.salida === null
  ).length;

  const el = document.getElementById("contadorAforo");
  if (el) el.innerText = `👥 Dentro: ${dentro}`;
}
