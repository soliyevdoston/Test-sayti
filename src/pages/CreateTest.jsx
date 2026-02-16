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
  ListPlus
} from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { createManualTestApi } from "../api/api";

export default function CreateTest() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    title: "",
    description: "",
    duration: 30,
    testLogin: "",
    testPassword: "",
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
      toast.error("Xatolik: " + err.message);
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
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:scale-105 transition-all"
              >
                <Plus size={16} /> Savol qo'shish
              </button>
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
    </DashboardLayout>
  );
}
