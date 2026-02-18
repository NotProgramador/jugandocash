import { useMemo } from "react";
import { useGameStore } from "../../store/gameStore";

export default function CardPortafolioReview({ onContinue }) {
  const invResults = useGameStore((s) => s.invResults || []);
  const aplicarInvResults = useGameStore((s) => s.aplicarInvResults);

  const total = useMemo(
    () => invResults.reduce((acc, r) => acc + Number(r?.delta || 0), 0),
    [invResults]
  );

  const aplicar = () => {
    aplicarInvResults(); // suma dinero + registra stats.inversionesNeto + limpia invResults
    onContinue?.();
  };

  if (!invResults.length) {
    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center space-y-3">
        <h3 className="text-lg font-bold">Revisión de portafolio</h3>
        <p className="opacity-80">No hay resultados pendientes.</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onContinue}>
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center space-y-4">
      <h3 className="text-lg font-bold">Revisión de portafolio</h3>
      <div className="text-sm opacity-80">Se resolvieron inversiones este mes:</div>

      <div className="text-left space-y-2">
        {invResults.map((r) => {
          const d = Number(r?.delta || 0);
          return (
            <div key={r.id} className="p-3 rounded border flex items-center justify-between">
              <div className="font-semibold">{r?.nombre}</div>
              <div className={d >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
                {d >= 0 ? "+" : "-"}${Math.abs(d).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <div className={total >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold"}>
        Total: {total >= 0 ? "+" : "-"}${Math.abs(total).toLocaleString()}
      </div>

      <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={aplicar}>
        Aplicar resultados y continuar
      </button>
    </div>
  );
}
