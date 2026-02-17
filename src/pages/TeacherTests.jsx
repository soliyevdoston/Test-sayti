import React, { useState, useEffect } from "react";
import {
  FaPlay,
  FaTrash,
  FaCheckCircle,
  FaStop,
  FaFileUpload,
  FaBolt,
  FaPlus
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardLayout from "../components/DashboardLayout";
import { 
  teacherUploadTest, 
  parseTextApi,
  parsePreviewApi,
  uploadPreviewApi,
  getTeacherTests, 
  startTestApi, 
  stopTestApi,
  deleteTestApi, 
  BASE_URL
} from "../api/api";

const socket = io(BASE_URL, { transports: ["polling", "websocket"] });

export default function TeacherTests() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    username: "",
    password: "",
    duration: 20,
    file: null,
  });
  const [createMode, setCreateMode] = useState("file"); // "file" or "text"
  const [pasteText, setPasteText] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else {
      setTeacherName(name);
      loadTests(id);
    }
  }, [navigate]);

  const loadTests = async (id) => {
    try {
      const { data } = await getTeacherTests(
        id || localStorage.getItem("teacherId")
      );
      setTests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Testlarni yuklashda xatolik");
      setTests([]);
    }
  };

  const handlePreview = async () => {
    if (createMode === "file" && !newTest.file) return toast.warning("Fayl tanlang");
    if (createMode === "text" && !pasteText.trim()) return toast.warning("Matnni kiriting");

    try {
      setPreviewLoading(true);
      let res;
      if (createMode === "file") {
        const formData = new FormData();
        formData.append("file", newTest.file);
        res = await uploadPreviewApi(formData);
      } else {
        res = await parsePreviewApi({ text: pasteText });
      }
      setPreviewData(res.data);
      toast.success(`${res.data.questions.length} ta savol topildi`);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Tahlil qilishda xatolik");
    } finally {
      setPreviewLoading(false);
    }
  };

  const addTest = async (e) => {
    e.preventDefault();
    if (!newTest.title || !newTest.username || !newTest.password) {
      toast.warning("Asosiy maydonlarni to'ldiring!");
      return;
    }

    if (createMode === "file" && !newTest.file) {
      toast.warning("Fayl tanlang!");
      return;
    }

    if (createMode === "text" && !pasteText.trim()) {
      toast.warning("Matnni kiriting!");
      return;
    }

    try {
      setLoading(true);
      
      if (createMode === "file") {
        const formData = new FormData();
        Object.entries({
          file: newTest.file,
          title: newTest.title,
          description: newTest.description,
          duration: newTest.duration,
          testLogin: newTest.username,
          testPassword: newTest.password,
          teacherId: localStorage.getItem("teacherId"),
        }).forEach(([k, v]) => formData.append(k, v));

        const res = await teacherUploadTest(formData);
        toast.success(`${res.data.count || ""} ta savol yuklandi!`);
      } else {
        const payload = {
          text: pasteText,
          title: newTest.title,
          description: newTest.description,
          duration: newTest.duration,
          testLogin: newTest.username,
          testPassword: newTest.password,
          teacherId: localStorage.getItem("teacherId"),
        };
        const res = await parseTextApi(payload);
        toast.success(`${res.data.count || ""} ta savol muvaffaqiyatli saqlandi!`);
      }

      setNewTest({
        title: "",
        description: "",
        username: "",
        password: "",
        duration: 20,
        file: null,
      });
      setPasteText("");
      setPreviewData(null);
      loadTests(localStorage.getItem("teacherId"));
    } catch (err) {
      toast.error(err.response?.data?.msg || err.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const removeTest = async (testId) => {
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      await deleteTestApi(testId);
      toast.info("Test o'chirildi");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Xatolik");
    }
  };

  const startTest = async (testId, testLogin) => {
    try {
      await startTestApi(testId);
      socket.emit("start-test", testLogin);
      toast.success("Test boshlandi!");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Xatolik");
    }
  };

  const stopTest = async (testId, testLogin) => {
    try {
      // API call to update DB
      await stopTestApi(testId);
    } catch (err) {
      console.error("API Stop Error:", err);
      // Even if API fails, we should still try to emit socket for real-time stop
    }
    
    try {
      socket.emit("force-stop-test", testLogin);
      toast.info("Test to'xtatildi!");
      loadTests(localStorage.getItem("teacherId"));
    } catch (socketErr) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleForceStop = (testLogin) => {
    if (window.confirm("Barcha o'quvchilar uchun testni majburiy to'xtatmoqchimisiz?")) {
      socket.emit("force-stop-test", testLogin);
      toast.warning("Test majburiy to'xtatildi!");
    }
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <section className="relative z-10 pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-8 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
              Testlar <span className="text-indigo-600 dark:text-indigo-400">Boshqaruvi</span>
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              Yangi testlar yuklash va mavjudlarini boshqarish
            </p>
          </div>
          <button 
            onClick={() => navigate("/teacher/create-test")}
            className="px-6 py-3 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/5 group"
          >
            <FaPlus className="group-hover:rotate-90 transition-transform duration-300" /> Qo'lda Yaratish
          </button>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto space-y-12 pb-20">
        {/* Upload Section */}
        <div className="premium-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500"><FaFileUpload size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">Yangi test {createMode === "file" ? "yuklash" : "yaratish"}</h3>
                <p className="text-xs text-muted font-bold uppercase tracking-widest">{createMode === "file" ? "Word (.docx) fayl tanlang" : "Matnni nusxalab joylashtiring"}</p>
              </div>
            </div>
            
            <div className="flex bg-primary/30 p-1 rounded-xl border border-primary/50 self-start">
              <button 
                type="button"
                onClick={() => setCreateMode("file")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${createMode === "file" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted hover:text-primary'}`}
              >
                Word Fayl
              </button>
              <button 
                type="button"
                onClick={() => setCreateMode("text")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${createMode === "text" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted hover:text-primary'}`}
              >
                Matnli Test
              </button>
            </div>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" onSubmit={addTest}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Test Nomi</label>
              <input
                required
                placeholder="Masalan: Matematika 1-chorak"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Tavsif</label>
              <input
                placeholder="Qisqacha tavsif"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Login (O'quvchilar uchun)</label>
              <input
                required
                placeholder="test_user"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.username}
                onChange={(e) => setNewTest({ ...newTest, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Parol</label>
              <input
                required
                placeholder="123456"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.password}
                onChange={(e) => setNewTest({ ...newTest, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Vaqt (Daqiqa)</label>
              <input
                required
                type="number"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.duration}
                onChange={(e) => setNewTest({ ...newTest, duration: e.target.value })}
              />
            </div>
            <div className="col-span-full space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">{createMode === "file" ? "Fayl (.docx)" : "Matnni shu yerga joylashtiring"}</label>
              {createMode === "file" ? (
                <input
                  required
                  type="file"
                  accept=".docx"
                  className="w-full p-3.5 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20"
                  onChange={(e) => setNewTest({ ...newTest, file: e.target.files[0] })}
                />
              ) : (
                <textarea
                  required
                  placeholder="1. Savol... A) Javob... B) Javob..."
                  className="w-full h-48 p-6 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm resize-none text-sm leading-relaxed"
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
              )}
            </div>
            <div className="col-span-full flex gap-4">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading || loading}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition group flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {previewLoading ? "Tahlil qilinmoqda..." : (
                  <>
                    <FaCheckCircle className="group-hover:scale-110 transition-transform" />
                    Tahlil Qilish (Preview)
                  </>
                )}
              </button>
              <button
                disabled={loading || previewLoading}
                className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-white transition transform ${
                  loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-700 hover:scale-[1.02] shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
                }`}
              >
                {loading ? "Saqlanmoqda..." : "Testni Yaratish va Saqlash"}
              </button>
            </div>
          </form>

          {/* Preview Results */}
          {previewData && (
            <div className="mt-12 p-8 border-2 border-indigo-500/20 rounded-[2.5rem] bg-indigo-500/5 animate-in slide-in-from-top duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white"><FaCheckCircle size={20} /></div>
                  <h4 className="text-xl font-black text-primary uppercase italic tracking-tighter">Tahlil Natijasi</h4>
                </div>
                <div className="px-4 py-2 bg-indigo-500/20 rounded-xl text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                  {previewData.questions.length} Savol Aniqlanadi
                </div>
              </div>
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-indigo-500/20">
                {previewData.questions.map((q, idx) => (
                  <div key={idx} className="p-6 bg-secondary/50 border border-primary/50 rounded-2xl">
                    <p className="text-sm font-bold text-primary mb-4 flex gap-3">
                      <span className="text-indigo-500">#{idx + 1}</span> {q.text}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${opt.isCorrect ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary/20 text-muted border border-primary/20'}`}>
                          <span>{String.fromCharCode(65 + oIdx)}) {opt.text}</span>
                          {opt.isCorrect && <FaCheckCircle size={10} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tests List Section */}
        <div className="premium-card">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500"><FaBolt size={24} /></div>
            <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">Mavjud Testlar Ro'yxati</h3>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {tests.length > 0 ? (
              tests.map((t) => (
                <div key={t._id} className="group relative p-6 rounded-3xl bg-secondary/50 border border-primary hover:border-indigo-500/50 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary border border-primary flex items-center justify-center text-indigo-500 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
                        {t.title.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-primary uppercase tracking-tight">{t.title}</h4>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">Login: {t.testLogin}</span>
                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">•</span>
                          <span className="text-[10px] font-black text-muted uppercase tracking-widest">Parol: {t.testPassword}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-indigo-500/10 rounded-lg text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                      {t.duration} Daqiqa
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {t.isStarted ? (
                      <div className="flex-1 flex gap-2">
                        <button
                          onClick={() => stopTest(t._id, t.testLogin)}
                          className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                        >
                          <FaStop /> TO'XTATISH
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startTest(t._id, t.testLogin)}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        <FaPlay size={12} /> BOSHLASH
                      </button>
                    )}
                    <button
                      onClick={() => removeTest(t._id)}
                      className="w-12 h-12 bg-secondary border border-primary text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-primary rounded-[2.5rem]">
                <p className="text-muted font-bold uppercase tracking-widest italic opacity-40">Testlar yuklanmagan</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
