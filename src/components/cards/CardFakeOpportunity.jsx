import { useGameStore } from "../../store/gameStore";

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
    <div className="max-w-lg mx-auto bg-amber-50 border-2 border-amber-300 p-6 rounded-xl shadow text-center">
      <div className="inline-block mb-3 px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wide">
        Oportunidad sospechosa
      </div>
      <p className="mb-4 text-lg font-semibold text-amber-950">{texto}</p>

      <div className="flex flex-col gap-3">
        {opciones.map((op, idx) => {
          const label = typeof op === "string" ? op : op?.texto ?? "Opción";
          return (
            <button
              key={idx}
              className="bg-amber-600 text-white rounded-lg p-3 hover:bg-amber-700 transition text-left"
              onClick={() => handleClick(op)}
            >
              <div className="font-semibold">{label}</div>
              {op?.descripcion && (
                <div className="text-xs opacity-90 mt-1">{op.descripcion}</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
