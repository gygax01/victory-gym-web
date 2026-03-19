(function initIngresosModule(global) {
  if (
    global.registrarVentaGeneral &&
    global.registrarVisitaIngreso &&
    global.registrarSuscripcionIngreso &&
    global.registrarReasignacionTarjetaIngreso
  ) {
    return;
  }

  function toNumberSafe(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function money(value) {
    return Number(toNumberSafe(value, 0).toFixed(2));
  }

  function normalizeString(value, fallback = "") {
    const out = String(value ?? "").trim();
    return out || fallback;
  }

  function shortRef(value, max = 120) {
    return normalizeString(value).slice(0, max);
  }

  function calcCambio(total, pago, cambioManual) {
    const manual = Number(cambioManual);
    if (Number.isFinite(manual)) return money(manual);
    const diff = money(pago - total);
    return diff > 0 ? diff : 0;
  }

  function cfg() {
    return global.APP_CONFIG || {
      tiposEvento: {
        visita: "visita",
        suscripcion: "suscripcion_mensual",
        reasignacionTarjeta: "reasignacion_tarjeta"
      },
      referencias: {
        visita: "VISITA_DIARIA",
        suscripcionAlta: "SUSCRIPCION_MENSUAL",
        suscripcionRenovacion: "SUSCRIPCION_MENSUAL_RENOVACION",
        reasignacionTarjeta: "REASIGNACION_TARJETA"
      }
    };
  }

  async function enviarVenta(venta, meta = {}) {
    if (typeof global.pushHistorialVenta !== "function") {
      return false;
    }

    const ok = await global.pushHistorialVenta(venta, meta);

    if (typeof global.broadcastVictory === "function") {
      global.broadcastVictory("historial_ventas");
    }

    return ok !== false;
  }

  global.registrarVentaGeneral = async function registrarVentaGeneral(input = {}) {
    const items = Array.isArray(input.items) ? input.items : [];
    const total = money(input.total);
    const pago = money(input.pago ?? total);
    const cambio = calcCambio(total, pago, input.cambio);

    const venta = {
      total,
      pago,
      cambio,
      items
    };

    const meta = {
      referencia: shortRef(input.referencia || "")
    };

    if (input.folio) {
      meta.folio = shortRef(input.folio || "", 50);
    }

    return enviarVenta(venta, meta);
  };

  global.registrarVisitaIngreso = async function registrarVisitaIngreso(input = {}) {
    const eventType = cfg().tiposEvento?.visita || "visita";
    const total = money(input.total ?? (typeof global.getPrecioVisita === "function" ? global.getPrecioVisita() : 60));
    const pago = money(input.pago ?? total);
    const cambio = calcCambio(total, pago, input.cambio);

    const venta = {
      total,
      pago,
      cambio,
      items: [{
        producto_id: null,
        nombre: normalizeString(input.nombre, "Visita diaria"),
        cantidad: 1,
        precio_unitario: total,
        subtotal: total,
        tipo_evento: eventType
      }]
    };

    const referencia = shortRef(
      input.referencia || cfg().referencias?.visita || "VISITA_DIARIA"
    );

    return enviarVenta(venta, { referencia });
  };

  global.registrarSuscripcionIngreso = async function registrarSuscripcionIngreso(input = {}) {
    const eventType = cfg().tiposEvento?.suscripcion || "suscripcion_mensual";
    const meses = Math.max(1, Math.floor(toNumberSafe(input.meses, 1)));

    const totalDefault = (typeof global.getMembresiaTotal === "function")
      ? global.getMembresiaTotal(meses)
      : money(meses * 399);
    const total = money(input.total ?? totalDefault);
    const pago = money(input.pago ?? total);
    const cambio = calcCambio(total, pago, input.cambio);

    const precioMensual = (typeof global.getPrecioMembresiaMensual === "function")
      ? global.getPrecioMembresiaMensual()
      : money(total / meses);

    const etiqueta = meses === 1 ? "mes" : "meses";
    const cliente = input.cliente || {};

    const referenciaBase = input.referenciaBase || (
      input.renovacion
        ? cfg().referencias?.suscripcionRenovacion
        : cfg().referencias?.suscripcionAlta
    ) || "SUSCRIPCION_MENSUAL";

    const referencia = shortRef(
      input.referencia || `${referenciaBase}_${meses}M_${normalizeString(cliente?.nombre, "CLIENTE").slice(0, 46)}`
    );

    const venta = {
      total,
      pago,
      cambio,
      items: [{
        producto_id: null,
        nombre: normalizeString(input.nombre, `Suscripción ${meses} ${etiqueta}`),
        cantidad: meses,
        precio_unitario: money(precioMensual),
        subtotal: total,
        tipo_evento: eventType,
        cliente_id: cliente?.id || null,
        cliente_nombre: normalizeString(cliente?.nombre, "Cliente")
      }]
    };

    return enviarVenta(venta, { referencia });
  };

  global.registrarReasignacionTarjetaIngreso = async function registrarReasignacionTarjetaIngreso(input = {}) {
    const eventType = cfg().tiposEvento?.reasignacionTarjeta || "reasignacion_tarjeta";
    const precioDefault = (typeof global.getPrecioReasignacionTarjeta === "function")
      ? global.getPrecioReasignacionTarjeta()
      : 50;

    const total = money(input.total ?? precioDefault);
    const pago = money(input.pago ?? total);
    const cambio = calcCambio(total, pago, input.cambio);
    const cliente = input.cliente || {};

    const referencia = shortRef(
      input.referencia ||
      `${cfg().referencias?.reasignacionTarjeta || "REASIGNACION_TARJETA"}_${normalizeString(cliente?.nombre, "CLIENTE").slice(0, 46)}`
    );

    const venta = {
      total,
      pago,
      cambio,
      items: [{
        producto_id: null,
        nombre: normalizeString(input.nombre, "Reasignación de tarjeta"),
        cantidad: 1,
        precio_unitario: total,
        subtotal: total,
        tipo_evento: eventType,
        cliente_id: cliente?.id || null,
        cliente_nombre: normalizeString(cliente?.nombre, "Cliente"),
        uid_anterior: normalizeString(input.uidAnterior),
        uid_nuevo: normalizeString(input.uidNuevo)
      }]
    };

    return enviarVenta(venta, { referencia });
  };
})(window);
