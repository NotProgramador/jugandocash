import { useGameStore } from "../../store/gameStore";

function etiquetaBienestar(b) {
  const v = Number(b || 0);
  if (v >= 75) return { texto: "Pleno", color: "text-emerald-700" };
  if (v >= 50) return { texto: "Estable", color: "text-blue-700" };
  if (v >= 25) return { texto: "Estresado", color: "text-amber-700" };
  return { texto: "Quemado", color: "text-red-700" };
}

export default function Cartera({ mesActual = null }) {
  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const salud = useGameStore((s) => s.salud);
  const bienestar = useGameStore((s) => s.bienestar);
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

  const bie = etiquetaBienestar(bienestar);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      {/* Métricas arriba */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
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
          <div className="text-xs text-gray-500 font-medium">Bienestar</div>
          <div className={`font-bold ${bie.color}`}>
            {Math.round(Number(bienestar || 0))}%
          </div>
          <div className={`text-[10px] ${bie.color}`}>{bie.texto}</div>
        </div>

        <div className="p-2 bg-gray-50 rounded-lg text-center col-span-2 sm:col-span-1">
          <div className="text-xs text-gray-500 font-medium">Sueldo</div>
          <div className="text-gray-700 font-bold">
            ${Number(sueldo || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Dos columnas: inversiones a la izquierda, sueños a la derecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="font-semibold text-xs text-gray-500 mb-2">
            Inversiones pendientes
          </div>
          {inversionesPendientes.length > 0 ? (
            <ul className="space-y-1">
              {inversionesPendientes.map((inv) => (
                <li key={inv.id} className="text-gray-700">
                  <span className="font-medium">
                    {inv.nombre || "Inversión"}
                  </span>{" "}
                  — ${Number(inv.costo || 0).toLocaleString()}
                  <span className="text-gray-500 italic">
                    {" "}
                    ({fmtMeses(inv)})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400 italic text-xs">
              Sin inversiones pendientes por ahora.
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="font-semibold text-xs text-gray-500 mb-2">Sueños</div>
          {sueños.length > 0 ? (
            <ul className="space-y-1">
              {sueños.map((s, idx) => (
                <li key={idx} className="text-gray-700">
                  <span
                    className={s.cumplido ? "line-through text-green-600" : ""}
                  >
                    {s.nombre} (${Number(s.costo || 0).toLocaleString()})
                  </span>
                  {s.cumplido && (
                    <span className="ml-1 text-green-500 font-bold">✔</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400 italic text-xs">
              Aún no tienes sueños registrados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
