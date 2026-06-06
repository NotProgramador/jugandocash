import CardShell from "./CardShell";
import OptionButton from "./OptionButton";

export default function CardSaludEspecial({ titulo, texto, opciones = [], onOpcion }) {
  return (
    <CardShell variant="danger" header="Tu salud" badge="Atención">
      <h2 className="text-lg sm:text-xl font-extrabold text-rose-950 mb-2">
        {titulo}
      </h2>
      <p className="text-rose-900 leading-relaxed mb-4">{texto}</p>

      <div className="flex flex-col gap-2.5">
        {opciones.map((op, idx) => (
          <OptionButton
            key={idx}
            tone="danger"
            title={op?.texto ?? "Opción"}
            description={op?.descripcion}
            onClick={() => onOpcion?.(op)}
          />
        ))}
      </div>
    </CardShell>
  );
}
