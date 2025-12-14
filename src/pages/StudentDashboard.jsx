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

// ⚠️ DIQQAT: Har safar ngrok o'zgarganda bu linkni yangilang!
const SOCKET_URL = "https://kayleigh-phototropic-cristine.ngrok-free.dev";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
});

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [studentData, setStudentData] = useState(null);
  const [testData, setTestData] = useState(null);
  const [status, setStatus] = useState("loading"); // 'waiting' | 'started' | 'finished'
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const questionRefs = useRef({});

  useEffect(() => {
    // 1. Ma'lumotlarni olish (Login dan kelgan yoki Xotirada saqlangan)
    let activeSession = location.state?.testData;

    // Agar Login orqali kelmagan bo'lsa, LocalStorage ni tekshiramiz (Refresh qilinganda)
    if (!activeSession) {
      const savedSession = localStorage.getItem("active_test_session");
      if (savedSession) {
        activeSession = JSON.parse(savedSession);
      }
    }

    // ❌ O'ZGARISH: "Oldin topshirganmi?" degan tekshiruv olib tashlandi.
    // Endi har kim qaytadan kiraveradi.

    // Agar umuman sessiya ma'lumoti yo'q bo'lsa -> Login sahifasiga qaytarish
    if (!activeSession) {
      navigate("/", { replace: true });
      return;
    }

    // 3. Ma'lumotlarni State ga yuklash
    setStudentData({
      name: activeSession.studentName,
      testId: activeSession.testId,
      testLogin: activeSession.testLogin,
    });

    setTestData({
      title: activeSession.title,
      description: activeSession.description,
      questions: activeSession.questions,
      duration: activeSession.duration,
    });

    // 4. Sessiyani xotiraga saqlab qo'yamiz (Refresh qilsa o'chmasligi uchun)
    localStorage.setItem("active_test_session", JSON.stringify(activeSession));

    // 5. Oldin belgilagan javoblarni tiklash (Agar bo'lsa)
    const savedAnswers = localStorage.getItem(
      `answers_${activeSession.testId}`
    );
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }

    // 6. Vaqtni sozlash
    if (timeLeft === 0) {
      setTimeLeft(activeSession.duration * 60);
    }

    if (activeSession.isStarted) {
      if (status !== "finished") setStatus("started");
    } else {
      setStatus("waiting");
    }

    socket.emit("join-test-room", activeSession.testLogin);

    const handleStartTest = () => {
      toast.info("Test boshlandi!");
      setStatus("started");
    };

    socket.on("start-test", handleStartTest);

    const handleBeforeUnload = (e) => {
      if (status === "started") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off("start-test", handleStartTest);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status, navigate, location.state]);

  // "Orqaga" tugmasini bloklash (faqat test tugagandan keyin orqaga qaytmasligi uchun)
  useEffect(() => {
    if (status === "finished") {
      window.history.pushState(null, document.title, window.location.href);
      const blockBack = () => {
        window.history.pushState(null, document.title, window.location.href);
      };
      window.addEventListener("popstate", blockBack);
      return () => {
        window.removeEventListener("popstate", blockBack);
      };
    }
  }, [status]);

  // Timer
  useEffect(() => {
    let timer;
    if (status === "started" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  // Javob belgilash
  const handleSelect = (questionId, optionText) => {
    setAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      const newAnswers = [
        ...filtered,
        { questionId, selectedText: optionText },
      ];

      if (studentData?.testId) {
        localStorage.setItem(
          `answers_${studentData.testId}`,
          JSON.stringify(newAnswers)
        );
      }

      return newAnswers;
    });
  };

  const scrollToQuestion = (id) => {
    questionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // ✅ TESTNI TOPSHIRISH
  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm("Testni yakunlashga ishonchingiz komilmi?"))
      return;

    try {
      const payload = {
        testId: studentData.testId,
        studentName: studentData.name,
        answers: answers,
      };

      const response = await submitTestApi(payload);
      const data = response.data;

      setResult(data);
      setStatus("finished");

      // ❌ O'ZGARISH: "localStorage.setItem(...)" qismi o'chirib tashlandi.
      // Endi qurilma bloklanmaydi.

      // Lekin joriy o'quvchining vaqtinchalik ma'lumotlarini tozalaymiz:
      localStorage.removeItem("active_test_session");
      localStorage.removeItem(`answers_${studentData.testId}`);

      if (isAuto) toast.warning("Vaqt tugadi! Test yakunlandi.");
      else toast.success("Test yakunlandi!");
    } catch (error) {
      console.error(error);
      toast.error("Xatolik yuz berdi. Internetni tekshiring.");
    }
  };

  // ✅ TESTDAN CHIQISH
  const handleExit = () => {
    socket.disconnect();
    // Chiqishda hamma narsani tozalaymiz, shunda keyingi odam bemalol kiradi
    localStorage.removeItem("active_test_session");
    if (studentData?.testId) {
      localStorage.removeItem(`answers_${studentData.testId}`);
    }
    navigate("/", { replace: true });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ================= UI QISMLARI =================

  // 1. KUTISH ZALI
  if (status === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>

        <div className="bg-white/80 backdrop-blur-xl p-8 md:p-12 rounded-3xl shadow-2xl max-w-md w-full border border-white/50 relative z-10">
          <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-white p-5 rounded-full shadow-lg border border-blue-50">
              <Hourglass className="w-10 h-10 text-blue-600 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-3">
            Tayyormisiz?
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            O'qituvchi <b>Start</b> tugmasini bosishi bilan test avtomatik
            boshlanadi.
          </p>

          <div className="bg-gradient-to-b from-gray-50 to-gray-100 rounded-2xl p-6 space-y-4 border border-gray-200 shadow-inner">
            <div className="flex items-center gap-4 border-b border-gray-200 pb-3 last:border-0 last:pb-0">
              <div className="bg-white p-2.5 rounded-xl shadow-sm text-indigo-500">
                <User size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  O'quvchi
                </p>
                <p className="font-bold text-gray-700 text-sm">
                  {studentData?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-b border-gray-200 pb-3 last:border-0 last:pb-0">
              <div className="bg-white p-2.5 rounded-xl shadow-sm text-purple-500">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Test fani
                </p>
                <p className="font-bold text-gray-700 text-sm">
                  {testData?.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white p-2.5 rounded-xl shadow-sm text-orange-500">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Ajratilgan vaqt
                </p>
                <p className="font-bold text-gray-700 text-sm">
                  {testData?.duration} daqiqa
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 py-2.5 px-4 rounded-full w-fit mx-auto border border-blue-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Aloqa o'rnatildi. Kutilmoqda...
          </div>
        </div>
      </div>
    );
  }

  // 2. NATIJA OYNASI
  if (status === "finished" && result) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full text-center relative">
          <div className="bg-blue-600 text-white p-10">
            <h2 className="text-3xl font-bold mb-2">Test Yakunlandi!</h2>
            <p className="opacity-80 text-sm">{testData?.title}</p>
          </div>

          <div className="p-8 -mt-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">
                Sizning natijangiz
              </p>
              <div className="text-5xl font-extrabold text-blue-600">
                {result.score}{" "}
                <span className="text-2xl text-gray-400 font-normal">
                  / {result.maxScore}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex flex-col items-center">
                <CheckCircle className="text-green-500 mb-2" size={28} />
                <p className="text-green-600 font-bold text-2xl">
                  {result.correctCount}
                </p>
                <p className="text-xs text-green-500 font-bold uppercase">
                  To'g'ri
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex flex-col items-center">
                <XCircle className="text-red-500 mb-2" size={28} />
                <p className="text-red-500 font-bold text-2xl">
                  {result.wrongCount}
                </p>
                <p className="text-xs text-red-400 font-bold uppercase">Xato</p>
              </div>
            </div>

            <button
              onClick={handleExit}
              className="w-full bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition transform active:scale-[0.98]"
            >
              <LogOut size={20} /> Natijani Yopish va Chiqish
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ASOSIY TEST JARAYONI
  if (status === "started" && testData) {
    return (
      <div
        className="bg-gray-50 min-h-screen pb-24 font-sans select-none"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
      >
        <header className="bg-white shadow-sm sticky top-0 z-20 px-4 py-3 flex justify-between items-center border-b border-gray-200">
          <div>
            <h1 className="font-bold text-gray-800 text-sm md:text-base line-clamp-1">
              {testData.title}
            </h1>
            <p className="text-xs text-gray-500">{studentData?.name}</p>
          </div>
          <div
            className={`font-mono font-bold text-lg px-3 py-1 rounded ${
              timeLeft < 60
                ? "bg-red-100 text-red-600 animate-pulse"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {testData.questions.map((q, index) => (
            <div
              key={q.id}
              id={`q-${q.id}`}
              ref={(el) => (questionRefs.current[q.id] = el)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex gap-3">
                  <span className="bg-blue-100 text-blue-600 w-8 h-8 flex justify-center items-center rounded-full text-sm shrink-0">
                    {index + 1}
                  </span>
                  {q.text}
                </h3>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {q.points} ball
                </span>
              </div>

              <div className="space-y-3 pl-11">
                {q.options.map((opt, i) => {
                  const isSelected =
                    answers.find((a) => a.questionId === q.id)?.selectedText ===
                    opt.text;
                  return (
                    <div
                      key={i}
                      onClick={() => handleSelect(q.id, opt.text)}
                      className={`cursor-pointer p-3 rounded-lg border-2 transition flex items-center gap-3 group ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-transparent bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? "border-blue-500" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      <span
                        className={`text-sm md:text-base ${
                          isSelected
                            ? "text-blue-800 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2 shadow-2xl z-30">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-2">
              {testData.questions.map((q, index) => {
                const isAnswered = answers.some((a) => a.questionId === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => scrollToQuestion(q.id)}
                    className={`w-10 h-10 shrink-0 rounded-lg text-sm font-bold transition ${
                      isAnswered
                        ? "bg-blue-600 text-white shadow-blue-200 shadow-lg"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handleSubmit(false)}
              className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold text-lg shadow-lg transition transform active:scale-[0.99]"
            >
              Testni Yakunlash
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
