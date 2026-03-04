import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.svg";

const NAV_ITEMS = [
  { id: "features", label: "Imkoniyatlar" },
  { id: "workflow", label: "Jarayon" },
  { id: "pricing", label: "Tariflar" },
  { id: "contact", label: "Bog'lanish" },
];

const rememberHomeSection = (sectionId = "") => {
  const target = String(sectionId || "").trim();
  if (!target) return;
  sessionStorage.setItem("homeScrollTarget", target);
};

export default function PublicHeader({ onNavigateSection = null }) {
  const navigate = useNavigate();

  const goHomeSection = (sectionId) => {
    if (typeof onNavigateSection === "function") {
      onNavigateSection(sectionId);
      return;
    }
    rememberHomeSection(sectionId);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-primary bg-secondary/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between">
        <button type="button" className="text-left" onClick={() => goHomeSection("hero")}>
          <div className="flex items-center gap-2">
            <img src={logo} alt="OsonTestOl logo" className="w-7 h-7 rounded-lg" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted font-bold">testonlinee.uz</p>
              <p className="text-xl font-extrabold">OsonTestOl</p>
            </div>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-5 text-xs font-bold uppercase tracking-[0.14em] text-muted">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goHomeSection(item.id)}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate("/guide")}>
            Qo'llanma
          </button>
          <button type="button" className="btn-primary" onClick={() => navigate("/teacher/register")}>
            Boshlash
          </button>
        </div>
      </div>
    </header>
  );
}
