import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { User, Phone, MapPin, Building, Globe, Mail, Camera, Save, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { updateAdminApi } from "../api/api";

export default function Profile() {
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState({
    fullName: "",
    username: "",
    password: "", // Added password
    email: "user@example.com",
    phone: "",
    role: "",
    markaz: "",
    shahar: "",
    bio: ""
  });

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") || "student";
    let savedName = "";
    
    if (savedRole === "admin") {
      savedName = localStorage.getItem("schoolName") || "Admin";
    } else if (savedRole === "teacher") {
      savedName = localStorage.getItem("teacherName") || "";
    } else {
      savedName = localStorage.getItem("studentName") || "";
    }

    setRole(savedRole);
    setUser(prev => ({
      ...prev,
      fullName: savedName,
      role: savedRole === "admin" ? "Administrator" : savedRole === "teacher" ? "O'qituvchi" : "O'quvchi",
      username: savedName.toLowerCase().replace(/\s+/g, '_')
    }));
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (role === "admin") {
        const schoolId = localStorage.getItem("schoolId");
        if (!schoolId) {
          // If no schoolId (initial static login), we might need to create it or prompt
          // For now, assume it exists if they used the new login flow
          toast.error("Tizimda xatolik: schoolId topilmadi");
          return;
        }
        await updateAdminApi(schoolId, {
          name: user.fullName,
          adminPassword: user.password,
          address: user.shahar,
          contact: user.phone
        });
        localStorage.setItem("schoolName", user.fullName);
        toast.success("Admin ma'lumotlari yangilandi!");
      } else {
        toast.info("Bu funksiya tez orada ishga tushadi!");
      }
    } catch (err) {
      toast.error("Saqlashda xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role={role} userName={user.fullName}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary italic uppercase tracking-tighter mb-2">Shaxsiy <span className="text-indigo-500">ma'lumotlar</span></h1>
          <p className="text-sm text-muted font-bold uppercase tracking-widest">Profilingizni boshqaring va yangilang</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="premium-card flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 p-1">
                  <div className="w-full h-full rounded-full bg-primary flex items-center justify-center overflow-hidden">
                    <User size={64} className="text-muted opacity-20" />
                  </div>
                </div>
                <button className="absolute bottom-1 right-1 p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                  <Camera size={16} />
                </button>
              </div>
              <h3 className="text-lg font-black text-primary text-center mb-1">{user.fullName}</h3>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mb-4">{user.role}</p>
              
              <div className="w-full pt-6 border-t border-primary space-y-4">
                <div className="flex items-center gap-3 text-muted">
                  <Mail size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted">
                  <Phone size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold">{user.phone || "+998 ..."}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="premium-card">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">{role === "admin" ? "Maktab / Tizim nomi" : "To'liq ism"}</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        name="fullName"
                        value={user.fullName}
                        onChange={handleChange}
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Yangi Parol</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={user.password}
                        onChange={handleChange}
                        placeholder="Yangi parolni kiriting"
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-12 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-bold font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-indigo-500"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
                      {role === "teacher" ? "Markaz nomi" : role === "admin" ? "Kontakt" : "Maktab / OTM"}
                    </label>
                    <div className="relative">
                      {role === "admin" ? <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" /> : <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />}
                      <input 
                        name={role === "admin" ? "phone" : "markaz"}
                        value={role === "admin" ? user.phone : user.markaz}
                        onChange={handleChange}
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                        placeholder={role === "teacher" ? "O'quv markazi nomi" : role === "admin" ? "Telefon raqami" : "Maktab raqami yoki OTM nomi"}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Shahar / Viloyat</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        name="shahar"
                        value={user.shahar}
                        onChange={handleChange}
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                {role !== "admin" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Biografiya</label>
                    <textarea 
                      name="bio"
                      value={user.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full bg-primary/50 border border-primary rounded-2xl px-4 py-3 outline-none focus:border-indigo-500 transition-all text-sm font-medium resize-none"
                    />
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {loading ? "Saqlanmoqda..." : <><Save size={18} /> Saqlash <span className="opacity-50">/ Update</span></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
