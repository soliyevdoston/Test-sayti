import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogOut, Shield } from "lucide-react";
import api from "../api/api"; // API import qilamiz

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Forma ma'lumotlari
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
  });

  const handleCreate = async (e) => {
    e.preventDefault();

    // Validatsiya
    if (!formData.fullName || !formData.username || !formData.password) {
      return toast.warning("Barcha qatorlarni to'ldiring!");
    }

    try {
      setLoading(true);

      // Backendga so'rov yuborish
      // Eslatma: api.js da createTeacher funksiyasi bo'lishi kerak,
      // yoki to'g'ridan-to'g'ri axios ishlatamiz:
      await api.post("/admin/create-teacher", formData);

      toast.success("O'qituvchi muvaffaqiyatli qo'shildi!");
      setFormData({ fullName: "", username: "", password: "" }); // Formani tozalash
    } catch (error) {
      toast.error(error.response?.data?.msg || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

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
      <main className="max-w-4xl mx-auto p-6 mt-10">
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
            {/* Ism Familiya */}
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
              {/* Login */}
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

              {/* Parol */}
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
      </main>
    </div>
  );
}
