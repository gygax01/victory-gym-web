<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Stock</title>
<link rel="stylesheet" href="css/styles.css">
</head>

<body>

<header class="header-brand">
  <div class="brand">
    <img src="img/logo.png" alt="Victory Pro Fitness">
    <h2>Stock</h2>
  </div>
  <button onclick="location.href='index.html'">← Inicio</button>
</header>

<!-- ===== NUEVO PRODUCTO ===== -->
<div class="card stock-nuevo" data-permission="products_create">
  <h3>Nuevo producto</h3>
  <div class="stock-form">
    <input id="inputNombre" placeholder="Nombre">
    <input id="inputPrecio" type="number" min="0" step="0.01" placeholder="Precio">
    <input id="inputStock" type="number" min="0" step="1" placeholder="Stock inicial">
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

<!-- ===== JS BASE ===== -->
<script src="js/storage.js"></script>
<script src="js/auth.js"></script>

<script>
const inputNombre = document.getElementById("inputNombre");
const inputPrecio = document.getElementById("inputPrecio");
const inputStock = document.getElementById("inputStock");
const btnAgregar = document.getElementById("btnAgregar");
const buscadorStock = document.getElementById("buscadorStock");
const listaStock = document.getElementById("listaStock");
const btnGuardar = document.getElementById("btnGuardar");

let productos = [];
let productosFiltrados = [];

window.addEventListener("load", initStock);

function initStock() {
  if (!verificarSesion()) return;
  if (!requirePermission("stock_view")) return;

  btnAgregar?.addEventListener("click", nuevoProducto);
  btnGuardar?.addEventListener("click", guardarStock);
  buscadorStock.addEventListener("input", filtrarStock);

  cargarStock();
  applyPermissions();
}

function cargarStock() {
  productos = obtenerProductos().filter(p => p && p.nombre);
  productosFiltrados = [...productos];
  renderStock();
}

function renderStock() {
  listaStock.innerHTML = "";

  if (!productosFiltrados.length) {
    listaStock.innerHTML = "<p>No hay productos</p>";
    return;
  }

  productosFiltrados.forEach(p => {
    const card = document.createElement("div");
    card.className = "stock-card";

    const nombre = document.createElement("h4");
    nombre.textContent = p.nombre;

    const precio = document.createElement("div");
    precio.textContent = "$" + Number(p.precio).toFixed(2);

    const stock = document.createElement("div");
    stock.textContent = "Stock: " + p.stock;

    const btnMas1 = document.createElement("button");
    btnMas1.textContent = "+1";
    btnMas1.setAttribute("data-permission", "stock_add");
    btnMas1.onclick = () => modificarStock(p, 1);

    const btnMas10 = document.createElement("button");
    btnMas10.textContent = "+10";
    btnMas10.setAttribute("data-permission", "stock_add");
    btnMas10.onclick = () => modificarStock(p, 10);

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.setAttribute("data-permission", "stock_delete");
    btnEliminar.onclick = () => eliminarProducto(p);

    card.append(nombre, precio, stock, btnMas1, btnMas10, btnEliminar);
    listaStock.appendChild(card);
  });

  applyPermissions();
}

function modificarStock(p, cant) {
  if (!can("stock_add")) return;
  p.stock += cant;
  renderStock();
}

function eliminarProducto(p) {
  if (!can("stock_delete")) return;
  productos = productos.filter(x => x !== p);
  guardarStock();
}

function guardarStock() {
  if (!can("stock_add")) return;
  guardarProductos(productos);
}

function nuevoProducto() {
  if (!can("products_create")) return;

  productos.push({
    nombre: inputNombre.value,
    precio: Number(inputPrecio.value),
    stock: Number(inputStock.value)
  });

  inputNombre.value = "";
  inputPrecio.value = "";
  inputStock.value = "";

  guardarStock();
}

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
