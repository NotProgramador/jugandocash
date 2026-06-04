import { useMemo } from "react";
import { useGameStore } from "../../store/gameStore";

function delayLabel(inv) {
  const min = Number(inv?.delayMin ?? inv?.mesesMin ?? 0);
  const max = Number(inv?.delayMax ?? inv?.mesesMax ?? 0);

  if (Number.isFinite(min) && Number.isFinite(max) && (min > 0 || max > 0)) {
    const a = Math.min(min, max) || 1;
    const b = Math.max(min, max) || a;
    return a === b
      ? `Se resuelve en ${a} mes${a > 1 ? "es" : ""}`
      : `Se resuelve en ${a}-${b} meses`;
  }

  const single = Number(inv?.delay ?? inv?.meses ?? 0);
  if (single > 0) return `Se resuelve en ${single} mes${single > 1 ? "es" : ""}`;

  return "Se resuelve en 1-2 meses";
}

function pickDelay(inv) {
  const min = Number(inv?.delayMin ?? inv?.mesesMin ?? 0);
  const max = Number(inv?.delayMax ?? inv?.mesesMax ?? 0);

  if (Number.isFinite(min) && Number.isFinite(max) && (min > 0 || max > 0)) {
    const a = Math.min(min, max) || 1;
    const b = Math.max(min, max) || a;
    return a + Math.floor(Math.random() * (b - a + 1));
  }

  const single = Number(inv?.delay ?? inv?.meses ?? 0);
  if (single > 0) return single;

  return 1 + Math.floor(Math.random() * 2);
}

export default function CardOportunidad({
  texto,
  opciones = [],
  mesActual = 1,
  onOpcion,
}) {
  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);
  const actualizarBienestar = useGameStore((s) => s.actualizarBienestar);
  const agendarInversion = useGameStore((s) => s.agendarInversion);

  const opcionesNorm = useMemo(
    () => (Array.isArray(opciones) ? opciones : []),
    [opciones]
  );

  const handleClick = (op) => {
    if (typeof op === "string") {
      onOpcion?.(op);
      return;
    }

    // Handle nested inversion object (from JSON data)
    if (op?.inversion) {
      const inv = op.inversion;
      const delay = pickDelay(inv);
      const resolveAt = Number(mesActual) + delay;

      agendarInversion({
        nombre: inv.nombre || "Inversión",
        costo: Number(inv.costo || 0),
        resolveAt,
        outcomes: inv.outcomes || inv.resultados || [{ delta: 0, p: 1 }],
      });
      onOpcion?.(op);
      return;
    }

    // Handle flat investment action
    const accion = op?.accion || op?.type || op?.tipo;
    if (
      accion === "invertir" ||
      accion === "inversion" ||
      accion === "invertirNegocio"
    ) {
      const costo = Number(op?.costo ?? op?.monto ?? op?.inversion ?? 0);
      const nombre = op?.nombre || op?.negocio || op?.titulo || "Inversión";
      const delay = pickDelay(op);
      const resolveAt = Number(mesActual) + delay;
      const outcomes = op?.outcomes || op?.resultados || [{ delta: 0, p: 1 }];

      agendarInversion({ nombre, costo, resolveAt, outcomes });
      onOpcion?.(op);
      return;
    }

    // Handle direct money/debt/health/bienestar changes
    if (typeof op?.dinero === "number") actualizarDinero(op.dinero);
    if (typeof op?.deuda === "number") actualizarDeuda(op.deuda);
    if (typeof op?.salud === "number") actualizarSalud(op.salud);
    if (typeof op?.bienestar === "number") actualizarBienestar(op.bienestar);

    onOpcion?.(op);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center">
      <p className="mb-6 text-lg font-semibold">{texto}</p>

      <div className="flex flex-col gap-3">
        {opcionesNorm.map((op, idx) => {
          const isObj = typeof op === "object" && op !== null;
          const label = typeof op === "string" ? op : op?.texto ?? "Opción";
          const hasInv = isObj && op?.inversion;
          const accion = isObj ? op?.accion || op?.type || op?.tipo : null;
          const isInvAction =
            accion === "invertir" ||
            accion === "inversion" ||
            accion === "invertirNegocio";

          return (
            <button
              key={idx}
              className="bg-blue-600 text-white rounded-lg p-3 hover:bg-blue-700 transition text-left"
              onClick={() => handleClick(op)}
            >
              <div className="font-semibold">{label}</div>
              {op?.descripcion && (
                <div className="text-xs opacity-80 mt-1">{op.descripcion}</div>
              )}
              {hasInv && (
                <div className="text-xs opacity-70 mt-1">
                  {delayLabel(op.inversion)}
                </div>
              )}
              {isInvAction && !hasInv && (
                <div className="text-xs opacity-70 mt-1">
                  {delayLabel(op)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
