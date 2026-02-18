export default function CardSaludEspecial({ titulo, texto, opciones = [], onOpcion }) {
  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow text-center space-y-4">
      <h2 className="text-xl font-extrabold">{titulo}</h2>
      <p className="opacity-85">{texto}</p>

      <div className="flex flex-col gap-3">
        {opciones.map((op, idx) => (
          <button
            key={idx}
            className="bg-rose-600 text-white rounded p-2 hover:opacity-90 transition text-left"
            onClick={() => onOpcion?.(op)}
          >
            <div className="font-semibold">{op?.texto ?? "Opción"}</div>
            {op?.descripcion ? <div className="text-sm opacity-80">{op.descripcion}</div> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
