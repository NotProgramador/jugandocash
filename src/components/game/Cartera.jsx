import { useGameStore } from "../../store/gameStore";

function etiquetaBienestar(b) {
  const v = Number(b || 0);
  if (v >= 75) return { texto: "Pleno", color: "text-emerald-700", bar: "bg-emerald-500" };
  if (v >= 50) return { texto: "Estable", color: "text-blue-700", bar: "bg-blue-500" };
  if (v >= 25) return { texto: "Estresado", color: "text-amber-700", bar: "bg-amber-500" };
  return { texto: "Quemado", color: "text-rose-700", bar: "bg-rose-500" };
}

function etiquetaSalud(s) {
  const v = Number(s || 0);
  if (v >= 75) return { texto: "Fuerte", color: "text-emerald-700", bar: "bg-emerald-500" };
  if (v >= 50) return { texto: "Estable", color: "text-blue-700", bar: "bg-blue-500" };
  if (v >= 25) return { texto: "Delicado", color: "text-amber-700", bar: "bg-amber-500" };
  return { texto: "Crítico", color: "text-rose-700", bar: "bg-rose-500" };
}

function Barra({ valor, colorClase }) {
  const v = Math.max(0, Math.min(100, Math.round(Number(valor || 0))));
  return (
    <div
      className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden"
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full ${colorClase} transition-all duration-500`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

function MetricaSimple({ label, value, valueClass = "text-gray-900" }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-2.5 text-center shadow-sm">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {label}
      </div>
      <div className={`text-base font-bold ${valueClass}`}>{value}</div>
    </div>
  );
}

function MetricaBarra({ label, valor, etiqueta }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-2.5 text-center shadow-sm">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {label}
      </div>
      <div className={`text-base font-bold ${etiqueta.color}`}>
        {Math.round(Number(valor || 0))}%
      </div>
      <Barra valor={valor} colorClase={etiqueta.bar} />
      <div className={`text-[10px] mt-0.5 ${etiqueta.color}`}>{etiqueta.texto}</div>
    </div>
  );
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
    if (faltan <= 0) return "Se resuelve este mes";
    if (faltan === 1) return "En 1 mes";
    return `En ${faltan} meses`;
  };

  const bie = etiquetaBienestar(bienestar);
  const sal = etiquetaSalud(salud);

  const suenosCumplidos = sueños.filter((s) => s.cumplido).length;

  return (
    <div className="bg-gray-50 rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4">
      {/* Metricas */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
        <MetricaSimple
          label="Dinero"
          value={`$${Number(dinero || 0).toLocaleString()}`}
          valueClass="text-emerald-700"
        />
        <MetricaSimple
          label="Deuda"
          value={`$${Number(deuda || 0).toLocaleString()}`}
          valueClass={deuda > 0 ? "text-rose-700" : "text-gray-500"}
        />
        <MetricaBarra label="Salud" valor={salud} etiqueta={sal} />
        <MetricaBarra label="Bienestar" valor={bienestar} etiqueta={bie} />
        <MetricaSimple
          label="Sueldo"
          value={`$${Number(sueldo || 0).toLocaleString()}`}
          valueClass="text-gray-700"
        />
      </div>

      {/* Inversiones + Sueños */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {/* Inversiones pendientes */}
        <div className="rounded-xl bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              Inversiones pendientes
            </div>
            {inversionesPendientes.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                {inversionesPendientes.length}
              </span>
            )}
          </div>
          {inversionesPendientes.length > 0 ? (
            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {inversionesPendientes.map((inv) => (
                <li
                  key={inv.id}
                  className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-2"
                >
                  <div className="font-semibold text-gray-900 leading-tight text-[13px]">
                    {inv.nombre || "Inversión"}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-gray-600">
                      Capital ${Number(inv.costo || 0).toLocaleString()}
                    </span>
                    <span className="text-indigo-700 font-medium">
                      {fmtMeses(inv)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-400 italic text-xs">
              No tienes inversiones en curso.
            </div>
          )}
        </div>

        {/* Sueños */}
        <div className="rounded-xl bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              Sueños
            </div>
            {sueños.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                {suenosCumplidos} / {sueños.length}
              </span>
            )}
          </div>
          {sueños.length > 0 ? (
            <ul className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {sueños.map((s, idx) => (
                <li
                  key={idx}
                  className={`rounded-lg border p-2 ${
                    s.cumplido
                      ? "border-emerald-100 bg-emerald-50/50"
                      : "border-gray-100 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`font-semibold text-[13px] leading-tight ${
                        s.cumplido ? "line-through text-emerald-700" : "text-gray-900"
                      }`}
                    >
                      {s.nombre}
                    </div>
                    {s.cumplido && (
                      <span
                        className="text-emerald-600 font-bold flex-shrink-0"
                        aria-label="cumplido"
                      >
                        ✔
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    ${Number(s.costo || 0).toLocaleString()}
                  </div>
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
