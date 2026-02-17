import { useGameStore } from "../../store/gameStore";

export default function CardOportunidad({ texto, opciones = [], onOpcion }) {
  const actualizarDinero = useGameStore((s) => s.actualizarDinero);

  const handleClick = (op) => {
    // Si la opción es objeto: { texto, dinero }
    if (typeof op === "object" && op.dinero) {
      actualizarDinero(op.dinero);
    }
    // Si es string (tipo "Invertir fuerte -$50,000")
    if (typeof op === "string" && op.includes("-$")) {
      const monto = -parseInt(op.match(/-\$([\d,]+)/)?.[1].replace(/,/g, "") || "0", 10);
      actualizarDinero(monto);
    }
    // Siempre avanza
    onOpcion(op);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center">
      <p className="mb-6 text-lg font-semibold">{texto}</p>
      <div className="flex flex-col gap-3">
        {opciones.map((op, idx) => (
          <button
            key={idx}
            className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 transition"
            onClick={() => handleClick(op)}
          >
            {typeof op === "string" ? op : op.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
