// Línea neutral y discreta de efectos. Sin colores rojo/verde que delaten
// qué opción "conviene". El protagonista debe ser el texto, no la pill.
//
// Comportamiento:
// - Si NO hay valores numéricos, no renderiza nada.
// - Si los hay, los muestra como texto pequeño en gris, separado por bullets.
// - Conserva el signo numérico pero sin pintar el fondo de cada parte.

function signo(n) {
  if (n > 0) return "+";
  if (n < 0) return "−";
  return "";
}

function partes({ dinero, salud, bienestar, deuda }) {
  const out = [];
  if (typeof dinero === "number" && dinero !== 0) {
    out.push(`$${signo(dinero)}${Math.abs(dinero).toLocaleString()}`);
  }
  if (typeof salud === "number" && salud !== 0) {
    out.push(`Salud ${signo(salud)}${Math.abs(salud)}`);
  }
  if (typeof bienestar === "number" && bienestar !== 0) {
    out.push(`Bienestar ${signo(bienestar)}${Math.abs(bienestar)}`);
  }
  if (typeof deuda === "number" && deuda !== 0) {
    out.push(`Deuda ${signo(deuda)}${Math.abs(deuda).toLocaleString()}`);
  }
  return out;
}

export default function EffectPills({
  dinero,
  salud,
  bienestar,
  deuda,
  className = "",
}) {
  const p = partes({ dinero, salud, bienestar, deuda });
  if (!p.length) return null;
  return (
    <div
      className={`text-[11px] text-gray-500 leading-relaxed ${className}`}
    >
      {p.map((t, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5 text-gray-300">•</span>}
          {t}
        </span>
      ))}
    </div>
  );
}
