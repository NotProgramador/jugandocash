import React from "react";

export default function ModalSimple({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed z-50 inset-0 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 shadow-lg w-[340px] relative">
        <button className="absolute right-3 top-3 text-gray-400" onClick={onClose}>✕</button>
        <h2 className="text-xl font-semibold mb-3">{title}</h2>
        {children}
      </div>
    </div>
  );
}
