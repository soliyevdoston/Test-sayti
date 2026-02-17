import React, { useState, useEffect } from "react";
import {
  FaChartBar,
  FaFileExport,
  FaTimes,
  FaEye,
  FaBolt,
  FaArrowRight,
  FaCheck
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client"; // ✅
import DashboardLayout from "../components/DashboardLayout";
import { 
  getTeacherTests, 
  getResultsApi, 
  getAnalysisApi,
  getRetakeRequests, // ✅
  handleRetakeRequest, // ✅
  BASE_URL
} from "../api/api";

const socket = io(BASE_URL, { transports: ["polling", "websocket"] }); // ✅

export default function TeacherResults() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [analyzedTestId, setAnalyzedTestId] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentAnalysis, setSelectedStudentAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [retakeRequests, setRetakeRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else {
      setTeacherName(name);
      loadTests(id);
      fetchRetakeRequests(id);
    }

    // 🔥 REAL-TIME RETAKE REQUESTS
    socket.on("new-retake-request", ({ teacherId, request }) => {
      const myId = localStorage.getItem("teacherId");
      if (teacherId === myId) {
        toast.info("Yangi qayta yechish so'rovi keldi!");
        setRetakeRequests(prev => [request, ...prev]);
      }
    });

    return () => socket.off("new-retake-request");
  }, [navigate]);

  const loadTests = async (id) => {
    try {
      const { data } = await getTeacherTests(id || localStorage.getItem("teacherId"));
      setTests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Natijalarni yuklashda xatolik");
    }
  };

  const analyzeTest = async (testId) => {
    if (analyzedTestId === testId) {
      setAnalyzedTestId(null);
      return;
    }
    try {
      const { data } = await getResultsApi(testId);
      setResultsData(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) toast.warning("Hozircha natijalar yo'q");
      setAnalyzedTestId(testId);
    } catch {
      toast.error("Natijalarni olishda xatolik");
      setResultsData([]);
    }
  };

  const handleStudentAnalysis = async (resultId) => {
    setIsModalOpen(true);
    setLoadingAnalysis(true);
    try {
      const { data } = await getAnalysisApi(resultId);
      setSelectedStudentAnalysis(data);
    } catch {
      toast.error("Tahlilni yuklab bo'lmadi");
      setIsModalOpen(false);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchRetakeRequests = async (tid) => {
    try {
      setLoadingRequests(true);
      const { data } = await getRetakeRequests(tid);
      setRetakeRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleRetakeResolve = async (requestId, status) => {
    try {
      await handleRetakeRequest({ requestId, status });
      toast.success(status === "approved" ? "Ruxsat berildi" : "Rad etildi");
      fetchRetakeRequests(localStorage.getItem("teacherId"));
    } catch (err) {
      toast.error("Amalni bajarishda xatolik");
    }
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <section className="relative z-10 pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-8 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
              Natijalar <span className="text-indigo-600 dark:text-indigo-400">Tahlili</span>
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              O'quvchilar natijalarini kuzatish va akademik tahlil
            </p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-sm">
            <FaFileExport /> Umumiy Hisobot (Excel)
          </button>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto pb-20">
        {/* ✅ QAYTA YECHISH SO'ROVLARI SECTION */}
        <div className="mb-16">
          <h3 className="text-xl font-black text-primary uppercase tracking-tighter italic mb-6 flex items-center gap-3">
             <FaBolt className="text-yellow-500" /> Qayta yechish so'rovlari
          </h3>
          {retakeRequests.length > 0 ? (
            <div className="grid gap-4">
              {retakeRequests.map(req => (
                <div key={req._id} className="p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                      <FaBolt />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary">{req.studentId?.fullName}</h4>
                      <p className="text-[10px] text-muted uppercase tracking-widest font-black">Test: {req.testId?.title}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleRetakeResolve(req._id, "rejected")}
                      className="px-6 py-2 rounded-xl border border-red-500/50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                    >
                      Rad etish
                    </button>
                    <button 
                      onClick={() => handleRetakeResolve(req._id, "approved")}
                      className="px-6 py-2 rounded-xl bg-green-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-green-600/20"
                    >
                      Tasdiqlash
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 border-2 border-dashed border-primary rounded-3xl opacity-30 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted italic">Hozircha yangi so'rovlar yo'q</p>
            </div>
          )}
        </div>

        <div className="grid gap-8">
          {tests.length > 0 ? (
            tests.map((test) => (
              <div key={test._id} className="bg-secondary/40 backdrop-blur-xl border border-primary rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                <div className="p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                  <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="w-20 h-20 rounded-3xl bg-primary border-2 border-primary flex items-center justify-center text-indigo-500 font-black text-3xl shadow-2xl shadow-indigo-500/10 group-hover:rotate-6 transition-transform duration-500">
                      {test.title.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                        <h4 className="text-2xl font-black text-primary uppercase tracking-tight italic">{test.title}</h4>
                        <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-600 dark:text-green-400 rounded-full uppercase tracking-widest flex items-center gap-1">
                          <FaCheck size={8} /> Bajarilgan
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-muted uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/40 rounded-xl border border-primary/50">
                          <FaBolt className="text-indigo-500" /> {test._id.slice(-8)}
                        </span>
                        <span className="flex items-center gap-2 px-3 py-1.5 bg-primary/40 rounded-xl border border-primary/50">
                          <FaChartBar size={14} className="text-indigo-500" /> {test.duration} Daqiqa
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className={`min-w-[200px] h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition transform hover:scale-[1.03] active:scale-95 flex items-center justify-center gap-3 ${
                      analyzedTestId === test._id
                        ? "bg-secondary text-primary border border-primary shadow-inner"
                        : "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30"
                    }`}
                    onClick={() => analyzeTest(test._id)}
                  >
                    {analyzedTestId === test._id ? "Yopish" : "Natijalarni Tahlil Qilish"}
                    <FaArrowRight className={`transition-transform duration-500 ${analyzedTestId === test._id ? "rotate-90" : "group-hover:translate-x-1"}`} />
                  </button>
                </div>

                {analyzedTestId === test._id && (
                  <div className="px-5 pb-5 md:px-10 md:pb-10 pt-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-primary/50 border border-primary rounded-[2rem] overflow-hidden shadow-inner">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead className="bg-secondary/50 uppercase text-[10px] font-black tracking-widest text-muted/60 border-b border-primary/50">
                            <tr>
                              <th className="py-6 px-8">№</th>
                              <th className="py-6 px-8">Ism Familiya</th>
                              <th className="py-6 px-8">Ball / Ko'rsatkich</th>
                              <th className="py-6 px-8 text-center">T/X</th>
                              <th className="py-6 px-8 text-center">Individual Tahlil</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary/10">
                            {resultsData.length > 0 ? (
                              resultsData.map((res, idx) => (
                                <tr key={res._id} className="group/tr hover:bg-indigo-500/[0.03] transition-colors">
                                  <td className="py-6 px-8">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${idx < 3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-primary border border-primary text-muted'}`}>
                                      {idx + 1}
                                    </div>
                                  </td>
                                  <td className="py-6 px-8 font-black uppercase text-xs tracking-tight text-primary">{res.studentName}</td>
                                  <td className="py-6 px-8">
                                    <div className="flex items-center gap-4">
                                      <span className="text-xl font-black text-primary tracking-tighter">{res.totalScore}</span>
                                      <div className="hidden md:block w-32 h-1.5 bg-primary/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full" style={{ width: `${(res.totalScore/30)*100}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-8 text-center">
                                    <div className="inline-flex items-center gap-3">
                                      <span className="px-3 py-1 bg-green-500/10 text-green-600 text-[10px] font-black rounded-lg">{res.correctAnswersCount}</span>
                                      <span className="px-3 py-1 bg-red-500/10 text-red-600 text-[10px] font-black rounded-lg">{res.wrongAnswersCount}</span>
                                    </div>
                                  </td>
                                  <td className="py-6 px-8 text-center">
                                    <button
                                      onClick={() => handleStudentAnalysis(res._id)}
                                      className="w-12 h-12 bg-primary border border-primary text-primary rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all mx-auto shadow-sm group-hover/tr:scale-110"
                                    >
                                      <FaEye size={18} />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan="5" className="py-20 text-center text-muted font-bold italic uppercase tracking-widest opacity-30">Natijalar hozircha mavjud emas</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-40 text-center border-2 border-dashed border-primary rounded-[3rem]">
              <p className="text-muted font-black uppercase tracking-[0.3em] italic opacity-30">Natijalar ro'yxati bo'sh</p>
            </div>
          )}
        </div>
      </main>

      {/* Tahlil Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in">
          <div className="bg-slate-900 w-full max-w-4xl rounded-[3rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10">
            <div className="p-8 border-b border-primary flex justify-between items-center bg-secondary/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20"><FaChartBar size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Individual Tahlil</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedStudentAnalysis?.studentName}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shadow-inner text-primary hover:bg-red-500 hover:text-white transition-all"><FaTimes size={20} /></button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
              {loadingAnalysis ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Tahlil qilinmoqda...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex flex-col items-center">
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Jami Ball</p>
                      <p className="text-5xl font-black text-white tracking-tighter">{selectedStudentAnalysis?.totalScore}</p>
                    </div>
                    <div className="bg-green-500/20 p-8 rounded-[2rem] flex flex-col items-center border-green-500/10">
                      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">To'g'ri</p>
                      <p className="text-5xl font-black text-white tracking-tighter">{selectedStudentAnalysis?.correctAnswersCount}</p>
                    </div>
                    <div className="bg-red-500/20 p-8 rounded-[2rem] flex flex-col items-center border-red-500/10">
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Xato</p>
                      <p className="text-5xl font-black text-white tracking-tighter">{selectedStudentAnalysis?.wrongAnswersCount}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedStudentAnalysis?.studentAnswers?.map((q, idx) => (
                      <div key={idx} className={`p-8 rounded-[2.5rem] border-2 ${q.isCorrect ? 'bg-green-500/5 border-green-500/20 shadow-sm' : 'bg-red-500/5 border-red-500/20 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${q.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>{idx + 1}</div>
                            <h5 className="font-black text-xl text-white leading-tight">{q.questionText}</h5>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 pl-14">
                          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">O'quvchi javobi</p>
                            <p className={`text-sm font-bold ${q.isCorrect ? 'text-green-500' : 'text-red-500'}`}>{q.selectedOption}</p>
                          </div>
                          {!q.isCorrect && (
                            <div className="p-5 rounded-2xl bg-green-500/5 border border-green-500/10">
                              <p className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-2">To'g'ri javob</p>
                              <p className="text-sm font-black text-green-600">{q.correctOption}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
