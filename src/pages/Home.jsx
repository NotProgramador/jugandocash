import { Link } from "react-router-dom";
import { useGameStore } from "../store/gameStore";

export default function Home() {
  const meta = useGameStore((s) => s.meta);
  const sueldo = useGameStore((s) => s.sueldo);
  const partidaEnCurso =
    meta?.personajeNombre && !meta?.terminado && sueldo > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[78vh] px-4">
      {/* Logo / marca */}
      <div className="mb-6">
        <div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-indigo-600 grid place-items-center shadow-lg shadow-indigo-200/60"
          aria-hidden
        >
          <span className="text-3xl font-extrabold text-white drop-shadow">$</span>
        </div>
      </div>

      <h1 className="text-4xl sm:text-5xl font-extrabold text-center tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-700">
        Jugando con el Dinero
      </h1>

      <p className="mt-3 text-gray-600 text-center max-w-md text-base">
        Decide, sobrevive, invierte, sueña.
      </p>

      <p className="mt-2 text-gray-500 text-center max-w-md text-sm">
        Un juego interactivo para aprender sobre decisiones financieras, deuda,
        salud, sueños e inversión.
      </p>

      <div className="flex flex-col gap-3 items-center mt-8 w-full max-w-xs">
        <Link to="/juego" className="w-full">
          <button className="w-full px-6 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition shadow-md hover:shadow-lg">
            {partidaEnCurso ? "Continuar partida" : "Empezar partida"}
          </button>
        </Link>

        {meta?.terminado && (
          <Link to="/resultados" className="w-full">
            <button className="w-full px-6 py-2.5 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 hover:bg-gray-50 transition">
              Ver últimos resultados
            </button>
          </Link>
        )}
      </div>

      <div className="mt-10 text-xs text-gray-400 text-center">
        Diseña tu vida con cartas: cada decisión tiene consecuencia.
      </div>
    </div>
  );
}
