import { useGameStore } from "../../store/gameStore";

export default function CardTragedia({ texto, opciones = [], onOpcion }) {
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
      // Tragedia sin campo bienestar: pequeño golpe emocional implícito
      if (typeof op.bienestar !== "number") {
        actualizarBienestar(-2);
      }
    }
    // Si la opción es string y menciona dinero negativo
    if (typeof op === "string" && op.match(/-\$([\d,]+)/)) {
      const monto = -parseInt(op.match(/-\$([\d,]+)/)[1].replace(/,/g, ""), 10);
      actualizarDinero(monto);
      actualizarBienestar(-2);
    }
    // TODO: si dinero gastado > dinero disponible, evaluar convertir faltante en deuda
    // (hoy se descuenta hasta 0 y el resto se evapora; tragedia no genera deuda automática).
    onOpcion(op);
  };

  return (
    <div className="bg-red-100 rounded-xl shadow-md p-6 text-center max-w-lg mx-auto my-8">
      <p className="text-lg font-semibold mb-4">{texto}</p>
      <div className="flex flex-col gap-2">
        {opciones.map((op, idx) => (
          <button
            key={idx}
            className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded"
            onClick={() => handleClick(op)}
          >
            {typeof op === "string" ? op : op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
