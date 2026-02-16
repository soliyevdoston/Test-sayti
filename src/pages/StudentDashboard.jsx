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
  X
} from "lucide-react";
import logo from "../assets/logo.svg";
import { submitTestApi, BASE_URL } from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import ChatBox from "../components/ChatBox";
const Footer = () => {
  return (
    <footer className="mt-24 border-t border-primary bg-secondary/30 backdrop-blur-xl py-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-muted">
        <div className="flex items-center gap-3">
           <img src={logo} alt="OsonTestOl" className="w-6 h-6 object-contain grayscale opacity-50" />
           <p className="text-sm font-bold tracking-widest uppercase">
             © {new Date().getFullYear()} OsonTestOl
           </p>
        </div>
        <p className="text-sm">
          Students Panel · Built by{" "}
          <span className="text-primary font-medium">Soliyev.uz</span>
        </p>
      </div>
    </footer>
  );
};

const socket = io(BASE_URL, {
  transports: ["polling", "websocket"],
});

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [testData, setTestData] = useState(null);
  const [status, setStatus] = useState("loading"); // waiting | started | finished
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const questionRefs = useRef({});

  // ================= INIT =================
  useEffect(() => {
    const savedResult = localStorage.getItem("test_result_data");
    if (savedResult) {
      setResult(JSON.parse(savedResult));
      setStatus("finished");
      return;
    }

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

    setStatus(activeSession.isStarted ? "started" : "waiting");

    socket.emit("join-test-room", activeSession.testLogin);

    const handleStartTest = () => {
      toast.info("Test boshlandi! Omad.");
      setStatus("started");
    };

    const handleForceStop = () => {
      if (status === "finished") return;
      toast.warning("O'qituvchi testni yakunladi!");
      handleSubmit(true);
    };

    socket.on("start-test", handleStartTest);
    socket.on("force-stop-test", handleForceStop);

    const handleBeforeUnload = (e) => {
      if (status === "started") {
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
    // eslint-disable-next-line
  }, [status]);

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
    if (!isAuto && !window.confirm("Haqiqatan ham testni yakunlaysizmi?"))
      return;
    try {
      const payload = {
        testId: studentData.testId,
        studentName: studentData.name,
        answers,
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

  const handleExit = () => {
    socket.disconnect();
    localStorage.removeItem("active_test_session");
    localStorage.removeItem("test_result_data");
    if (studentData?.testId)
      localStorage.removeItem(`answers_${studentData.testId}`);
    navigate("/", { replace: true });
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // ================= WAITING =================
  if (status === "waiting") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-primary text-primary px-4 transition-colors duration-300">
        <div className="bg-secondary/50 backdrop-blur-xl border border-primary rounded-3xl shadow-2xl p-10 text-center max-w-md w-full">
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
          <div className="bg-secondary/80 border border-primary rounded-xl p-4 text-primary text-sm font-mono">
            Fan: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{testData?.title}</span> <br />
            Vaqt: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{testData?.duration}</span> daqiqa
          </div>
        </div>
        <p className="mt-8 text-muted text-xs animate-pulse font-medium">
          Aloqa o'rnatildi...
        </p>
      </div>
    );
  }

  // ================= RESULT =================
  if (status === "finished" && result) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-primary px-6 relative transition-colors duration-500 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Card */}
        <div className="relative z-10 w-full max-w-lg bg-secondary/40 backdrop-blur-3xl border border-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in translate-y-0 hover:-translate-y-1 transition-transform duration-500">
          {/* Result Header */}
          <div className="bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-800 p-12 text-center text-white relative">
            <div className="absolute top-4 left-4 opacity-10"><Award size={80} /></div>
            <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-4 opacity-70">Sizning Natijangiz</h2>
            <div className="text-8xl font-black mb-6 tracking-tighter">
              {Math.round((result.score / result.maxScore) * 100)}<span className="text-3xl opacity-50">%</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md border border-white/10">
              <BarChart2 size={14} /> {result.score} / {result.maxScore} ball
            </div>
          </div>

          {/* Stats Badges */}
          <div className="p-10 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center gap-3 bg-green-500/5 dark:bg-green-500/10 text-green-600 dark:text-green-400 p-6 rounded-[2rem] border border-green-500/10 hover:bg-green-500/10 transition-all group">
                <div className="p-2 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform"><CheckCircle size={24} /></div>
                <span className="text-3xl font-black tracking-tight">{result.correctCount}</span>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">To‘g‘ri</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3 bg-red-500/5 dark:bg-red-500/10 text-red-600 dark:text-red-400 p-6 rounded-[2rem] border border-red-500/10 hover:bg-red-500/10 transition-all group">
                <div className="p-2 bg-red-500/10 rounded-xl group-hover:scale-110 transition-transform"><XCircle size={24} /></div>
                <span className="text-3xl font-black tracking-tight">{result.wrongCount}</span>
                <span className="text-[10px] uppercase font-black tracking-[0.2em] opacity-60">Xato</span>
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
          <div className="px-10 pb-10">
            <button
              onClick={handleExit}
              className="group w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-white bg-gradient-to-r from-indigo-600 to-indigo-700 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Bosh sahifaga qaytish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= TEST STARTED =================
  if (status === "started" && testData) {
    return (
      <DashboardLayout role="student" userName={studentData.name}>

        {/* Student Stats Header */}
        <section className="max-w-7xl mx-auto px-6 pt-12">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-primary pb-8 mb-12">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
                  O'qu<span className="text-indigo-600 dark:text-indigo-400">vchi</span> Paneli
                </h2>
                <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
                  OsonTestOl · Bilimlaringizni sinab ko'ring
                </p>
              </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
               <div className="bg-secondary/30 backdrop-blur-xl border border-primary p-6 rounded-[2rem] flex flex-col items-center justify-center text-center hover:bg-secondary transition-all group">
                <div className="p-3 bg-indigo-500/10 rounded-xl mb-3 text-indigo-500 group-hover:scale-110 transition-transform"><CheckCircle size={20} /></div>
                <span className="text-2xl font-black text-primary">24</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Topshirilgan</span>
              </div>
              <div className="bg-secondary/30 backdrop-blur-xl border border-primary p-6 rounded-[2rem] flex flex-col items-center justify-center text-center hover:bg-secondary transition-all group">
                <div className="p-3 bg-indigo-500/10 rounded-xl mb-3 text-indigo-500 group-hover:scale-110 transition-transform"><Award size={20} /></div>
                <span className="text-2xl font-black text-primary">85%</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">O'rtacha Ball</span>
              </div>
               <div className="bg-secondary/30 backdrop-blur-xl border border-primary p-6 rounded-[2rem] flex flex-col items-center justify-center text-center hover:bg-secondary transition-all group">
                <div className="p-3 bg-green-500/10 rounded-xl mb-3 text-green-500 group-hover:scale-110 transition-transform"><TrendingUp size={20} /></div>
                <span className="text-2xl font-black text-primary">12</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Yutuqlar</span>
              </div>
              <div className="bg-secondary/30 backdrop-blur-xl border border-primary p-6 rounded-[2rem] flex flex-col items-center justify-center text-center hover:bg-secondary transition-all group">
                <div className="p-3 bg-indigo-500/10 rounded-xl mb-3 text-indigo-500 group-hover:scale-110 transition-transform"><Clock size={20} /></div>
                <span className="text-2xl font-black text-primary">145m</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">O'quv Vaqti</span>
              </div>
           </div>
        </section>

        {/* Previous Results Section (Simplified Mock) */}
         <section className="max-w-3xl mx-auto px-6 mb-20">
            <h3 className="text-xl font-black text-primary uppercase tracking-tighter italic mb-6 flex items-center gap-3">
               <History className="text-indigo-500" /> Oxirgi natijalar
            </h3>
           <div className="space-y-4">
              {[
                { title: "Matematika - Algebra", score: 90, date: "Bugun" },
                { title: "Ingliz tili - Grammar", score: 75, date: "Kecha" },
                { title: "Fizika - Mexanika", score: 85, date: "2 kun oldin" }
              ].map((res, i) => (
                 <div key={i} className="p-6 bg-secondary/40 backdrop-blur-xl border border-primary rounded-3xl flex justify-between items-center group hover:border-indigo-500/50 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-indigo-500 font-black">{res.score}</div>
                      <div>
                        <h4 className="font-bold text-primary text-sm">{res.title}</h4>
                        <p className="text-[10px] text-muted font-bold tracking-widest uppercase">{res.date}</p>
                      </div>
                   </div>
                    <div className="h-1.5 w-24 bg-primary rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${res.score}%` }} />
                    </div>
                </div>
              ))}
           </div>
        </section>

        <div className="max-w-3xl mx-auto space-y-6">
          {testData.readingText && (
             <div className="bg-secondary/30 backdrop-blur-xl border border-primary rounded-3xl p-8 shadow-xl mb-8">
               <h2 className="font-black mb-4 flex items-center gap-3 border-b border-primary pb-4 text-primary italic uppercase tracking-widest text-sm">
                 <FileText className="text-indigo-600 dark:text-indigo-400" /> Matnni diqqat bilan o'qing
               </h2>
              <div className="text-primary/90 leading-relaxed font-serif text-lg bg-primary/20 p-6 rounded-2xl border border-primary/10">
                {testData.readingText}
              </div>
            </div>
          )}

          {testData.questions.map((q, index) => {
            const selected = answers.find(
              (a) => a.questionId === q.id
            )?.selectedText;
            return (
              <div
                key={q.id}
                ref={(el) => (questionRefs.current[q.id] = el)}
                className="bg-secondary/50 backdrop-blur-xl border border-primary p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                 <div className="flex justify-between mb-8 items-start gap-4">
                   <h3 className="flex gap-4 text-primary font-bold text-xl leading-snug">
                     <span className="bg-indigo-600 text-white min-w-[36px] h-36px p-2 flex justify-center items-center rounded-2xl font-black shadow-lg shadow-indigo-600/20">
                       {index + 1}
                     </span>
                    {q.text}
                  </h3>
                  <span className="text-[10px] font-black bg-secondary border border-primary text-muted px-3 py-1.5 rounded-xl uppercase tracking-widest">
                    {q.points} ball
                  </span>
                </div>

                <div className="space-y-4 pl-0 md:pl-12">
                  {q.options.map((opt, i) => (
                    <label
                      key={i}
                       className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 relative group overflow-hidden ${
                         selected === opt.text
                           ? "border-indigo-600 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
                           : "border-primary bg-primary/50 hover:border-indigo-600/50 hover:bg-secondary"
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
                             : "border-secondary group-hover:border-indigo-600/50"
                         }`}
                       >
                        {selected === opt.text && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in duration-300"></div>}
                      </div>
                       <span
                         className={`text-lg font-medium transition-colors ${
                           selected === opt.text
                             ? "text-primary dark:text-indigo-400"
                             : "text-secondary"
                         }`}
                       >
                        {opt.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 w-full z-30 pb-6 pt-4 px-6 bg-primary/80 backdrop-blur-2xl border-t border-primary shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide py-1">
              {testData.questions.map((q, index) => {
                const isAnswered = answers.some((a) => a.questionId === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                     className={`min-w-[44px] h-11 rounded-1.5xl text-sm font-black border-2 transition-all duration-300 flex items-center justify-center ${
                       isAnswered
                         ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                         : "bg-secondary text-muted border-primary hover:border-indigo-600/50 hover:text-primary"
                     }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
             <button
               onClick={() => handleSubmit(false)}
               className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 hover:scale-[1.01] active:scale-95 transition-all text-lg uppercase tracking-wider"
             >
               <CheckCircle size={22} /> Testni Yakunlash
             </button>
          </div>
        </div>

        {/* Global Chat Button (Only for Individual Students) */}
        {localStorage.getItem("studentId") && (
          <div className="fixed bottom-32 right-8 z-50">
             {chatOpen ? (
               <div className="absolute bottom-16 right-0 w-80 h-96 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="h-full relative">
                    <button 
                      onClick={() => setChatOpen(false)}
                      className="absolute top-4 right-4 z-10 p-1 text-muted hover:text-red-500 transition-colors"
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
        )}
      </DashboardLayout>
    );
  }

  return null;
}
