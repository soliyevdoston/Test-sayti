import React, { useState, useEffect } from "react";
import {
  FaChartBar,
  FaFileExport,
  FaTimes,
  FaEye,
  FaBolt
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { 
  getTeacherTests, 
  getResultsApi, 
  getAnalysisApi,
  BASE_URL
} from "../api/api";

export default function TeacherResults() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [analyzedTestId, setAnalyzedTestId] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentAnalysis, setSelectedStudentAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [teacherName, setTeacherName] = useState("");

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
          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-secondary border border-primary text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary transition-all shadow-sm">
            <FaFileExport /> Umumiy Hisobot (Excel)
          </button>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto pb-20">
        <div className="grid gap-8">
          {tests.length > 0 ? (
            tests.map((test) => (
              <div key={test._id} className="premium-card p-0 overflow-hidden group hover:border-indigo-500/50 transition-all">
                <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-secondary/50 to-transparent">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary border border-primary flex items-center justify-center text-indigo-500 font-black text-2xl shadow-inner group-hover:rotate-6 transition-transform">
                      {test.title.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-primary uppercase tracking-tight">{test.title}</h4>
                      <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">ID: {test._id.slice(-8)} • {test.duration} daqiqa</p>
                    </div>
                  </div>
                  <button
                    className={`min-w-[140px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition transform hover:scale-105 active:scale-95 ${
                      analyzedTestId === test._id
                        ? "bg-secondary text-primary border border-primary"
                        : "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"
                    }`}
                    onClick={() => analyzeTest(test._id)}
                  >
                    {analyzedTestId === test._id ? "Yopish" : "Natijalarni Ko'rish"}
                  </button>
                </div>

                {analyzedTestId === test._id && (
                  <div className="p-8 animate-fade-in overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="uppercase text-[10px] font-black tracking-widest text-muted border-b border-primary/50">
                        <tr>
                          <th className="pb-6 pl-2">Stat</th>
                          <th className="pb-6">O'quvchi</th>
                          <th className="pb-6">Ball / %</th>
                          <th className="pb-6 text-center">To'g'ri</th>
                          <th className="pb-6 text-center">Xato</th>
                          <th className="pb-6 text-center">Tahlil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/10">
                        {resultsData.length > 0 ? (
                          resultsData.map((res, idx) => (
                            <tr key={res._id} className="group/tr hover:bg-indigo-500/[0.02] transition-colors">
                              <td className="py-6 pl-2">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx < 3 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted'}`}>
                                  {idx + 1}
                                </div>
                              </td>
                              <td className="py-6 font-black uppercase text-xs tracking-tight text-primary">{res.studentName}</td>
                              <td className="py-6">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-black text-primary">{res.totalScore}</span>
                                  <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: `${(res.totalScore/30)*100}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="py-6 text-center">
                                <span className="text-green-500 font-black">{res.correctAnswersCount}</span>
                              </td>
                              <td className="py-6 text-center">
                                <span className="text-red-500 font-bold opacity-60">{res.wrongAnswersCount}</span>
                              </td>
                              <td className="py-6 text-center">
                                <button
                                  onClick={() => handleStudentAnalysis(res._id)}
                                  className="w-10 h-10 bg-secondary border border-primary text-primary rounded-xl flex items-center justify-center hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all mx-auto shadow-sm"
                                >
                                  <FaEye />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" className="py-10 text-center text-muted font-bold italic uppercase tracking-widest opacity-40">Natijalar hozircha mavjud emas</td></tr>
                        )}
                      </tbody>
                    </table>
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
          <div className="bg-primary w-full max-w-4xl rounded-[3rem] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border border-primary">
            <div className="p-8 border-b border-primary flex justify-between items-center bg-secondary/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20"><FaChartBar size={24} /></div>
                <div>
                  <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">Individual Tahlil</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{selectedStudentAnalysis?.studentName}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-secondary border border-primary text-primary hover:bg-red-500 hover:text-white transition-all"><FaTimes size={20} /></button>
            </div>

            <div className="p-10 overflow-y-auto custom-scrollbar">
              {loadingAnalysis ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Tahlil qilinmoqda...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="premium-card flex flex-col items-center">
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Jami Ball</p>
                      <p className="text-5xl font-black text-primary tracking-tighter">{selectedStudentAnalysis?.totalScore}</p>
                    </div>
                    <div className="premium-card flex flex-col items-center bg-green-500/5 border-green-500/10">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">To'g'ri</p>
                      <p className="text-5xl font-black text-green-600 tracking-tighter">{selectedStudentAnalysis?.correctAnswersCount}</p>
                    </div>
                    <div className="premium-card flex flex-col items-center bg-red-500/5 border-red-500/10">
                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Xato</p>
                      <p className="text-5xl font-black text-red-600 tracking-tighter">{selectedStudentAnalysis?.wrongAnswersCount}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {selectedStudentAnalysis?.studentAnswers?.map((q, idx) => (
                      <div key={idx} className={`p-8 rounded-[2.5rem] border-2 ${q.isCorrect ? 'bg-green-500/[0.02] border-green-500/10' : 'bg-red-500/[0.02] border-red-500/10'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${q.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>{idx + 1}</div>
                            <h5 className="font-bold text-lg text-primary leading-tight">{q.questionText}</h5>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 pl-14">
                          <div className="p-5 rounded-2xl bg-secondary border border-primary">
                            <p className="text-muted text-[10px] font-black uppercase tracking-widest mb-2">O'quvchi javobi</p>
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
