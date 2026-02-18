import { useMemo, useState } from "react";
import ModalSimple from "../ui/ModalSimple";
import { useGameStore } from "../../store/gameStore";

function efectoSaludPorSueno(nombre = "") {
  const n = String(nombre).toLowerCase();
  if (n.includes("viaj")) return 10;
  if (n.includes("casa") || n.includes("hogar")) return 6;
  if (n.includes("estudio") || n.includes("exposición") || n.includes("exposicion")) return 5;
  if (n.includes("auto") || n.includes("moto")) return 3;
  return 2;
}

export default function CardPayDay({ texto, opciones = [], onOpcion }) {
  const [modal, setModal] = useState(null); // deuda | suenio | invertir
  const [montoPago, setMontoPago] = useState(500);
  const [montoInvertir, setMontoInvertir] = useState(500);

  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const sueños = useGameStore((s) => s.sueños || []);

  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);
  const cumplirSueño = useGameStore((s) => s.cumplirSueño);

  const opcionesFiltradas = useMemo(() => {
    return (opciones || []).filter((op) => {
      const a = String(op?.accion || "").toLowerCase();
      if (deuda <= 0 && a.includes("pagar")) return false; // oculta pagar si ya no hay deuda
      return true;
    });
  }, [opciones, deuda]);

  const handleElegir = (op) => {
    if (op?.accion === "pagarDeuda") return setModal({ tipo: "deuda", opcion: op });
    if (op?.accion === "cumplirSuenio") return setModal({ tipo: "suenio", opcion: op });
    if (op?.accion === "invertir") return setModal({ tipo: "invertir", opcion: op });
    onOpcion(op);
  };

  const sueñosPendientes = sueños.filter((s) => !s.cumplido);

  const pagar = () => {
    onOpcion({ accion: "pagarDeuda", montoPago });
    setModal(null);
    setMontoPago(500);
  };

  const invertir = () => {
    onOpcion({ accion: "invertir", montoInvertir });
    setModal(null);
    setMontoInvertir(500);
  };

  const cumplir = (s) => {
    const costo = Number(s?.costo || 0);
    if (dinero < costo) return;

    actualizarDinero(-costo);
    cumplirSueño(s.nombre);

    const deltaSalud = efectoSaludPorSueno(s.nombre);
    if (deltaSalud) actualizarSalud(deltaSalud);

    setModal(null);
    onOpcion({ accion: "cumplirSuenio", suenio: s.nombre, costo });
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center space-y-4">
      <h2 className="text-xl font-bold">{texto}</h2>

      {deuda <= 0 && <div className="text-sm opacity-70 italic">No tienes deuda 🎉</div>}

      <div className="flex flex-col gap-3">
        {opcionesFiltradas.map((op, idx) => (
          <button
            key={idx}
            className="bg-gray-900 text-white rounded p-2 hover:opacity-90 transition text-left"
            onClick={() => handleElegir(op)}
          >
            <div className="font-semibold">{op?.texto ?? "Opción"}</div>
            {op?.descripcion && <div className="text-sm opacity-80">{op.descripcion}</div>}
          </button>
        ))}
      </div>

      {/* Modal Pagar deuda */}
      <ModalSimple open={modal?.tipo === "deuda"} title="Pagar deuda" onClose={() => setModal(null)}>
        <div className="space-y-3">
          <div className="text-sm opacity-80">Monto (mínimo $100, múltiplos de $100):</div>
          <input
            type="number"
            value={montoPago}
            onChange={(e) => setMontoPago(Math.max(100, Math.round(+e.target.value / 100) * 100))}
            className="w-full p-2 rounded border"
          />
          <button className="p-3 rounded-lg border w-full" onClick={pagar}>
            Pagar ${montoPago.toLocaleString()}
          </button>
        </div>
      </ModalSimple>

      {/* Modal Invertir/Ahorrar */}
      <ModalSimple open={modal?.tipo === "invertir"} title="Ahorrar / invertir" onClose={() => setModal(null)}>
        <div className="space-y-3">
          <div className="text-sm opacity-80">¿Cuánto apartas este mes? (múltiplos de $100)</div>
          <input
            type="number"
            value={montoInvertir}
            onChange={(e) => setMontoInvertir(Math.max(100, Math.round(+e.target.value / 100) * 100))}
            className="w-full p-2 rounded border"
          />
          <button className="p-3 rounded-lg border w-full" onClick={invertir}>
            Apartar ${montoInvertir.toLocaleString()}
          </button>
        </div>
      </ModalSimple>

      {/* Modal Cumplir sueño */}
      <ModalSimple open={modal?.tipo === "suenio"} title="Cumplir un sueño" onClose={() => setModal(null)}>
        <div className="space-y-3">
          {!sueñosPendientes.length ? (
            <div className="opacity-80">Ya cumpliste todos tus sueños 🎉</div>
          ) : (
            <div className="grid gap-2">
              {sueñosPendientes.map((s, idx) => {
                const costo = Number(s?.costo || 0);
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
