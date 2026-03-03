import React, { useState } from "react";
import { Moon, Monitor, Palette, Sun } from "lucide-react";
import { useTheme } from "../context/useTheme";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {open && (
        <div className="mb-2 premium-card p-2 w-36">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setTheme(option.id);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                theme === option.id
                  ? "bg-blue-600 text-white"
                  : "text-secondary hover:bg-accent hover:text-primary"
              }`}
            >
              <option.icon size={15} />
              {option.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-11 h-11 rounded-full border border-primary bg-secondary/95 backdrop-blur-sm text-primary flex items-center justify-center shadow-md"
      >
        <Palette size={18} />
      </button>
    </div>
  );
}
