import { useMemo } from "react";
import { useGameStore } from "../../store/gameStore";

function parseMoneyFromText(text = "") {
  const m = String(text).match(/([+-])\$\s*([\d,]+)/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const amount = parseInt(m[2].replace(/,/g, ""), 10);
  return sign * (Number.isFinite(amount) ? amount : 0);
}

function pickDelay(op) {
  const min = Number(op?.delayMin ?? op?.mesesMin ?? op?.minMeses ?? op?.minDelay);
  const max = Number(op?.delayMax ?? op?.mesesMax ?? op?.maxMeses ?? op?.maxDelay);

  if (Number.isFinite(min) && Number.isFinite(max)) {
    const a = Math.min(min, max);
    const b = Math.max(min, max);
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  const single = Number(op?.delay ?? op?.meses ?? op?.wait);
  if (Number.isFinite(single) && single > 0) return single;

  return 1 + Math.floor(Math.random() * 2); // default 1–2
}

function delayLabel(op) {
  const min = Number(op?.delayMin ?? op?.mesesMin ?? op?.minMeses ?? op?.minDelay);
  const max = Number(op?.delayMax ?? op?.mesesMax ?? op?.maxMeses ?? op?.maxDelay);

  if (Number.isFinite(min) && Number.isFinite(max)) {
    const a = Math.min(min, max);
    const b = Math.max(min, max);
    return a === b
      ? `Se resuelve en ${a} mes${a > 1 ? "es" : ""}`
      : `Se resuelve en ${a}–${b} meses`;
  }

  const single = Number(op?.delay ?? op?.meses ?? op?.wait);
  if (Number.isFinite(single) && single > 0) {
    return `Se resuelve en ${single} mes${single > 1 ? "es" : ""}`;
  }

  return "Se resuelve en 1–2 meses";
}

export default function CardOportunidad({ texto, opciones = [], mesActual = 1, onOpcion }) {
  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);

  const agendarInversion = useGameStore((s) => s.agendarInversion);

  const opcionesNorm = useMemo(() => (Array.isArray(opciones) ? opciones : []), [opciones]);

  const handleClick = (op) => {
    if (typeof op === "string") {
      const delta = parseMoneyFromText(op);
      if (typeof delta === "number") actualizarDinero(delta);
      onOpcion?.(op);
      return;
    }

    const accion = op?.accion || op?.type || op?.tipo;

    if (accion === "invertir" || accion === "inversion" || accion === "invertirNegocio") {
      const costo =
        Number(op?.costo ?? op?.monto ?? op?.inversion ?? 0) ||
        Math.abs(parseMoneyFromText(op?.texto || "") || 0);

      const nombre = op?.nombre || op?.negocio || op?.titulo || "Inversión";
      const delay = pickDelay(op);
      const resolveAt = Number(mesActual) + delay;

      const outcomes = op?.outcomes || op?.resultados || op?.resultado || [{ delta: 0, p: 1 }];

      agendarInversion({ nombre, costo, resolveAt, outcomes });
      onOpcion?.(op);
      return;
    }

    if (typeof op?.dinero === "number") actualizarDinero(op.dinero);
    if (typeof op?.deuda === "number") actualizarDeuda(op.deuda);
    if (typeof op?.salud === "number") actualizarSalud(op.salud);

    if (typeof op?.dinero !== "number" && typeof op?.texto === "string") {
      const delta = parseMoneyFromText(op.texto);
      if (typeof delta === "number") actualizarDinero(delta);
    }

    onOpcion?.(op);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center">
      <p className="mb-6 text-lg font-semibold">{texto}</p>

      <div className="flex flex-col gap-3">
        {opcionesNorm.map((op, idx) => {
          const isObj = typeof op === "object" && op !== null;
          const label = typeof op === "string" ? op : op?.texto ?? "Opción";
          const accion = isObj ? (op?.accion || op?.type || op?.tipo) : null;
          const isInv = accion === "invertir" || accion === "inversion" || accion === "invertirNegocio";

          return (
            <button
              key={idx}
              className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 transition text-left"
              onClick={() => handleClick(op)}
            >
              <div className="font-semibold">{label}</div>
              {isInv ? <div className="text-xs opacity-80 mt-1">{delayLabel(op)}</div> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
