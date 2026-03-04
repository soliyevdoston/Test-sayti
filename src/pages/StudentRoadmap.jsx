import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Calendar, CheckCircle2, Compass, RefreshCcw, Target } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { getMyResults } from "../api/api";
import { hasActiveStudentSubscription } from "../utils/billingTools";
import { getActiveStudentCatalogTests } from "../utils/studentCatalogTools";

const getRoadmapStorageKey = (studentId) => `student_roadmap_focus_v1_${studentId}`;

const toScore = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const buildLevel = (averageScore, solvedCount) => {
  if (solvedCount < 3) return "Start";
  if (averageScore >= 24) return "Advanced";
  if (averageScore >= 16) return "Intermediate";
  return "Foundation";
};

const buildWeeklyRoadmap = ({ focus, level }) => {
  const baseFocus = focus || "Umumiy tayyorgarlik";
  const templates = {
    Start: [
      "Asosiy mavzular bo'yicha 2 ta test ishlang.",
      "Xatolar ro'yxatini tuzing va 1 marta qayta ishlang.",
      "Vaqtni nazorat qilish uchun 1 ta time-trial test bajaring.",
      "Hafta oxirida yakuniy mini test bilan progressni tekshiring.",
    ],
    Foundation: [
      "Har kuni kamida 1 ta mavzulashtirilgan test ishlang.",
      "Xatolarni 3 toifaga ajrating: bilim, diqqat, vaqt.",
      "Qiyin savollar bo'yicha alohida konspekt tayyorlang.",
      "Haftalik umumiy test bilan natijani solishtiring.",
    ],
    Intermediate: [
      "Yo'nalish bo'yicha murakkabroq testlar blokini ishlang.",
      "Har testdan keyin tahlil qilib eng sust mavzuni belgilang.",
      "2 ta imtihon simulyatsiyasi bajaring.",
      "Kuchsiz mavzu uchun qayta yechish rejasi tuzing.",
    ],
    Advanced: [
      "Imtihon formatidagi blok testlar bilan ishlang.",
      "Yuqori tezlik + aniqlik balansini ushlab boring.",
      "Qiyin savollar bankidan har kuni 20-30 daqiqa mashq qiling.",
      "Hafta yakunida natijalarni trend bo'yicha taqqoslang.",
    ],
  };

  const steps = templates[level] || templates.Foundation;
  return steps.map((task, index) => ({
    week: index + 1,
    title: `${baseFocus} • ${index + 1}-hafta`,
    task,
  }));
};

