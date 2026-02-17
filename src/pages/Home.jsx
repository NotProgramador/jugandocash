import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl font-bold mb-4">Jugando con el Dinero</h1>
      <p className="mb-4">¿Listo para iniciar tu aventura financiera?</p>
      <Link to="/juego">
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Empezar partida</button>
      </Link>
    </div>
  );
}
