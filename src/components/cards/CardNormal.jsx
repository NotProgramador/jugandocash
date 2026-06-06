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
  return (
    <CardShell variant="neutral" header="Situación del mes">
      <p className="text-base sm:text-lg text-gray-800 leading-relaxed mb-4">
        {texto}
      </p>

      {/* Linea secundaria muy discreta */}
      <EffectPills
        dinero={dinero}
        salud={salud}
        bienestar={bienestar}
        deuda={deuda}
        className="mb-4"
      />

      <button
        type="button"
        onClick={onSiguiente}
        className="w-full mt-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition shadow-sm"
      >
        Siguiente
      </button>
    </CardShell>
  );
}
