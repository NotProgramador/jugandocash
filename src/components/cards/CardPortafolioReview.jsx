import { useMemo } from "react";
import { useGameStore } from "../../store/gameStore";
import CardShell from "./CardShell";

function fmt(n) {
  return Math.abs(Number(n || 0)).toLocaleString();
}

// Distingue ganancia, recuperar capital, pérdida parcial y pérdida total.
function etiquetaResultado(delta, costo, retorno) {
  const d = Number(delta || 0);
  const c = Number(costo || 0);
  const r = Number(retorno ?? Math.max(0, c + d));
  if (r === 0 && c > 0) {
    return {
      texto: "Pérdida total",
      tono: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
    };
  }
  if (d > 0) {
    return {
      texto: "Ganancia",
      tono: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
    };
  }
  if (d < 0) {
    return {
      texto: "Pérdida",
      tono: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
    };
  }
  return {
    texto: "Recuperaste capital",
    tono: "text-gray-700",
    bg: "bg-gray-50 border-gray-200",
  };
}

function signoMoneda(n) {
  if (n > 0) return "+";
  if (n < 0) return "−";
  return "";
}

export default function CardPortafolioReview({ onContinue }) {
  const invResults = useGameStore((s) => s.invResults || []);
  const aplicarInvResults = useGameStore((s) => s.aplicarInvResults);

  const { totalCapital, totalRetorno, totalNeto } = useMemo(() => {
    let cap = 0, ret = 0, neto = 0;
    for (const r of invResults) {
      const costo = Number(r?.costo || 0);
      const delta = Number(r?.delta || 0);
      const retorno =
        typeof r?.retorno === "number" ? r.retorno : Math.max(0, costo + delta);
      cap += costo;
      ret += retorno;
      // Neto capeado a -costo (igual que el store)
      neto += Math.max(delta, -costo);
    }
    return { totalCapital: cap, totalRetorno: ret, totalNeto: neto };
  }, [invResults]);

  const aplicar = () => {
    aplicarInvResults();
    onContinue?.();
  };

  if (!invResults.length) {
    return (
      <CardShell variant="portfolio" header="Portafolio">
        <p className="text-base text-indigo-900 mb-4">
          No hay resultados pendientes este mes.
        </p>
        <button
          className="w-full px-4 py-2.5 rounded-xl bg-indigo-700 text-white font-semibold hover:bg-indigo-800 transition"
          onClick={onContinue}
        >
          Continuar
        </button>
      </CardShell>
    );
  }

  const totalLabel = etiquetaResultado(totalNeto, totalCapital, totalRetorno);

  return (
    <CardShell variant="portfolio" header="Tu portafolio se movió">
      <p className="text-sm text-indigo-800 mb-4">
        Se resolvieron {invResults.length}{" "}
        {invResults.length === 1 ? "inversión" : "inversiones"} este mes.
      </p>

      {/* Resumen general arriba */}
      <div className="rounded-xl border border-indigo-200 bg-white/70 p-3 mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-700">
              Capital
            </div>
            <div className="font-bold text-indigo-950">
              ${fmt(totalCapital)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-700">
              Retorno
            </div>
            <div className="font-bold text-indigo-950">${fmt(totalRetorno)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-indigo-700">
              Neto
            </div>
            <div className={`font-bold ${totalLabel.tono}`}>
              {signoMoneda(totalNeto)}${fmt(totalNeto)}
            </div>
          </div>
        </div>
        <div className={`mt-2 text-center text-xs font-semibold ${totalLabel.tono}`}>
          {totalLabel.texto}
        </div>
      </div>

      {/* Lista por inversion */}
      <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
        {invResults.map((r) => {
          const costo = Number(r?.costo || 0);
          const delta = Number(r?.delta || 0);
          const retorno =
            typeof r?.retorno === "number" ? r.retorno : Math.max(0, costo + delta);
          const netoReal = Math.max(delta, -costo);
          const label = etiquetaResultado(netoReal, costo, retorno);
          return (
            <div
              key={r.id}
              className={`p-3 rounded-xl border ${label.bg}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-gray-900 leading-tight">
                  {r?.nombre}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide ${label.tono}`}
                >
                  {label.texto}
                </span>
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
                  <div className={`font-semibold ${label.tono}`}>
                    {signoMoneda(netoReal)}${fmt(netoReal)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="w-full px-4 py-2.5 rounded-xl bg-indigo-700 text-white font-semibold hover:bg-indigo-800 transition"
        onClick={aplicar}
      >
        Cobrar resultados y continuar
      </button>
    </CardShell>
  );
}
