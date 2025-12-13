// src/components/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { FaTelegramPlane, FaInstagram, FaGlobe } from "react-icons/fa";

export default function Home() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState("UZ");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const navItems = [
    { id: 1, title: "Home", path: "/" },
    { id: 2, title: "Roles", path: "/#roles" },
    { id: 3, title: "Contact", path: "/contact" },
  ];

  const roles = [
    {
      id: 1,
      title: "Admin",
      path: "/admin/login",
      color: "bg-blue-600 hover:bg-blue-700 shadow-blue-400/50",
    },
    {
      id: 2,
      title: "O‘qituvchi",
      path: "/teacher/login",
      color: "bg-green-600 hover:bg-green-700 shadow-green-400/50",
    },
    {
      id: 3,
      title: "O‘quvchi",
      path: "/student/login",
      color: "bg-yellow-500 hover:bg-yellow-600 shadow-yellow-400/50",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md fixed w-full z-50 transition-colors duration-300">
        <div className="container mx-auto flex justify-between items-center py-4 px-6">
          {/* Left - Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <svg
              className="w-8 h-8 text-blue-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C9.243 2 7 4.243 7 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5zm0 8c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" />
              <circle cx="12" cy="12" r="1" />
            </svg>
            <span className="text-xl font-bold text-gray-800 dark:text-white">
              Online Test
            </span>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="text-gray-700 dark:text-gray-300 hover:text-indigo-500 dark:hover:text-indigo-400 transition font-medium"
              >
                {item.title}
              </button>
            ))}
          </nav>

          {/* Right - Language & DarkMode */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLang(lang === "EN" ? "UZ" : "EN")}
              className="px-3 py-1 border rounded text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition font-medium"
            >
              {lang}
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
              {darkMode ? (
                <SunIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                <MoonIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-32 px-6 mt-16">
        <div className="container mx-auto text-center max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
            Testlarni Onlayn, Har Qachon, Har Joyda Oling
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Quyida rolni tanlang: Admin, O‘qituvchi yoki O‘quvchi. Testlarni
            boshqarish yoki o‘tkazish endi juda oson va xavfsiz.
          </p>
        </div>
      </section>

      {/* Main Section */}
      <main className="bg-gray-50 dark:bg-gray-900 py-16 transition-colors duration-300">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-10 text-gray-800 dark:text-white">
            Rolni tanlang
          </h2>
          <div className="grid md:grid-cols-3 gap-8 justify-items-center">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => navigate(role.path)}
                className={`${role.color} cursor-pointer rounded-xl shadow-lg p-10 text-white text-center transform transition duration-300 hover:scale-105 hover:shadow-2xl`}
              >
                <h3 className="text-2xl font-semibold">{role.title}</h3>
                <p className="mt-2 text-sm opacity-90">
                  {role.title} sifatida tizimga kiring
                </p>
              </div>
            ))}
          </div>

          {/* About Section */}
          <div className="mt-20 text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Platforma haqida</h3>
            <p className="mb-4">
              Bu platforma orqali siz testlarni boshqarishingiz, yaratishingiz
              va o‘tkazishingiz mumkin. Adminlar testlarni boshqaradi,
              o‘qituvchilar testlarni yaratadi va nazorat qiladi, o‘quvchilar
              esa testlarni qulay va xavfsiz tarzda bajaradi.
            </p>
            <p>
              Platforma interaktiv va intuitiv dizayn bilan ishlashni
              osonlashtiradi, shuningdek, barcha foydalanuvchilar uchun xavfsiz
              va tezkor tizimni ta’minlaydi.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 transition-colors text-white py-8 mt-16 transition-colors duration-300">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          {/* Copyright */}
          <span className="text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Online Test Platform. Barcha
            huquqlar himoyalangan.
          </span>

          {/* Quick Links */}
          <div className="flex space-x-6 mb-4 md:mb-0">
            <a
              href="/"
              className="text-gray-300 hover:text-white transition text-sm"
            >
              Home
            </a>
            <a
              href="/#roles"
              className="text-gray-300 hover:text-white transition text-sm"
            >
              Rol tanlash
            </a>
            <a
              href="/contact"
              className="text-gray-300 hover:text-white transition text-sm"
            >
              Contact
            </a>
            <a
              href="/about"
              className="text-gray-300 hover:text-white transition text-sm"
            >
              Platforma haqida
            </a>
          </div>
        </div>

        {/* Social & Personal Info */}
        <div className="container mx-auto px-6 mt-6 flex flex-col md:flex-row justify-between items-center border-t border-gray-700 pt-4">
          {/* Social Icons */}
          <div className="flex space-x-4 mb-4 md:mb-0">
            <a
              href="https://t.me/Dostonbek_Solijonov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition text-2xl"
            >
              <FaTelegramPlane />
            </a>
            <a
              href="https://instagram.com/soliyev_web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition text-2xl"
            >
              <FaInstagram />
            </a>
            <a
              href="https://soliyev.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition text-2xl"
            >
              <FaGlobe />
            </a>
          </div>

          {/* Personal Info */}
          <div className="text-gray-300 text-sm text-center md:text-right">
            <p>Dostonbek Solijonov</p>
            <p>Email: solijonovd97@gmail.com</p>
            <p>Tel: +998 91 325 77 06</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
