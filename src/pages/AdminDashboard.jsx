import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogOut, Shield, Trash2 } from "lucide-react";
import { createTeacher, getTeachers, deleteTeacher } from "../api/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  // Forma ma'lumotlari
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
  });

  // --- O'qituvchilar ro'yxatini olish ---
  const fetchTeachers = async () => {
    try {
      const res = await getTeachers();
      // Serverdan kelgan ma'lumot Array ekanligini tekshiramiz
      if (Array.isArray(res.data)) {
        setTeachers(res.data);
      } else {
        console.error("Serverdan noto'g'ri format:", res.data);
        setTeachers([]); // Xato bo'lsa bo'sh ro'yxat
      }
    } catch (e) {
      console.error(e);
      toast.error("O'qituvchilar ro'yxati olinmadi");
      setTeachers([]);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // --- O'qituvchi qo'shish ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password) {
      return toast.warning("Barcha qatorlarni to'ldiring!");
    }
    try {
      setLoading(true);
      await createTeacher(formData);
      toast.success("O'qituvchi muvaffaqiyatli qo'shildi!");
      setFormData({ fullName: "", username: "", password: "" });
      fetchTeachers(); // Ro'yxatni yangilash
    } catch (error) {
      toast.error(error.response?.data?.msg || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // --- O'qituvchi o'chirish ---
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "O'qituvchini va uning barcha testlarini o'chirishni xohlaysizmi?"
      )
    )
      return;
    try {
      await deleteTeacher(id);
      toast.success("O'qituvchi o'chirildi");
      fetchTeachers(); // Ro'yxatni yangilash
    } catch (e) {
      toast.error("O'qituvchi o'chirilmadi");
    }
  };

  // --- Chiqish ---
  const logout = () => {
    navigate("/admin/login");
    toast.info("Chiqildi");
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-blue-400" /> Admin Panel
        </h1>
        <button
          onClick={logout}
          className="text-gray-300 hover:text-white flex items-center gap-2 transition"
        >
          <LogOut size={18} /> Chiqish
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 mt-10 space-y-10">
        {/* 1. O'qituvchi qo'shish */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6 border-b pb-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <UserPlus size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Yangi O'qituvchi Qo'shish
              </h2>
              <p className="text-gray-500 text-sm">
                Tizimga kirish uchun login va parol yarating
              </p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                F.I.SH (To'liq ism)
              </label>
              <input
                type="text"
                placeholder="Masalan: Eshmat Toshmatov"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Login (Username)
                </label>
                <input
                  type="text"
                  placeholder="teacher1"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Parol
                </label>
                <input
                  type="text"
                  placeholder="parol123"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition transform active:scale-[0.99]"
            >
              {loading ? "Saqlanmoqda..." : "O'qituvchini Saqlash"}
            </button>
          </form>
        </div>

        {/* 2. O'qituvchilar ro'yxati */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            O'qituvchilar Ro'yxati
          </h2>

          {/* Tekshiruv: Array bo'lsa va bo'sh bo'lmasa */}
          {Array.isArray(teachers) && teachers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-4 py-2 text-left">F.I.SH</th>
                    <th className="border px-4 py-2 text-left">Login</th>
                    <th className="border px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((tch) => (
                    <tr key={tch._id} className="hover:bg-gray-50">
                      <td className="border px-4 py-2">{tch.fullName}</td>
                      <td className="border px-4 py-2">{tch.username}</td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          onClick={() => handleDelete(tch._id)}
                          className="text-red-600 hover:text-red-800 flex items-center justify-center gap-2 px-3 py-1 border rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} /> O'chirish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">Hozircha o'qituvchi yo'q.</p>
              <p className="text-gray-400 text-sm mt-2">
                Yuqoridagi forma orqali yangi o'qituvchi qo'shing.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
