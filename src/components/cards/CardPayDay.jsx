import { useMemo, useState } from "react";
import ModalSimple from "../ui/ModalSimple";
import { useGameStore } from "../../store/gameStore";
import CardShell from "./CardShell";
import OptionButton from "./OptionButton";

function efectoSaludPorSueno(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("viaj")) return 10;
  if (n.includes("casa") || n.includes("hogar")) return 6;
  if (n.includes("estudio") || n.includes("exposición") || n.includes("exposicion")) return 5;
  if (n.includes("auto") || n.includes("moto")) return 3;
  return 2;
}

export default function CardPayDay({ texto, opciones = [], onOpcion }) {
  const [modal, setModal] = useState(null);
  const [montoPago, setMontoPago] = useState(500);

  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const sueldo = useGameStore((s) => s.sueldo);
  const sueños = useGameStore((s) => s.sueños || []);

  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);
  const actualizarBienestar = useGameStore((s) => s.actualizarBienestar);
  const cumplirSueño = useGameStore((s) => s.cumplirSueño);

  const opcionesFinal = useMemo(() => {
    const base = Array.isArray(opciones) ? opciones : [];
    if (base.length) return base;
    return [
      { texto: "Pagar deuda", accion: "pagarDeuda" },
      { texto: "Cumplir un sueño", accion: "cumplirSuenio" },
      { texto: "Ahorrar / invertir (simple)", accion: "invertir", montoInvertir: 500 },
      { texto: "No hacer nada", accion: "nada" },
    ];
  }, [opciones]);

  const handleElegir = (op) => {
    if (op?.accion === "pagarDeuda") {
      if (deuda <= 0) return;
      setModal({ tipo: "deuda", opcion: op });
      return;
    }
    if (op?.accion === "cumplirSuenio") {
      setModal({ tipo: "suenio", opcion: op });
      return;
    }
    onOpcion?.(op);
  };

  const handlePagar = () => {
    if (montoPago >= 100) {
      onOpcion?.({ ...modal.opcion, montoPago });
      setModal(null);
      setMontoPago(500);
    }
  };

  const sueñosPendientes = sueños.filter((s) => !s.cumplido);

  const cumplir = (s) => {
    const costo = Number(s.costo || 0);
    if (dinero < costo) return;

    actualizarDinero(-costo);
    cumplirSueño(s.nombre);
    const deltaSalud = efectoSaludPorSueno(s.nombre);
    if (deltaSalud) actualizarSalud(deltaSalud);
    actualizarBienestar(12);

    setModal(null);
    onOpcion?.({ accion: "cumplirSuenio", suenio: s.nombre, costo });
  };

  return (
    <CardShell variant="payday" header="Día de pago">
      <h2 className="text-lg sm:text-xl font-bold leading-snug text-emerald-950 mb-2">
        {texto}
      </h2>

      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-800 mb-4">
        {sueldo > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-white/70 border border-emerald-200">
            Sueldo: ${Number(sueldo).toLocaleString()}
          </span>
        )}
        {deuda > 0 ? (
          <span className="px-2 py-0.5 rounded-full bg-white/70 border border-emerald-200">
            Deuda: ${Number(deuda).toLocaleString()}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-white/70 border border-emerald-200">
            Sin deuda 🎉
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {opcionesFinal
          .filter((op) => !(op?.accion === "pagarDeuda" && deuda <= 0))
          .map((op, idx) => {
            const pills = {
              dinero: op?.dinero,
              salud: op?.salud,
              bienestar: op?.bienestar,
              deuda: op?.deuda,
            };
            return (
              <OptionButton
                key={idx}
                tone="payday"
                title={op?.texto ?? "Opción"}
                description={op?.descripcion}
                pills={pills}
                onClick={() => handleElegir(op)}
              />
            );
          })}
      </div>

      <ModalSimple
        open={modal?.tipo === "deuda"}
        title="Pagar deuda"
        onClose={() => setModal(null)}
      >
        <div className="space-y-3">
          <div className="text-sm opacity-80">
            Monto (mínimo $100, múltiplos de $100):
          </div>
          <input
            type="number"
            value={montoPago}
            onChange={(e) =>
              setMontoPago(Math.max(100, Math.round(+e.target.value / 100) * 100))
            }
            className="w-full p-2 rounded border"
          />
          <button
            className="p-3 rounded-lg border w-full font-semibold hover:bg-gray-50"
            onClick={handlePagar}
          >
            Pagar ${montoPago?.toLocaleString()}
          </button>
        </div>
      </ModalSimple>

      <ModalSimple
        open={modal?.tipo === "suenio"}
        title="Cumplir un sueño"
        onClose={() => setModal(null)}
      >
        <div className="space-y-3">
          {!sueñosPendientes.length ? (
            <div className="opacity-80">Ya cumpliste todos tus sueños 🎉</div>
          ) : (
            <div className="grid gap-2">
              {sueñosPendientes.map((s, idx) => {
                const costo = Number(s.costo || 0);
                const alcanza = dinero >= costo;
                return (
                  <div key={idx} className="p-3 rounded-lg border">
                    <div className="font-semibold">{s.nombre}</div>
                    <div className="text-sm opacity-80">
                      Costo: ${costo.toLocaleString()}
                    </div>
                    <button
                      className="mt-2 p-2 rounded border w-full disabled:opacity-50 font-semibold hover:bg-gray-50"
                      disabled={!alcanza}
                      onClick={() => cumplir(s)}
                    >
                      {alcanza ? "Cumplir" : "No te alcanza aún"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModalSimple>
    </CardShell>
  );
}
