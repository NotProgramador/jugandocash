// Pills consistentes para mostrar efectos directos en cartas y opciones.
// Acepta dinero, salud, bienestar, deuda. Omite si valor === 0 o no es numero.

function signo(n) {
  return n > 0 ? "+" : n < 0 ? "−" : "";
}

function Pill({ label, value, tone }) {
  const colors = {
    pos: "bg-emerald-100 text-emerald-800 border-emerald-200",
    neg: "bg-rose-100 text-rose-800 border-rose-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${colors[tone] || colors.neutral}`}
    >
      {label}
      <span className="ml-1 font-semibold">{value}</span>
    </span>
  );
}

function tone(n) {
  if (typeof n !== "number" || n === 0) return "neutral";
  return n > 0 ? "pos" : "neg";
}

export default function EffectPills({
  dinero,
  salud,
  bienestar,
  deuda,
  className = "",
}) {
  const pills = [];
  if (typeof dinero === "number" && dinero !== 0) {
    pills.push(
      <Pill
        key="d"
        label="$"
        value={`${signo(dinero)}${Math.abs(dinero).toLocaleString()}`}
        tone={tone(dinero)}
      />
    );
  }
  if (typeof salud === "number" && salud !== 0) {
    pills.push(
      <Pill
        key="s"
        label="Salud"
        value={`${signo(salud)}${Math.abs(salud)}`}
        tone={tone(salud)}
      />
    );
  }
  if (typeof bienestar === "number" && bienestar !== 0) {
    pills.push(
      <Pill
        key="b"
        label="Bienestar"
        value={`${signo(bienestar)}${Math.abs(bienestar)}`}
        tone={tone(bienestar)}
      />
    );
  }
  if (typeof deuda === "number" && deuda !== 0) {
    // Deuda: subir es malo, bajar es bueno (invertido vs los demas).
    const t = deuda > 0 ? "neg" : "pos";
    pills.push(
      <Pill
        key="de"
        label="Deuda"
        value={`${signo(deuda)}${Math.abs(deuda).toLocaleString()}`}
        tone={t}
      />
    );
  }
  if (!pills.length) return null;
  return <div className={`flex flex-wrap gap-1.5 ${className}`}>{pills}</div>;
}
