import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed left-4 bottom-4 z-[9998] max-w-xs rounded-2xl border border-primary bg-secondary/95 backdrop-blur-sm shadow-xl p-3">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">PWA o'rnatish</p>
      <p className="text-sm text-secondary mt-1">OsonTestOl ilovasini qurilmaga o'rnatib offline rejimda ham ochishingiz mumkin.</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={async () => {
            try {
              await deferredPrompt.prompt();
              await deferredPrompt.userChoice;
            } finally {
              setDeferredPrompt(null);
            }
          }}
        >
          <Download size={14} /> O'rnatish
        </button>
        <button type="button" className="btn-secondary" onClick={() => setDismissed(true)}>
          Keyin
        </button>
      </div>
    </div>
  );
}
