import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  MessageSquare,
  ShieldAlert,
  StopCircle,
  Users,
  Zap,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { BASE_URL, getRetakeRequests, getTeacherStats, getTeacherTests } from "../api/api";
import { formatLimit, getTeacherSubscription } from "../utils/subscriptionTools";
import { syncTeacherTestUsageWithCurrent } from "../utils/testUsageTools";
import { getTeacherSolveLimitSnapshot } from "../utils/teacherSolveUsageTools";
import { isTeacherProActive } from "../utils/teacherAccessTools";

const socket = io(BASE_URL, { transports: ["websocket", "polling"] });

const ActionCard = ({ icon: Icon, title, desc, onClick, locked = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`premium-card text-left transition-colors ${
      locked ? "opacity-80 border-amber-500/30 bg-amber-500/5" : "hover:border-blue-500/40"
    }`}
  >
    <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
      {React.createElement(Icon, { size: 18 })}
    </div>
    <h3 className="text-base font-extrabold mt-3">{title}</h3>
    <p className="text-sm text-secondary mt-1">{desc}</p>
    <p className="text-xs mt-3 text-blue-600 font-semibold inline-flex items-center gap-1">
      {locked ? "Pro tarifda ochiladi" : "Ochish"} <ArrowRight size={13} />
    </p>
  </button>
);

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [tests, setTests] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
  });
  const [retakeRequests, setRetakeRequests] = useState([]);
  const [usageCount, setUsageCount] = useState(0);
  const [solvedUsageCount, setSolvedUsageCount] = useState(0);
  const [subscription, setSubscription] = useState(getTeacherSubscription(localStorage.getItem("teacherId")));
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning",
  });

  const showConfirm = (message, onConfirm, type = "warning", title = "Tasdiqlash") => {
    setModalConfig({ isOpen: true, title, message, onConfirm, type });
  };

  const teacherId = localStorage.getItem("teacherId");
  const isProPlan = isTeacherProActive(teacherId);
  const hasLimit = Number.isFinite(subscription.maxTests);
  const hasSolveLimit = Number.isFinite(subscription.maxSolved);
  const remaining = hasLimit ? Math.max(subscription.maxTests - usageCount, 0) : null;
  const remainingSolved = hasSolveLimit ? Math.max(subscription.maxSolved - solvedUsageCount, 0) : null;
  const testLimitReached = hasLimit && usageCount >= subscription.maxTests;
  const solveLimitReached = hasSolveLimit && solvedUsageCount >= subscription.maxSolved;
  const limitReached = testLimitReached || solveLimitReached;
  const activeTests = useMemo(() => tests.filter((test) => test.isStarted), [tests]);

  const load = async (id) => {
    const targetId = id || localStorage.getItem("teacherId");
    if (!targetId) return;

    try {
      const [testsRes, statsRes, retakeRes] = await Promise.all([
        getTeacherTests(targetId).catch(() => ({ data: [] })),
        getTeacherStats(targetId).catch(() => ({ data: {} })),
        getRetakeRequests(targetId).catch(() => ({ data: [] })),
      ]);
      const fetchedTests = Array.isArray(testsRes.data) ? testsRes.data : [];
      setTests(fetchedTests);
      setStats({
        totalStudents: Number(statsRes.data?.totalStudents || 0),
        averageScore: Number(statsRes.data?.averageScore || 0),
      });
      setRetakeRequests(Array.isArray(retakeRes.data) ? retakeRes.data : []);
      setUsageCount(syncTeacherTestUsageWithCurrent(targetId, fetchedTests.length));
      const solveSnapshot = await getTeacherSolveLimitSnapshot(targetId, fetchedTests);
      setSolvedUsageCount(Number(solveSnapshot.usedSolved || 0));
      setSubscription(getTeacherSubscription(targetId));
    } catch {
      toast.error("Dashboard ma'lumotlari yuklanmadi");
    }
  };

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) {
      navigate("/teacher/login");
      return;
    }
    setTeacherName(name);
    load(id);

    socket.on("new-retake-request", ({ teacherId: incomingTeacherId, request }) => {
      if (incomingTeacherId !== id) return;
      setRetakeRequests((prev) => [request, ...prev]);
      toast.info("Yangi qayta yechish so'rovi keldi");
    });

    return () => socket.off("new-retake-request");
  }, [navigate]);

  const handleForceStop = (testLogin) => {
    showConfirm(
      "Bu testni hamma o'quvchilar uchun to'xtatasizmi?",
      () => {
        socket.emit("force-stop-test", testLogin);
        toast.warning("Test majburiy to'xtatildi");
      },
      "danger",
      "Majburiy to'xtatish"
    );
  };

  const openProSection = (path, label) => {
    if (isProPlan) {
      navigate(path);
      return;
    }
    toast.info(`${label} faqat Pro tarifda ishlaydi.`);
    navigate("/teacher/subscription");
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <ConfirmationModal {...modalConfig} onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))} />

      <div className="max-w-7xl mx-auto space-y-6">
        <section className="premium-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted font-bold">Teacher kabinet</p>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Salom, {teacherName}</h1>
              <p className="text-sm text-secondary mt-2">
                {isProPlan
                  ? "Barcha bo'limlar alohida ajratilgan: test, guruh, natija, obuna va qo'llanma."
                  : "Bepul tarifda testlar ishlaydi. Guruh, chat va natijalar bo'limi Pro tarifda ochiladi."}
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => load(teacherId)}>
              Yangilash
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            <div className="rounded-xl border border-primary bg-accent p-3">
              <p className="text-xs text-muted uppercase tracking-wider font-bold">Obuna</p>
              <p className="text-lg font-extrabold text-primary mt-1">{subscription.label}</p>
            </div>
            <div className="rounded-xl border border-primary bg-accent p-3">
              <p className="text-xs text-muted uppercase tracking-wider font-bold">Ishlatilgan test</p>
              <p className="text-lg font-extrabold text-primary mt-1">{usageCount}</p>
            </div>
            <div className="rounded-xl border border-primary bg-accent p-3">
              <p className="text-xs text-muted uppercase tracking-wider font-bold">Qolgan test limiti</p>
              <p className={`text-lg font-extrabold mt-1 ${limitReached ? "text-red-600" : "text-primary"}`}>
                {hasLimit ? remaining : "Cheksiz"}
              </p>
            </div>
            <div className="rounded-xl border border-primary bg-accent p-3">
              <p className="text-xs text-muted uppercase tracking-wider font-bold">Qolgan yechish limiti</p>
              <p className="text-lg font-extrabold text-primary mt-1">
                {hasSolveLimit ? remainingSolved : "Cheksiz"}
              </p>
            </div>
          </div>
          <p className={`text-xs mt-4 font-semibold ${limitReached ? "text-red-600" : "text-secondary"}`}>
            Test limiti: {formatLimit(subscription.maxTests)} | Yechish limiti: {formatLimit(subscription.maxSolved)} | Joriy testlar: {tests.length}
          </p>
          <p className={`text-xs mt-2 font-semibold ${limitReached ? "text-red-600" : "text-secondary"}`}>
            Yechilgan jami: {solvedUsageCount} | O'quvchi: {stats.totalStudents} | O'rtacha: {stats.averageScore}%
          </p>
        </section>

        {limitReached && (
          <section className="premium-card border border-amber-500/30 bg-amber-500/10">
            <div className="flex items-start gap-2">
              <ShieldAlert size={18} className="text-amber-600 mt-0.5" />
              <p className="text-sm text-secondary">
                Bepul limit tugagan. Yuklash va yordamchi funksiyalarni davom ettirish uchun obuna bo'limidan to'lov qiling.
              </p>
            </div>
            <button type="button" className="btn-primary mt-4" onClick={() => navigate("/teacher/subscription")}>
              Obuna bo'limiga o'tish
            </button>
          </section>
        )}

        {!isProPlan && (
          <section className="premium-card border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-start gap-2">
              <ShieldAlert size={18} className="text-blue-600 mt-0.5" />
              <p className="text-sm text-secondary">
                Bepul rejim: test yaratish va boshlash ochiq. Blok imtihon, guruhlar, natijalar, chat, kengaytirilgan
                eksport va sozlamalar Pro obunada ishlaydi.
              </p>
            </div>
            <button type="button" className="btn-primary mt-4" onClick={() => navigate("/teacher/subscription")}>
              Pro tarifni faollashtirish
            </button>
          </section>
        )}

        {!!retakeRequests.length && (
          <section
            className="premium-card border border-yellow-500/30 bg-yellow-500/10 cursor-pointer"
            onClick={() => openProSection("/teacher/results", "Natijalar")}
          >
            <p className="text-sm font-bold text-yellow-700">
              Qayta yechish so'rovlari: {retakeRequests.length} ta
            </p>
            <p className="text-xs text-secondary mt-1">Natijalar bo'limida tasdiqlash/rad etish mumkin.</p>
          </section>
        )}

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <ActionCard
            icon={FileText}
            title="Testlar bo'limi"
            desc="Yangi test qo'shish, Pro rejimda blok imtihon yaratish, arxivlash va eksport."
            onClick={() => navigate("/teacher/tests")}
          />
          <ActionCard
            icon={Users}
            title="Guruhlar bo'limi"
            desc="O'quvchi qo'shish, login/parol yaratish va guruh boshqaruvi."
            onClick={() => openProSection("/teacher/groups", "Guruhlar")}
            locked={!isProPlan}
          />
          <ActionCard
            icon={BarChart3}
            title="Natijalar bo'limi"
            desc="Test natijalarini ko'rish va tahlil qilish."
            onClick={() => openProSection("/teacher/results", "Natijalar")}
            locked={!isProPlan}
          />
          <ActionCard
            icon={CreditCard}
            title="Obuna bo'limi"
            desc="Tarif, to'lov tartibi va so'rov holati."
            onClick={() => navigate("/teacher/subscription")}
          />
          <ActionCard
            icon={MessageSquare}
            title="Chatlar bo'limi"
            desc="O'quvchilar bilan aloqani bitta joyda yuritish."
            onClick={() => openProSection("/teacher/chats", "Chat")}
            locked={!isProPlan}
          />
          <ActionCard
            icon={BookOpen}
            title="Qo'llanma bo'limi"
            desc="Har bir bo'lim bo'yicha batafsil yo'riqnoma."
            onClick={() => navigate("/guide")}
          />
        </section>

        <section className="premium-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold">Faol testlar</h2>
            <span className="text-xs font-semibold text-muted">Jami: {activeTests.length}</span>
          </div>
          {activeTests.length ? (
            <div className="space-y-2">
              {activeTests.map((test) => (
                <div
                  key={test._id}
                  className="rounded-xl border border-primary bg-accent px-3 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div>
                    <p className="font-semibold text-primary">{test.title}</p>
                    <p className="text-xs text-secondary">
                      Login: {test.testLogin} | Vaqt: {test.duration} daqiqa
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 text-xs font-semibold inline-flex items-center gap-1.5"
                    onClick={() => handleForceStop(test.testLogin)}
                  >
                    <StopCircle size={14} /> To'xtatish
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Hozircha faol test yo'q.</p>
          )}
        </section>

        <section className="premium-card border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-start gap-2">
            <Zap size={18} className="text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-extrabold">Tez yo'l</h3>
              <p className="text-sm text-secondary mt-1">
                Ishni tez boshlash uchun avval qo'llanmani oching, keyin testlar bo'limidan shablon bilan yuklashni boshlang.
              </p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
