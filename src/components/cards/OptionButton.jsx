// Boton de opcion consistente: titulo + descripcion + pills opcionales.
// Tones: neutral (default), danger (tragedias), payday (verde).

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
      className={`w-full text-left rounded-xl border p-3 sm:p-3.5 transition shadow-sm hover:shadow ${clases} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="font-semibold leading-snug">{title}</div>
      {description && (
        <div className="text-xs text-gray-600 mt-1 leading-snug">
          {description}
        </div>
      )}
      {hint && (
        <div className="text-[11px] text-gray-500 mt-1 italic">{hint}</div>
      )}
      {pills && (
        <div className="mt-2">
          <EffectPills {...pills} />
        </div>
      )}
    </button>
  );
}
