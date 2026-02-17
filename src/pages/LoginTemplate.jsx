import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import logo from "../assets/logo.svg";
import { loginUser, studentIndividualLogin, requestRetake } from "../api/api";

export default function LoginTemplate({ role, loginPath, initialUsername = "", initialPassword = "" }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [fullName, setFullName] = useState("");
  const [isIndividual, setIsIndividual] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (role === "Student" && !isIndividual && !fullName.trim()) {
      return toast.warning("Iltimos, ism va familiyangizni kiriting!");
    }

    setLoading(true);
    try {
      if (role === "Student" && isIndividual) {
        localStorage.clear(); // Clear any existing guest session/garbage
        const { data } = await studentIndividualLogin({ username, password });
        localStorage.setItem("studentId", data._id);
        localStorage.setItem("fullName", data.fullName);
        localStorage.setItem("teacherId", data.teacherId);
        localStorage.setItem("groupId", data.groupId || "");
        localStorage.setItem("userRole", "student"); // Consistent key with Admin/Teacher
        toast.success("Xush kelibsiz, " + data.fullName);
        navigate("/student/dashboard");
      } else {
        // ✅ For guests, still check if they have a studentId in localStorage
        const existingStudentId = role === "Student" ? localStorage.getItem("studentId") : "";

        const data = await loginUser(
          role.toLowerCase(),
          username,
          password,
          fullName,
          existingStudentId
        );

        toast.success(data.message);

        if (role === "Student") {
          navigate(loginPath, { state: { testData: data } });
        } else {
          navigate(loginPath);
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message || "Login xato!";
      
      // ✅ Handle Forbidden 403 errors specifically
      if (err.response?.status === 403) {
         const { alreadyTaken, teacherId, testId } = err.response.data || {};
         
         if (alreadyTaken) {
            if (window.confirm(errorMsg + "\n\nQayta yechish uchun ustozga so'rov yuborasizmi?")) {
               try {
                 const studentId = localStorage.getItem("studentId");
                 if (!studentId) {
                   toast.error("So'rov yuborish uchun tizimga shaxsiy kabinet orqali kirgan bo'lishingiz kerak.");
                   return setIsIndividual(true);
                 }
                 toast.info("So'rov yuborilmoqda...");
                 const res = await requestRetake({ studentId, testId, teacherId });
                 toast.success(res.data.msg || "So'rov yuborildi!");
               } catch (e) {
                 toast.error(e.response?.data?.msg || "So'rov yuborishda xatolik");
               }
            }
         } else {
            // Other 403 (Group restricted, etc.)
            toast.error(errorMsg);
            
            // If they are a guest with an existing studentId, maybe that's the problem
            if (role === "Student" && !isIndividual && localStorage.getItem("studentId")) {
               if (window.confirm("Balki eski sessiya xalaqit berayotgan bo'lishi mumkin. Sessiyani tozalab qaytadan urinib ko'rasizmi?")) {
                  localStorage.removeItem("studentId");
                  localStorage.removeItem("fullName");
                  localStorage.removeItem("teacherId");
                  localStorage.removeItem("groupId");
                  toast.info("Sessiya tozalandi. Qayta urinib ko'ring.");
               }
            }
         }
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-primary text-primary overflow-hidden px-6 transition-colors duration-300">
      {/* Glow background */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-indigo-600/10 dark:bg-indigo-600/30 rounded-full blur-3xl animate-blob pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/30 rounded-full blur-3xl animate-blob animation-delay-2000 pointer-events-none" />

      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="
          relative z-10 w-full max-w-md
          backdrop-blur-2xl bg-secondary/50
          border border-primary
          rounded-[32px] p-10
          shadow-2xl
        "
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-indigo-600/20">
            T
          </div>
        </div>

        {/* Title */}
        <h2 className="text-4xl font-black text-center mb-2 text-primary tracking-tighter uppercase italic">
          {role === "Student" ? "Testga" : role} <span className="text-indigo-600 dark:text-indigo-400">{role === "Student" ? "Kirish" : "Login"}</span>
        </h2>

        <p className="text-center text-muted text-xs font-bold uppercase tracking-widest mb-6 opacity-70">
          OsonTestOl Platformasi
        </p>

        {role === "Student" && (
          <div className="flex bg-primary/30 p-1 rounded-2xl mb-8 border border-primary/20">
            <button 
              type="button"
              onClick={() => setIsIndividual(false)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isIndividual ? 'bg-indigo-600 text-white shadow-lg' : 'text-muted hover:text-primary'}`}
            >
              Testga Kirish
            </button>
            <button 
              type="button"
              onClick={() => setIsIndividual(true)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isIndividual ? 'bg-indigo-600 text-white shadow-lg' : 'text-muted hover:text-primary'}`}
            >
              Shaxsiy Kabinet
            </button>
          </div>
        )}

        {/* Student Full Name - Only for Guest */}
        {role === "Student" && !isIndividual && (
          <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2 ml-1">
              Ism va Familiya
            </label>
            <input
              type="text"
              placeholder="Ali Valiyev"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="
                w-full p-4 rounded-2xl
                bg-primary border border-primary
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                outline-none transition-all shadow-sm
                text-primary placeholder:text-muted/50
              "
            />
          </div>
        )}

        {/* Username */}
        <div className="mb-6">
          <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2 ml-1">
            {role === "Student" && !isIndividual ? "Test Logini" : "Login"}
          </label>
          <input
            type="text"
            placeholder={
              role === "Student" && !isIndividual ? "O'qituvchi bergan login" : "Loginni kiriting"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="
              w-full p-4 rounded-2xl
              bg-primary border border-primary
              focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
              outline-none transition-all shadow-sm
              text-primary placeholder:text-muted/50
            "
          />
        </div>

        {/* Password */}
        <div className="mb-10">
          <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2 ml-1">
            {isIndividual ? "Parol" : "Test Paroli"}
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full p-4 rounded-2xl
              bg-primary border border-primary
              focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
              outline-none transition-all shadow-sm
              text-primary placeholder:text-muted/50
            "
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-5 rounded-2xl
            font-black uppercase tracking-[0.2em] text-xs
            transition-all flex items-center justify-center gap-3
            ${
              loading
                ? "bg-secondary text-muted cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95"
            }
          `}
        >
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>

        {role === "Student" && (
          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-muted mb-4 italic">Sizda hali akkaunt yo'qmi?</p>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest transition-colors"
            >
              Ro'yxatdan o'tish
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
