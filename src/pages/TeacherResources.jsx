import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BookOpen,
  Brain,
  Download,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import {
  generateSmartQuestions,
  getTeacherQuestionBank,
  removeTeacherQuestion,
  saveTeacherQuestion,
} from "../utils/questionBankTools";
import { isTeacherProActive } from "../utils/teacherAccessTools";

const DIFFICULTY_OPTIONS = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const toCsvRow = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function TeacherResources() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [questionBank, setQuestionBank] = useState([]);
  const [query, setQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [manualForm, setManualForm] = useState({
    subject: "Matematika",
    topic: "",
    difficulty: "medium",
    text: "",
    options: "",
    correctOption: "",
    explanation: "",
  });
  const [generatorForm, setGeneratorForm] = useState({
    subject: "Matematika",
    topic: "",
    difficulty: "medium",
    count: 5,
  });
  const [generatedRows, setGeneratedRows] = useState([]);

  const refreshBank = useCallback((id = teacherId) => {
    setQuestionBank(getTeacherQuestionBank(id));
  }, [teacherId]);

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) {
      navigate("/teacher/login");
      return;
    }
    if (!isTeacherProActive(id)) {
      toast.info("Savollar banki va smart generator faqat Pro tarifda ishlaydi.");
      navigate("/teacher/subscription");
      return;
    }
    setTeacherName(name);
    setTeacherId(id);
    refreshBank(id);
  }, [navigate, refreshBank]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questionBank.filter((item) => {
      if (difficultyFilter !== "all" && String(item.difficulty || "") !== difficultyFilter) return false;
      if (!q) return true;
      const haystack = [item.subject, item.topic, item.text, item.correctOption].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [difficultyFilter, query, questionBank]);

  const handleAddManual = () => {
    if (!teacherId) return;
    try {
      const options = manualForm.options
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      saveTeacherQuestion(teacherId, {
        ...manualForm,
        options,
      });
      setManualForm({
        subject: manualForm.subject,
        topic: "",
        difficulty: manualForm.difficulty,
        text: "",
        options: "",
        correctOption: "",
        explanation: "",
      });
      refreshBank();
      toast.success("Savol bankka qo'shildi");
    } catch (err) {
      toast.error(err.message || "Savol saqlanmadi");
    }
  };

  const handleGenerate = () => {
    const rows = generateSmartQuestions(generatorForm);
    setGeneratedRows(rows);
    toast.success(`${rows.length} ta smart savol tayyorlandi`);
  };

  const handleSaveGenerated = () => {
    if (!teacherId) return;
    if (!generatedRows.length) {
      toast.warning("Avval smart savol yarating");
      return;
    }
    try {
      generatedRows.forEach((row) => {
        saveTeacherQuestion(teacherId, row);
      });
      setGeneratedRows([]);
      refreshBank();
      toast.success("Smart savollar bankka saqlandi");
    } catch (err) {
      toast.error(err.message || "Smart savollarni saqlab bo'lmadi");
    }
  };

  const handleRemove = (questionId) => {
    if (!teacherId) return;
    const removed = removeTeacherQuestion(teacherId, questionId);
    if (!removed) {
      toast.warning("Savol topilmadi");
      return;
    }
    refreshBank();
    toast.success("Savol o'chirildi");
  };

  const handleExportCsv = () => {
    const headers = ["Fan", "Mavzu", "Daraja", "Savol", "Variantlar", "To'g'ri javob", "Izoh"];
    const rows = filteredRows.map((item) => [
      item.subject,
      item.topic,
      item.difficulty,
      item.text,
      Array.isArray(item.options) ? item.options.join(" | ") : "",
      item.correctOption,
      item.explanation || "",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => toCsvRow(cell)).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "teacher-question-bank.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Savollar banki CSV yuklandi");
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="premium-card">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted font-bold">Teacher Pro vositalari</p>
              <h1 className="text-3xl md:text-4xl font-extrabold mt-1">Savollar banki va smart generator</h1>
              <p className="text-sm text-secondary mt-2">
                Pro uchun qo'shimcha modul: savol yaratish, avtomatik variantlar va bankdan qayta foydalanish.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => refreshBank()}>
                <RefreshCcw size={14} /> Yangilash
              </button>
              <button type="button" className="btn-secondary" onClick={handleExportCsv}>
                <Download size={14} /> CSV eksport
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="premium-card space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={17} className="text-blue-600" />
              <h2 className="text-xl font-extrabold">Qo'lda savol qo'shish</h2>
            </div>
            <input
              className="input-clean"
              placeholder="Fan (masalan Matematika)"
              value={manualForm.subject}
              onChange={(e) => setManualForm((prev) => ({ ...prev, subject: e.target.value }))}
            />
            <input
              className="input-clean"
              placeholder="Mavzu"
              value={manualForm.topic}
              onChange={(e) => setManualForm((prev) => ({ ...prev, topic: e.target.value }))}
            />
            <select
              className="input-clean"
              value={manualForm.difficulty}
              onChange={(e) => setManualForm((prev) => ({ ...prev, difficulty: e.target.value }))}
            >
              {DIFFICULTY_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <textarea
              className="input-clean min-h-24"
              placeholder="Savol matni"
              value={manualForm.text}
              onChange={(e) => setManualForm((prev) => ({ ...prev, text: e.target.value }))}
            />
            <textarea
              className="input-clean min-h-24"
              placeholder={"Variantlar (har qatorga bittadan)\nA)\nB)\nC)\nD)"}
              value={manualForm.options}
              onChange={(e) => setManualForm((prev) => ({ ...prev, options: e.target.value }))}
            />
            <input
              className="input-clean"
              placeholder="To'g'ri javob (variant matni)"
              value={manualForm.correctOption}
              onChange={(e) => setManualForm((prev) => ({ ...prev, correctOption: e.target.value }))}
            />
            <textarea
              className="input-clean min-h-20"
              placeholder="Izoh (ixtiyoriy)"
              value={manualForm.explanation}
              onChange={(e) => setManualForm((prev) => ({ ...prev, explanation: e.target.value }))}
            />
            <button type="button" className="btn-primary w-full" onClick={handleAddManual}>
              <Plus size={14} /> Bankga saqlash
            </button>
          </div>

          <div className="premium-card space-y-3">
            <div className="flex items-center gap-2">
              <Brain size={17} className="text-blue-600" />
              <h2 className="text-xl font-extrabold">Smart savol generator</h2>
            </div>
            <input
              className="input-clean"
              placeholder="Fan (masalan Matematika, Ingliz tili, Tarix)"
              value={generatorForm.subject}
              onChange={(e) => setGeneratorForm((prev) => ({ ...prev, subject: e.target.value }))}
            />
            <input
              className="input-clean"
              placeholder="Mavzu"
              value={generatorForm.topic}
              onChange={(e) => setGeneratorForm((prev) => ({ ...prev, topic: e.target.value }))}
            />
            <select
              className="input-clean"
              value={generatorForm.difficulty}
              onChange={(e) => setGeneratorForm((prev) => ({ ...prev, difficulty: e.target.value }))}
            >
              {DIFFICULTY_OPTIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={20}
              className="input-clean"
              value={generatorForm.count}
              onChange={(e) => setGeneratorForm((prev) => ({ ...prev, count: e.target.value }))}
            />
            <button type="button" className="btn-secondary w-full" onClick={handleGenerate}>
              <Wand2 size={14} /> Savollarni generatsiya qilish
            </button>

            {generatedRows.length > 0 ? (
              <div className="rounded-xl border border-primary bg-accent p-3 space-y-2">
                <p className="text-xs font-bold text-muted uppercase tracking-[0.16em]">Preview</p>
                {generatedRows.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-lg border border-primary bg-secondary p-2">
                    <p className="text-sm font-semibold">{item.text}</p>
                    <p className="text-xs text-secondary mt-1">{item.options.join(" | ")}</p>
                  </div>
                ))}
                <button type="button" className="btn-primary w-full mt-1" onClick={handleSaveGenerated}>
                  <Sparkles size={14} /> {generatedRows.length} ta savolni bankga saqlash
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2">
                <ShieldAlert size={15} className="text-amber-700 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Smart generator sinov rejimida: natijani preview ko'rib keyin bankga saqlang.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="premium-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold">Savollar banki</h2>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  className="input-clean pl-9"
                  placeholder="Fan, mavzu yoki savol bo'yicha qidirish"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                className="input-clean"
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="all">Barcha daraja</option>
                {DIFFICULTY_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredRows.length ? (
            <div className="space-y-2">
              {filteredRows.map((item) => (
                <div key={item.id} className="rounded-xl border border-primary bg-accent px-3 py-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-blue-600 font-bold">
                        {item.subject} {item.topic ? `• ${item.topic}` : ""} • {item.difficulty}
                      </p>
                      <p className="text-sm font-semibold mt-1">{item.text}</p>
                      <p className="text-xs text-secondary mt-1">Variantlar: {item.options?.join(" | ")}</p>
                      <p className="text-xs text-secondary mt-1">To'g'ri javob: {item.correctOption}</p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-red-500/10 text-red-600 text-xs font-semibold inline-flex items-center gap-1.5"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 size={13} /> O'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Savollar banki bo'sh. Yangi savol qo'shing yoki smart generatorni ishlating.</p>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
