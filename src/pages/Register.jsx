import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Send, Globe, Play, ArrowRight, ShieldCheck, Lock, Phone } from "lucide-react";
import logo from "../assets/logo.svg";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: "998",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Parollar mos kelmadi!");
    }
    toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
    navigate("/student/login");
  };

  return (
    <div className="min-h-screen flex bg-white font-['Outfit'] overflow-hidden">
      {/* Left Side: Illustration Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#F8FAFC] items-center justify-center p-20 relative">
        <div className="max-w-xl w-full">
          <div className="relative group">
            {/* Illustration Placeholder - Representing the tablet sign-up from user image */}
            <div className="relative z-10 w-full aspect-[4/3] bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-8 transform rotate-[-2deg] group-hover:rotate-0 transition-transform duration-700">
               <div className="h-full w-full rounded-[2rem] bg-gradient-to-br from-indigo-500 to-blue-600 p-10 flex flex-col items-center justify-center text-center text-white">
                 <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 backdrop-blur-md">
                   <ShieldCheck size={48} />
                 </div>
                 <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">SIGN UP</h2>
                 <p className="text-lg font-medium opacity-80 uppercase tracking-widest">Create a New Account is Free</p>
                 
                 <div className="mt-12 space-y-4 w-full">
                    <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse"></div>
                    <div className="h-12 w-full bg-white/10 rounded-xl animate-pulse"></div>
                    <div className="h-16 w-full bg-indigo-400/30 rounded-xl border border-white/20"></div>
                 </div>
               </div>
            </div>
            
            {/* Decorative elements behind the "tablet" */}
            <div className="absolute top-10 right-[-40px] w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-[-40px] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 md:p-20 relative">
        <div className="max-w-md w-full space-y-10">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/20">
              T
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">osontestol.uz</p>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Ro'yxatdan o'tish</h1>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2">Telefon raqamingiz</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="998"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-gray-900 shadow-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2">Parol</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-gray-900 shadow-sm"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-gray-500 ml-2">Parolni qaytaring</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  required
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-gray-900 shadow-sm"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            {/* reCAPTCHA Placeholder */}
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input type="checkbox" className="w-6 h-6 rounded border-gray-300" id="captcha" />
                <label htmlFor="captcha" className="text-sm font-bold text-gray-700">Я не робот</label>
              </div>
              <div className="flex flex-col items-center">
                <ShieldCheck size={24} className="text-indigo-500" />
                <span className="text-[6px] font-bold text-gray-400 uppercase">reCAPTCHA</span>
              </div>
            </div>

            <p className="text-[10px] text-center text-gray-500 font-medium leading-relaxed">
              Tizimga kirish jarayonida siz, <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Foydalanish shartlari</span> va <span className="text-indigo-600 font-bold cursor-pointer hover:underline">Maxfiylik siyosatini</span> qabul qilasiz!
            </p>

            <button
              type="submit"
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              Ro'yxatdan o'tish <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="space-y-6 text-center">
            <p className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest">
               Akkauntingiz bormi?{" "}
               <button
                 type="button"
                 onClick={() => navigate("/student/login")}
                 className="text-indigo-600 hover:text-indigo-700 underline decoration-2 underline-offset-4"
               >
                 Kirish
               </button>
             </p>

            <div className="pt-8">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 italic">Biz ijtimoiy tarmoqlar</p>
              <div className="flex justify-center gap-6">
                <a href="#" className="p-3 bg-cyan-500/10 rounded-xl text-cyan-500 hover:bg-cyan-500 hover:text-white transition-all shadow-sm"><Send size={20} /></a>
                <a href="#" className="p-3 bg-blue-600/10 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Globe size={20} /></a>
                <a href="#" className="p-3 bg-red-600/10 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"><Play size={20} /></a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Target-like Logo from user image bottom right */}
        <div className="hidden md:flex absolute bottom-8 right-8 w-16 h-16 bg-white border border-gray-100 rounded-full shadow-2xl items-center justify-center p-2">
           <div className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center text-white relative">
             <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-ping"></div>
             <ShieldCheck size={28} />
           </div>
        </div>
      </div>
    </div>
  );
}
