import React from "react";
import { Link } from "react-router-dom";
import { Globe, Instagram, Phone, Send } from "lucide-react";
import logo from "../assets/logo.svg";

const QUICK_LINKS = [
  { label: "Asosiy", to: "/" },
  { label: "Online test", to: "/online-test-platforma" },
  { label: "Olimpiada test", to: "/olimpiada-testlar" },
  { label: "Qo'llanma", to: "/guide" },
  { label: "O'qituvchi kirish", to: "/teacher/login" },
  { label: "O'quvchi kirish", to: "/student/login" },
  { label: "Admin kirish", to: "/admin/login" },
];

const CONTACTS = [
  { icon: Send, label: "Telegram", value: "@Dostonbek_Solijonov", href: "https://t.me/Dostonbek_Solijonov" },
  { icon: Instagram, label: "Instagram", value: "@soliyev_web", href: "https://instagram.com/soliyev_web" },
  { icon: Phone, label: "Telefon", value: "+998 91 660 56 06", href: "tel:+998916605606" },
];

export default function SiteFooter({ compact = false, className = "" }) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className={`border-t border-primary bg-secondary/90 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-sm text-secondary">
          <div className="flex items-center gap-2">
            <img src={logo} alt="OsonTestOl logo" className="w-5 h-5 rounded" />
            <p>
              © {year} OsonTestOl
            </p>
          </div>
          <a
            href="https://testonlinee.uz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-blue-600 font-semibold"
          >
            <Globe size={14} />
            testonlinee.uz
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`border-t border-primary bg-secondary/95 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid lg:grid-cols-[1.2fr_1fr_1fr] gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="OsonTestOl logo" className="w-8 h-8 rounded-lg" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">testonlinee.uz</p>
              <p className="text-xl font-extrabold">OsonTestOl</p>
            </div>
          </div>
          <p className="text-sm text-secondary mt-3 max-w-md">
            O'qituvchi, o'quvchi va admin jarayonlarini yagona standartda boshqarish uchun ishlab chiqilgan online
            test platformasi.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold mb-3">Bo'limlar</p>
          <div className="grid gap-2">
            {QUICK_LINKS.map((item) => (
              <Link key={item.to} to={item.to} className="text-sm text-secondary hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold mb-3">Aloqa</p>
          <div className="grid gap-2.5">
            {CONTACTS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors"
              >
                <item.icon size={15} className="text-blue-600" />
                <span>{item.value}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-primary">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-muted">
          <p>© {year} OsonTestOl. Barcha huquqlar himoyalangan.</p>
          <p>Professional online test boshqaruv platformasi</p>
        </div>
      </div>
    </footer>
  );
}
