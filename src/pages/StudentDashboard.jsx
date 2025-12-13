import React, { useState } from "react";
import {
  FaClipboardList,
  FaChartBar,
  FaPlay,
  FaUserGraduate,
  FaSignOutAlt,
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom"; // 🔥

export default function StudentDashboard({ tests = [] }) {
  const navigate = useNavigate(); // 🔥
  const [step, setStep] = useState("name"); // name | dashboard
  const [activeCard, setActiveCard] = useState(null); // tests | results
  const [studentName, setStudentName] = useState("");
  const [login, setLogin] = useState({ username: "", password: "" });
  const [results, setResults] = useState([]);

  /* ================= ISM ================= */
  const submitName = (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      toast.error("Ismingizni kiriting!");
      return;
    }
    setStep("dashboard");
    toast.success("Xush kelibsiz!");
  };

  /* ================= TEST BOSHLASH ================= */
  const startTest = (test) => {
    if (login.username !== test.username || login.password !== test.password) {
      toast.error("Login yoki parol noto‘g‘ri!");
      return;
    }

    const fakeResult = {
      testTitle: test.title,
      score: 7,
      total: 10,
      correct: ["1-savol", "2-savol", "4-savol"],
      wrong: ["3-savol"],
    };

    setResults([...results, fakeResult]);
    toast.success("Test yakunlandi!");
  };

  /* ================= LOGOUT ================= */
  const onLogout = () => {
    setStudentName("");
    setLogin({ username: "", password: "" });
    setActiveCard(null);
    setResults([]);
    setStep("name");
    toast.success("Chiqildi!");
    navigate("/"); // 🔥 asosiy home ga qaytadi
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ================= HEADER ================= */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <FaUserGraduate className="text-blue-600 text-2xl" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            Student Dashboard
          </h1>
        </div>

        {studentName && (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">
              👤 {studentName}
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              <FaSignOutAlt />
              Chiqish
            </button>
          </div>
        )}
      </header>

      <Toaster
        position="top-right"
        toastOptions={{
          success: { style: { background: "green", color: "white" } },
          error: { style: { background: "red", color: "white" } },
        }}
      />

      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Online Test Platform</h2>
        <p className="opacity-90">
          Testlarni yeching va natijangizni darhol ko‘ring
        </p>
      </section>

      {/* ================= ISM KIRITISH ================= */}
      {step === "name" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-center mb-6">
              Ismingizni kiriting
            </h3>
            <form onSubmit={submitName}>
              <input
                className="w-full p-3 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
                placeholder="Ism"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded">
                Davom etish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= DASHBOARD ================= */}
      {step === "dashboard" && (
        <main className="container mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-10">
            Salom, {studentName}
          </h2>

          {/* DASHBOARD CARDS */}
          <div className="grid md:grid-cols-2 gap-8 mb-14">
            <div
              onClick={() => setActiveCard("tests")}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-xl text-center transition transform hover:scale-105"
            >
              <FaClipboardList className="text-4xl mx-auto mb-4" />
              <h3 className="text-2xl font-semibold">Testlar</h3>
            </div>

            <div
              onClick={() => setActiveCard("results")}
              className="cursor-pointer bg-green-600 hover:bg-green-700 text-white p-8 rounded-xl text-center transition transform hover:scale-105"
            >
              <FaChartBar className="text-4xl mx-auto mb-4" />
              <h3 className="text-2xl font-semibold">Natijalar</h3>
            </div>
          </div>

          {/* TESTLAR */}
          {activeCard === "tests" && (
            <div className="grid md:grid-cols-2 gap-6">
              {tests.map((test, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow">
                  <h3 className="text-xl font-bold mb-2">{test.title}</h3>
                  <p className="text-gray-500 mb-4">{test.description}</p>

                  <input
                    className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Login"
                    onChange={(e) =>
                      setLogin({ ...login, username: e.target.value })
                    }
                  />
                  <input
                    type="password"
                    className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Parol"
                    onChange={(e) =>
                      setLogin({ ...login, password: e.target.value })
                    }
                  />

                  <button
                    onClick={() => startTest(test)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded flex justify-center gap-2"
                  >
                    <FaPlay /> Boshlash
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* NATIJALAR */}
          {activeCard === "results" && (
            <div className="grid md:grid-cols-2 gap-6">
              {results.length === 0 && (
                <p className="text-gray-500">Natijalar yo‘q</p>
              )}

              {results.map((r, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow">
                  <h3 className="text-xl font-bold">{r.testTitle}</h3>
                  <p>
                    Natija: {r.score}/{r.total}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">
                      Tahlil
                    </summary>
                    <p className="text-green-600">
                      To‘g‘ri: {r.correct.join(", ")}
                    </p>
                    <p className="text-red-600">Xato: {r.wrong.join(", ")}</p>
                  </details>
                </div>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
