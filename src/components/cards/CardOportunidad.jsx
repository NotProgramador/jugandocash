import { useGameStore } from "../../store/gameStore";

export default function CardOportunidad({ texto, opciones = [], onOpcion, mesActual = 1 }) {
  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);
  const agendarInversion = useGameStore((s) => s.agendarInversion);

  const handleClick = (op) => {
    // NUEVO: inversión diferida
    if (typeof op === "object" && op?.inversion) {
      const inv = op.inversion;
      const dmin = Number(inv.delayMin ?? 1);
      const dmax = Number(inv.delayMax ?? 2);
      const delay = dmin + Math.floor(Math.random() * (dmax - dmin + 1));

      agendarInversion({
        nombre: inv.nombre || texto,
        costo: inv.costo,
        resolveAt: Number(mesActual) + delay,
        outcomes: inv.outcomes || [{ delta: 0, p: 1 }],
      });

      onOpcion(op);
      return;
    }

    // Efectos directos (tu formato actual)
    if (typeof op === "object") {
      if (typeof op.dinero === "number") actualizarDinero(op.dinero);
      if (typeof op.deuda === "number") actualizarDeuda(op.deuda);
      if (typeof op.salud === "number") actualizarSalud(op.salud);
      onOpcion(op);
      return;
    }

    // Strings tipo "-$"
    if (typeof op === "string" && op.match(/-\$([\d,]+)/)) {
      const monto = -parseInt(op.match(/-\$([\d,]+)/)[1].replace(/,/g, ""), 10);
      actualizarDinero(monto);
    }

    onOpcion(op);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center">
      <p className="mb-6 text-lg font-semibold">{texto}</p>
      <div className="flex flex-col gap-3">
        {opciones.map((op, idx) => (
          <button
            key={idx}
            className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 transition text-left"
            onClick={() => handleClick(op)}
          >
            <div className="font-semibold">{typeof op === "string" ? op : op?.texto ?? "Opción"}</div>
            {typeof op === "object" && op?.descripcion ? (
              <div className="text-sm opacity-80">{op.descripcion}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
