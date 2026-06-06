function StatBox({ label, value, accent = "text-gray-900" }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-3 text-center shadow-sm">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
        {label}
      </div>
      <div className={`text-base font-bold ${accent} mt-0.5`}>{value}</div>
    </div>
  );
}

function SuenoMini({ s }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2.5 text-center shadow-sm flex flex-col justify-center min-h-[64px]">
      <div className="text-[12px] font-semibold text-gray-900 leading-tight line-clamp-2">
        {s?.nombre}
      </div>
      <div className="text-[11px] text-gray-500 mt-1">
        ${Number(s?.costo || 0).toLocaleString()}
      </div>
    </div>
  );
}

export default function TarjetaPersonaje({ personaje }) {
  const ahorros = Number(personaje?.ahorros || 0);
  const deuda = Number(personaje?.deuda || 0);
  const ingresos = Number(personaje?.ingresos || 0);
  const suenos = Array.isArray(personaje?.suenos) ? personaje.suenos : [];

  return (
    <div className="max-w-xl mx-auto rounded-2xl bg-white border border-gray-200 shadow-md overflow-hidden">
      {/* Header con degradado */}
      <div className="bg-gradient-to-br from-amber-50 to-rose-50 p-5 border-b border-gray-100">
        <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
          Tu punto de partida
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1 leading-tight">
          {personaje?.nombre}
        </h2>
        <div className="text-sm text-gray-600 font-medium">
          {personaje?.profesion}
        </div>
        {personaje?.contexto && (
          <p className="mt-3 text-sm text-gray-700 italic leading-relaxed">
            {personaje.contexto}
          </p>
        )}
      </div>

      {/* Stats iniciales */}
      <div className="px-5 pt-4">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
          Situación inicial
        </div>
        <div className="grid grid-cols-3 gap-2">
          <StatBox
            label="Ahorros"
            value={`$${ahorros.toLocaleString()}`}
            accent="text-emerald-700"
          />
          <StatBox
            label="Deuda"
            value={`$${deuda.toLocaleString()}`}
            accent={deuda > 0 ? "text-rose-700" : "text-gray-500"}
          />
          <StatBox
            label="Ingreso"
            value={`$${ingresos.toLocaleString()}`}
            accent="text-gray-800"
          />
        </div>
      </div>

      {/* Sueños — siempre visibles, sin scroll */}
      {suenos.length > 0 && (
        <div className="px-5 py-4 mt-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
            Sus sueños
          </div>
          <div className="grid grid-cols-3 gap-2">
            {suenos.slice(0, 3).map((s, i) => (
              <SuenoMini key={i} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
