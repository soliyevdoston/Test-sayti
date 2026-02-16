import React, { useState, useEffect } from "react";
import {
  FaBook,
  FaPlus,
  FaTrash,
  FaEdit,
  FaGraduationCap
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";

import { 
  getTeacherSubjects, 
  addTeacherSubject, 
  deleteTeacherSubject 
} from "../api/api";

export default function TeacherSubjects() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else {
      setTeacherName(name);
      loadSubjects(id);
    }
  }, [navigate]);

  const loadSubjects = async (id) => {
    try {
      setLoading(true);
      const { data } = await getTeacherSubjects(id || localStorage.getItem("teacherId"));
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Fanlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async () => {
    const name = prompt("Yangi fan nomini kiriting:");
    if (!name) return;
    try {
      await addTeacherSubject({ 
        name, 
        teacherId: localStorage.getItem("teacherId") 
      });
      toast.success("Fan qo'shildi");
      loadSubjects();
    } catch {
      toast.error("Fan qo'shishda xatolik");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Rostdan ham ushbu fanni o'chirmoqchimisiz?")) return;
    try {
      await deleteTeacherSubject(id);
      toast.success("Fan o'chirildi");
      loadSubjects();
    } catch {
      toast.error("Fan o'chirishda xatolik");
    }
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <section className="relative z-10 pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-8 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
              Mening <span className="text-indigo-600 dark:text-indigo-400">Fanlarim</span>
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              O'qitilayotgan fanlar va o'quv dasturlarini boshqarish
            </p>
          </div>
          <button 
            onClick={handleAddSubject}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
          >
            <FaPlus /> Yangi Fan Qo'shish
          </button>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Yuklanmoqda...</p>
            </div>
          ) : subjects.length > 0 ? (
            subjects.map((sub, idx) => (
              <div key={sub._id || idx} className="premium-card group hover:border-indigo-500/50 transition-all">
                <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform`}>
                  <FaBook size={28} />
                </div>
                <h3 className="text-2xl font-black text-primary uppercase tracking-tighter mb-2 italic">{sub.name}</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-secondary/50 p-3 rounded-xl border border-primary">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">Darslar</p>
                    <p className="text-xl font-black text-primary">{sub.lessonsCount || 0}</p>
                  </div>
                  <div className="bg-secondary/50 p-3 rounded-xl border border-primary">
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest">O'quvchilar</p>
                    <p className="text-xl font-black text-primary">{sub.studentsCount || sub.pupils || 0}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-primary">
                  <button className="flex-1 py-3 bg-secondary border border-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary transition-all flex items-center justify-center gap-2">
                    <FaEdit /> Tahrirlash
                  </button>
                  <button 
                    onClick={() => handleDelete(sub._id)}
                    className="w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-primary rounded-[3rem]">
              <p className="text-muted font-black uppercase tracking-[0.3em] italic opacity-30">Fanlar ro'yxati bo'sh</p>
            </div>
          )}

          {/* New Subject Placeholder Card */}
          <div 
            onClick={handleAddSubject}
            className="border-2 border-dashed border-primary rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-indigo-500/50 transition-all"
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-secondary border border-primary flex items-center justify-center text-muted mb-4 group-hover:text-indigo-600 transition-colors">
              <FaPlus size={24} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-muted group-hover:text-primary transition-colors">Yangi Bo'lim Qo'shish</p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
