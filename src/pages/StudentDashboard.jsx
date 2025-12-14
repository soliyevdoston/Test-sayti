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

// ⚠️ NGROK URL (Har safar yangilanganda tekshiring)
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
    // 1. Agar natija allaqachon bor bo'lsa (Refresh qilinganda)
    const savedResult = localStorage.getItem("test_result_data");
    if (savedResult) {
      setResult(JSON.parse(savedResult));
      setStatus("finished");
      return; // Agar natija bo'lsa, boshqa narsalarni yuklash shart emas
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

    // Agar oldin tugatgan bo'lsa, "finished" ga o'tkazmaymiz, chunki natija yo'q bo'lsa qayta topshirsin
    setStatus(activeSession.isStarted ? "started" : "waiting");

    socket.emit("join-test-room", activeSession.testLogin);

    // 1. TEST BOSHLANDI
    const handleStartTest = () => {
      toast.info("Test boshlandi! Omad.");
      setStatus("started");
    };

    // 2. O'QITUVCHI TESTNI MAJBURIY TO'XTATDI
    const handleForceStop = () => {
      // Agar allaqachon tugatgan bo'lsa, qayta yubormasin
      if (status === "finished") return;

      toast.warning("O'qituvchi testni yakunladi!");
      handleSubmit(true); // Avtomatik topshirish
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

  // ================= JAVOB BELGILASH =================
  const handleSelect = (questionId, optionText) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      const updated = [...filtered, { questionId, selectedText: optionText }];

      if (studentData?.testId) {
        localStorage.setItem(
          `answers_${studentData.testId}`,
          JSON.stringify(updated)
        );
      }
      return updated;
    });
  };

  const scrollToQuestion = (id) => {
    questionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // ================= SUBMIT (YAKUNLASH) =================
  const handleSubmit = async (isAuto = false) => {
    if (status === "finished") return; // Qayta yuborishni oldini olish

    if (!isAuto && !window.confirm("Haqiqatan ham testni yakunlaysizmi?"))
      return;

    try {
      const payload = {
        testId: studentData.testId,
        studentName: studentData.name,
        answers: answers,
      };

      const { data } = await submitTestApi(payload);

      setResult(data);
      setStatus("finished");

      // ⚠️ MUHIM: Bu yerda ma'lumotlarni o'chirmaymiz!
      // Natijani saqlab qo'yamiz (Refresh qilsa ham turishi uchun)
      localStorage.setItem("test_result_data", JSON.stringify(data));

      if (isAuto) toast.warning("Vaqt tugadi yoki test to'xtatildi!");
      else toast.success("Test muvaffaqiyatli topshirildi!");
    } catch (err) {
      console.error(err);
      toast.error("Natijani saqlashda xatolik! Internetni tekshiring.");
    }
  };

  // ================= EXIT (CHIQISH) =================
  const handleExit = () => {
    // ⚠️ Faqat shu tugma bosilganda hammasini tozalaymiz
    socket.disconnect();
    localStorage.removeItem("active_test_session");
    localStorage.removeItem("test_result_data"); // Natijani tozalash
    if (studentData?.testId) {
      localStorage.removeItem(`answers_${studentData.testId}`);
    }
    navigate("/", { replace: true });
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // ================= 1. KUTISH REJIMI =================
  if (status === "waiting") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4">
        <div className="bg-white/10 backdrop-blur-lg p-10 rounded-3xl shadow-2xl text-center max-w-md w-full border border-white/20">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-white/30 rounded-full animate-ping"></div>
            <div className="relative bg-white text-indigo-600 p-5 rounded-full shadow-lg flex items-center justify-center h-full w-full">
              <Hourglass size={40} className="animate-spin-slow" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-wide">
            Tayyormisiz?
          </h2>
          <p className="text-indigo-100 mb-6">
            {studentData?.name}, o‘qituvchi <b>Start</b> tugmasini bosishi bilan
            test avtomatik boshlanadi.
          </p>
          <div className="bg-white/20 rounded-xl p-4 text-white text-sm font-mono">
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

  // ================= 2. NATIJA EKRANI (MUHIM) =================
  if (status === "finished" && result) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
          <div className="bg-blue-600 p-8 text-center text-white">
            <h2 className="text-2xl font-bold">Natijangiz</h2>
            <div className="text-6xl font-extrabold mt-2">
              {Math.round((result.score / result.maxScore) * 100)}%
            </div>
            <p className="opacity-80 mt-1">
              Jami: {result.score} / {result.maxScore} ball
            </p>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-green-600 font-bold">
                <CheckCircle /> {result.correctCount} To'g'ri
              </div>
              <div className="h-8 w-[1px] bg-gray-300"></div>
              <div className="flex items-center gap-2 text-red-500 font-bold">
                <XCircle /> {result.wrongCount} Xato
              </div>
            </div>

            {/* ⚠️ BU TUGMA BOSILMAGUNCHA SAHIFA YOPILMAYDI */}
            <button
              onClick={handleExit}
              className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              <LogOut size={20} /> Chiqish va Bosh sahifa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. TEST JARAYONI =================
  if (status === "started" && testData) {
    return (
      <div className="bg-gray-50 min-h-screen pb-32 select-none">
        {/* Header */}
        <header className="bg-white sticky top-0 z-20 px-4 py-3 flex justify-between items-center shadow-sm border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
              <User size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1 max-w-[150px] md:max-w-xs">
                {testData.title}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                {studentData.name}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-full shadow-inner ${
              timeLeft < 60
                ? "bg-red-100 text-red-600 animate-pulse border border-red-200"
                : "bg-blue-50 text-blue-600 border border-blue-100"
            }`}
          >
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {/* Reading Text (Agar bo'lsa) */}
          {testData.readingText && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
                <FileText className="text-blue-500" /> Matnni o'qing
              </h2>
              <div className="text-sm md:text-base text-gray-700 whitespace-pre-line leading-7 font-serif">
                {testData.readingText}
              </div>
            </div>
          )}

          {/* Savollar */}
          {testData.questions.map((q, index) => (
            <div
              key={q.id}
              ref={(el) => (questionRefs.current[q.id] = el)}
              className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base md:text-lg font-semibold text-gray-800 flex gap-3">
                  <span className="bg-gray-100 text-gray-600 min-w-[30px] h-[30px] flex justify-center items-center rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  {q.text}
                </h3>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 whitespace-nowrap ml-2">
                  {q.points} ball
                </span>
              </div>

              {/* Variantlar (Radio Buttons) */}
              <div className="space-y-3 pl-2 md:pl-10">
                {q.options.map((opt, i) => {
                  const isSelected =
                    answers.find((a) => a.questionId === q.id)?.selectedText ===
                    opt.text;

                  return (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all group ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-100 hover:border-blue-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt.text}
                          checked={isSelected}
                          onChange={() => handleSelect(q.id, opt.text)}
                          className="peer sr-only" // Inputni yashiramiz
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300 group-hover:border-blue-400"
                          }`}
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <span
                        className={`text-sm md:text-base ${
                          isSelected
                            ? "text-blue-900 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {opt.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Navigatsiya va Tugatish */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 pb-4 pt-2 px-2">
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {/* Savol raqamlari (Scroll bo'ladi) */}
            <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide">
              {testData.questions.map((q, index) => {
                const isAnswered = answers.some((a) => a.questionId === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                    className={`min-w-[40px] h-10 rounded-lg text-sm font-bold border transition-all ${
                      isAnswered
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200"
                        : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Asosiy tugma */}
            <button
              onClick={() => handleSubmit(false)}
              className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-lg shadow-lg active:scale-[0.99] transition-transform flex justify-center items-center gap-2"
            >
              <CheckCircle size={20} /> Testni Yakunlash
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
