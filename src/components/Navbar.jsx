import { NavLink } from "react-router-dom";

const linkClasses = ({ isActive }) =>
  `relative px-3 py-1.5 rounded-lg text-sm font-medium transition ${
    isActive
      ? "bg-white/10 text-white"
      : "text-gray-300 hover:text-white hover:bg-white/5"
  }`;

export default function Navbar() {
  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400 to-indigo-500 grid place-items-center text-[12px] font-extrabold text-white shadow"
            aria-hidden
          >
            $
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Jugando con el Dinero
          </span>
        </div>
        <ul className="flex gap-1 items-center">
          <li>
            <NavLink to="/" end className={linkClasses}>
              Inicio
            </NavLink>
          </li>
          <li>
            <NavLink to="/juego" className={linkClasses}>
              Juego
            </NavLink>
          </li>
          <li>
            <NavLink to="/resultados" className={linkClasses}>
              Resultados
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
}
