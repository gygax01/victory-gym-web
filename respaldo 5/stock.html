<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Stock</title>
<link rel="stylesheet" href="css/styles.css">

<!-- Supabase (solo para realtime.js) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>

<body onload="initStock()">

<header class="header-brand">
  <div class="brand">
    <img src="img/logo.png">
    <h2>Stock</h2>
  </div>
  <button onclick="location.href='index.html'">← Inicio</button>
</header>

<!-- ===== NUEVO PRODUCTO ===== -->
<div class="card stock-nuevo" data-permission="products_create">
  <h3>Nuevo producto</h3>
  <div class="stock-form">
    <input id="inputNombre" placeholder="Nombre">
    <input id="inputPrecio" type="number" step="0.01" placeholder="Precio">
    <input id="inputStock" type="number" placeholder="Stock inicial">
    <button id="btnAgregar">Agregar</button>
  </div>
</div>

<!-- ===== BUSCADOR ===== -->
<div class="search-bar">
  <input id="buscadorStock" placeholder="Buscar...">
</div>

<!-- ===== LISTA ===== -->
<div class="stock-grid" id="listaStock"></div>

<!-- ===== FOOTER ===== -->
<div class="stock-footer" data-permission="stock_add">
  <button id="btnGuardar">💾 Guardar</button>
</div>

<!-- CORE -->
<script src="js/storage.js"></script>
<script src="js/auth.js"></script>
<script src="js/realtime.js"></script>

<script>
/* ================= DOM ================= */
const inputNombre = document.getElementById("inputNombre");
const inputPrecio = document.getElementById("inputPrecio");
const inputStock = document.getElementById("inputStock");
const btnAgregar = document.getElementById("btnAgregar");
const buscadorStock = document.getElementById("buscadorStock");
const listaStock = document.getElementById("listaStock");
const btnGuardar = document.getElementById("btnGuardar");

/* ================= ESTADO ================= */
let productos = [];
let productosFiltrados = [];

/* ================= INIT ================= */
function initStock() {
  if (typeof verificarSesion === "function" && !verificarSesion()) return;

  if (typeof can === "function" && !can("stock_view")) {
    location.href = "index.html";
    return;
  }

  btnAgregar.onclick = nuevoProducto;
  btnGuardar.onclick = guardarCambios;
  buscadorStock.oninput = filtrarStock;

  iniciarSyncStock();
  cargarStock();

  if (typeof applyPermissions === "function") {
    applyPermissions();
  }
}

/* ================= SYNC ================= */
function iniciarSyncStock() {
  const bc = new BroadcastChannel("victory-data");

  bc.onmessage = e => {
    if (e.data === "productos") cargarStock();
  };

  window.addEventListener("storage", e => {
    if (e.key === "productos") cargarStock();
  });
}

/* ================= CARGA ================= */
function cargarStock() {
  productos = obtenerProductos().filter(p => p && p.nombre);
  productosFiltrados = [...productos];
  renderStock();
}

/* ================= RENDER ================= */
function renderStock() {
  listaStock.innerHTML = "";

  if (!productosFiltrados.length) {
    listaStock.innerHTML = "<p>No hay productos</p>";
    return;
  }

  productosFiltrados.forEach(p => {
    const card = document.createElement("div");
    card.className = "stock-card";

    card.innerHTML = `
      <h4>${p.nombre}</h4>
      <div class="precio">$${Number(p.precio).toFixed(2)}</div>
      <div class="stock-cantidad">Stock: <span>${p.stock}</span></div>
      <div class="stock-botones">
        <button data-permission="stock_add">+1</button>
        <button data-permission="stock_add">+10</button>
        <button data-permission="stock_delete">Eliminar</button>
      </div>
    `;

    const [b1, b10, bDel] = card.querySelectorAll("button");

    b1.onclick = () => modificarStock(p, 1);
    b10.onclick = () => modificarStock(p, 10);
    bDel.onclick = () => eliminarProducto(p.id);

    listaStock.appendChild(card);
  });

  if (typeof applyPermissions === "function") {
    applyPermissions();
  }
}

/* ================= ACCIONES ================= */
function modificarStock(p, cant) {
  if (typeof can === "function" && !can("stock_add")) return;
  p.stock += cant;
  renderStock();
}

function eliminarProducto(id) {
  if (typeof can === "function" && !can("stock_delete")) return;

  productos = productos.filter(p => p.id !== id);
  eliminarProductoLocal(id);
  guardarCambios();
}

function nuevoProducto() {
  if (typeof can === "function" && !can("products_create")) return;
  if (!inputNombre.value || !inputPrecio.value) return;

  const prod = {
    id: crypto.randomUUID(),
    nombre: inputNombre.value.trim(),
    precio: Number(inputPrecio.value),
    stock: Number(inputStock.value) || 0
  };

  productos.push(prod);
  registrarProducto(prod);

  inputNombre.value = "";
  inputPrecio.value = "";
  inputStock.value = "";

  guardarCambios();
}

function guardarCambios() {
  safeSet("productos", productos);
  new BroadcastChannel("victory-data").postMessage("productos");
}

/* ================= FILTRO ================= */
function filtrarStock() {
  const q = buscadorStock.value.toLowerCase();
  productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(q)
  );
  renderStock();
}
</script>

</body>
</html>
