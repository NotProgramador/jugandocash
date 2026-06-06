// Cascarón visual compartido. Soporta variantes:
// - neutral: cartas normales, oportunidades reales, fakes (mismo look).
// - danger: tragedias (rojo).
// - payday: día de pago (verde).
// - portfolio: resumen de portafolio (azul/financiero).

const VARIANTS = {
  neutral: {
    wrap: "bg-white border border-gray-200",
    header: "text-gray-500",
    title: "text-gray-900",
    accent: "border-gray-200",
  },
  danger: {
    wrap: "bg-rose-50 border border-rose-300",
    header: "text-rose-700",
    title: "text-rose-950",
    accent: "border-rose-200",
  },
  payday: {
    wrap: "bg-emerald-50 border border-emerald-300",
    header: "text-emerald-800",
    title: "text-emerald-950",
    accent: "border-emerald-200",
  },
  portfolio: {
    wrap: "bg-indigo-50 border border-indigo-200",
    header: "text-indigo-700",
    title: "text-indigo-950",
    accent: "border-indigo-200",
  },
};

export default function CardShell({
  variant = "neutral",
  header,
  badge,
  title,
  children,
  className = "",
}) {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <div
      className={`max-w-lg mx-auto rounded-2xl shadow-md p-5 sm:p-6 my-6 ${v.wrap} ${className}`}
    >
      {(header || badge) && (
        <div className="flex items-center justify-between mb-3">
          {header && (
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider ${v.header}`}
            >
              {header}
            </span>
          )}
          {badge && (
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${v.accent} ${v.header} bg-white/60`}
            >
              {badge}
            </span>
          )}
        </div>
      )}
      {title && (
        <h2 className={`text-lg sm:text-xl font-bold leading-snug mb-3 ${v.title}`}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}
