import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import {
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  LogOut,
  Hourglass,
} from "lucide-react";
import { submitTestApi } from "../api/api";
const Footer = () => {
  return (
    <footer className="mt-24 border-t border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400">
        <p className="text-sm">
          © {new Date().getFullYear()} Knowledge Gateway
        </p>
        <p className="text-sm">
          Sudents Panel · Built by{" "}
          <span className="text-white font-medium">Soliyev.uz</span>
        </p>
      </div>
    </footer>
  );
};

// ⚠️ NGROK URL
const SOCKET_URL = "https://kayleigh-phototropic-cristine.ngrok-free.dev";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
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
      <div className="min-h-screen flex flex-col justify-center items-center bg-black text-white px-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-10 text-center max-w-md w-full">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
            <div className="relative bg-white text-indigo-600 p-5 rounded-full shadow-lg flex items-center justify-center h-full w-full">
              <Hourglass size={40} className="animate-spin-slow" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold mb-2">Tayyormisiz?</h2>
          <p className="text-gray-300 mb-6">
            {studentData?.name}, o‘qituvchi Start tugmasini bosishi bilan test
            avtomatik boshlanadi.
          </p>
          <div className="bg-white/10 border border-white/20 rounded-xl p-4 text-white text-sm font-mono">
            Fan: {testData?.title} <br />
            Vaqt: {testData?.duration} daqiqa
          </div>
        </div>
        <p className="mt-8 text-white/50 text-xs animate-pulse">
          Aloqa o'rnatildi...
        </p>
      </div>
    );
  }

  // ================= RESULT =================
  if (status === "finished" && result) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-black px-6 relative">
        {/* Card */}
        <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {/* Result Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-8 text-center text-white">
            <h2 className="text-3xl font-extrabold">Natijangiz</h2>
            <div className="text-6xl font-extrabold mt-2">
              {Math.round((result.score / result.maxScore) * 100)}%
            </div>
            <p className="opacity-80 mt-1">
              Jami: {result.score} / {result.maxScore} ball
            </p>
          </div>

          {/* Stats Badges */}
          <div className="p-6 flex justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-2xl font-bold shadow-inner">
              <CheckCircle /> {result.correctCount} To‘g‘ri
            </div>
            <div className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-2xl font-bold shadow-inner">
              <XCircle /> {result.wrongCount} Xato
            </div>
            <div className="flex items-center gap-2 bg-blue-500/20 text-white px-4 py-2 rounded-2xl font-bold shadow-inner">
              <FileText /> Ball: {result.score} / {result.maxScore}
            </div>
          </div>

          {/* Bottom Panel */}
          {/* Bottom Panel */}
          <div className="flex justify-center p-6 bg-black/20 backdrop-blur-xl border-t border-white/10">
            <button
              onClick={handleExit}
              className="w-full max-w-sm py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <LogOut size={20} /> Chiqish va Bosh sahifa
            </button>
          </div>
        </div>

        {/* Glow Background */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl" />
      </div>
    );
  }

  // ================= TEST STARTED =================
  if (status === "started" && testData) {
    return (
      <div className="bg-black text-white min-h-screen pb-32 px-4">
        {/* Header */}
        <header className="bg-white/5 backdrop-blur-xl border border-white/10 sticky top-0 z-20 px-4 py-3 flex justify-between items-center rounded-b-2xl shadow-2xl mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-full text-white">
              <User size={20} />
            </div>
            <div>
              <h1 className="font-bold text-white">{testData.title}</h1>
              <p className="text-gray-300">{studentData.name}</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 font-mono font-bold px-4 py-1.5 rounded-full shadow-inner ${
              timeLeft < 60
                ? "bg-red-500 text-white animate-pulse"
                : "bg-white/10 text-white"
            }`}
          >
            <Clock size={18} /> {formatTime(timeLeft)}
          </div>
        </header>

        <div className="max-w-3xl mx-auto space-y-6">
          {testData.readingText && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              <h2 className="font-bold mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                <FileText className="text-cyan-400" /> Matnni o'qing
              </h2>
              <p className="text-white/80 leading-7 font-serif">
                {testData.readingText}
              </p>
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
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl"
              >
                <div className="flex justify-between mb-4 items-start">
                  <h3 className="flex gap-3 text-white font-semibold">
                    <span className="bg-white/10 text-white min-w-[30px] h-[30px] flex justify-center items-center rounded-full font-bold">
                      {index + 1}
                    </span>
                    {q.text}
                  </h3>
                  <span className="text-xs font-bold bg-white/10 text-white px-2 py-1 rounded border border-white/10">
                    {q.points} ball
                  </span>
                </div>

                <div className="space-y-3 pl-2 md:pl-10">
                  {q.options.map((opt, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selected === opt.text
                          ? "border-cyan-500 bg-cyan-500/20"
                          : "border-white/10 hover:border-cyan-400 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`q-${q.id}`}
                        checked={selected === opt.text}
                        onChange={() => handleSelect(q.id, opt.text)}
                      />
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selected === opt.text
                            ? "border-cyan-500 bg-cyan-500"
                            : "border-white/20"
                        }`}
                      >
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <span
                        className={`${
                          selected === opt.text
                            ? "text-white font-medium"
                            : "text-white/80"
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

        {/* Footer */}
        <div className="fixed bottom-0 left-0 w-full z-30 pb-4 pt-2 px-2 bg-black/20 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {testData.questions.map((q, index) => {
                const isAnswered = answers.some((a) => a.questionId === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                    className={`min-w-[40px] h-10 rounded-lg text-sm font-bold border transition-all ${
                      isAnswered
                        ? "bg-cyan-500 text-white border-cyan-500 shadow-md"
                        : "bg-white/10 text-white/60 border-white/20 hover:bg-white/20"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handleSubmit(false)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
            >
              <CheckCircle size={20} /> Testni Yakunlash
            </button>
          </div>
        </div>
        <Footer></Footer>
      </div>
    );
  }

  return null;
}
