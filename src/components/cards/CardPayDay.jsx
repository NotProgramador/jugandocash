import { useMemo, useState } from "react";
import ModalSimple from "../ui/ModalSimple";
import { useGameStore } from "../../store/gameStore";

function efectoSaludPorSueno(nombre = "") {
  const n = nombre.toLowerCase();
  if (n.includes("viaj")) return 10;
  if (n.includes("casa") || n.includes("hogar")) return 6;
  if (n.includes("estudio") || n.includes("exposición") || n.includes("exposicion")) return 5;
  if (n.includes("auto") || n.includes("moto")) return 3;
  return 2;
}

export default function CardPayDay({ texto, opciones = [], onOpcion }) {
  const [modal, setModal] = useState(null); // null | { tipo, opcion }
  const [montoPago, setMontoPago] = useState(500);

  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
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

    // Cumplir un sueño es siempre bueno para el bienestar
    actualizarBienestar(12);

    setModal(null);
    onOpcion?.({ accion: "cumplirSuenio", suenio: s.nombre, costo });
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow space-y-4">
      <h2 className="text-xl font-bold">{texto}</h2>

      {deuda <= 0 ? (
        <div className="text-sm opacity-70 italic">No tienes deuda 🎉</div>
      ) : (
        <div className="text-sm opacity-70">
          Deuda actual: <span className="font-semibold">${Number(deuda).toLocaleString()}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {opcionesFinal
          .filter((op) => !(op?.accion === "pagarDeuda" && deuda <= 0))
          .map((op, idx) => (
            <button
              key={idx}
              className="bg-green-700 text-white rounded p-2 hover:opacity-90 transition text-left"
              onClick={() => handleElegir(op)}
            >
              <div className="font-semibold">{op?.texto ?? "Opción"}</div>
              {op?.descripcion ? <div className="text-xs opacity-80 mt-1">{op.descripcion}</div> : null}
            </button>
          ))}
      </div>

      <ModalSimple open={modal?.tipo === "deuda"} title="Pagar deuda" onClose={() => setModal(null)}>
        <div className="space-y-3">
          <div className="text-sm opacity-80">Monto (mínimo $100, múltiplos de $100):</div>
          <input
            type="number"
            value={montoPago}
            onChange={(e) =>
              setMontoPago(Math.max(100, Math.round(+e.target.value / 100) * 100))
            }
            className="w-full p-2 rounded border"
          />
          <button className="p-3 rounded-lg border w-full" onClick={handlePagar}>
            Pagar ${montoPago?.toLocaleString()}
          </button>
        </div>
      </ModalSimple>

      <ModalSimple open={modal?.tipo === "suenio"} title="Cumplir un sueño" onClose={() => setModal(null)}>
        <div className="space-y-3">
          {!sueñosPendientes.length ? (
            <div className="opacity-80">Ya cumpliste todos tus sueños 🎉</div>
          ) : (
            <div className="grid gap-2">
              {sueñosPendientes.map((s, idx) => {
                const costo = Number(s.costo || 0);
                const alcanza = dinero >= costo;
                return (
                  <div key={idx} className="p-3 rounded border">
                    <div className="font-semibold">{s.nombre}</div>
                    <div className="text-sm opacity-80">Costo: ${costo.toLocaleString()}</div>
                    <button
                      className="mt-2 p-2 rounded border w-full disabled:opacity-50"
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
    </div>
  );
}
