import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogOut, Shield, Trash2, Activity, Globe, Zap, Users, Edit, Key, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import logo from "../assets/logo.svg";
import { createTeacher, getTeachers, deleteTeacher, updateTeacher } from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";

const Footer = () => {
  return (
    <footer className="mt-24 border-t border-primary bg-secondary/30 backdrop-blur-xl py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-muted">
        <div className="flex items-center gap-3">
           <img src={logo} alt="OsonTestOl" className="w-6 h-6 object-contain grayscale opacity-50" />
           <p className="text-sm font-bold tracking-widest uppercase">
             © {new Date().getFullYear()} OsonTestOl
           </p>
        </div>
        <p className="text-sm">
          Developed by{" "}
          <a href="https://soliyev.uz" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">Soliyev.uz</a>
        </p>
      </div>
    </footer>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info"
  });

  const showConfirm = (message, onConfirm, type = "info", title = "Tasdiqlash") => {
    setModalConfig({ isOpen: true, title, message, onConfirm, type });
  };

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});

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

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password)
      return toast.warning("Barcha maydonlarni to‘ldiring!");

    try {
      setLoading(true);
      if (editMode) {
        await updateTeacher(editingId, formData);
        toast.success("O‘qituvchi ma'lumotlari yangilandi");
      } else {
        await createTeacher(formData);
        toast.success("O‘qituvchi qo‘shildi");
      }
      setFormData({ fullName: "", username: "", password: "" });
      setEditMode(false);
      setEditingId(null);
      fetchTeachers();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teacher) => {
    setFormData({
      fullName: teacher.fullName,
      username: teacher.username,
      password: teacher.password
    });
    setEditMode(true);
    setEditingId(teacher._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (teacher) => {
    try {
      await updateTeacher(teacher._id, { ...teacher, isActive: !teacher.isActive });
      toast.success("Status o'zgardi");
      fetchTeachers();
    } catch {
      toast.error("Statusni o'zgartirishda xato");
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDelete = async (id) => {
    showConfirm(
      "O‘qituvchini o'chirishni tasdiqlaysizmi?",
      async () => {
        try {
          await deleteTeacher(id);
          toast.success("O‘chirilgan");
          fetchTeachers();
        } catch {
          toast.error("O‘chirishda xato");
        }
      },
      "danger",
      "O'qituvchini o'chirish"
    );
  };

  return (
    <DashboardLayout role="admin" userName="Admin">
      <ConfirmationModal 
        {...modalConfig} 
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-primary italic uppercase tracking-tighter mb-2">Admin <span className="text-indigo-500">Boshqaruvi</span></h1>
          <p className="text-sm text-muted font-bold uppercase tracking-widest">O'qituvchilar va tizim parametrlarini boshqaring</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Teacher Section */}
          <div className="lg:col-span-1">
            <div className="premium-card lg:sticky lg:top-28">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500"><Users size={24} /></div>
                <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">Yangi <span className="text-indigo-500">o'qituvchi</span></h2>
              </div>

               <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                <input
                  type="text"
                  placeholder="To‘liq ism"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                   className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-primary transition-all outline-none"
                />

                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-primary transition-all outline-none"
                />
                <input
                  type="text"
                  placeholder="Parol"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-primary transition-all outline-none"
                />

                 <div className="flex gap-2">
                   <button
                     type="submit"
                     disabled={loading}
                     className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                       loading ? "bg-gray-500 opacity-50" : "bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02]"
                     }`}
                   >
                    {loading ? "Saqlanmoqda..." : editMode ? "Yangilash" : "Saqlash"}
                  </button>
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditMode(false);
                        setEditingId(null);
                        setFormData({ fullName: "", username: "", password: "" });
                      }}
                      className="px-6 py-5 rounded-2xl bg-secondary border border-primary text-muted hover:text-primary transition-all font-black text-xs uppercase"
                    >
                      Bekor qilish
                    </button>
                  )}
                 </div>
              </form>
            </div>
          </div>

          {/* Teachers List Section */}
          <div className="lg:col-span-2">
            <div className="premium-card">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                       <Shield size={20} />
                    </div>
                <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">O'qituvchilar <span className="text-indigo-500">ro'yxati</span></h2>
              </div>

              {teachers.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-primary">
                    <thead className="text-muted border-b border-primary uppercase text-xs tracking-widest font-black">
                      <tr>
                        <th className="py-4 text-left">Ism</th>
                        <th className="py-4 text-left">Login / Parol</th>
                        <th className="py-4 text-center">Status</th>
                        <th className="py-4 text-center">Amallar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((t) => (
                        <tr
                          key={t._id}
                          className="border-b border-primary hover:bg-secondary/40 transition-colors"
                        >
                          <td className="py-4 font-bold">{t.fullName}</td>
                          <td className="p-4">
                                     <div className="flex flex-col gap-1">
                                       <span className="px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 w-fit">
                                         {t.username}
                                       </span>
                                       <div className="flex items-center gap-2 group/pass">
                                         <span className="text-[10px] font-mono text-muted">
                                           {showPasswords[t._id] ? t.password : "••••••••"}
                                         </span>
                                         <button 
                                           onClick={() => togglePasswordVisibility(t._id)}
                                           className="transition-opacity text-muted hover:text-indigo-500"
                                         >
                                           {showPasswords[t._id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                         </button>
                                       </div>
                                     </div>
                                 </td>
                          <td className="py-4 text-center">
                            <button
                              onClick={() => handleToggleStatus(t)}
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                                t.isActive 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                : "bg-red-500/10 text-red-600 border-red-500/20"
                              }`}
                            >
                              {t.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {t.isActive ? "Aktiv" : "Nofaol"}
                            </button>
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(t)}
                                className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white transition-all"
                                title="Tahrirlash"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(t._id)}
                                className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white transition-all"
                                title="O'chirish"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 py-20 text-center italic font-bold opacity-30">Hozircha o‘qituvchi yo‘q</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </DashboardLayout>
  );
}
