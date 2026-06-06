import { useGameStore } from "../../store/gameStore";
import CardShell from "./CardShell";
import OptionButton from "./OptionButton";

const SEV_LABEL = {
  leve: "Leve",
  media: "Media",
  fuerte: "Fuerte",
};

export default function CardTragedia({ texto, opciones = [], severidad, onOpcion }) {
  const actualizarDinero = useGameStore((s) => s.actualizarDinero);
  const actualizarDeuda = useGameStore((s) => s.actualizarDeuda);
  const actualizarSalud = useGameStore((s) => s.actualizarSalud);
  const actualizarBienestar = useGameStore((s) => s.actualizarBienestar);

  const handleClick = (op) => {
    if (typeof op === "object" && op !== null) {
      if (typeof op.dinero === "number") actualizarDinero(op.dinero);
      if (typeof op.deuda === "number") actualizarDeuda(op.deuda);
      if (typeof op.salud === "number") actualizarSalud(op.salud);
      if (typeof op.bienestar === "number") actualizarBienestar(op.bienestar);
      if (typeof op.bienestar !== "number") actualizarBienestar(-2);
    }
    if (typeof op === "string" && op.match(/-\$([\d,]+)/)) {
      const monto = -parseInt(op.match(/-\$([\d,]+)/)[1].replace(/,/g, ""), 10);
      actualizarDinero(monto);
      actualizarBienestar(-2);
    }
    onOpcion(op);
  };

  const badge = severidad ? SEV_LABEL[severidad] : null;

  return (
    <CardShell variant="danger" header="Imprevisto" badge={badge}>
      <p className="text-base sm:text-lg text-rose-950 leading-relaxed mb-4">
        {texto}
      </p>

      <div className="flex flex-col gap-2.5">
        {opciones.map((op, idx) => {
          const isObj = typeof op === "object" && op !== null;
          const label = typeof op === "string" ? op : op?.texto;
          const pills = isObj
            ? {
                dinero: op?.dinero,
                salud: op?.salud,
                bienestar: op?.bienestar,
                deuda: op?.deuda,
              }
            : null;
          return (
            <OptionButton
              key={idx}
              tone="danger"
              title={label}
              description={isObj ? op?.descripcion : null}
              pills={pills}
              onClick={() => handleClick(op)}
            />
          );
        })}
      </div>
    </CardShell>
  );
}
