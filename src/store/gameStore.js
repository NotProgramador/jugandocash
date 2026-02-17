import { create } from "zustand";

// Función auxiliar para inicializar sueños a partir del personaje
function mapSueños(suenios) {
  // Acepta array de objetos {nombre, costo}, o string simple (ajusta si tu JSON es diferente)
  return suenios.map(s => ({
    nombre: typeof s === "string" ? s : s.nombre,
    costo: typeof s === "string" ? 0 : s.costo,
    cumplido: false,
  }));
}

export const useGameStore = create((set, get) => ({
  // Estado inicial (cambian al elegir personaje)
  dinero: 5000,
  deuda: 2000,
  salud: 100,
  sueldo: 0,
  inversiones: [],
  sueños: [],

  // Al elegir personaje:
  setValoresIniciales: (personaje) => set(() => ({
    dinero: personaje.ahorros || 0,
    deuda: personaje.deuda || 0,
    salud: 100,
    sueldo: personaje.ingresos || 0,
    inversiones: [],
     sueños: mapSueños(p.sueños || p["Sueños (y costo)"] || []),
})),

  // Dinero
  actualizarDinero: (monto) => set((state) => ({
    dinero: Math.max(0, state.dinero + monto),
  })),

  // Deuda
  actualizarDeuda: (monto) => set((state) => ({
    deuda: Math.max(0, state.deuda + monto),
  })),

  // Salud (límite entre 0 y 100)
  actualizarSalud: (monto) => set((state) => ({
    salud: Math.max(0, Math.min(100, state.salud + monto)),
  })),

  // Inversiones: [{ tipo, monto }]
  agregarInversion: (inversion) => set((state) => ({
    inversiones: [...state.inversiones, inversion],
    dinero: Math.max(0, state.dinero - inversion.monto),
  })),
  quitarInversion: (idx) => set((state) => {
    const invs = [...state.inversiones];
    invs.splice(idx, 1);
    return { inversiones: invs };
  }),

  // Cumplir sueño
  cumplirSueño: (nombre) => set((state) => ({
    sueños: state.sueños.map(s => s.nombre === nombre ? { ...s, cumplido: true } : s)
  })),

  // Reiniciar el juego
  reiniciar: () => set(() => ({
    dinero: 5000,
    deuda: 2000,
    salud: 100,
    sueldo: 0,
    inversiones: [],
    sueños: [],
  })),
}));
