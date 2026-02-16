import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { User, Phone, MapPin, Building, Globe, Mail, Camera, Save } from "lucide-react";

export default function Profile() {
  const [role, setRole] = useState("student");
  const [user, setUser] = useState({
    fullName: "",
    username: "",
    email: "user@example.com",
    phone: "",
    role: "",
    markaz: "",
    shahar: "",
    bio: ""
  });

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") || "student";
    const savedName = localStorage.getItem(savedRole === "teacher" ? "teacherName" : "studentName") || "";
    setRole(savedRole);
    setUser(prev => ({
      ...prev,
      fullName: savedName,
      role: savedRole === "teacher" ? "O'qituvchi" : "O'quvchi",
      username: savedName.toLowerCase().replace(/\s+/g, '_')
    }));
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout role={role} userName={user.fullName}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary italic uppercase tracking-tighter mb-2">Shaxsiy <span className="text-cyan-500">ma'lumotlar</span></h1>
          <p className="text-sm text-muted font-bold uppercase tracking-widest">Profilingizni boshqaring va yangilang</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Avatar Section */}
          <div className="lg:col-span-1">
            <div className="premium-card flex flex-col items-center">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-1">
                  <div className="w-full h-full rounded-full bg-primary flex items-center justify-center overflow-hidden">
                    <User size={64} className="text-muted opacity-20" />
                  </div>
                </div>
                <button className="absolute bottom-1 right-1 p-2 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                  <Camera size={16} />
                </button>
              </div>
              <h3 className="text-lg font-black text-primary text-center mb-1">{user.fullName}</h3>
              <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.2em] mb-4">{user.role}</p>
              
              <div className="w-full pt-6 border-t border-primary space-y-4">
                <div className="flex items-center gap-3 text-muted">
                  <Mail size={16} className="text-cyan-500" />
                  <span className="text-xs font-bold">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted">
                  <Phone size={16} className="text-cyan-500" />
                  <span className="text-xs font-bold">{user.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="premium-card">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">To'liq ism</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        name="fullName"
                        value={user.fullName}
                        onChange={handleChange}
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-cyan-500 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Username</label>
                    <div className="relative">
                      <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        name="username"
                        value={user.username}
                        onChange={handleChange}
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-cyan-500 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">
                      {role === "teacher" ? "Markaz nomi" : "Maktab / OTM"}
                    </label>
                    <div className="relative">
                      <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        name="markaz"
                        value={user.markaz}
                        onChange={handleChange}
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-cyan-500 transition-all text-sm font-bold"
                        placeholder={role === "teacher" ? "O'quv markazi nomi" : "Maktab raqami yoki OTM nomi"}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Shahar</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                      <input 
                        name="shahar"
                        value={user.shahar}
                        onChange={handleChange}
                        className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-3 outline-none focus:border-cyan-500 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Biografiya</label>
                  <textarea 
                    name="bio"
                    value={user.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full bg-primary/50 border border-primary rounded-2xl px-4 py-3 outline-none focus:border-cyan-500 transition-all text-sm font-medium resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-cyan-600/20 hover:scale-[1.02] active:scale-95 transition-all">
                    <Save size={18} /> Saqlash <span className="opacity-50">/ Update</span>
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
