(function initAppConfig(global) {
  if (global.APP_CONFIG) return;

  const rawConfig = {
    syncChannel: "victory-data",
    precios: {
      visita: 60,
      membresiaMensual: 399
    },
    membresias: {
      diasPorMes: 30,
      planesMeses: [1, 2, 3]
    },
    tiposEvento: {
      visita: "visita",
      suscripcion: "suscripcion_mensual"
    },
    referencias: {
      visita: "VISITA_DIARIA",
      suscripcionAlta: "SUSCRIPCION_MENSUAL",
      suscripcionRenovacion: "SUSCRIPCION_MENSUAL_RENOVACION"
    }
  };

  function freezeDeep(value) {
    if (!value || typeof value !== "object") return value;
    Object.getOwnPropertyNames(value).forEach(key => freezeDeep(value[key]));
    return Object.freeze(value);
  }

  const config = freezeDeep(rawConfig);

  function toNumberSafe(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  global.APP_CONFIG = config;

  global.getPrecioVisita = function getPrecioVisita() {
    return toNumberSafe(config.precios.visita, 0);
  };

  global.getPrecioMembresiaMensual = function getPrecioMembresiaMensual() {
    return toNumberSafe(config.precios.membresiaMensual, 0);
  };

  global.getMembresiaDias = function getMembresiaDias(meses) {
    const mesesInt = Math.max(0, Math.floor(toNumberSafe(meses, 0)));
    return mesesInt * toNumberSafe(config.membresias.diasPorMes, 30);
  };

  global.getMembresiaTotal = function getMembresiaTotal(meses) {
    const mesesInt = Math.max(0, Math.floor(toNumberSafe(meses, 0)));
    return Number((mesesInt * getPrecioMembresiaMensual()).toFixed(2));
  };

  global.getPlanesMembresia = function getPlanesMembresia() {
    return [...(config.membresias.planesMeses || [])];
  };

  global.broadcastVictory = function broadcastVictory(topic) {
    try {
      const ch = new BroadcastChannel(config.syncChannel);
      ch.postMessage(topic);
      ch.close();
    } catch (error) {
      console.warn("[CONFIG] broadcastVictory error:", error);
    }
  };
})(window);
