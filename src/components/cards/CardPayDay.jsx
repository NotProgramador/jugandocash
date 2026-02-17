import { useState } from "react";
import ModalSimple from "../ui/ModalSimple";

export default function CardPayDay({ texto, opciones, onOpcion }) {
  const [modal, setModal] = useState(null); // null | { tipo, opcion }

  // Handler cuando eliges opción de pagar deuda
  const handleElegir = (op) => {
    if (op.accion === "pagarDeuda") {
      setModal({ tipo: "deuda", opcion: op });
    } else {
      onOpcion(op);
    }
  };

  // Handler para cuando confirma el pago en el modal
  const [montoPago, setMontoPago] = useState(500);

  const handlePagar = () => {
    if (montoPago >= 100) {
      onOpcion({ ...modal.opcion, montoPago });
      setModal(null);
      setMontoPago(500);
    }
  };

  return (
    <div className="mx-auto my-8 max-w-lg p-8 rounded-xl shadow bg-white">
      <div className="text-xl font-semibold mb-6">{texto}</div>
      <div className="flex flex-col gap-4">
        {opciones.map((op, idx) => (
          <button
            key={idx}
            className="py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => handleElegir(op)}
          >
            <div className="font-bold">{op.texto}</div>
            <div className="text-sm text-blue-100">{op.descripcion}</div>
          </button>
        ))}
      </div>

      {/* Modal para pagar deuda */}
      <ModalSimple
        open={modal?.tipo === "deuda"}
        title="¿Cuánto quieres abonar a tu deuda?"
        onClose={() => setModal(null)}
      >
        <div className="mb-3">
          <label className="block mb-1 text-sm">Monto (mínimo $100, múltiplos de $100):</label>
          <input
            type="number"
            min={100}
            step={100}
            className="border rounded w-full px-2 py-1"
            value={montoPago}
            onChange={e => setMontoPago(Math.max(100, Math.round(+e.target.value / 100) * 100))}
          />
        </div>
        <button
          className="bg-green-600 px-4 py-2 text-white rounded"
          onClick={handlePagar}
        >
          Pagar ${montoPago?.toLocaleString()}
        </button>
      </ModalSimple>
    </div>
  );
}
