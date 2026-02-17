import { useGameStore } from "../../store/gameStore";

export default function Cartera() {
  const dinero = useGameStore((s) => s.dinero);
  const deuda = useGameStore((s) => s.deuda);
  const salud = useGameStore((s) => s.salud);
  const inversiones = useGameStore((s) => s.inversiones || []);
  const sueños = useGameStore((s) => s.sueños || []);

  return (
    <div className="flex flex-wrap gap-4 my-4 px-4 justify-center">
      <div className="p-3 bg-gray-100 rounded-xl shadow w-40">
        <div className="font-bold">Dinero</div>
        <div className="text-green-700 text-lg">${dinero?.toLocaleString()}</div>
      </div>
      <div className="p-3 bg-gray-100 rounded-xl shadow w-40">
        <div className="font-bold">Deuda</div>
        <div className="text-red-700 text-lg">${deuda?.toLocaleString()}</div>
      </div>
      <div className="p-3 bg-gray-100 rounded-xl shadow w-40">
        <div className="font-bold">Salud</div>
        <div className="text-blue-700 text-lg">{salud}</div>
      </div>
      <div className="p-3 bg-gray-100 rounded-xl shadow min-w-[200px]">
        <div className="font-bold mb-1">Inversiones</div>
        {inversiones.length ? (
          <ul className="text-sm list-disc ml-4">
            {inversiones.map((inv, idx) => (
              <li key={idx}>
                {inv.tipo || "Tipo"}: ${inv.monto?.toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400">Sin inversiones</div>
        )}
      </div>
      <div className="p-3 bg-gray-100 rounded-xl shadow min-w-[200px]">
        <div className="font-bold mb-1">Sueños</div>
        {sueños.length ? (
          <ul className="text-sm list-disc ml-4">
            {sueños.map((s, idx) => (
              <li key={idx}>
                <span className={s.cumplido ? "line-through text-green-600" : ""}>
                  {s.nombre} (${s.costo?.toLocaleString()})
                </span>
                {s.cumplido && <span className="ml-2 text-green-500 font-bold">✔</span>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-400">Sin sueños</div>
        )}
      </div>
    </div>
  );
}
