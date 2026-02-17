export default function CardNormal({ texto, onSiguiente }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center max-w-lg mx-auto my-8">
      <p className="text-lg font-semibold mb-4">{texto}</p>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
        onClick={onSiguiente}
      >
        Siguiente
      </button>
    </div>
  );
}
