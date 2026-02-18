import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Tasdiqlash", 
  message, 
  confirmText = "Ha", 
  cancelText = "Yo'q",
  type = "info" // 'info' | 'danger' | 'warning' | 'success'
}) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          icon: <AlertCircle className="text-red-500" size={32} />,
          btn: "bg-red-600 hover:bg-red-700 shadow-red-600/30",
          text: "text-red-600"
        };
      case "warning":
        return {
          bg: "bg-yellow-500/10",
          border: "border-yellow-500/20",
          icon: <AlertCircle className="text-yellow-500" size={32} />,
          btn: "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-600/30",
          text: "text-yellow-600"
        };
      case "success":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/20",
          icon: <CheckCircle2 className="text-green-500" size={32} />,
          btn: "bg-green-600 hover:bg-green-700 shadow-green-600/30",
          text: "text-green-600"
        };
      default:
        return {
          bg: "bg-indigo-500/10",
          border: "border-indigo-500/20",
          icon: <Info className="text-indigo-500" size={32} />,
          btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30",
          text: "text-indigo-600"
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="
          relative w-full max-w-md
          bg-solid-secondary
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

        <div className="p-10 pb-8 flex flex-col items-center text-center">
          {/* Icon Container */}
          <div className={`w-20 h-20 ${styles.bg} ${styles.border} border rounded-[1.5rem] flex items-center justify-center mb-6`}>
            {styles.icon}
          </div>

          {/* Content */}
          <h3 className="text-2xl font-black text-primary uppercase tracking-tight italic mb-3">
            {title}
          </h3>
          <p className="text-secondary font-medium leading-relaxed mb-8">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-4 w-full">
            <button
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
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`
                flex-1 py-4 rounded-2xl
                text-white font-black uppercase tracking-widest text-[10px]
                shadow-xl transition-all hover:scale-[1.02] active:scale-95
                ${styles.btn}
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className={`h-1.5 w-full ${styles.btn.split(' ')[0]}`} />
      </div>
    </div>
  );
}
