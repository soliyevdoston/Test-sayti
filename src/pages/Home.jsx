import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaTelegramPlane,
  FaInstagram,
  FaGlobe,
} from "react-icons/fa";

export default function HomeFinalFixed() {
  const navigate = useNavigate();

  const roles = [
    {
      title: "ADMIN",
      desc: "Boshqaruv & nazorat",
      path: "/admin/login",
      gradient: "from-cyan-400 to-blue-600",
    },
    {
      title: "TEACHER",
      desc: "Testlar va tahlil",
      path: "/teacher/login",
      gradient: "from-green-400 to-emerald-600",
    },
    {
      title: "STUDENT",
      desc: "Bilimni sinash",
      path: "/student/login",
      gradient: "from-yellow-400 to-orange-500",
    },
  ];

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black text-white">
      {/* ================= 1-SAHIFA (HERO + ABOUT) ================= */}
      <section className="relative h-screen snap-start flex flex-col justify-between px-6">
        {/* Glow */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl" />
        </div>

        {/* HERO */}
        <div className="relative z-10 flex-1 flex mt-[200px] justify-center text-center">
          <div className="max-w-3xl">
            <span className="text-sm tracking-widest text-gray-400">
              ONLINE TEST PLATFORM
            </span>

            <h1 className="text-5xl md:text-7xl font-extrabold mt-6 mb-8">
              Knowledge <span className="text-cyan-400">Gateway</span>
            </h1>

            <p className="text-gray-400 text-lg">
              Ta’limni raqamlashtiruvchi zamonaviy test tizimi. Minimal.
              Xavfsiz. Tez.
            </p>
          </div>
        </div>

        {/* ABOUT */}
        <div className="relative z-10 max-w-4xl mx-auto text-center pb-[350px]">
          <p className="text-gray-400 leading-relaxed max-w-3xl mx-auto text-center">
            Ushbu platforma o‘qituvchilar va o‘quvchilar uchun yagona raqamli
            test muhitini yaratish maqsadida ishlab chiqilgan. Testga kirish
            uchun o‘qituvchi tomonidan berilgan login va paroldan foydalaning.
            Testlar
            <span className="text-cyan-400 font-semibold">
              {" "}
              Word (.docx)
            </span>{" "}
            formatida yuklanadi. Javoblaringiz avtomatik saqlanadi va test
            tugagach natijangiz ko‘rsatiladi.
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-gray-400 text-sm">Scroll qiling</span>
          <div className="w-3 h-3 border-b-2 border-r-2 border-gray-400 rotate-45 animate-bounce"></div>
        </div>
      </section>

      {/* ================= 2-SAHIFA (ROLES + FOOTER) ================= */}
      <section className="snap-start min-h-screen flex flex-col px-6">
        {/* ROLES */}
        <div className="flex-1 flex items-center">
          <div className="max-w-6xl mx-auto w-full">
            <h2 className="text-4xl font-bold text-center mb-16">
              Tizimga kirish
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              {roles.map((role, i) => (
                <div
                  key={i}
                  onClick={() => navigate(role.path)}
                  className="cursor-pointer backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-10 hover:scale-105 transition"
                >
                  <div
                    className={`h-1 w-20 mb-6 bg-gradient-to-r ${role.gradient}`}
                  />

                  <h3 className="text-2xl font-bold mb-2">{role.title}</h3>

                  <p className="text-gray-400 mb-8">{role.desc}</p>

                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    Kirish <FaArrowRight />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER (shu sahifaning pastida) */}
        <footer className="border-t border-white/10 py-8 mt-16">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-500 text-sm text-center md:text-left">
              © {new Date().getFullYear()}{" "}
              <span className="text-white font-medium">
                Dostonbek Solijonov
              </span>
              <br />
              Developer · soliyev.uz
            </div>

            <div className="flex gap-8 text-2xl">
              <a
                href="https://t.me/Dostonbek_Solijonov"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400 transition"
              >
                <FaTelegramPlane />
              </a>
              <a
                href="https://instagram.com/soliyev_web"
                target="_blank"
                rel="noreferrer"
                className="hover:text-pink-500 transition"
              >
                <FaInstagram />
              </a>
              <a
                href="https://soliyev.uz"
                target="_blank"
                rel="noreferrer"
                className="hover:text-green-400 transition"
              >
                <FaGlobe />
              </a>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
