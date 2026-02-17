import { useGameStore } from "../../store/gameStore";

export default function CardTragedia({ texto, opciones = [], onOpcion }) {
  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);

  const handleClick = (op) => {
    // Si la opción es objeto
    if (typeof op === "object") {
      if (op.dinero) actualizarDinero(op.dinero);
      if (op.deuda) actualizarDeuda(op.deuda);
      if (op.salud) actualizarSalud(op.salud);
    }
    // Si la opción es string y menciona dinero
    if (typeof op === "string" && op.match(/-\$([\d,]+)/)) {
      const monto = -parseInt(op.match(/-\$([\d,]+)/)[1].replace(/,/g, ""), 10);
      actualizarDinero(monto);
    }
    // SIEMPRE avanza
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
