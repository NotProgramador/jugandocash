import { create } from "zustand";

// Normaliza sueños desde personajes.json -> [{ nombre, costo, cumplido }]
function mapSuenos(input) {
  if (!Array.isArray(input)) return [];
  return input.map((s) => ({
    nombre: typeof s === "string" ? s : s?.nombre ?? "Sueño",
    costo: typeof s === "string" ? 0 : Number(s?.costo ?? 0),
    cumplido: false,
  }));
}

/**
 * outcomes: [{ delta: number, p: number }, ...]  // p suma ~1
 */
function pickOutcome(outcomes) {
  if (!Array.isArray(outcomes) || outcomes.length === 0) return 0;
  const r = Math.random();
  let acc = 0;
  for (const o of outcomes) {
    acc += Number(o?.p ?? 0);
    if (r <= acc) return Number(o?.delta ?? 0);
  }
  // fallback: último
  return Number(outcomes[outcomes.length - 1]?.delta ?? 0);
}

function uid() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return String(Date.now()) + "_" + Math.random().toString(16).slice(2);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function initialBaseline() {
  return {
    dineroInicial: 5000,
    deudaInicial: 2000,
    saludInicial: 100,
    suenosTotal: 0,
  };
}

function initialMeta() {
  return {
    mesActual: 1,
    mesesObjetivo: 24,
    finMotivo: null, // "salud" | "dinero" | "tiempo" | "checkpoint_24" | null
    terminado: false,
  };
}

function initialStats() {
  return {
    pagosDeudaCount: 0,
    pagosDeudaTotal: 0,

    pagosMinimoCount: 0,
    pagosMinimoTotal: 0,

    interesTotal: 0,

    inversionesCount: 0,
    inversionesTotalInvertido: 0,
    inversionesNeto: 0,

    saludGanada: 0,
    saludPerdida: 0,

    // opcional (si luego etiquetas gastos/impulsos)
    gastoImpulsivoCount: 0,
    gastoImpulsivoTotal: 0,
  };
}

