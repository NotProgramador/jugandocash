import { useGameStore } from "../../store/gameStore";

export default function Cartera({ mesActual = null }) {
  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const salud = useGameStore((s) => s.salud);
  const inversionesPendientes = useGameStore((s) => s.inversionesPendientes || []);
  const sueños = useGameStore((s) => s.sueños || []);

  const fmtMeses = (inv) => {
    if (mesActual == null) return `Mes ${inv?.resolveAt}`;
    const faltan = Number(inv?.resolveAt || 0) - Number(mesActual || 0);
    if (!Number.isFinite(faltan)) return `Mes ${inv?.resolveAt}`;
    if (faltan <= 0) return "se resuelve este mes";
    if (faltan === 1) return "en 1 mes";
    return `en ${faltan} meses`;
  };

  return (
    <div className="flex flex-wrap gap-4 my-4 px-4 justify-center">
      <div className="p-3 bg-gray-100 rounded-xl shadow w-40">
        <div className="font-bold">Dinero</div>
        <div className="text-green-700 text-lg">${Number(dinero || 0).toLocaleString()}</div>
      </div>

      <div className="p-3 bg-gray-100 rounded-xl shadow w-40">
        <div className="font-bold">Deuda</div>
        <div className="text-red-700 text-lg">${Number(deuda || 0).toLocaleString()}</div>
      </div>

      <div className="p-3 bg-gray-100 rounded-xl shadow w-40">
        <div className="font-bold">Salud</div>
        <div className="text-blue-700 text-lg">{Number(salud || 0)}%</div>
      </div>

      <div className="p-3 bg-gray-100 rounded-xl shadow min-w-[220px]">
        <div className="font-bold mb-1">Inversiones pendientes</div>
        {inversionesPendientes.length ? (
          <ul className="text-sm list-disc ml-4">
            {inversionesPendientes.map((inv) => (
              <li key={inv.id}>
                {inv.nombre || "Inversión"} — ${Number(inv.costo || 0).toLocaleString()} ({fmtMeses(inv)})
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400">Sin inversiones pendientes</div>
        )}
      </div>

      <div className="p-3 bg-gray-100 rounded-xl shadow min-w-[220px]">
        <div className="font-bold mb-1">Sueños</div>
        {sueños.length ? (
          <ul className="text-sm list-disc ml-4">
            {sueños.map((s, idx) => (
              <li key={idx}>
                <span className={s.cumplido ? "line-through text-green-600" : ""}>
                  {s.nombre} (${Number(s.costo || 0).toLocaleString()})
                </span>
                {s.cumplido && <span className="ml-2 text-green-500 font-bold">✔</span>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400">Sin sueños</div>
        )}
      </div>
    </div>
  );
}
