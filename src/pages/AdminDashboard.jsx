import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogOut, Shield, Trash2 } from "lucide-react";
import { createTeacher, getTeachers, deleteTeacher } from "../api/api";

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400">
        <p className="text-sm">
          © {new Date().getFullYear()} Knowledge Gateway
        </p>
        <p className="text-sm">
          Admin Panel · Built by{" "}
          <span className="text-white font-medium">Soliyev</span>
        </p>
      </div>
    </footer>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
  });

  const fetchTeachers = async () => {
    try {
      const res = await getTeachers();
      setTeachers(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("O‘qituvchilar olinmadi");
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password)
      return toast.warning("Barcha maydonlarni to‘ldiring!");

    try {
      setLoading(true);
      await createTeacher(formData);
      toast.success("O‘qituvchi qo‘shildi");
      setFormData({ fullName: "", username: "", password: "" });
      fetchTeachers();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("O‘chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteTeacher(id);
      toast.success("O‘chirilgan");
      fetchTeachers();
    } catch {
      toast.error("O‘chirishda xato");
    }
  };

  const logout = () => {
    navigate("/admin/login");
    toast.info("Chiqildi");
  };

  return (
    <div className="min-h-screen relative bg-black text-white overflow-hidden px-6 flex flex-col">
      {/* ---------- Glow Background ---------- */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl animate-blob" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl animate-blob animation-delay-2000" />

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="text-indigo-400" size={20} /> Admin Dashboard
          </h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <LogOut size={18} /> Chiqish
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="flex-grow max-w-6xl mx-auto px-6 py-20 space-y-20 relative z-10">
        {/* -------- CREATE TEACHER -------- */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
            <UserPlus size={24} /> Yangi o‘qituvchi qo‘shish
          </h2>

          <form onSubmit={handleCreate} className="space-y-6">
            <input
              type="text"
              placeholder="To‘liq ism"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />

            <div className="grid md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
              <input
                type="text"
                placeholder="Parol"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
              />
            </div>

            <button
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold transition transform ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105"
              }`}
            >
              {loading ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        </section>

        {/* -------- TEACHERS LIST -------- */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6">
            O‘qituvchilar ro‘yxati
          </h2>

          {teachers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 text-left">Ism</th>
                    <th className="py-3 text-left">Login</th>
                    <th className="py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr
                      key={t._id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="py-3">{t.fullName}</td>
                      <td className="py-3">{t.username}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-500"
                        >
                          <Trash2 size={15} /> O‘chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">Hozircha o‘qituvchi yo‘q</p>
          )}
        </section>
      </main>

      <Footer />

      <style>
        {`
          @keyframes blob {
            0%,100% { transform: translate(0px,0px) scale(1); }
            33% { transform: translate(30px,-50px) scale(1.1); }
            66% { transform: translate(-20px,20px) scale(0.9); }
          }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
        `}
      </style>
    </div>
  );
}
