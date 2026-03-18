(function initCorteUtils(global) {
  if (global.corteTotalVenta && global.corteConstruirDesglose) return;

  function toNumberSafe(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function itemsVenta(v) {
    return Array.isArray(v?.items) ? v.items : [];
  }

  function totalVenta(v) {
    const total = toNumberSafe(v?.total, 0);
    if (total > 0) return total;

    return itemsVenta(v).reduce((acc, item) => {
      const subtotal = toNumberSafe(item?.subtotal, 0);
      if (subtotal > 0) return acc + subtotal;
      return acc + (toNumberSafe(item?.precio_unitario, 0) * toNumberSafe(item?.cantidad, 0));
    }, 0);
  }

  function tipoIngreso(v) {
    const cfg = global.APP_CONFIG || {};
    const tipoSus = normalizeText(cfg?.tiposEvento?.suscripcion || "suscripcion_mensual");
    const tipoVisita = normalizeText(cfg?.tiposEvento?.visita || "visita");

    const ref = normalizeText(v?.referencia || "");
    const tags = itemsVenta(v).map(it => normalizeText(it?.tipo_evento || it?._tipo_evento || ""));
    const nombres = itemsVenta(v).map(it => normalizeText(it?.nombre || ""));

    const esSuscripcion =
      tags.includes(tipoSus) ||
      tags.includes("suscripcion_mensual") ||
      nombres.some(n => n.includes("suscripcion")) ||
      ref.includes("suscripcion_mensual") ||
      ref.includes("suscripcion");

    if (esSuscripcion) return "suscripcion";

    const esVisita =
      tags.includes(tipoVisita) ||
      tags.includes("visita") ||
      nombres.some(n => n.includes("visita")) ||
      ref.includes("visita");

    if (esVisita) return "visita";

    return "venta";
  }

  function construirDesglose(ventas) {
    const desglose = {
      suscripciones: [],
      visitas: [],
      ventas: [],
      totalSuscripciones: 0,
      totalVisitas: 0,
      totalVentas: 0,
      totalGeneral: 0
    };

    (Array.isArray(ventas) ? ventas : []).forEach(v => {
      const total = Number(totalVenta(v).toFixed(2));
      const item = {
        fecha: String(v?.fecha || "-"),
        hora: String(v?.hora || "-"),
        folio: String(v?.folio || "-"),
        referencia: String(v?.referencia || "Sin referencia"),
        total
      };

      const tipo = tipoIngreso(v);
      if (tipo === "suscripcion") {
        desglose.suscripciones.push(item);
        desglose.totalSuscripciones += total;
        return;
      }

      if (tipo === "visita") {
        desglose.visitas.push(item);
        desglose.totalVisitas += total;
        return;
      }

      desglose.ventas.push(item);
      desglose.totalVentas += total;
    });

    desglose.totalSuscripciones = Number(desglose.totalSuscripciones.toFixed(2));
    desglose.totalVisitas = Number(desglose.totalVisitas.toFixed(2));
    desglose.totalVentas = Number(desglose.totalVentas.toFixed(2));
    desglose.totalGeneral = Number(
      (desglose.totalSuscripciones + desglose.totalVisitas + desglose.totalVentas).toFixed(2)
    );

    return desglose;
  }

  global.corteNum = toNumberSafe;
  global.corteMoney = function corteMoney(v) {
    return `$${toNumberSafe(v, 0).toFixed(2)}`;
  };
  global.corteNormalizarTexto = normalizeText;
  global.corteItemsVenta = itemsVenta;
  global.corteTotalVenta = totalVenta;
  global.corteTipoIngreso = tipoIngreso;
  global.corteConstruirDesglose = construirDesglose;
})(window);
