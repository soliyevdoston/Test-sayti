import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import {
  LogOut,
  Hourglass,
  Award,
  BarChart2,
  TrendingUp,
  History,
  User,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  MessageCircle,
  Search,
  X
} from "lucide-react";
import logo from "../assets/logo.svg";
import { submitTestApi, BASE_URL, getAvailableTests, loginUser, getMyResults, requestRetake } from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import ChatBox from "../components/ChatBox";
import ConfirmationModal from "../components/ConfirmationModal";

const socket = io(BASE_URL, {
  transports: ["polling", "websocket"],
});
export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [testData, setTestData] = useState(null);
  const [status, setStatus] = useState("loading"); // selection | waiting | started | finished
  const [availableTests, setAvailableTests] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isGuest, setIsGuest] = useState(true); // ✅ Track if guest or authenticated
  const questionRefs = useRef({});

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

  // ================= INIT =================
  useEffect(() => {
    const init = async () => {
      const savedResult = localStorage.getItem("test_result_data");
      if (savedResult) {
        setResult(JSON.parse(savedResult));
        setStatus("finished");
        return;
      }

      const studentId = localStorage.getItem("studentId");
      const teacherId = localStorage.getItem("teacherId");
      const groupId = localStorage.getItem("groupId");

      if (studentId) {
        setIsGuest(false);
        const name = localStorage.getItem("fullName");
        setStudentData({ name, studentId });
        
        // If we results saved, show finished
        if (savedResult) {
           setResult(JSON.parse(savedResult));
           setStatus("finished");
           return;
        }

        // Authenticated users go to selection (stats + dashboard)
        loadAvailableTests(teacherId, groupId);
        fetchHistory(studentId);
        setStatus("selection");
        return;
      }

      setIsGuest(true);

      let activeSession = location.state?.testData;
      if (!activeSession) {
        const saved = localStorage.getItem("active_test_session");
        if (saved) activeSession = JSON.parse(saved);
      }

      if (!activeSession) {
        navigate("/", { replace: true });
        return;
      }

      setStudentData({
        name: activeSession.studentName,
        testId: activeSession.testId,
        testLogin: activeSession.testLogin,
      });

      setTestData({
        title: activeSession.title,
        description: activeSession.description,
        duration: activeSession.duration,
        questions: activeSession.questions,
        readingText: activeSession.readingText || null,
      });

      localStorage.setItem("active_test_session", JSON.stringify(activeSession));

      const savedAnswers = localStorage.getItem(
        `answers_${activeSession.testId}`
      );
      if (savedAnswers) setAnswers(JSON.parse(savedAnswers));

      if (timeLeft === 0) setTimeLeft(activeSession.duration * 60);

      const currentStatus = activeSession.isStarted ? "started" : "waiting";
      setStatus(currentStatus);

      socket.emit("join-test-room", activeSession.testLogin);

      const handleStartTest = () => {
        toast.info("Test boshlandi! Omad.");
        setStatus("started");
      };

      const handleForceStop = () => {
        toast.warning("O'qituvchi testni yakunladi!");
        handleSubmit(true);
      };

      socket.on("start-test", handleStartTest);
      socket.on("force-stop-test", handleForceStop);

      const handleBeforeUnload = (e) => {
        if (currentStatus === "started") {
          e.preventDefault();
          e.returnValue = "";
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      return () => {
        socket.off("start-test", handleStartTest);
        socket.off("force-stop-test", handleForceStop);
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    };
    init();
    // eslint-disable-next-line
  }, [location.pathname]);

  // ================= TIMER =================
  useEffect(() => {
    if (status !== "started" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleSelect = (questionId, optionText) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      const updated = [...filtered, { questionId, selectedText: optionText }];
      if (studentData?.testId)
        localStorage.setItem(
          `answers_${studentData.testId}`,
          JSON.stringify(updated)
        );
      return updated;
    });
  };

  const scrollToQuestion = (id) => {
    questionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleSubmit = async (isAuto = false) => {
    if (status === "finished") return;
    if (!isAuto) {
      return showConfirm(
        "Haqiqatan ham testni yakunlaysizmi?",
        () => executeSubmit(false),
        "warning",
        "Testni yakunlash"
      );
    }
    executeSubmit(true);
  };

  const executeSubmit = async (isAuto = false) => {
    try {
      const payload = {
        testId: studentData.testId,
        studentName: studentData.name,
        answers,
        studentId: studentData.studentId || localStorage.getItem("studentId")
      };
      const { data } = await submitTestApi(payload);
      setResult(data);
      setStatus("finished");
      window.scrollTo({ top: 0, behavior: "smooth" });
      localStorage.setItem("test_result_data", JSON.stringify(data));
      if (isAuto) toast.warning("Vaqt tugadi yoki test to'xtatildi!");
      else toast.success("Test muvaffaqiyatli topshirildi!");
    } catch (err) {
      console.error(err);
      toast.error("Natijani saqlashda xatolik! Internetni tekshiring.");
    }
  };

  const handleJoinTest = async (test) => {
    if (!test.isStarted) {
      return toast.warning("Ushbu test hali boshlanmagan!");
    }
    const studentName = studentData?.name || localStorage.getItem("fullName");
    const studentId = localStorage.getItem("studentId");
    try {
      setLoading(true);
      const data = await loginUser("student", test.testLogin, "none", studentName, studentId);
      setStudentData({
        name: studentName,
        testId: data.testId,
        testLogin: data.testLogin,
        studentId // Keep studentId in state
      });
      setTestData({
        title: data.title,
        description: data.description,
        duration: data.duration,
        questions: data.questions,
        readingText: data.readingText || null,
      });
      localStorage.setItem("active_test_session", JSON.stringify(data));
      setTimeLeft(data.duration * 60);
      setStatus("waiting");
      socket.emit("join-test-room", data.testLogin);
    } catch (err) {
      const { msg, alreadyTaken, teacherId, testId } = err.response?.data || {};
      const errorMsg = msg || err.message || "Testga kirishda xato";
      
      toast.error(errorMsg);
      
      if (err.response?.status === 403 && alreadyTaken) {
         showConfirm(
           "Qayta yechish uchun ustozga so'rov yuborasizmi?",
           () => handleRequestRetake(testId || test._id, teacherId || test.teacherId),
           "info",
           "Qayta yechish"
         );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (sid) => {
    try {
      const { data } = await getMyResults(sid);
      setHistory(data);
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  const handleRequestRetake = async (testId, teacherId) => {
    try {
      setLoading(true);
      const studentId = localStorage.getItem("studentId");
      await requestRetake({ studentId, testId, teacherId });
      toast.success("So'rov muvaffaqiyatli yuborildi!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "So'rov yuborishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTests = async (tid, gid) => {
    try {
      const { data } = await getAvailableTests(tid, gid);
      setAvailableTests(data);
    } catch {
      toast.error("Testlarni yuklashda xatolik");
    }
  };

  const getStats = () => {
    if (!history.length) return { total: 0, avg: 0, best: 0 };
    const total = history.length;
    const scores = history.map(h => (h.totalScore / h.maxScore) * 100);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
    const best = Math.round(Math.max(...scores));
    return { total, avg, best };
  };

  const handleExit = () => {
    socket.disconnect();
    const isCabinet = !!localStorage.getItem("studentId");
    
    localStorage.removeItem("active_test_session");
    localStorage.removeItem("test_result_data");
    
    if (isCabinet) {
      // If from cabinet, just refresh selection view
      const tid = localStorage.getItem("teacherId");
      const gid = localStorage.getItem("groupId");
      const sid = localStorage.getItem("studentId");
      loadAvailableTests(tid, gid);
      fetchHistory(sid);
      setStatus("selection");
      setResult(null);
      setTestData(null);
      return;
    }

    localStorage.removeItem("studentId");
    localStorage.removeItem("fullName");
    localStorage.removeItem("teacherId");
    localStorage.removeItem("role");
    if (studentData?.testId)
      localStorage.removeItem(`answers_${studentData.testId}`);
    navigate("/", { replace: true });
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const renderGlobalChat = () => {
    if (!localStorage.getItem("studentId")) return null;
    return (
      <div className="fixed bottom-32 right-8 z-[60]">
        {chatOpen ? (
          <div className="absolute bottom-16 right-0 w-80 h-[450px] animate-in slide-in-from-bottom-4 duration-300">
            <div className="h-full relative shadow-2xl rounded-3xl overflow-hidden border border-primary">
              <button 
                onClick={() => setChatOpen(false)}
                className="absolute top-3 right-4 z-10 p-1 text-muted hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
              <ChatBox 
                teacherId={localStorage.getItem("teacherId")}
                studentId={localStorage.getItem("studentId")}
                role="student"
              />
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setChatOpen(true)}
            className="w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-bounce"
          >
            <MessageCircle size={28} />
          </button>
        )}
      </div>
    );
  };

  // ================= SELECTION (CABINET) =================
  if (status === "selection") {
    const stats = getStats();
    return (
      <DashboardLayout role="student" userName={studentData?.name}>
        <ConfirmationModal 
          {...modalConfig} 
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          
          {/* 1. WELCOME & STATS SECTION */}
          {!isGuest && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-primary uppercase italic">
                      Mening <span className="text-indigo-600">Statistikam</span>
                    </h2>
                    <p className="text-muted font-bold uppercase tracking-widest text-[10px] mt-2 italic opacity-60">Shaxsiy natijalar tahlili</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Total Tests */}
                  <div className="group bg-secondary/30 backdrop-blur-xl border border-primary p-8 rounded-[2.5rem] hover:border-indigo-500/50 transition-all duration-500">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                           <History size={24} />
                        </div>
                        <TrendingUp size={20} className="text-green-500/50" />
                     </div>
                     <p className="text-4xl font-black text-primary mb-1 tracking-tighter">{stats.total}</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted">Jami topshirilgan</p>
                  </div>

                  {/* Average Score */}
                  <div className="group bg-secondary/30 backdrop-blur-xl border border-primary p-8 rounded-[2.5rem] hover:border-indigo-500/50 transition-all duration-500">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                           <BarChart2 size={24} />
                        </div>
                        <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">AVG</div>
                     </div>
                     <p className="text-4xl font-black text-primary mb-1 tracking-tighter">{stats.avg}%</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted">O'rtacha o'zlashtirish</p>
                  </div>

                  {/* Best Score */}
                  <div className="group bg-secondary/30 backdrop-blur-xl border border-primary p-8 rounded-[2.5rem] hover:border-indigo-500/50 transition-all duration-500 font-['Outfit']">
                     <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                           <Award size={24} />
                        </div>
                        <CheckCircle size={20} className="text-amber-500/50" />
                     </div>
                     <p className="text-4xl font-black text-primary mb-1 tracking-tighter">{stats.best}%</p>
                     <p className="text-[10px] font-black uppercase tracking-widest text-muted">Eng yuqori natija</p>
                  </div>
               </div>
            </section>
          )}

          {/* 2. AVAILABLE TESTS SECTION */}
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-primary uppercase italic">
                  Mavjud <span className="text-indigo-600">Testlar</span>
                </h2>
                <p className="text-muted font-bold uppercase tracking-widest text-[10px] mt-1 italic opacity-60">Yechish uchun testni tanlang</p>
              </div>
              <div className="flex items-center gap-3 bg-secondary/50 border border-primary px-5 py-3 rounded-2xl md:w-80 group focus-within:border-indigo-500/50 transition-all">
                <Search size={18} className="text-muted group-focus-within:text-indigo-500" />
                <input
                  type="text"
                  placeholder="Testni qidirish..."
                  className="bg-transparent border-none outline-none text-xs font-bold w-full text-primary placeholder:opacity-30"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {availableTests.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                availableTests.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase())).map((t, tidx) => (
                  <div key={t._id} className="group bg-secondary/20 backdrop-blur-md border border-primary p-8 rounded-[2.5rem] hover:bg-secondary/40 hover:border-indigo-500/50 transition-all duration-500 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${tidx * 100}ms` }}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                    <div className="flex items-start justify-between mb-6 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-indigo-500 shadow-xl shadow-indigo-500/5 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                        <FileText size={28} />
                      </div>
                      {t.isStarted ? (
                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest border border-green-500/20">Faol</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest border border-red-500/20">Kutilmoqda</span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-3 line-clamp-1">{t.title}</h3>
                    <p className="text-sm text-secondary mb-8 line-clamp-2 min-h-[40px] opacity-70">{t.description || "Ushbu test uchun tavsif yozilmagan."}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-primary/10">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted tracking-widest">
                        <Clock size={14} className="text-indigo-500" />
                        {t.duration} daqiqa
                      </div>
                      <button 
                        onClick={() => handleJoinTest(t)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          t.isStarted 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95" 
                          : "bg-primary/50 text-muted cursor-not-allowed opacity-50"
                        }`}
                      >
                        Kirish
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-primary rounded-[2.5rem] opacity-40">
                  <p className="text-muted font-black uppercase tracking-widest italic">Hozirda mavjud testlar yo'q</p>
                </div>
              )}
            </div>
          </section>
        </div>
        <ConfirmationModal 
          {...modalConfig} 
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
        />
        {renderGlobalChat()}
      </DashboardLayout>
    );
  }

  if (status === "waiting") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-primary text-primary px-4 transition-colors duration-300">
        <ConfirmationModal 
          {...modalConfig} 
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
        />
        <div className="bg-secondary/50 backdrop-blur-xl border border-primary rounded-2xl md:rounded-3xl shadow-2xl p-10 text-center max-w-md w-full">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-indigo-500/30 rounded-full animate-ping"></div>
            <div className="relative bg-secondary text-indigo-600 dark:text-indigo-400 p-5 rounded-full shadow-lg flex items-center justify-center h-full w-full">
              <Hourglass size={40} className="animate-spin-slow" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold mb-2 text-primary">Tayyormisiz?</h2>
          <p className="text-secondary mb-6">
            {studentData?.name}, o‘qituvchi Start tugmasini bosishi bilan test
            avtomatik boshlanadi.
          </p>
          <div className="bg-secondary/80 border border-primary rounded-xl p-3 md:p-4 text-primary text-sm font-mono">
            Fan: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{testData?.title}</span> <br />
            Vaqt: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{testData?.duration}</span> daqiqa
          </div>
        </div>
        {renderGlobalChat()}
        <p className="mt-8 text-muted text-xs animate-pulse font-medium">
          Aloqa o'rnatildi...
        </p>
      </div>
    );
  }

  // ================= RESULT =================
  if (status === "finished" && result) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-primary px-4 md:px-4 md:px-6 relative transition-colors duration-500 overflow-hidden">
        <ConfirmationModal 
          {...modalConfig} 
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
        />
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Card */}
        <div className="relative z-10 w-full max-w-lg bg-secondary/40 backdrop-blur-3xl border border-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in translate-y-0 hover:-translate-y-1 transition-transform duration-500">
          {/* Result Header */}
          <div className="bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-800 p-6 md:p-12 text-center text-white relative">
            <div className="absolute top-3 md:p-4 left-4 opacity-10"><Award size={60} className="md:w-20 md:h-20" /></div>
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-4 opacity-70">Sizning Natijangiz</h2>
            <div className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
              {Math.round((result.score / result.maxScore) * 100)}<span className="text-2xl md:text-3xl opacity-50">%</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
              <BarChart2 size={14} /> {result.score} / {result.maxScore} ball
            </div>
          </div>

          {/* Stats Badges */}
          <div className="p-6 md:p-10 space-y-6">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col items-center justify-center gap-2 md:gap-3 bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-green-500/10 hover:bg-green-500/10 transition-all group">
                <div className="p-2 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform"><CheckCircle size={20} className="md:w-6 md:h-6" /></div>
                <span className="text-2xl md:text-3xl font-black tracking-tight text-white">{result.correctCount}</span>
                <span className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-white/70">To‘g‘ri</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 md:gap-3 bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-red-500/10 hover:bg-red-500/10 transition-all group">
                <div className="p-2 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform"><XCircle size={20} className="md:w-6 md:h-6" /></div>
                <span className="text-2xl md:text-3xl font-black tracking-tight text-white">{result.wrongCount}</span>
                <span className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] text-white/70">Xato</span>
              </div>
            </div>

            <div className="p-6 bg-primary/20 rounded-2xl border border-primary/10 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted">Test muvaffaqiyatli yakunlandi</p>
               </div>
               <Award size={16} className="text-indigo-500" />
            </div>
          </div>

          {/* Bottom Panel */}
          <div className="px-6 pb-6 md:px-10 md:pb-10 flex flex-col gap-4">
            <button
              onClick={() => setSelectedResult(result)}
              className="w-full py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <FileText size={16} /> Batafsil Tahlil
            </button>
            <button
              onClick={handleExit}
              className="group w-full py-4 md:py-5 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              {localStorage.getItem("studentId") ? "Kabinetga qaytish" : "Bosh sahifaga qaytish"}
            </button>
          </div>
        </div>

        {/* ✅ DETAILED ANALYSIS MODAL */}
        {selectedResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedResult(null)} />
            <div className="relative w-full max-w-4xl bg-primary border border-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-primary flex items-center justify-between bg-secondary/30">
                <h3 className="text-2xl font-black text-primary uppercase italic tracking-tighter">Test <span className="text-indigo-500">Tahlili</span></h3>
                <button onClick={() => setSelectedResult(null)} className="p-3 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all">
                   <X size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto space-y-6">
                {(selectedResult.studentAnswers || selectedResult.answers || []).map((ans, idx) => (
                  <div key={idx} className={`p-6 rounded-3xl border-2 ${ans.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <div className="flex justify-between items-start mb-4 gap-4">
                       <h4 className="font-bold text-primary text-lg flex gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-xs ${ans.isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {idx + 1}
                          </span>
                          {ans.questionText || `Savol #${idx+1}`}
                       </h4>
                       <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${ans.isCorrect ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                          {ans.isCorrect ? "To'g'ri" : "Xato"}
                       </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-4 bg-primary/40 rounded-2xl border border-primary">
                          <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Sizning javobingiz:</p>
                          <p className={`text-sm font-bold ${ans.isCorrect ? 'text-green-500' : 'text-red-500'}`}>{ans.selectedOption || "Belgilanmagan"}</p>
                       </div>
                       {!ans.isCorrect && (
                         <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                            <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">To'g'ri javob:</p>
                            <p className="text-sm font-bold text-green-600">{ans.correctOption}</p>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <ConfirmationModal 
          {...modalConfig} 
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
        />
        {renderGlobalChat()}
      </div>
    );
  }

  // ================= TEST STARTED =================
  if (status === "started" && testData) {
    const answeredCount = answers.length;
    return (
      <DashboardLayout role="student" userName={studentData.name} showBottomNav={false}>
        <ConfirmationModal 
          {...modalConfig} 
          onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 pb-40 relative">
          
          {/* Header Stick Stats */}
          <div className="sticky top-0 z-40 bg-primary/80 backdrop-blur-xl border border-primary p-6 rounded-3xl mb-12 flex justify-between items-center shadow-xl">
             <div className="flex flex-col">
               <h2 className="text-xl font-black text-primary italic uppercase tracking-tighter truncate max-w-[200px] md:max-w-md">{testData.title}</h2>
               <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-muted">Jonli Jarayon · {answeredCount}/{testData.questions.length} yechildi</span>
               </div>
             </div>

             <div className="flex items-center gap-4 bg-indigo-600 px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/30">
                <Clock className="text-white/80" size={18} />
                <span className="text-xl font-black text-white font-mono leading-none">{formatTime(timeLeft)}</span>
             </div>
          </div>

          {/* Reading Material if exists */}
          {testData.readingText && (
             <div className="bg-secondary/30 backdrop-blur-xl border border-primary rounded-[2.5rem] p-8 mb-12 shadow-inner">
               <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-6 italic">
                  <FileText size={16} /> Matn bilan tanishib chiqing
               </h4>
               <div className="text-lg leading-relaxed font-serif text-primary/80 bg-primary/10 p-8 rounded-3xl border border-primary/10">
                 {testData.readingText}
               </div>
             </div>
          )}

          {/* Test Questions */}
          <div className="space-y-8">
            {testData.questions.map((q, index) => {
              const selected = answers.find((a) => a.questionId === q.id)?.selectedText;
              return (
                <div
                  key={q.id}
                  ref={(el) => (questionRefs.current[q.id] = el)}
                  className={`bg-secondary/20 backdrop-blur-md border p-8 rounded-[2.5rem] transition-all duration-500 group ${selected ? 'border-indigo-500/30 ring-1 ring-indigo-500/10' : 'border-primary'}`}
                >
                  <div className="flex justify-between items-start mb-8 gap-4">
                    <h3 className="font-bold text-primary text-lg md:text-xl leading-snug flex gap-4">
                      <span className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm transition-all shadow-md ${selected ? 'bg-indigo-600 text-white' : 'bg-primary text-indigo-500 border border-primary'}`}>
                        {index + 1}
                      </span>
                      {q.text}
                    </h3>
                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/40 text-muted border border-primary whitespace-nowrap italic">
                      {q.points} ball
                    </span>
                  </div>

                  <div className="space-y-4 pl-0 md:pl-14">
                    {q.options.map((opt, i) => (
                      <label
                        key={i}
                        className={`group flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${
                          selected === opt.text
                            ? "border-indigo-600 bg-indigo-500/5 shadow-md"
                            : "border-primary bg-primary/30 hover:border-indigo-500/40 hover:bg-secondary/50"
                        }`}
                      >
                        {selected === opt.text && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600" />
                        )}
                        <input
                          type="radio"
                          className="sr-only"
                          name={`q-${q.id}`}
                          checked={selected === opt.text}
                          onChange={() => handleSelect(q.id, opt.text)}
                        />
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            selected === opt.text
                              ? "border-indigo-600 bg-indigo-600"
                              : "border-secondary group-hover:border-indigo-500"
                          }`}
                        >
                          {selected === opt.text && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in duration-300"></div>}
                        </div>
                        <span className={`text-lg transition-colors font-medium ${selected === opt.text ? "text-primary italic" : "text-muted"}`}>
                          {opt.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Floating Submit & Tracker */}
        <div className="fixed bottom-0 left-0 right-0 p-6 md:px-10 z-[50] pointer-events-none">
           <div className="max-w-4xl mx-auto flex flex-col gap-4 pointer-events-auto">
              {/* Question Tracker Pills */}
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide py-2 px-1">
                 {testData.questions.map((q, idx) => {
                    const isAnswered = answers.some(a => a.questionId === q.id);
                    return (
                       <button
                          key={q.id}
                          onClick={() => scrollToQuestion(q.id)}
                          className={`min-w-[44px] h-11 rounded-1.5xl text-sm font-black border-2 transition-all duration-300 flex items-center justify-center ${
                             isAnswered 
                             ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30" 
                             : "bg-secondary/90 backdrop-blur-md text-muted border-primary hover:border-indigo-500"
                          }`}
                       >
                          {idx + 1}
                       </button>
                    )
                 })}
              </div>

              {/* Finish Button */}
              <button
                onClick={() => handleSubmit(false)}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 py-6 rounded-[2rem] font-black text-white text-lg uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 italic group"
              >
                <CheckCircle size={28} className="group-hover:rotate-12 transition-transform" />
                Sinfdan chiqish va Yakunlash
              </button>
           </div>
        </div>
        {renderGlobalChat()}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
       <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}
