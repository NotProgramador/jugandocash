export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-2">
      <ul className="flex gap-4">
        <li><a href="/">Inicio</a></li>
        <li><a href="/juego">Juego</a></li>
        <li><a href="/resultados">Resultados</a></li>
      </ul>
    </nav>
  );
}
