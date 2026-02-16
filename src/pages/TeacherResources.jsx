import React, { useState, useEffect } from "react";
import {
  FaFileAlt,
  FaDownload,
  FaVideo,
  FaLightbulb,
  FaSearch
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

export default function TeacherResources() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else setTeacherName(name);
  }, [navigate]);

  const resources = [
    { title: "Test tuzish qoidalari", type: "PDF", date: "12.02.2026", size: "2.4 MB", icon: <FaFileAlt /> },
    { title: "Video qo'llanma: OCR", type: "VIDEO", date: "10.02.2026", size: "156 MB", icon: <FaVideo /> },
    { title: "Dars ishlanmalari", type: "DOCX", date: "08.02.2026", size: "1.1 MB", icon: <FaLightbulb /> },
  ];

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <section className="relative z-10 pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-8 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
              Test<span className="text-indigo-600 dark:text-indigo-400">Onlinee</span> Resurslari
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              Metodik qo'llanmalar, video darslar va foydali materiallar
            </p>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              placeholder="Resurslarni izlash..." 
              className="pl-12 pr-6 py-3 rounded-2xl bg-secondary border border-primary text-xs font-bold uppercase tracking-widest outline-none focus:border-indigo-500 transition-all w-64 md:w-80 shadow-sm" 
            />
          </div>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto pb-20">
        <div className="grid gap-6">
          {resources.map((res, idx) => (
            <div key={idx} className="premium-card flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-indigo-500/50 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-2xl group-hover:scale-110 transition-transform">
                  {res.icon}
                </div>
                <div>
                  <h3 className="text-lg font-black text-primary uppercase tracking-tighter italic">{res.title}</h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{res.type}</span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">•</span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">{res.date}</span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">•</span>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">{res.size}</span>
                  </div>
                </div>
              </div>
              <button className="px-6 py-3 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                <FaDownload /> Yuklab Olish
              </button>
            </div>
          ))}
          
          <div className="py-20 text-center border-2 border-dashed border-primary rounded-[3rem] bg-secondary/30">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted opacity-40">Yana ko'p resurslar tez kunda...</p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