export const useGameStore = create((set, get) => ({
  // Estado base
  dinero: 5000,
  deuda: 2000,
  salud: 100,
  sueldo: 0,

  sueños: [],
  inversiones: [], // legacy opcional
  inversionesPendientes: [], // se resuelven en otro mes
  invResults: [], // resultados listos para mostrar/aplicar

  baseline: initialBaseline(),
  meta: initialMeta(),
  stats: initialStats(),

  // --- Meta helpers (opcional) ---
  setMesActual: (mes) =>
    set((s) => ({ meta: { ...s.meta, mesActual: Number(mes || 1) } })),

  setMesesObjetivo: (meses) =>
    set((s) => ({ meta: { ...s.meta, mesesObjetivo: Number(meses || 24) } })),

  setFinJuego: (motivo) =>
    set((s) => ({ meta: { ...s.meta, finMotivo: motivo || null, terminado: true } })),

  // --- Setup personaje ---
  setValoresIniciales: (personaje) =>
    set(() => {
      const dineroInicial = Number(personaje?.ahorros ?? 0);
      const deudaInicial = Number(personaje?.deuda ?? 0);
      const suenos = mapSuenos(
        personaje?.suenos || personaje?.["Sueños (y costo)"] || []
      );

      return {
        dinero: dineroInicial,
        deuda: deudaInicial,
        salud: 100,
        sueldo: Number(personaje?.ingresos ?? 0),

        sueños: suenos,
        inversiones: [],
        inversionesPendientes: [],
        invResults: [],

        baseline: {
          dineroInicial,
          deudaInicial,
          saludInicial: 100,
          suenosTotal: suenos.length,
        },

        meta: initialMeta(),
        stats: initialStats(),
      };
    }),

  // --- Dinero / deuda / salud ---
  actualizarDinero: (monto) =>
    set((s) => ({ dinero: Math.max(0, s.dinero + Number(monto || 0)) })),

  actualizarDeuda: (monto) =>
    set((s) => ({ deuda: Math.max(0, s.deuda + Number(monto || 0)) })),

  actualizarSalud: (monto) =>
    set((s) => {
      const delta = Number(monto || 0);
      const saludNueva = clamp(s.salud + delta, 0, 100);
      const stats = { ...s.stats };
      if (delta > 0) stats.saludGanada += delta;
      if (delta < 0) stats.saludPerdida += Math.abs(delta);
      return { salud: saludNueva, stats };
    }),

  // Pago “correcto”: no más de lo que tienes ni más de lo que debes
  pagarDeuda: (deseado) => {
    const { dinero, deuda } = get();
    const d = Number(deseado || 0);
    const pago = Math.max(0, Math.min(d, dinero, deuda));
    if (pago <= 0) return 0;

    set((s) => ({
      dinero: Math.max(0, s.dinero - pago),
      deuda: Math.max(0, s.deuda - pago),
      stats: {
        ...s.stats,
        pagosDeudaCount: s.stats.pagosDeudaCount + 1,
        pagosDeudaTotal: s.stats.pagosDeudaTotal + pago,
      },
    }));
    return pago;
  },

  // --- Deuda viva: pago mínimo + interés ---
  calcularPagoMinimo: () => {
    const { deuda } = get();
    if (deuda <= 0) return 0;
    const min = Math.max(Math.round(deuda * 0.05), 200); // 5% o $200
    return Math.min(min, deuda);
  },

  cobrarPagoMinimo: () => {
    const { dinero } = get();
    const minimo = get().calcularPagoMinimo();
    if (minimo <= 0) return { ok: true, pagoMin: 0 };

    if (dinero < minimo) return { ok: false, pagoMin: minimo };

    set((s) => ({
      dinero: Math.max(0, s.dinero - minimo),
      deuda: Math.max(0, s.deuda - minimo),
      stats: {
        ...s.stats,
        pagosMinimoCount: s.stats.pagosMinimoCount + 1,
        pagosMinimoTotal: s.stats.pagosMinimoTotal + minimo,
      },
    }));
    return { ok: true, pagoMin: minimo };
  },

  aplicarInteres: (tasa = 0.02) => {
    const { deuda } = get();
    if (deuda <= 0) return 0;

    const t = Number(tasa || 0);
    const nuevo = Math.round(deuda * (1 + t));
    const delta = nuevo - deuda;

    set((s) => ({
      deuda: nuevo,
      stats: { ...s.stats, interesTotal: s.stats.interesTotal + delta },
    }));

    return delta;
  },

  // --- Sueños ---
  cumplirSueño: (nombre) =>
    set((s) => ({
      sueños: (s.sueños || []).map((x) =>
        x.nombre === nombre ? { ...x, cumplido: true } : x
      ),
    })),

  // --- Ahorro / cartera (opcional) ---
  invertirAhorro: (monto) =>
    set((s) => {
      const m = Number(monto || 0);
      if (m <= 0) return s;
      if (s.dinero < m) return s;
      return {
        ...s,
        dinero: Math.max(0, s.dinero - m),
        inversiones: [...(s.inversiones || []), { tipo: "ahorro", monto: m }],
      };
    }),

  agregarInversiones: (lista) =>
    set((s) => ({
      inversiones: [
        ...(s.inversiones || []),
        ...(Array.isArray(lista) ? lista : []),
      ],
    })),

  // --- Inversiones diferidas ---
  agendarInversion: ({ nombre, costo, resolveAt, outcomes }) =>
    set((s) => {
      const c = Number(costo || 0);
      if (c <= 0) return s;
      if (s.dinero < c) return s;

      const inv = {
        id: uid(),
        nombre: nombre || "Inversión",
        costo: c,
        resolveAt: Number(resolveAt || 1),
        outcomes: Array.isArray(outcomes) ? outcomes : [{ delta: 0, p: 1 }],
      };

      return {
        ...s,
        dinero: Math.max(0, s.dinero - c),
        inversionesPendientes: [...(s.inversionesPendientes || []), inv],
        stats: {
          ...s.stats,
          inversionesCount: s.stats.inversionesCount + 1,
          inversionesTotalInvertido: s.stats.inversionesTotalInvertido + c,
        },
      };
    }),

  // Llamar al INICIO de un mes: mueve inversiones vencidas a invResults (sin aplicar dinero)
  tomarResultadosInversion: (mesActual) =>
    set((s) => {
      const m = Number(mesActual || 1);
      const pendientes = s.inversionesPendientes || [];

      const due = pendientes.filter((i) => Number(i.resolveAt) === m);
      const rest = pendientes.filter((i) => Number(i.resolveAt) !== m);

      const results = due.map((inv) => ({
        id: inv.id,
        nombre: inv.nombre,
        delta: pickOutcome(inv.outcomes),
      }));

      return {
        ...s,
        inversionesPendientes: rest,
        invResults: [...(s.invResults || []), ...results],
      };
    }),

  // Recomendado: usar esto desde CardPortafolioReview para que quede registrado el neto
  aplicarInvResults: () => {
    const { invResults } = get();
    if (!invResults?.length) return 0;

    const total = invResults.reduce(
      (acc, r) => acc + Number(r?.delta || 0),
      0
    );

    set((s) => ({
      dinero: Math.max(0, s.dinero + total),
      invResults: [],
      stats: { ...s.stats, inversionesNeto: s.stats.inversionesNeto + total },
    }));

    return total;
  },

  limpiarInvResults: () => set(() => ({ invResults: [] })),

  // --- Reiniciar ---
  reiniciar: () =>
    set(() => ({
      dinero: 5000,
      deuda: 2000,
      salud: 100,
      sueldo: 0,

      sueños: [],
      inversiones: [],
      inversionesPendientes: [],
      invResults: [],

      baseline: initialBaseline(),
      meta: initialMeta(),
      stats: initialStats(),
    })),
}));
