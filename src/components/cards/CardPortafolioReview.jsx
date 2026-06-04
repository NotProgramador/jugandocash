import { useMemo } from "react";
import { useGameStore } from "../../store/gameStore";

function fmt(n) {
  return Math.abs(Number(n || 0)).toLocaleString();
}

function etiquetaResultado(delta) {
  const d = Number(delta || 0);
  if (d > 0) return { texto: "Ganancia neta", color: "text-green-700" };
  if (d < 0) return { texto: "Pérdida neta", color: "text-red-700" };
  return { texto: "Recuperaste tu capital", color: "text-gray-700" };
}

export default function CardPortafolioReview({ onContinue }) {
  const invResults = useGameStore((s) => s.invResults || []);
  const aplicarInvResults = useGameStore((s) => s.aplicarInvResults);

  const { totalCapital, totalRetorno, totalNeto } = useMemo(() => {
    let cap = 0;
    let ret = 0;
    let neto = 0;
    for (const r of invResults) {
      const costo = Number(r?.costo || 0);
      const delta = Number(r?.delta || 0);
      const retorno =
        typeof r?.retorno === "number" ? r.retorno : Math.max(0, costo + delta);
      cap += costo;
      ret += retorno;
      neto += delta;
    }
    return { totalCapital: cap, totalRetorno: ret, totalNeto: neto };
  }, [invResults]);

  const aplicar = () => {
    aplicarInvResults();
    onContinue?.();
  };

  if (!invResults.length) {
    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center space-y-3">
        <h3 className="text-lg font-bold">Revisión de portafolio</h3>
        <p className="opacity-80">No hay resultados pendientes.</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={onContinue}
        >
          Continuar
        </button>
      </div>
    );
  }

  const totalLabel = etiquetaResultado(totalNeto);

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow space-y-4">
      <h3 className="text-lg font-bold text-center">Revisión de portafolio</h3>
      <p className="text-sm text-gray-600 text-center">
        Se resolvieron inversiones este mes:
      </p>

      <div className="space-y-2">
        {invResults.map((r) => {
          const costo = Number(r?.costo || 0);
          const delta = Number(r?.delta || 0);
          const retorno =
            typeof r?.retorno === "number"
              ? r.retorno
              : Math.max(0, costo + delta);
          const label = etiquetaResultado(delta);
          return (
            <div key={r.id} className="p-3 rounded-lg border">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold">{r?.nombre}</div>
                <div className={`text-sm font-bold ${label.color}`}>
                  {label.texto}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div>
                  <div className="text-gray-500">Capital</div>
                  <div className="font-semibold">${fmt(costo)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Retorno</div>
                  <div className="font-semibold">${fmt(retorno)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Neto</div>
                  <div className={`font-semibold ${label.color}`}>
                    {delta >= 0 ? "+" : "-"}${fmt(delta)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border p-3 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Capital invertido total</span>
          <span className="font-semibold">${fmt(totalCapital)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Retorno total al dinero</span>
          <span className="font-semibold">${fmt(totalRetorno)}</span>
        </div>
        <div
          className={`flex items-center justify-between text-base font-bold ${totalLabel.color}`}
        >
          <span>{totalLabel.texto}</span>
          <span>
            {totalNeto >= 0 ? "+" : "-"}${fmt(totalNeto)}
          </span>
        </div>
      </div>

      <button
        className="px-4 py-2 bg-blue-600 text-white rounded w-full font-semibold hover:bg-blue-700 transition"
        onClick={aplicar}
      >
        Aplicar resultados y continuar
      </button>
    </div>
  );
}
