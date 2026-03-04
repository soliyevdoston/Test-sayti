import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import {
  getTeachers,
  loginUser,
  releaseDeviceSession,
  requestRetake,
  studentIndividualLogin,
} from "../api/api";
import { canUseDeviceForPrincipal, lockDeviceForPrincipal, registerOauthUser } from "../utils/billingTools";
import { clearUserSession } from "../utils/authSession";
import {
  authenticateManagedAdmin,
  isOwnerAdminConfigured,
  setupOwnerAdmin,
} from "../utils/adminAccessTools";
import logo from "../assets/logo.svg";
import SiteFooter from "../components/SiteFooter";
import PublicHeader from "../components/PublicHeader";

export default function LoginTemplate({
  role,
  loginPath,
  initialUsername = "",
  initialPassword = "",
}) {
  const navigate = useNavigate();
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [studentMode, setStudentMode] = useState("personal"); // personal | test | group
  const [loading, setLoading] = useState(false);

  const roleTips =
    role === "Teacher"
      ? [
          "Email/parol bilan kabinetga kiring",
          "Google login ham mavjud",
          "Ro'yxatdan o'tmagan bo'lsangiz account yarating",
        ]
      : role === "Admin"
        ? ["Admin login/parol kiriting", "To'lov va obuna nazoratini boshqaring", "Teacher monitoring paneliga o'ting"]
        : studentMode === "personal"
          ? ["Gmail kiriting", "Shaxsiy kabinetga kiring", "Tarix va testlar bo'limidan foydalaning"]
          : studentMode === "group"
            ? ["Ustoz bergan login/parolni kiriting", "Guruhga kirib testlarni ko'ring", "Natijalarni kabinetda saqlang"]
            : ["Test login/parolini kiriting", "Faol testga qo'shiling", "Yakunlang va natijani ko'ring"];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === "Student" && (studentMode === "group" || studentMode === "personal")) {
        const normalizedStudentIdentity = `${username}`.trim().toLowerCase();
        if (studentMode === "personal" && !normalizedStudentIdentity.includes("@")) {
          toast.warning("Shaxsiy kabinet uchun email kiriting");
          setLoading(false);
          return;
        }
        if (studentMode === "personal" && !normalizedStudentIdentity.endsWith("@gmail.com")) {
          toast.warning("Shaxsiy kabinetga kirish uchun gmail.com email kiriting");
          setLoading(false);
          return;
        }

        const principal = normalizedStudentIdentity;
        if (!canUseDeviceForPrincipal("student", principal)) {
          toast.error("Bu qurilmada student roli uchun boshqa login/email biriktirilgan.");
          setLoading(false);
          return;
        }

        await releaseDeviceSession();
        clearUserSession();
        let resolvedData = null;
        if (studentMode === "personal") {
          const { data } = await studentIndividualLogin({
            username: normalizedStudentIdentity,
            password,
          });
          resolvedData = data;
        } else {
          const { data } = await studentIndividualLogin({
            username,
            password,
          });
          resolvedData = data;
        }

        const data = resolvedData;
        localStorage.setItem("studentId", data._id);
        localStorage.setItem("fullName", data.fullName);
        localStorage.setItem("studentName", data.fullName);
        if (studentMode === "personal") {
          localStorage.setItem("studentEmail", normalizedStudentIdentity);
        } else if (data.email) {
          localStorage.setItem("studentEmail", data.email);
        }
        localStorage.setItem("teacherId", data.teacherId);
        localStorage.setItem("groupId", data.groupId || "");
        localStorage.setItem("userRole", "student");
        localStorage.setItem("studentAccessMode", studentMode);
        if (studentMode === "personal") {
          registerOauthUser({
            provider: "google",
            role: "student",
            userId: data._id,
            fullName: data.fullName,
            email: normalizedStudentIdentity,
          });
        }
        lockDeviceForPrincipal("student", principal);
        toast.success(`Xush kelibsiz, ${data.fullName}`);
        navigate("/student/dashboard");
        return;
      }

      const existingStudentId =
        role === "Student" && studentMode === "test"
          ? localStorage.getItem("studentId")
          : "";
      const quickStudentName =
        role === "Student" && studentMode === "test" ? username.trim() || "O'quvchi" : "";

      if (role === "Teacher" || role === "Admin") {
        const roleKey = role.toLowerCase();
        const principal = `${username}`.trim().toLowerCase();
        if (!canUseDeviceForPrincipal(roleKey, principal)) {
          toast.error(`Bu qurilmada ${roleKey} roli uchun boshqa email/login biriktirilgan.`);
          setLoading(false);
          return;
        }
      }

      if (role === "Teacher" || role === "Admin") {
        await releaseDeviceSession();
        clearUserSession();
      }

      if (role === "Admin") {
        const principal = `${username}`.trim().toLowerCase();
        if (!principal || !String(password || "").trim()) {
          toast.warning("Admin login va parolni to'liq kiriting");
          setLoading(false);
          return;
        }

        if (!isOwnerAdminConfigured()) {
          const bootstrapData = await loginUser("admin", username, password);
          const owner = setupOwnerAdmin({
            login: username,
            password,
            fullName: bootstrapData?.name || "Owner Admin",
            schoolId: bootstrapData?.schoolId || "",
            schoolName: bootstrapData?.name || "Admin",
          });

          localStorage.setItem("schoolId", owner.schoolId || bootstrapData?.schoolId || "local-owner-school");
          localStorage.setItem("schoolName", owner.schoolName || bootstrapData?.name || "Admin");
          localStorage.setItem("fullName", owner.fullName || bootstrapData?.name || "Owner Admin");
          localStorage.setItem("adminPrincipalType", "owner");
          localStorage.setItem("adminPrincipalLogin", owner.login || principal);
          localStorage.setItem("userRole", "admin");
          lockDeviceForPrincipal("admin", owner.login || principal);
          toast.success("Owner admin faollashtirildi");
          navigate(loginPath);
          return;
        }

        const managed = authenticateManagedAdmin({ login: username, password });
        if (!managed.ok) {
          throw new Error(managed.reason || "Admin login yoki parol xato");
        }

        localStorage.setItem("schoolId", managed.schoolId || "local-owner-school");
        localStorage.setItem("schoolName", managed.schoolName || "Admin");
        localStorage.setItem("fullName", managed.fullName || "Admin");
        localStorage.setItem("adminPrincipalType", managed.accountType || "sub");
        localStorage.setItem("adminPrincipalLogin", managed.login || principal);
        localStorage.setItem("userRole", "admin");
        lockDeviceForPrincipal("admin", managed.login || principal);
        toast.success(`Xush kelibsiz, ${managed.fullName || "Admin"}`);
        navigate(loginPath);
        return;
      }

      const data = await loginUser(
        role.toLowerCase(),
        username,
        password,
        quickStudentName,
        existingStudentId
      );

      toast.success(data.message || "Muvaffaqiyatli kirdingiz.");
      if (role === "Teacher" || role === "Admin") {
        const roleKey = role.toLowerCase();
        const principal = `${username}`.trim().toLowerCase();
        lockDeviceForPrincipal(roleKey, principal);
        if (role === "Teacher") {
          localStorage.setItem("teacherEmail", principal);
        }
      }
      if (role === "Student") {
        navigate(loginPath, { state: { testData: data } });
      } else {
        navigate(loginPath);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.msg || err.message || "Login xato!";

      if (err.response?.status === 403) {
        const { alreadyTaken, teacherId, testId } = err.response.data || {};

        if (alreadyTaken) {
          try {
            const studentId = localStorage.getItem("studentId");
            if (!studentId) {
              toast.error("Qayta yechish so'rovi uchun Guruhga kirish orqali kabinetga kiring.");
              setStudentMode("group");
            } else if (!teacherId || !testId) {
              toast.error(errorMsg);
            } else {
              await requestRetake({ studentId, testId, teacherId });
              toast.success("Qayta yechish so'rovi yuborildi.");
            }
          } catch (requestError) {
            toast.error(requestError.response?.data?.msg || "So'rov yuborishda xatolik.");
          }
        } else {
          toast.error(errorMsg);
        }
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleTeacherLogin = async () => {
    const fallbackEmail = `${username || ""}`.trim();
    const promptedEmail = fallbackEmail || window.prompt("Google email kiriting:", "");
    if (!promptedEmail) return;
    const normalizedEmail = promptedEmail.trim().toLowerCase();
    if (!normalizedEmail.endsWith("@gmail.com")) {
      return toast.warning("Faqat gmail.com email ishlaydi");
    }
    if (!canUseDeviceForPrincipal("teacher", normalizedEmail)) {
      return toast.error("Bu qurilmada teacher roli uchun boshqa email/login biriktirilgan.");
    }

    try {
      setLoading(true);
      const { data } = await getTeachers();
      const teachers = Array.isArray(data) ? data : [];
      const found = teachers.find((teacher) => String(teacher.username || "").toLowerCase() === normalizedEmail);
      if (!found) {
        toast.error("Bu email topilmadi. Avval ro'yxatdan o'ting.");
        return;
      }

      const loginData = await loginUser("teacher", found.username, found.password);
      registerOauthUser({
        provider: "google",
        role: "teacher",
        userId: loginData.teacherId || found._id,
        fullName: found.fullName,
        email: normalizedEmail,
      });
      lockDeviceForPrincipal("teacher", normalizedEmail);
      localStorage.setItem("teacherEmail", normalizedEmail);
      toast.success("Google orqali kirildi");
      navigate(loginPath);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Google login xatoligi");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleStudentEmail = () => {
    const prompted = window.prompt("Gmail kiriting (example@gmail.com):", username || "");
    if (!prompted) return;
    const normalized = prompted.trim().toLowerCase();
    if (!normalized.endsWith("@gmail.com")) {
      toast.warning("Faqat gmail.com email kiriting");
      return;
    }
    setStudentMode("personal");
    setUsername(normalized);
    toast.success("Gmail maydonga kiritildi");
  };

  return (
    <div className="min-h-screen bg-primary text-primary relative overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <PublicHeader />

      <div className="relative z-10 flex-1 w-full px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-5 items-stretch">
          <section className="premium-card hidden md:flex flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold border border-blue-500/20 bg-blue-500/10 text-blue-700">
                <Sparkles size={12} /> OsonTestOl
              </p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted font-bold mt-2 inline-flex items-center gap-2">
                <img src={logo} alt="OsonTestOl logo" className="w-4 h-4 rounded" /> testonlinee.uz
              </p>
              <h1 className="text-4xl font-extrabold mt-2">
                {role === "Student"
                  ? studentMode === "test"
                    ? "Testga kirish"
                    : studentMode === "group"
                      ? "Guruhga kirish"
                      : "Shaxsiy kabinetga kirish"
                  : `${role} kabinetiga kirish`}
              </h1>
              <p className="text-secondary mt-3 text-sm leading-relaxed">
                {role === "Student" && studentMode === "personal"
                  ? "Shaxsiy kabinetga email va parol bilan kiring."
                  : "Login va parolni kiriting. Tizimga kirgandan so'ng bevosita ish boshlaysiz."}
              </p>
              <div className="mt-5 space-y-2">
                {roleTips.map((item) => (
                  <p key={item} className="text-sm text-secondary inline-flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 mt-8">
              <p className="text-sm font-semibold text-primary">Tezkor yo'riqnoma</p>
              <div className="mt-2 space-y-1.5 text-xs text-secondary">
                <p>1. Kirish turini tanlang.</p>
                <p>2. Login/email va parol kiriting.</p>
                <p>3. Kirgach bo'limlar bo'yicha ishlashni boshlang.</p>
                <p>4. Batafsil yo'riqnoma: <button type="button" onClick={() => navigate("/guide")} className="text-blue-600 font-semibold">Qo'llanma</button></p>
              </div>
            </div>
          </section>

          <form onSubmit={handleLogin} className="premium-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted font-bold">Kirish</p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Asosiy
              </button>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mt-2">
              {role === "Student" ? "O'quvchi" : role} login
            </h2>

            {role === "Student" && (
              <div className="grid grid-cols-3 gap-2 rounded-xl bg-accent p-1 mt-5 mb-3">
                <button
                  type="button"
                  onClick={() => setStudentMode("personal")}
                  className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                    studentMode === "personal" ? "bg-blue-600 text-white" : "text-secondary"
                  }`}
                >
                  Shaxsiy kabinet
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode("test")}
                  className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                    studentMode === "test" ? "bg-blue-600 text-white" : "text-secondary"
                  }`}
                >
                  Umumiy test
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode("group")}
                  className={`py-2.5 rounded-lg text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                    studentMode === "group" ? "bg-blue-600 text-white" : "text-secondary"
                  }`}
                >
                  Guruh
                </button>
              </div>
            )}

            {role === "Student" && (
              <p className="text-[11px] text-secondary mb-4">
                {studentMode === "personal" && "Shaxsiy kabinet uchun email va parolni kiriting."}
                {studentMode === "test" && "O'qituvchi bergan test login/paroli bilan kirasiz."}
                {studentMode === "group" && "Guruh kabineti uchun o'qituvchi bergan login/parolni kiriting."}
              </p>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-2">
                  {role === "Student"
                    ? studentMode === "test"
                      ? "Test logini"
                      : studentMode === "group"
                        ? "Guruh logini"
                        : "Email"
                    : role === "Teacher"
                      ? "Email"
                      : "Login"}
                </label>
                <input
                  type={
                    role === "Teacher" || (role === "Student" && studentMode === "personal")
                      ? "email"
                      : "text"
                  }
                  className="input-clean"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    role === "Teacher" || (role === "Student" && studentMode === "personal")
                      ? "example@gmail.com"
                      : "Login"
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-[0.12em] text-muted block mb-2">
                  {role === "Student"
                    ? studentMode === "test"
                      ? "Test paroli"
                      : studentMode === "group"
                        ? "Guruh paroli"
                        : "Shaxsiy parol"
                    : "Parol"}
                </label>
                <input
                  type="password"
                  className="input-clean"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-6" disabled={loading}>
              {loading ? "Kirilmoqda..." : "Kirish"}
            </button>

            {role === "Student" && studentMode === "personal" && (
              <button type="button" className="btn-secondary w-full mt-3" onClick={handleGoogleStudentEmail}>
                Gmail orqali qo'shish
              </button>
            )}

            {role === "Teacher" && (
              <>
                <button type="button" className="btn-secondary w-full mt-3" onClick={handleGoogleTeacherLogin} disabled={loading}>
                  Google orqali kirish
                </button>
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => navigate("/teacher/register")} className="text-sm font-semibold text-blue-600">
                    Email orqali ro'yxatdan o'tish
                  </button>
                </div>
              </>
            )}

            {role === "Student" && (
              <div className="mt-5 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-sm font-semibold text-blue-600"
                >
                  Akkaunt yo'qmi? Ro'yxatdan o'tish
                </button>
                <div>
                  <button type="button" className="text-xs font-semibold text-secondary" onClick={() => navigate("/guide")}>
                    Qanday kirish kerak? Qo'llanmani ochish
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <SiteFooter className="relative z-10" />
    </div>
  );
}