export default function StudentRoadmap() {
  const studentId = localStorage.getItem("studentId");
  const studentName = localStorage.getItem("fullName") || "O'quvchi";
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [focus, setFocus] = useState("all");
  const [catalogTests, setCatalogTests] = useState([]);

  const isSubActive = hasActiveStudentSubscription(studentId);

  const refresh = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const [{ data }] = await Promise.all([getMyResults(studentId).catch(() => ({ data: [] }))]);
      setResults(Array.isArray(data) ? data : []);
      setCatalogTests(getActiveStudentCatalogTests(studentId));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    const savedFocus = localStorage.getItem(getRoadmapStorageKey(studentId));
    if (savedFocus) setFocus(savedFocus);
    refresh();
  }, [studentId, refresh]);

  const directions = useMemo(() => {
    const items = Array.from(
      new Set(
        catalogTests
          .map((item) => String(item.direction || "").trim())
          .filter(Boolean)
      )
    );
    return ["all", ...items];
  }, [catalogTests]);

  const averageScore = useMemo(() => {
    if (!results.length) return 0;
    const sum = results.reduce((acc, row) => acc + toScore(row.totalScore), 0);
    return Math.round((sum / results.length) * 10) / 10;
  }, [results]);

  const solvedCount = results.length;
  const level = buildLevel(averageScore, solvedCount);
  const resolvedFocus = focus === "all" ? "Umumiy tayyorgarlik" : focus;
  const roadmapRows = buildWeeklyRoadmap({ focus: resolvedFocus, level });

  const recommendedTests = useMemo(() => {
    const pool = focus === "all" ? catalogTests : catalogTests.filter((item) => String(item.direction || "") === focus);
    return pool.slice(0, 8);
  }, [catalogTests, focus]);

  const completionPercent = Math.min(100, Math.round((solvedCount / (isSubActive ? 30 : 10)) * 100));

  const handleFocusChange = (value) => {
    setFocus(value);
    if (studentId) {
      localStorage.setItem(getRoadmapStorageKey(studentId), value);
    }
  };

  if (!studentId) return null;

  return (
    <DashboardLayout role="student" userName={studentName}>
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="premium-card">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted font-bold">Shaxsiy reja</p>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Student Roadmap</h1>
              <p className="text-sm text-secondary mt-2">
                Natija tarixiga qarab bosqichma-bosqich o'quv reja avtomatik tuziladi.
              </p>
            </div>
            <button type="button" className="btn-secondary" onClick={refresh}>
              <RefreshCcw size={14} /> Yangilash
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="premium-card">
            <p className="text-xs uppercase tracking-[0.14em] text-muted font-bold">Daraja</p>
            <p className="text-2xl font-extrabold mt-2">{level}</p>
          </div>
          <div className="premium-card">
            <p className="text-xs uppercase tracking-[0.14em] text-muted font-bold">Yechilgan test</p>
            <p className="text-2xl font-extrabold mt-2">{loading ? "..." : solvedCount}</p>
          </div>
          <div className="premium-card">
            <p className="text-xs uppercase tracking-[0.14em] text-muted font-bold">O'rtacha ball</p>
            <p className="text-2xl font-extrabold mt-2">{loading ? "..." : averageScore}</p>
          </div>
          <div className="premium-card">
            <p className="text-xs uppercase tracking-[0.14em] text-muted font-bold">Progress</p>
            <p className="text-2xl font-extrabold mt-2">{completionPercent}%</p>
            <div className="mt-2 h-2 rounded-full bg-accent overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>
        </section>

        <section className="premium-card">
          <div className="flex items-center gap-2 mb-3">
            <Compass size={17} className="text-blue-600" />
            <h2 className="text-xl font-extrabold">Yo'nalish tanlovi</h2>
          </div>
          <div className="grid sm:grid-cols-3 md:grid-cols-5 gap-2">
            {directions.map((item) => {
              const active = item === focus;
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => handleFocusChange(item)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    active ? "bg-blue-600 text-white border-blue-600" : "bg-accent border-primary text-secondary"
                  }`}
                >
                  {item === "all" ? "Barchasi" : item}
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="premium-card">
            <div className="flex items-center gap-2">
              <Calendar size={17} className="text-blue-600" />
              <h2 className="text-xl font-extrabold">4 haftalik amaliy reja</h2>
            </div>
            <div className="space-y-3 mt-4">
              {roadmapRows.map((item) => (
                <article key={item.week} className="rounded-xl border border-primary bg-accent p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">{item.title}</p>
                  <p className="text-sm text-secondary mt-1">{item.task}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="premium-card">
              <div className="flex items-center gap-2">
                <Target size={17} className="text-blue-600" />
                <h2 className="text-xl font-extrabold">Tavsiya etilgan testlar</h2>
              </div>
              {recommendedTests.length ? (
                <div className="space-y-2 mt-4">
                  {recommendedTests.map((item) => (
                    <div key={item.catalogId || item._id} className="rounded-lg border border-primary bg-accent p-2.5">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-secondary mt-1">{item.direction || "Umumiy"} • {item.teacherName || "Teacher"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted mt-3">Bu yo'nalishda tavsiya testlar hali biriktirilmagan.</p>
              )}
            </div>

            <div className="premium-card">
              <div className="flex items-center gap-2">
                <BarChart3 size={17} className="text-blue-600" />
                <h2 className="text-xl font-extrabold">Yo'naltirish</h2>
              </div>
              <div className="space-y-2 mt-3 text-sm text-secondary">
                <p className="inline-flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  Natijalar trendini haftasiga kamida 1 marta tekshiring.
                </p>
                <p className="inline-flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  Kuchsiz mavzularni roadmap bo'yicha bloklarga ajrating.
                </p>
                <p className="inline-flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-blue-600 mt-0.5 shrink-0" />
                  Pro obuna bilan cheksiz test ishlash va to'liq tahlil ochiladi.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
