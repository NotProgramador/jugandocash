import { useGameStore } from "../../store/gameStore";

export default function Cartera({ mesActual = null }) {
  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const salud = useGameStore((s) => s.salud);
  const sueldo = useGameStore((s) => s.sueldo);
  const inversionesPendientes = useGameStore(
    (s) => s.inversionesPendientes || []
  );
  const sueños = useGameStore((s) => s.sueños || []);

  const fmtMeses = (inv) => {
    if (mesActual == null) return `Mes ${inv?.resolveAt}`;
    const faltan = Number(inv?.resolveAt || 0) - Number(mesActual || 0);
    if (!Number.isFinite(faltan)) return `Mes ${inv?.resolveAt}`;
    if (faltan <= 0) return "este mes";
    if (faltan === 1) return "en 1 mes";
    return `en ${faltan} meses`;
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <div className="text-xs text-gray-500 font-medium">Dinero</div>
          <div className="text-green-700 font-bold">
            ${Number(dinero || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <div className="text-xs text-gray-500 font-medium">Deuda</div>
          <div className="text-red-700 font-bold">
            ${Number(deuda || 0).toLocaleString()}
          </div>
        </div>

        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <div className="text-xs text-gray-500 font-medium">Salud</div>
          <div className="text-blue-700 font-bold">
            {Math.round(Number(salud || 0))}%
          </div>
        </div>

        <div className="p-2 bg-gray-50 rounded-lg text-center">
          <div className="text-xs text-gray-500 font-medium">Sueldo</div>
          <div className="text-gray-700 font-bold">
            ${Number(sueldo || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {(inversionesPendientes.length > 0 || sueños.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          {inversionesPendientes.length > 0 && (
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="font-semibold text-xs text-gray-500 mb-1">
                Inversiones pendientes
              </div>
              <ul className="space-y-0.5">
                {inversionesPendientes.map((inv) => (
                  <li key={inv.id} className="text-gray-700">
                    {inv.nombre || "Inversión"} — $
                    {Number(inv.costo || 0).toLocaleString()} ({fmtMeses(inv)})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sueños.length > 0 && (
            <div className="p-2 bg-gray-50 rounded-lg">
              <div className="font-semibold text-xs text-gray-500 mb-1">
                Sueños
              </div>
              <ul className="space-y-0.5">
                {sueños.map((s, idx) => (
                  <li key={idx} className="text-gray-700">
                    <span
                      className={
                        s.cumplido ? "line-through text-green-600" : ""
                      }
                    >
                      {s.nombre} (${Number(s.costo || 0).toLocaleString()})
                    </span>
                    {s.cumplido && (
                      <span className="ml-1 text-green-500 font-bold">
                        ✔
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
