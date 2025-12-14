import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { FaTelegramPlane, FaInstagram, FaGlobe } from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState("UZ");

  // Dark mode logikasi
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Scroll funksiyasi
  const scrollToRoles = () => {
    const section = document.getElementById("roles");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    {
      id: 1,
      title: "Home",
      action: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    },
    { id: 2, title: "Roles", action: scrollToRoles },
    { id: 3, title: "Contact", action: () => navigate("/contact") }, // Contact sahifasi bo'lsa
  ];

  const roles = [
    {
      id: 1,
      title: "Admin",
      path: "/admin/login",
      color: "bg-blue-600 hover:bg-blue-700 shadow-blue-400/50",
      desc: "Tizimni boshqarish",
    },
    {
      id: 2,
      title: "O‘qituvchi",
      path: "/teacher/login",
      color: "bg-green-600 hover:bg-green-700 shadow-green-400/50",
      desc: "Test yaratish va tahlil",
    },
    {
      id: 3,
      title: "O‘quvchi",
      path: "/student/login",
      color: "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-400/50",
      desc: "Test ishlash",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md shadow-md fixed w-full z-50 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full group-hover:rotate-12 transition">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white tracking-wide">
              Online<span className="text-blue-600">Test</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition font-medium text-sm uppercase tracking-wider"
              >
                {item.title}
              </button>
            ))}
          </nav>

          {/* Settings */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setLang(lang === "EN" ? "UZ" : "EN")}
              className="px-3 py-1 text-xs font-bold border rounded-lg text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              {lang}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-500" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white pt-40 pb-24 px-6 overflow-hidden">
        {/* Orqa fon bezagi (Doiralar) */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-x-10 -translate-y-10"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500 opacity-20 rounded-full blur-3xl translate-x-20 translate-y-20"></div>

        <div className="container mx-auto text-center max-w-3xl relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight animate-fade-in-up">
            Bilimingizni <span className="text-yellow-300">Sinovdan</span>{" "}
            O'tkazing
          </h1>
          <p className="text-lg md:text-xl mb-10 opacity-90 font-light">
            O‘qituvchilar uchun qulay test yaratish tizimi va o‘quvchilar uchun
            xavfsiz imtihon platformasi.
          </p>
          <button
            onClick={scrollToRoles}
            className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 hover:scale-105 transition transform"
          >
            Boshlash
          </button>
        </div>
      </section>

      {/* Roles Section */}
      <main
        id="roles"
        className="bg-gray-50 dark:bg-gray-900 py-20 transition-colors duration-300"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
              Tizimga kirish
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              O'zingizga tegishli rolni tanlang
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => navigate(role.path)}
                className={`${role.color} cursor-pointer rounded-2xl shadow-xl p-8 text-white text-center transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center justify-center min-h-[200px]`}
              >
                <h3 className="text-3xl font-bold mb-2">{role.title}</h3>
                <p className="text-white/80 text-sm font-medium">{role.desc}</p>
              </div>
            ))}
          </div>

          {/* About Section */}
          <div className="mt-24 bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-12 shadow-lg max-w-4xl mx-auto text-center border dark:border-gray-700">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
              Platforma haqida
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              Bu platforma ta'lim jarayonini raqamlashtirish maqsadida ishlab
              chiqilgan. Adminlar umumiy nazoratni olib boradi, o‘qituvchilar{" "}
              <span className="font-semibold text-blue-500">Word (.docx)</span>{" "}
              formatidagi testlarni yuklaydi va natijalarni real vaqtda
              kuzatadi.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              O‘quvchilar esa chalg‘ituvchi omillarsiz, xavfsiz muhitda test
              topshiradilar. Natijalar avtomatik hisoblanadi va darhol e'lon
              qilinadi.
            </p>
          </div>
        </div>
      </main>

      {/* Footer (Tuzatilgan) */}
      <footer className="bg-gray-900 text-gray-300 py-10 mt-auto">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-8 mb-8">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h4 className="text-white text-xl font-bold mb-2">
                Online Test Platform
              </h4>
              <p className="text-sm text-gray-400">
                Zamonaviy ta'lim yechimlari.
              </p>
            </div>

            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition">
                Bosh sahifa
              </a>
              <a
                href="#roles"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToRoles();
                }}
                className="hover:text-white transition"
              >
                Kirish
              </a>
              <a href="#" className="hover:text-white transition">
                Bog'lanish
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center">
            <span className="text-sm text-gray-500 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Dostonbek Solijonov. Barcha
              huquqlar himoyalangan.
            </span>

            <div className="flex items-center gap-6">
              <a
                href="https://t.me/Dostonbek_Solijonov"
                target="_blank"
                rel="noreferrer"
                className="text-2xl hover:text-blue-400 transition transform hover:scale-110"
              >
                <FaTelegramPlane />
              </a>
              <a
                href="https://instagram.com/soliyev_web"
                target="_blank"
                rel="noreferrer"
                className="text-2xl hover:text-pink-500 transition transform hover:scale-110"
              >
                <FaInstagram />
              </a>
              <a
                href="https://soliyev.uz"
                target="_blank"
                rel="noreferrer"
                className="text-2xl hover:text-green-400 transition transform hover:scale-110"
              >
                <FaGlobe />
              </a>
            </div>
          </div>

          <div className="text-center mt-8 text-xs text-gray-600">
            <p>Developer: Dostonbek Solijonov | Tel: +998 91 325 77 06</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
