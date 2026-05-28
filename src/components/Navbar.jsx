import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-2">
      <ul className="flex gap-4 items-center">
        <li>
          <Link to="/" className="hover:underline">Inicio</Link>
        </li>
        <li>
          <Link to="/juego" className="hover:underline">Juego</Link>
        </li>
        <li>
          <Link to="/resultados" className="hover:underline">Resultados</Link>
        </li>
      </ul>
    </nav>
  );
}
