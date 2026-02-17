import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  CheckCircle2, 
  Type, 
  Clock, 
  FileText,
  ListPlus,
  Clipboard,
  X,
  HelpCircle
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { createManualTestApi, parsePreviewApi, getTeacherGroups } from "../api/api";

export default function CreateTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    title: "",
    description: "",
    duration: 30,
    testLogin: "",
    testPassword: "",
    accessType: "public",
    groupId: "",
    questions: [
      {
        id: Date.now(),
        text: "",
        points: 1,
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ]
      }
    ]
  });

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [groups, setGroups] = useState([]);

  React.useEffect(() => {
    const id = localStorage.getItem("teacherId");
    if (id) {
      getTeacherGroups(id).then(res => {
        setGroups(Array.isArray(res.data) ? res.data : []);
      });
    }
  }, []);

  const parseBulkText = async () => {
    if (!bulkText.trim()) return toast.warning("Matnni kiriting");
    
    try {
      setLoading(true);
      const res = await parsePreviewApi({ text: bulkText });
      const parsedQuestions = res.data.questions;

      if (!parsedQuestions || parsedQuestions.length === 0) {
        return toast.error("Format noto'g'ri. Savollar topilmadi.");
      }

      // Map backend format to local format (id generation, etc.)
      const finalQuestions = parsedQuestions.map(q => ({
        id: Date.now() + Math.random(),
        text: q.text,
        points: q.points || 1,
        options: q.options.map(o => ({
          text: o.text,
          isCorrect: o.isCorrect
        }))
      }));
      
      const newQuestions = testData.questions.length === 1 && testData.questions[0].text === "" 
        ? finalQuestions 
        : [...testData.questions, ...finalQuestions];

      setTestData({
        ...testData,
        questions: newQuestions
      });
      
      setBulkText("");
      setShowBulkModal(false);
      toast.success(`${finalQuestions.length} ta savol qo'shildi!`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Xatolik yuz berdi: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setTestData({
      ...testData,
      questions: [
        ...testData.questions,
        {
          id: Date.now(),
          text: "",
          points: 1,
          options: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
          ]
        }
      ]
    });
  };

  const removeQuestion = (id) => {
    if (testData.questions.length === 1) return;
    setTestData({
      ...testData,
      questions: testData.questions.filter(q => q.id !== id)
    });
  };

  const updateQuestion = (id, field, value) => {
    setTestData({
      ...testData,
      questions: testData.questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      )
    });
  };

  const updateOption = (qId, oIdx, value) => {
    setTestData({
      ...testData,
      questions: testData.questions.map(q => 
        q.id === qId ? {
          ...q,
          options: q.options.map((o, idx) => 
            idx === oIdx ? { ...o, text: value } : o
          )
        } : q
      )
    });
  };

  const setCorrect = (qId, oIdx) => {
    setTestData({
      ...testData,
      questions: testData.questions.map(q => 
        q.id === qId ? {
          ...q,
          options: q.options.map((o, idx) => 
            ({ ...o, isCorrect: idx === oIdx })
          )
        } : q
      )
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const teacherId = localStorage.getItem("teacherId");
    
    // Validatsiya
    if (!testData.title || !testData.testLogin || !testData.testPassword) {
      return toast.warning("Asosiy ma'lumotlarni to'ldiring");
    }

    const hasEmpty = testData.questions.some(q => 
      !q.text || q.options.some(o => !o.text)
    );
    if (hasEmpty) {
      return toast.warning("Barcha savol va variantlarni to'ldiring");
    }

    try {
      setLoading(true);
      await createManualTestApi({
        ...testData,
        teacherId,
        isStarted: false
      });
      toast.success("Test muvaffaqiyatli yaratildi!");
      navigate("/teacher/tests");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="max-w-4xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-12">
          <div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft size={16} /> Orqaga
            </button>
            <h1 className="text-4xl font-black text-primary italic uppercase tracking-tighter">Yangi <span className="text-indigo-500">Test Yaratish</span></h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3"
          >
            {loading ? "Saqlanmoqda..." : <><Save size={18} /> Saqlash</>}
          </button>
        </div>

        <div className="space-y-8">
          {/* General Info */}
          <div className="premium-card space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><FileText size={20} /></div>
              <h3 className="text-sm font-black uppercase tracking-widest">Asosiy ma'lumotlar</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Test nomi</label>
                <div className="relative">
                  <Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    placeholder="Masalan: Matematika 1-blok"
                    value={testData.title}
                    onChange={(e) => setTestData({...testData, title: e.target.value})}
                    className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Vaqt (daqiqada)</label>
                <div className="relative">
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                  <input 
                    type="number"
                    value={testData.duration}
                    onChange={(e) => setTestData({...testData, duration: e.target.value})}
                    className="w-full bg-primary/50 border border-primary rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Test Logini (Xona nomi)</label>
                <input 
                  placeholder="Xona nomi"
                  value={testData.testLogin}
                  onChange={(e) => setTestData({...testData, testLogin: e.target.value})}
                  className="w-full bg-primary/50 border border-primary rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                />
              </div>

              {/* Visibility & Group */}
              <div className="col-span-full grid md:grid-cols-2 gap-6 bg-indigo-500/5 p-6 rounded-3xl border border-indigo-500/10 mt-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-1">Kirish ruxsati</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setTestData({...testData, accessType: "public", groupId: ""})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${testData.accessType === 'public' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                    >
                      Umumiy (Barchaga)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setTestData({...testData, accessType: "group"})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${testData.accessType === 'group' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                    >
                      Faqat Guruhga
                    </button>
                  </div>
                </div>

                {testData.accessType === "group" && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-1">Guruhni Tanlang</label>
                    <select 
                      required
                      value={testData.groupId}
                      onChange={(e) => setTestData({...testData, groupId: e.target.value})}
                      className="w-full p-3.5 rounded-xl bg-primary/50 border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm text-xs"
                    >
                      <option value="">Guruhni tanlang...</option>
                      {groups.map(g => (
                        <option key={g._id} value={g._id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Kirish paroli</label>
                <input 
                  placeholder="Parol"
                  value={testData.testPassword}
                  onChange={(e) => setTestData({...testData, testPassword: e.target.value})}
                  className="w-full bg-primary/50 border border-primary rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all text-sm font-bold"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500"><ListPlus size={20} /></div>
                <h3 className="text-sm font-black uppercase tracking-widest">Savollar ({testData.questions.length})</h3>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowGuideModal(true)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all bg-white/5 px-4 py-2 rounded-xl border border-white/10"
                >
                  <HelpCircle size={14} /> Qo'llanma
                </button>
                <button 
                  onClick={() => setShowBulkModal(true)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:scale-105 transition-all bg-indigo-500/5 px-4 py-2 rounded-xl border border-indigo-500/20"
                >
                  <Clipboard size={14} /> Bulk Import
                </button>
                <button 
                  onClick={addQuestion}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:scale-105 transition-all"
                >
                  <Plus size={16} /> Savol qo'shish
                </button>
              </div>
            </div>

            {testData.questions.map((q, idx) => (
              <div key={q.id} className="premium-card relative group">
                <button 
                  onClick={() => removeQuestion(q.id)}
                  className="absolute top-4 right-4 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <span className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-black shrink-0 mt-1">
                      {idx + 1}
                    </span>
                    <div className="flex-1 space-y-4">
                      <textarea 
                        placeholder="Savol matni..."
                        value={q.text}
                        onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                        className="w-full bg-primary/30 border border-primary rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all text-sm font-bold min-h-[100px] resize-none"
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className={`relative flex items-center gap-3 p-3 rounded-2xl border transition-all ${opt.isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-primary bg-primary/20'}`}>
                            <button 
                              onClick={() => setCorrect(q.id, oIdx)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${opt.isCorrect ? 'bg-green-500 text-white' : 'bg-primary border border-primary text-transparent'}`}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                            <input 
                              placeholder={`Variant ${String.fromCharCode(65 + oIdx)}`}
                              value={opt.text}
                              onChange={(e) => updateOption(q.id, oIdx, e.target.value)}
                              className="bg-transparent flex-1 outline-none text-xs font-bold text-primary"
                            />
                            {opt.isCorrect && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-green-600 ml-auto">To'g'ri</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={addQuestion}
            className="w-full py-8 border-2 border-dashed border-primary rounded-[2rem] text-muted hover:border-indigo-500 hover:text-indigo-500 transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="p-4 bg-primary rounded-full group-hover:scale-110 transition-transform">
              <Plus size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Yana savol qo'shish</span>
          </button>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Bulk <span className="text-indigo-500">Import</span></h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">#Savol matni va A) B) C) D) variantlar</p>
              </div>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 mb-6">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                  <Plus size={12} /> Format namunasi:
                </p>
                <pre className="text-[10px] text-slate-400 font-mono leading-relaxed">
{`#Bugun havo qanday?
A) Quyoshli
+B) Yomg'irli
C) Bulutli
D) Qorli`}
                </pre>
              </div>
              
              <textarea 
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Savollarni shu yerga joylashtiring..."
                className="w-full h-[300px] bg-slate-950 border border-white/5 rounded-[1.5rem] p-6 text-sm text-slate-300 font-medium outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>
            
            <div className="p-6 md:p-8 bg-slate-950/50 border-t border-white/5 flex gap-4">
              <button 
                onClick={() => setShowBulkModal(false)}
                className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Bekor qilish
              </button>
              <button 
                onClick={parseBulkText}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Import qilish
              </button>
            </div>
          </div>
        </div>
      )}
      <GuideModal isOpen={showGuideModal} onClose={() => setShowGuideModal(false)} />
    </DashboardLayout>
  );
}

{/* Guide Modal Component (Rendered outside for z-index) */}
const GuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <HelpCircle size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight italic">Professional <span className="text-indigo-500">Parser Qo'llanmasi</span></h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Murakkab testlarni yuklash bo'yicha yo'riqnoma</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto space-y-10 scrollbar-hide">
          {/* Feature 1: Sequential Tracking */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Plus size={18} />
              <h3 className="text-lg font-black uppercase tracking-tight italic">1. Aqlli Ketma-ketlik (Sequential Tracking)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Tizim savollarni 1, 2, 3 tartibida qat'iy kuzatib boradi. Bu savol matni ichidagi boshqa raqamli ro'yxatlar bilan asosiy savolni adashtirmaslikka yordam beradi.
            </p>
            <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed text-indigo-300">
               1. Quyidagi shaxslarni muvofiqlashtiring:<br/>
               1) Muhammad Rahim; 2) Doniyolbiy; 3) Shohmurod.<br/>
               A) Variant 1<br/>
               B) Variant 2
            </div>
          </section>

          {/* Feature 2: Case Sensitive Options */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Clipboard size={18} />
              <h3 className="text-lg font-black uppercase tracking-tight italic">2. Katta-Kichik Harflar (Case Sensitivity)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Variantlar har doim KATTA harflar (`A, B, C, D`) bilan belgilanishi tavsiya etiladi. Tizim kichik harfli ro'yxatlarni (`a, b, c...`) variant deb hisoblamaydi va savol matni sifatida qabul qiladi.
            </p>
            <div className="p-6 bg-slate-950 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed text-emerald-300">
               1. Noto'g'ri hukmni aniqlang:<br/>
               a) Birinchi ma'lumot...<br/>
               b) Ikkinchi ma'lumot...<br/>
               A) To'g'ri javob shu yerda<br/>
               B) Noto'g'ri javob
            </div>
          </section>

          {/* Feature 3: Answer Key Detection */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <Zap size={18} />
              <h3 className="text-lg font-black uppercase tracking-tight italic">3. Javoblar Kaliti (Answer Keys)</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Matn oxiriga "Javoblar" yoki "Savol № To'g'ri javob" jadvalini qo'shsangiz, tizim avtomatik ravishda to'g'ri javoblarni belgilab chiqadi.
            </p>
            <pre className="p-6 bg-slate-950 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed text-blue-300">
{`Savol № To‘gri javob
1 B
2 A
3 D`}
            </pre>
          </section>
        </div>
        
        <div className="p-8 bg-slate-950/50 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Tushunarli, Rahmat!
          </button>
        </div>
      </div>
    </div>
  );
};
