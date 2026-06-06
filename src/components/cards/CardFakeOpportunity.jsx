// IMPORTANTE: Esta carta debe verse visualmente IDÉNTICA a CardOportunidad.
// El jugador no debe distinguir fake de real por UI — solo por el texto y opciones.
import { useGameStore } from "../../store/gameStore";
import CardShell from "./CardShell";
import OptionButton from "./OptionButton";

export default function CardFakeOpportunity({ texto, opciones = [], onOpcion }) {
  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);
  const actualizarBienestar = useGameStore((s) => s.actualizarBienestar);

  const handleClick = (op) => {
    if (typeof op === "object" && op !== null) {
      if (typeof op.dinero === "number") actualizarDinero(op.dinero);
      if (typeof op.deuda === "number") actualizarDeuda(op.deuda);
      if (typeof op.salud === "number") actualizarSalud(op.salud);
      if (typeof op.bienestar === "number") actualizarBienestar(op.bienestar);
    }
    onOpcion?.(op);
  };

  return (
    <CardShell variant="neutral" header="Oportunidad">
      <p className="text-base sm:text-lg text-gray-800 leading-relaxed mb-4">
        {texto}
      </p>

      <div className="flex flex-col gap-2.5">
        {opciones.map((op, idx) => {
          const isObj = typeof op === "object" && op !== null;
          const label = typeof op === "string" ? op : op?.texto ?? "Opción";
          const pills = isObj
            ? {
                dinero: op?.dinero,
                salud: op?.salud,
                bienestar: op?.bienestar,
                deuda: op?.deuda,
              }
            : null;
          return (
            <OptionButton
              key={idx}
              tone="neutral"
              title={label}
              description={isObj ? op?.descripcion : null}
              pills={pills}
              onClick={() => handleClick(op)}
            />
          );
        })}
      </div>
    </CardShell>
  );
}
