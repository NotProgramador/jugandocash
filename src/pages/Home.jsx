import { Link } from "react-router-dom";
import { useGameStore } from "../store/gameStore";

export default function Home() {
  const meta = useGameStore((s) => s.meta);
  const sueldo = useGameStore((s) => s.sueldo);
  const partidaEnCurso =
    meta?.personajeNombre && !meta?.terminado && sueldo > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <h1 className="text-3xl font-bold mb-2 text-center">
        Jugando con el Dinero
      </h1>
      <p className="mb-6 text-gray-600 text-center max-w-md">
        Un juego interactivo para aprender sobre decisiones financieras, deuda,
        salud, sueños e inversión.
      </p>

      <div className="flex flex-col gap-3 items-center">
        <Link to="/juego">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            {partidaEnCurso ? "Continuar partida" : "Empezar partida"}
          </button>
        </Link>

        {meta?.terminado && (
          <Link to="/resultados">
            <button className="border px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition">
              Ver últimos resultados
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
