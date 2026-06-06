// Boton de opcion narrativo: texto y descripcion como protagonistas, efectos
// como linea secundaria discreta. Tones cambian solo bordes/hover, no
// "premian" visualmente ninguna opcion.

import EffectPills from "./EffectPills";

const TONES = {
  neutral:
    "bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-900",
  danger:
    "bg-white hover:bg-rose-50 border-rose-200 hover:border-rose-300 text-rose-950",
  payday:
    "bg-white hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 text-emerald-950",
};

export default function OptionButton({
  title,
  description,
  hint,
  pills,
  tone = "neutral",
  onClick,
  disabled = false,
}) {
  const clases = TONES[tone] || TONES.neutral;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left rounded-xl border p-3.5 transition shadow-sm hover:shadow ${clases} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="font-semibold leading-snug">{title}</div>
      {description && (
        <div className="text-sm text-gray-600 mt-1 leading-snug">
          {description}
        </div>
      )}
      {hint && (
        <div className="text-[11px] text-gray-400 mt-1.5 italic">{hint}</div>
      )}
      {pills && (
        <div className="mt-1.5">
          <EffectPills {...pills} />
        </div>
      )}
    </button>
  );
}
