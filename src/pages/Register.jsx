import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { checkLoginAvailabilityApi, registerPersonalStudentApi } from "../api/api";
import { registerOauthUser } from "../utils/billingTools";
import { checkLoginAvailability } from "../utils/authIdentityTools";
import logo from "../assets/logo.svg";
import SiteFooter from "../components/SiteFooter";

const STUDENT_BENEFITS = [
  "Shaxsiy kabinet orqali testlar ro'yxatini ko'rish",
  "Yechilgan testlar tarixini saqlash",
  "Qayta yechish so'rovini to'g'ridan-to'g'ri yuborish",
];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "998",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const ensureStudentLoginAvailable = async (email) => {
    const localCheck = checkLoginAvailability(email);
    if (!localCheck.ok) return localCheck.reason;

    try {
      const { data } = await checkLoginAvailabilityApi(email);
      if (data?.available === false) {
        return "Bu login band. Boshqa login kiriting.";
      }
    } catch {
      // Server tekshiruvi ishlamasa local tekshiruv bilan davom etamiz.
    }

    return "";
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.password.trim()) {
      return toast.warning("Majburiy maydonlarni to'ldiring");
    }
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Parollar mos kelmadi");
    }

    const normalizedEmail = String(formData.email || "").trim().toLowerCase();
    if (!normalizedEmail.endsWith("@gmail.com")) {
      return toast.warning("Shaxsiy kabinet uchun gmail.com email kiriting");
    }

    try {
      setLoading(true);
      const loginReason = await ensureStudentLoginAvailable(normalizedEmail);
      if (loginReason) {
        toast.error(loginReason);
        return;
      }

      await registerPersonalStudentApi({
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: normalizedEmail,
        password: formData.password,
      });
    } catch (err) {
      toast.error(err.message || "Ro'yxatdan o'tishda xatolik");
      return;
    } finally {
      setLoading(false);
    }

    registerOauthUser({
      provider: "google",
      role: "student",
      fullName: formData.fullName.trim(),
      email: normalizedEmail,
    });
    localStorage.setItem("studentEmail", normalizedEmail);

    toast.success("Ro'yxatdan o'tdingiz. Endi login sahifasidan kiring.");
    navigate("/student/login");
  };

  const handleGoogleRegister = () => {
    const email = window.prompt("Gmail kiriting (example@gmail.com):", formData.email || "");
    if (!email) return;
    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith("@gmail.com")) {
      return toast.warning("Faqat gmail.com email kiriting");
    }
    setFormData((prev) => ({ ...prev, email: normalized }));
    toast.success("Gmail biriktirildi");
  };

  return (
    <div className="min-h-screen bg-primary text-primary relative overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl animate-blob [animation-delay:1.6s]" />

      <div className="relative z-10 flex-1 w-full px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-6xl grid lg:grid-cols-[1fr_1.1fr] gap-5">
          <section className="premium-card hidden lg:flex flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold border border-blue-500/20 bg-blue-500/10 text-blue-700">
                <Sparkles size={12} /> Student onboarding
              </p>
              <h1 className="text-4xl font-extrabold mt-4 leading-tight">
                O'quvchi kabinetini
                <span className="block text-gradient">tez va toza oching</span>
              </h1>
              <p className="text-sm text-secondary mt-4">
                Registratsiyadan keyin testlarni ko'rish, yechilgan tarixni kuzatish va kerak bo'lsa qayta yechish
                so'rovini yuborish mumkin bo'ladi.
              </p>

              <div className="space-y-2 mt-6">
                {STUDENT_BENEFITS.map((item) => (
                  <p key={item} className="text-sm text-secondary inline-flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm font-semibold text-primary">Tezkor yo'riqnoma</p>
              <div className="mt-2 space-y-1.5 text-xs text-secondary">
                <p>1. Asosiy ma'lumotlarni kiriting.</p>
                <p>2. Gmail kiritsangiz shaxsiy kabinetga kirish yengillashadi.</p>
                <p>3. Login sahifasidan `Shaxsiy kabinet` rejimini tanlang.</p>
              </div>
            </div>
          </section>

          <form onSubmit={handleRegister} className="premium-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold inline-flex items-center gap-2">
                <img src={logo} alt="OsonTestOl logo" className="w-4 h-4 rounded" /> OsonTestOl
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1"
                onClick={() => navigate("/")}
              >
                <ArrowLeft size={14} /> Asosiy
              </button>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold mt-2">Akkaunt yaratish</h2>

            <div className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-2">
                  F.I.Sh
                </label>
                <input
                  type="text"
                  className="input-clean"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ism Familya"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-2">
                  Telefon
                </label>
                <div className="input-icon-wrap">
                  <Phone size={16} />
                  <input
                    type="text"
                    className="input-clean input-clean-icon"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="998..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-2">
                  Gmail
                </label>
                <div className="input-icon-wrap">
                  <Mail size={16} />
                  <input
                    type="email"
                    className="input-clean input-clean-icon"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="example@gmail.com"
                    required
                  />
                </div>
                <button type="button" className="text-xs text-blue-600 font-semibold mt-2" onClick={handleGoogleRegister}>
                  Gmail orqali qo'shish
                </button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-2">
                  Parol
                </label>
                <input
                  type="password"
                  className="input-clean"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-2">
                  Parolni tasdiqlang
                </label>
                <input
                  type="password"
                  className="input-clean"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-6" disabled={loading}>
              {loading ? "Tekshirilmoqda..." : "Ro'yxatdan o'tish"} <ArrowRight size={14} />
            </button>

            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <button type="button" className="text-sm font-semibold text-blue-600 text-left" onClick={() => navigate("/student/login")}>
                Login sahifasiga o'tish
              </button>
              <button type="button" className="text-xs text-secondary font-semibold text-left sm:text-right" onClick={() => navigate("/guide")}>
                To'liq qo'llanma
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-primary bg-accent p-3 text-xs text-secondary">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-blue-600 mt-0.5" />
                <p>Qurilma xavfsizligi uchun bir qurilmada bitta asosiy login/email ishlatiladi.</p>
              </div>
            </div>
          </form>
        </div>
      </div>

      <SiteFooter className="relative z-10" />
    </div>
  );
}
