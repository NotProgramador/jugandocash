import CardShell from "./CardShell";
import EffectPills from "./EffectPills";

export default function CardNormal({
  texto,
  dinero,
  salud,
  bienestar,
  deuda,
  onSiguiente,
}) {
  const tieneEfecto =
    typeof dinero === "number" ||
    typeof salud === "number" ||
    typeof bienestar === "number" ||
    typeof deuda === "number";

  return (
    <CardShell variant="neutral" header="Situación del mes">
      <p className="text-base sm:text-lg text-gray-800 leading-relaxed mb-4">
        {texto}
      </p>

      {tieneEfecto && (
        <div className="mb-4">
          <div className="text-[11px] text-gray-500 mb-1.5 font-medium">
            Efecto:
          </div>
          <EffectPills
            dinero={dinero}
            salud={salud}
            bienestar={bienestar}
            deuda={deuda}
          />
        </div>
      )}

      <button
        type="button"
        onClick={onSiguiente}
        className="w-full mt-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
      >
        Siguiente
      </button>
    </CardShell>
  );
}
