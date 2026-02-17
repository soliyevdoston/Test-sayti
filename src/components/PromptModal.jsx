import React, { useState, useEffect } from "react";
import { Edit3, X } from "lucide-react";

export default function PromptModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Ma'lumot kiriting", 
  label, 
  placeholder,
  initialValue = "",
  confirmText = "Saqlash", 
  cancelText = "Bekor qilish"
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setValue(initialValue);
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="
          relative w-full max-w-md
          bg-secondary/60 backdrop-blur-2xl
          border border-primary
          rounded-[32px] overflow-hidden
          shadow-2xl animate-in zoom-in-95 duration-300
        "
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-muted hover:bg-primary/20 transition-all"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-10 pb-8 flex flex-col">
          {/* Icon Container */}
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Edit3 className="text-indigo-500" size={28} />
          </div>

          {/* Content */}
          <h3 className="text-2xl font-black text-primary uppercase tracking-tight italic mb-2">
            {title}
          </h3>
          <p className="text-xs text-muted font-bold uppercase tracking-widest mb-6">
            {label}
          </p>

          <input 
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-primary/20 border border-primary rounded-2xl p-4 outline-none focus:border-indigo-500 text-primary font-bold mb-8 transition-all"
          />

          {/* Actions */}
          <div className="flex gap-4 w-full">
            <button
              type="button"
              onClick={onClose}
              className="
                flex-1 py-4 rounded-2xl
                bg-primary border border-primary
                text-primary font-black uppercase tracking-widest text-[10px]
                hover:bg-secondary transition-all
              "
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="
                flex-1 py-4 rounded-2xl
                bg-indigo-600 hover:bg-indigo-700
                text-white font-black uppercase tracking-widest text-[10px]
                shadow-xl shadow-indigo-600/30 transition-all 
                hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale
              "
            >
              {confirmText}
            </button>
          </div>
        </form>

        {/* Bottom Accent */}
        <div className="h-1.5 w-full bg-indigo-600" />
      </div>
    </div>
  );
}
