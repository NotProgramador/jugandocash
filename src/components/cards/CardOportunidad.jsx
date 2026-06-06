import { useMemo } from "react";
import { useGameStore } from "../../store/gameStore";
import CardShell from "./CardShell";
import OptionButton from "./OptionButton";

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
      if (typeof op?.bienestar === "number") actualizarBienestar(op.bienestar);
      onOpcion?.(op);
      return;
    }

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
      if (typeof op?.bienestar === "number") actualizarBienestar(op.bienestar);
      onOpcion?.(op);
      return;
    }

    if (typeof op?.dinero === "number") actualizarDinero(op.dinero);
    if (typeof op?.deuda === "number") actualizarDeuda(op.deuda);
    if (typeof op?.salud === "number") actualizarSalud(op.salud);
    if (typeof op?.bienestar === "number") actualizarBienestar(op.bienestar);
    onOpcion?.(op);
  };

  return (
    <CardShell variant="neutral" header="Oportunidad">
      <p className="text-base sm:text-lg text-gray-800 leading-relaxed mb-4">
        {texto}
      </p>

      <div className="flex flex-col gap-2.5">
        {opcionesNorm.map((op, idx) => {
          const isObj = typeof op === "object" && op !== null;
          const label = typeof op === "string" ? op : op?.texto ?? "Opción";
          const hasInv = isObj && op?.inversion;
          const accion = isObj ? op?.accion || op?.type || op?.tipo : null;
          const isInvAction =
            accion === "invertir" ||
            accion === "inversion" ||
            accion === "invertirNegocio";

          let hint = null;
          if (hasInv) hint = delayLabel(op.inversion);
          else if (isInvAction) hint = delayLabel(op);

          // Para inversiones no mostramos pills (outcomes son sorpresa); solo costo en hint adicional
          let pills = null;
          if (isObj && !hasInv && !isInvAction) {
            pills = {
              dinero: op?.dinero,
              salud: op?.salud,
              bienestar: op?.bienestar,
              deuda: op?.deuda,
            };
          } else if (hasInv && typeof op.inversion.costo === "number") {
            // Para inversion solo mostrar el costo como pill negativa de dinero
            pills = { dinero: -Math.abs(op.inversion.costo) };
          }

          return (
            <OptionButton
              key={idx}
              tone="neutral"
              title={label}
              description={op?.descripcion}
              hint={hint}
              pills={pills}
              onClick={() => handleClick(op)}
            />
          );
        })}
      </div>
    </CardShell>
  );
}
