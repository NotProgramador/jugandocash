export default function ModalSimple({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-sm relative">
        {onClose && (
          <button
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
            onClick={onClose}
          >
            ✕
          </button>
        )}
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}
