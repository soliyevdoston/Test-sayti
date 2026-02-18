import React, { useState, useEffect } from "react";
import {
  FaPlay,
  FaTrash,
  FaCheckCircle,
  FaStop,
  FaFileUpload,
  FaBolt,
  FaPlus,
  FaUsers,
  FaGlobe,
  FaCogs
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { 
  teacherUploadTest, 
  parseTextApi,
  parsePreviewApi,
  uploadPreviewApi,
  getTeacherTests, 
  getTeacherGroups,
  startTestApi, 
  stopTestApi,
  updateTestAccess,
  deleteTestApi, 
  duplicateTestApi, // ✅
  updateTestApi, // ✅
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
    accessType: "public",
    groupId: "",
  });
  const [groups, setGroups] = useState([]);
  const [createMode, setCreateMode] = useState("file"); // "file" or "text"
  const [pasteText, setPasteText] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, test: null }); // ✅

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info"
  });

  const showConfirm = (message, onConfirm, type = "info", title = "Tasdiqlash") => {
    setModalConfig({ isOpen: true, title, message, onConfirm, type });
  };

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else {
      setTeacherName(name);
      loadTests(id);
      loadGroups(id);
    }
  }, [navigate]);

  const loadGroups = async (id) => {
    try {
      const { data } = await getTeacherGroups(id || localStorage.getItem("teacherId"));
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Guruhlarni yuklashda xatolik");
    }
  };

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
          accessType: newTest.accessType,
          groupId: newTest.groupId,
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
          accessType: newTest.accessType,
          groupId: newTest.groupId,
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
        accessType: "public",
        groupId: "",
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
    showConfirm(
      "Rostdan ham ushbu testni o'chirmoqchimisiz?",
      async () => {
        try {
          await deleteTestApi(testId);
          toast.info("Test o'chirildi");
          loadTests(localStorage.getItem("teacherId"));
        } catch {
          toast.error("Xatolik");
        }
      },
      "danger",
      "Testni o'chirish"
    );
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
    showConfirm(
      "Barcha o'quvchilar uchun testni majburiy to'xtatmoqchimisiz?",
      () => {
        socket.emit("force-stop-test", testLogin);
        toast.warning("Test majburiy to'xtatildi!");
      },
      "danger",
      "Testni to'xtatish"
    );
  };

  const handleUpdateAccess = async (testId, accessType, groupId = null) => {
    try {
      await updateTestAccess(testId, { accessType, groupId });
      toast.success("Ruxsat holati yangilandi");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDuplicate = async (testId) => {
    try {
      setLoading(true);
      await duplicateTestApi(testId);
      toast.success("Test nusxalandi");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Nusxalashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateTestApi(editModal.test._id, editModal.test);
      toast.success("O'zgarishlar saqlandi");
      setEditModal({ open: false, test: null });
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Yangilashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <ConfirmationModal 
        {...modalConfig} 
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
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

            {/* 🔥 Visibility Control */}
            <div className="col-span-full grid md:grid-cols-2 gap-6 bg-primary p-6 rounded-3xl border border-primary">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-2">Kirish ruxsati</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setNewTest({...newTest, accessType: "public", groupId: ""})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${newTest.accessType === 'public' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                  >
                    Umumiy (Barchaga)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewTest({...newTest, accessType: "group"})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${newTest.accessType === 'group' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                  >
                    Faqat Guruhga
                  </button>
                </div>
              </div>

              {newTest.accessType === "group" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-2">Guruhni Tanlang</label>
                  <select 
                    required
                    value={newTest.groupId}
                    onChange={(e) => setNewTest({...newTest, groupId: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm text-xs"
                  >
                    <option value="">Guruhni tanlang...</option>
                    {groups.map(g => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>
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
            <div className="mt-12 p-8 border-2 border-primary rounded-[2.5rem] bg-secondary animate-in slide-in-from-top duration-500">
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
                <div key={t._id} className="group relative p-5 md:p-6 rounded-[2rem] bg-secondary border border-primary hover:border-indigo-500/50 transition-all flex flex-col h-full shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div className="flex items-start gap-3 md:gap-4 w-full">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary border border-primary flex items-center justify-center text-indigo-500 font-black text-lg md:text-xl shadow-inner shrink-0 mt-1">
                        {t.title.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-primary uppercase tracking-tight text-sm md:text-base break-words leading-tight">{t.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest bg-primary/50 px-2 py-1 rounded-lg border border-primary/50">Login: {t.testLogin}</span>
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest bg-primary/50 px-2 py-1 rounded-lg border border-primary/50">Parol: {t.testPassword}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.accessType === "group" ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/10">
                              <FaUsers size={10} /> Faqat Guruh
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/10">
                              <FaGlobe size={10} /> Umumiy
                            </span>
                          )}
                           <div className="px-2 py-1 bg-indigo-500/10 rounded-lg text-indigo-500 text-[9px] font-black uppercase tracking-widest flex items-center border border-indigo-500/10">
                              {t.duration} Daq
                           </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 🔥 Dynamic Access Control - Mobile Optimized Position */}
                     <div className="relative group/access self-end sm:self-start">
                        <button className="w-8 h-8 rounded-xl bg-secondary border border-primary flex items-center justify-center text-primary hover:border-indigo-500 transition-all shadow-sm">
                           <FaCogs size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-primary border border-primary rounded-xl shadow-2xl opacity-0 invisible group-hover/access:opacity-100 group-hover/access:visible transition-all z-20 overflow-hidden">
                           <div className="p-2 border-b border-primary bg-secondary/30">
                              <p className="text-[8px] font-black uppercase text-muted tracking-widest">Tizimni o'zgartirish</p>
                           </div>
                           <button 
                             onClick={() => handleUpdateAccess(t._id, "public")}
                             className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-500/10 hover:text-green-500 transition-all ${t.accessType === 'public' ? 'text-green-500 bg-green-500/5' : 'text-muted'}`}
                           >
                              <FaGlobe /> Umumiyga O'tkazish
                           </button>
                           <div className="border-t border-primary">
                              <p className="px-4 py-2 text-[8px] font-black uppercase text-muted tracking-widest bg-secondary/10">Guruhga yo'naltirish</p>
                              {groups.map(g => (
                                <button 
                                  key={g._id}
                                  onClick={() => handleUpdateAccess(t._id, "group", g._id)}
                                  className={`w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all ${t.groupId === g._id ? 'text-indigo-500 bg-indigo-500/5' : 'text-muted'}`}
                                >
                                  <FaUsers /> {g.name}
                                </button>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-4 border-t border-primary/50">
                    {t.isStarted ? (
                      <button
                        onClick={() => stopTest(t._id, t.testLogin)}
                        className="w-full sm:flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                      >
                        <FaStop /> TO'XTATISH
                      </button>
                    ) : (
                      <button
                        onClick={() => startTest(t._id, t.testLogin)}
                        className="w-full sm:flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        <FaPlay size={10} /> BOSHLASH
                      </button>
                    )}
                    <button
                      onClick={() => setEditModal({ open: true, test: t })}
                      className="w-full sm:w-12 h-10 sm:h-auto bg-secondary border border-primary text-indigo-500 rounded-xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                    >
                      <FaCogs size={14} />
                    </button>
                    <button
                      onClick={() => handleDuplicate(t._id)}
                      className="w-full sm:w-12 h-10 sm:h-auto bg-secondary border border-primary text-green-500 rounded-xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all shadow-sm"
                    >
                      <FaPlus size={14} />
                    </button>
                    <button
                      onClick={() => removeTest(t._id)}
                      className="w-full sm:w-12 h-10 sm:h-auto bg-secondary border border-primary text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <FaTrash size={14} />
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

      {/* Edit Test Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditModal({ open: false, test: null })}
          ></div>
          <div className="relative w-full max-w-2xl bg-primary border border-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 p-8 md:p-12">
            <h3 className="text-2xl font-black text-primary uppercase italic tracking-tighter mb-8">
              Testni <span className="text-indigo-500">Tahrirlash</span>
            </h3>
            
            <form onSubmit={handleUpdateTest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Test Nomi</label>
                  <input
                    required
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.title}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, title: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Vaqt (Daqiqa)</label>
                  <input
                    required
                    type="number"
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.duration}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, duration: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Login</label>
                  <input
                    required
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.testLogin}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, testLogin: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Parol</label>
                  <input
                    required
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.testPassword}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, testPassword: e.target.value } })}
                  />
                </div>
              </div>

              <div className="space-y-3 bg-secondary p-6 rounded-3xl border border-primary">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-2">Kirish ruxsati</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditModal({ ...editModal, test: { ...editModal.test, accessType: "public", groupId: "" } })}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editModal.test.accessType === 'public' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                  >
                    Umumiy
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditModal({ ...editModal, test: { ...editModal.test, accessType: "group" } })}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editModal.test.accessType === 'group' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                  >
                    Guruhga
                  </button>
                </div>
                {editModal.test.accessType === "group" && (
                  <select 
                    required
                    value={editModal.test.groupId || ""}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, groupId: e.target.value } })}
                    className="w-full mt-4 p-3.5 rounded-xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm text-xs"
                  >
                    <option value="">Guruhni tanlang...</option>
                    {groups.map(g => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditModal({ open: false, test: null })}
                  className="flex-1 py-4 bg-secondary text-muted border border-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  Bekor Qilish
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-all"
                >
                  {loading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
