import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { Clock, CheckCircle, AlertCircle, User, FileText } from "lucide-react";
import { submitTestApi } from "../api/api";

// ==========================================================
// ⚠️ MUHIM: Bu yerga Ngrok havolangizni qo'ying!
// Oxirida /api YOKI / belgisi bo'lmasligi kerak.
// ==========================================================
const SOCKET_URL = "https://kayleigh-phototropic-cristine.ngrok-free.dev";

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"], // Barqaror ulanish uchun
});

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  // Login paytida kelgan ma'lumotlarni olamiz
  const [studentData, setStudentData] = useState(null);
  const [testData, setTestData] = useState(null);

  // Statuslar: 'waiting' | 'started' | 'finished'
  const [status, setStatus] = useState("loading");
  const [timeLeft, setTimeLeft] = useState(0); // Sekund hisobida
  const [answers, setAnswers] = useState([]); // { questionId: 1, selectedText: "A" }
  const [result, setResult] = useState(null);

  // Scroll uchun
  const questionRefs = useRef({});

  useEffect(() => {
    // 1. Ma'lumotlarni tiklash (Login dan o'tgan bo'lsa)
    const stateData = location.state?.testData;

    // Agar to'g'ridan-to'g'ri link orqali kirsa, loginga qaytaramiz
    if (!stateData) {
      navigate("/student/login");
      return;
    }

    setStudentData({
      name: stateData.studentName,
      testId: stateData.testId,
      testLogin: stateData.testLogin,
    });

    setTestData({
      title: stateData.title,
      description: stateData.description,
      questions: stateData.questions,
      duration: stateData.duration,
    });

    setTimeLeft(stateData.duration * 60);

    // 2. Statusni aniqlash
    if (stateData.isStarted) {
      setStatus("started");
    } else {
      setStatus("waiting");
    }

    // 3. Socket xonasiga ulanish
    socket.emit("join-test-room", stateData.testLogin);

    // 4. O'qituvchi START bosganda eshitish
    const handleStartTest = () => {
      toast.info("Test boshlandi! Omad.");
      setStatus("started");
    };

    socket.on("start-test", handleStartTest);

    // 5. Sahifani yangilashdan (Refresh) himoya
    const handleBeforeUnload = (e) => {
      if (status === "started") {
        e.preventDefault();
        e.returnValue = ""; // Brauzer ogohlantirish oynasini chiqaradi
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Tozalash
    return () => {
      socket.off("start-test", handleStartTest);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [status, navigate, location.state]);

  // Timer logikasi
  useEffect(() => {
    let timer;
    if (status === "started" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit(true); // Vaqt tugasa avtomatik topshirish
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
      // Agar oldin belgilagan bo'lsa o'chiramiz, yangisini yozamiz
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, { questionId, selectedText: optionText }];
    });
  };

  // Navigatsiya (Scroll)
  const scrollToQuestion = (id) => {
    questionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Testni topshirish
  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm("Testni yakunlashga ishonchingiz komilmi?"))
      return;

    try {
      const payload = {
        testId: studentData.testId,
        studentName: studentData.name,
        answers: answers,
      };

      const { data } = await submitTestApi(payload);
      setResult(data); // Natijani saqlaymiz
      setStatus("finished");
      if (isAuto) toast.warning("Vaqt tugadi! Test avtomatik yakunlandi.");
      else toast.success("Test yakunlandi!");
    } catch (error) {
      console.error(error);
      toast.error("Xatolik yuz berdi. Internetni tekshiring.");
    }
  };

  // Vaqtni formatlash (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ================= UI QISMLARI =================

  // 1. KUTISH ZALI (LOBBY)
  if (status === "waiting") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 text-gray-700 animate-fade-in">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-gray-100">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            O'qituvchi ruxsatini kuting...
          </h2>
          <p className="text-gray-500 mb-6">Test hali boshlanmadi.</p>

          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <p className="font-semibold text-blue-800 flex items-center gap-2">
              <User size={18} /> {studentData?.name}
            </p>
            <p className="text-blue-600 mt-1 flex items-center gap-2">
              <FileText size={18} /> {testData?.title}
            </p>
            <p className="text-blue-600 mt-1 flex items-center gap-2">
              <Clock size={18} /> {testData?.duration} daqiqa
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. NATIJA OYNASI
  if (status === "finished" && result) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100 p-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full text-center">
          <div className="bg-blue-600 text-white p-8">
            <h2 className="text-3xl font-bold mb-2">Test Yakunlandi!</h2>
            <p className="opacity-80">{testData?.title}</p>
          </div>

          <div className="p-8">
            <div className="text-6xl font-extrabold text-blue-600 mb-2">
              {result.score}{" "}
              <span className="text-2xl text-gray-400 font-normal">
                / {result.maxScore}
              </span>
            </div>
            <p className="text-gray-500 font-medium uppercase tracking-wide mb-8">
              Sizning natijangiz
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                <p className="text-green-600 font-bold text-xl">
                  {result.correctCount}
                </p>
                <p className="text-xs text-green-500 uppercase font-semibold">
                  To'g'ri
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-red-500 font-bold text-xl">
                  {result.wrongCount}
                </p>
                <p className="text-xs text-red-400 uppercase font-semibold">
                  Xato
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate("/student/login")}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-xl font-semibold transition"
            >
              Chiqish
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
        className="bg-gray-50 min-h-screen pb-24 font-sans select-none" // ⚠️ Belgilashni o'chiradi
        onContextMenu={(e) => e.preventDefault()} // ⚠️ O'ng tugmani o'chiradi
        onCopy={(e) => e.preventDefault()} // ⚠️ Copy ni o'chiradi
        onCut={(e) => e.preventDefault()} // ⚠️ Cut ni o'chiradi
      >
        {/* Header */}
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

        {/* Savollar (Scrollable) */}
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

        {/* Sticky Footer (Navigatsiya) */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-2 shadow-2xl z-30">
          <div className="max-w-3xl mx-auto flex flex-col gap-2">
            {/* Raqamlar */}
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

            {/* Yakunlash tugmasi */}
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
