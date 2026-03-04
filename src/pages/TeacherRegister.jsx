import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { checkLoginAvailabilityApi, createTeacher } from "../api/api";
import { registerOauthUser } from "../utils/billingTools";
import {
  checkLoginAvailability,
  isLoginConflictMessage,
} from "../utils/authIdentityTools";
import logo from "../assets/logo.svg";
import SiteFooter from "../components/SiteFooter";

const randomPassword = () => Math.random().toString(36).slice(2, 10);

const BENEFITS = [
  "Email orqali mustaqil ro'yxatdan o'tish",
  "Dashboard, test, guruh va natija bo'limlari tayyor",
  "Bepul limit bilan darhol ishni boshlash",
];

export default function TeacherRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const ensureTeacherLoginAvailable = async (email) => {
    const localCheck = checkLoginAvailability(email);
    if (!localCheck.ok) return localCheck.reason;

    try {
      const { data } = await checkLoginAvailabilityApi(email);
      if (data?.available === false) {
        return "Bu login band. Boshqa login kiriting.";
      }
    } catch {
      // Server tekshiruvi ishlamasa backend create endpointga tayangan holda davom etadi.
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.password.trim()) {
      return toast.warning("Barcha maydonlarni to'ldiring");
    }
    if (!form.email.includes("@")) {
      return toast.warning("Email noto'g'ri");
    }
    if (form.password !== form.confirmPassword) {
      return toast.warning("Parollar mos emas");
    }

    const normalizedEmail = form.email.trim().toLowerCase();

    try {
      setLoading(true);
      const loginReason = await ensureTeacherLoginAvailable(normalizedEmail);
      if (loginReason) {
        toast.error(loginReason);
        return;
      }
      await createTeacher({
        fullName: form.fullName.trim(),
        username: normalizedEmail,
        password: form.password,
      });
      toast.success("Ro'yxatdan o'tdingiz. Endi email/parol bilan kiring.");
      navigate("/teacher/login");
    } catch (err) {
      const backendMessage = err.response?.data?.msg || err.message || "";
      toast.error(isLoginConflictMessage(backendMessage) ? "Bu login band. Boshqa login kiriting." : (backendMessage || "Ro'yxatdan o'tishda xatolik"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    const email = window.prompt("Google email kiriting (gmail.com):", "");
    if (!email) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@gmail.com")) {
      return toast.warning("Faqat gmail.com email qabul qilinadi");
    }

    const fullName = window.prompt("Ism-familyani kiriting:", normalizedEmail.split("@")[0] || "");
    const generatedPassword = randomPassword();

    try {
      setLoading(true);
      const loginReason = await ensureTeacherLoginAvailable(normalizedEmail);
      if (loginReason) {
        toast.error(loginReason);
        return;
      }
      await createTeacher({
        fullName: (fullName || normalizedEmail.split("@")[0] || "Teacher").trim(),
        username: normalizedEmail,
        password: generatedPassword,
      });
      registerOauthUser({
        provider: "google",
        role: "teacher",
        fullName: (fullName || normalizedEmail.split("@")[0] || "Teacher").trim(),
        email: normalizedEmail,
      });
      toast.success("Google orqali ro'yxatdan o'tdingiz. Endi login qiling.");
      navigate("/teacher/login");
    } catch (err) {
      const backendMessage = err.response?.data?.msg || err.message || "";
      toast.error(
        isLoginConflictMessage(backendMessage)
          ? "Bu login band. Boshqa login kiriting."
          : (backendMessage || "Google ro'yxatdan o'tishda xatolik")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary relative overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl animate-blob [animation-delay:1.6s]" />

      <div className="relative z-10 flex-1 w-full px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-6xl grid lg:grid-cols-[1fr_1.08fr] gap-5 items-stretch">
          <section className="premium-card hidden lg:flex flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold border border-blue-500/20 bg-blue-500/10 text-blue-700">
                <Sparkles size={12} /> Teacher onboarding
              </p>
              <h1 className="text-4xl font-extrabold mt-4 leading-tight">
                O'qituvchi kabinetini
                <span className="block text-gradient">1 daqiqada oching</span>
              </h1>
              <p className="text-secondary mt-4 text-sm leading-relaxed">
                Admindan login kutmaysiz. Email orqali ro'yxatdan o'tib test, guruh, natija va chat bo'limlariga
                darhol kirishingiz mumkin.
              </p>

              <div className="mt-6 space-y-2">
                {BENEFITS.map((item) => (
                  <p key={item} className="text-sm text-secondary inline-flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm font-semibold text-primary inline-flex items-center gap-2">
                <ShieldCheck size={15} className="text-blue-600" /> Xavfsizlik
              </p>
              <p className="text-xs text-secondary mt-2">
                Qurilmaga asosiy login biriktiriladi. Bu orqali foydalanuvchi sessiyalari tartibli va himoyalangan
                bo'ladi.
              </p>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="premium-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold inline-flex items-center gap-2">
                <img src={logo} alt="OsonTestOl logo" className="w-4 h-4 rounded" /> OsonTestOl
              </p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Asosiy
              </button>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold mt-2">O'qituvchi ro'yxatdan o'tish</h2>
            <p className="text-sm text-secondary mt-2">Email orqali akkaunt yarating va kabinetga kiring.</p>

            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={loading}
              className="btn-secondary w-full mt-5"
            >
              Google orqali ro'yxatdan o'tish
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-primary" />
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted font-bold">yoki</p>
              <div className="h-px flex-1 bg-primary" />
            </div>

            <div className="space-y-4">
              <div className="input-icon-wrap">
                <User size={16} />
                <input
                  type="text"
                  placeholder="To'liq ism"
                  className="input-clean input-clean-icon"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="input-icon-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  className="input-clean input-clean-icon"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="input-icon-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Parol"
                  className="input-clean input-clean-icon"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="input-icon-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="Parolni tasdiqlang"
                  className="input-clean input-clean-icon"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
              {loading ? "Saqlanmoqda..." : "Ro'yxatdan o'tish"} <ArrowRight size={14} />
            </button>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <button
                type="button"
                onClick={() => navigate("/teacher/login")}
                className="text-sm text-blue-600 font-semibold"
              >
                Login sahifasiga qaytish
              </button>
              <button
                type="button"
                onClick={() => navigate("/guide")}
                className="text-xs text-secondary font-semibold"
              >
                Qo'llanmani ochish
              </button>
            </div>
          </form>
        </div>
      </div>

      <SiteFooter className="relative z-10" />
    </div>
  );
}
