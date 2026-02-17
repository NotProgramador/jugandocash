export default function TarjetaPersonaje({ personaje }) {
  return (
    <div className="bg-yellow-100 rounded-lg shadow p-6 my-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold">{personaje.nombre} – {personaje.profesion}</h2>
      <p className="mt-2 mb-4 text-gray-700 italic">{personaje.contexto}</p>
      <div className="flex flex-col gap-1 mb-3">
        <div>💰 <b>Ahorros:</b> ${personaje.ahorros}</div>
        <div>💳 <b>Deuda:</b> ${personaje.deuda}</div>
        <div>📈 <b>Ingreso mensual:</b> ${personaje.ingresos}</div>
        <div>🌟 <b>Sueños:</b>
          <ul className="ml-3 list-disc">
            {personaje.suenos.map((s, i) => (
              <li key={i}>{s.nombre} (${s.costo})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
