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

export const useGameStore = create((set) => ({
  // Estado inicial (se sobre-escribe al elegir personaje)
  dinero: 5000,
  deuda: 2000,
  salud: 100,
  sueldo: 0,
  inversiones: [],
  sueños: [],
  mes: 1,
  maxMeses: 24,
  extendido: false,
  gameStatus: "playing", // playing | checkpoint | finished | gameover
  endReason: "",

  // Al elegir personaje:
  setValoresIniciales: (personaje) =>
    set(() => ({
      dinero: personaje?.ahorros ?? 0,
      deuda: personaje?.deuda ?? 0,
      salud: 100,
      sueldo: personaje?.ingresos ?? 0,
      inversiones: [],
      sueños: mapSuenos(
        personaje?.suenos || personaje?.["Sueños (y costo)"] || []
      ),
    })),

  // Dinero
  actualizarDinero: (monto) =>
    set((state) => ({ dinero: Math.max(0, state.dinero + monto) })),

  // Deuda
  actualizarDeuda: (monto) =>
    set((state) => ({ deuda: Math.max(0, state.deuda + monto) })),

  // Salud (0–100)
  actualizarSalud: (monto) =>
    set((state) => ({
      salud: Math.max(0, Math.min(100, state.salud + monto)),
    })),

  // Inversiones: [{ tipo, monto }]
  agregarInversion: (inversion) =>
    set((state) => ({
      inversiones: [...state.inversiones, inversion],
      dinero: Math.max(0, state.dinero - (inversion?.monto ?? 0)),
    })),

  quitarInversion: (idx) =>
    set((state) => {
      const invs = [...state.inversiones];
      invs.splice(idx, 1);
      return { inversiones: invs };
    }),

  // Cumplir sueño
  cumplirSueño: (nombre) =>
    set((state) => ({
      sueños: state.sueños.map((s) =>
        s.nombre === nombre ? { ...s, cumplido: true } : s
      ),
    })),
    setGameStatus: (gameStatus, endReason = "") =>
  set(() => ({ gameStatus, endReason })),

checkDerrota: () => {
  const { dinero, salud } = get();
  if (salud <= 0) {
    set(() => ({ gameStatus: "gameover", endReason: "salud" }));
    return true;
  }
  if (dinero <= 0) {
    set(() => ({ gameStatus: "gameover", endReason: "dinero" }));
    return true;
  }
  return false;
},

endOfMonth: () =>
  set((s) => {
    if (s.gameStatus === "gameover") return s;

    // checkpoint al terminar mes 24 (fin parcial)
    if (s.mes === 24 && s.maxMeses === 24 && !s.extendido) {
      return { ...s, gameStatus: "checkpoint", endReason: "checkpoint_24" };
    }

    // fin definitivo (mes max)
    if (s.mes >= s.maxMeses) {
      return { ...s, gameStatus: "finished", endReason: "tiempo" };
    }

    // siguiente mes
    return { ...s, mes: s.mes + 1 };
  }),

aceptarAnioExtra: () =>
  set((s) => ({
    ...s,
    extendido: true,
    maxMeses: 36,
    gameStatus: "playing",
    endReason: "",
  })),

terminarEn24: () =>
  set((s) => ({
    ...s,
    gameStatus: "finished",
    endReason: "checkpoint_24",
  })),


  // Reiniciar
  reiniciar: () =>
  set(() => ({
    dinero: 5000,
    deuda: 2000,
    salud: 100,
    sueldo: 0,
    inversiones: [],
    sueños: [],
    mes: 1,
    maxMeses: 24,
    extendido: false,
    gameStatus: "playing",
    endReason: "",
  })),
}));