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
      readingText: activeSession.readingText || null, // ✅ READING TEXT
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
  }, [location.state, navigate, status, timeLeft]);

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

  // ================= ANSWER =================
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

  // ================= SUBMIT =================
  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm("Testni yakunlaysizmi?")) return;

    try {
      const payload = {
        testId: studentData.testId,
        studentName: studentData.name,
        answers,
      };

      const { data } = await submitTestApi(payload);

      setResult(data);
      setStatus("finished");

      localStorage.removeItem("active_test_session");
      localStorage.removeItem(`answers_${studentData.testId}`);

      isAuto
        ? toast.warning("Vaqt tugadi!")
        : toast.success("Test yakunlandi!");
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleExit = () => {
    socket.disconnect();
    localStorage.removeItem("active_test_session");
    localStorage.removeItem(`answers_${studentData?.testId}`);
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
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center">
          <Hourglass
            className="mx-auto text-blue-600 animate-pulse"
            size={48}
          />
          <h2 className="mt-4 font-bold text-xl">Kutilmoqda...</h2>
          <p className="text-gray-500 mt-2">O‘qituvchi testni boshlaydi</p>
        </div>
      </div>
    );
  }

  // ================= RESULT =================
  if (status === "finished" && result) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Test yakunlandi</h2>
          <p className="text-5xl font-extrabold text-blue-600 mb-4">
            {result.score} / {result.maxScore}
          </p>
          <div className="flex justify-between mb-6">
            <div className="text-green-600 font-bold">
              <CheckCircle className="mx-auto" /> {result.correctCount}
            </div>
            <div className="text-red-500 font-bold">
              <XCircle className="mx-auto" /> {result.wrongCount}
            </div>
          </div>
          <button
            onClick={handleExit}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            Chiqish
          </button>
        </div>
      </div>
    );
  }

  // ================= TEST =================
  if (status === "started" && testData) {
    return (
      <div className="bg-gray-50 min-h-screen pb-24">
        <header className="bg-white sticky top-0 z-10 p-4 flex justify-between border-b">
          <div>
            <h1 className="font-bold">{testData.title}</h1>
            <p className="text-xs text-gray-500">{studentData.name}</p>
          </div>
          <div className="font-mono font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded">
            {formatTime(timeLeft)}
          </div>
        </header>

        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {/* ===== READING TEXT ===== */}
          {testData.readingText && (
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <FileText className="text-blue-600" /> Reading
              </h2>
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {testData.readingText}
              </div>
            </div>
          )}

          {/* ===== QUESTIONS ===== */}
          {testData.questions.map((q, index) => (
            <div
              key={q.id}
              ref={(el) => (questionRefs.current[q.id] = el)}
              className="bg-white p-6 rounded-xl border shadow-sm"
            >
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">
                  {index + 1}. {q.text}
                </h3>
                <span className="text-xs text-gray-400">{q.points} ball</span>
              </div>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const selected =
                    answers.find((a) => a.questionId === q.id)?.selectedText ===
                    opt.text;

                  return (
                    <div
                      key={i}
                      onClick={() => handleSelect(q.id, opt.text)}
                      className={`p-3 rounded-lg cursor-pointer border ${
                        selected
                          ? "bg-blue-50 border-blue-500"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {opt.text}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white p-3 border-t">
          <button
            onClick={() => handleSubmit(false)}
            className="w-full bg-black text-white py-3 rounded-xl"
          >
            Testni yakunlash
          </button>
        </div>
      </div>
    );
  }

  return null;
}
