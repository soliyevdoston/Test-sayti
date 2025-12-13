import React, { useState, useRef } from "react";
import {
  FaClipboardList,
  FaUsers,
  FaTrash,
  FaSignOutAlt,
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom"; // 🔥

export default function TeacherDashboard() {
  const navigate = useNavigate(); // 🔥
  const [activeCard, setActiveCard] = useState(null);
  const [tests, setTests] = useState([]);
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    username: "",
    password: "",
    file: null,
  });
  const [analyzedTest, setAnalyzedTest] = useState(null);

  const testSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  const cards = [
    { id: 1, title: "Testlar Boshqaruvi", icon: <FaClipboardList /> },
    { id: 2, title: "Natijalar", icon: <FaUsers /> },
  ];

  const addTest = (e) => {
    e.preventDefault();
    if (
      !newTest.title ||
      !newTest.username ||
      !newTest.password ||
      !newTest.file
    ) {
      toast.error("Iltimos, barcha maydonlarni to'ldiring va fayl yuklang!");
      return;
    }
    setTests([...tests, { ...newTest, results: [] }]);
    setNewTest({
      title: "",
      description: "",
      username: "",
      password: "",
      file: null,
    });
    toast.success("Test qo'shildi!");
  };

  const removeTest = (index) => {
    setTests(tests.filter((_, i) => i !== index));
    toast.error("Test o'chirildi!");
  };

  const logout = () => {
    toast.success("Logout qilindi!");
    navigate("/"); // 🔥 Home sahifaga qaytaradi
  };

  const analyzeTest = (test) => {
    if (!test.results.length) {
      toast("Hozircha natija yo'q!");
      return;
    }
    setAnalyzedTest(test);
  };

  const handleCardClick = (id) => {
    setActiveCard(id);
    if (id === 1 && testSectionRef.current) {
      testSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (id === 2 && resultSectionRef.current) {
      resultSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          success: { style: { background: "green", color: "white" } },
          error: { style: { background: "red", color: "white" } },
        }}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Teacher Dashboard
        </h1>
        <button
          className="flex items-center space-x-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          onClick={logout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20 px-6 rounded-b-3xl shadow-lg text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Xush kelibsiz, O'qituvchi!
        </h2>
        <p className="text-lg md:text-xl mb-6">
          Bu yerda siz testlar yaratishingiz, natijalarni ko'rishingiz va tahlil
          qilishingiz mumkin.
        </p>
        <p className="text-sm md:text-base opacity-80">
          Tezkor bo‘limlardan ishni boshlashingiz mumkin.
        </p>
      </section>

      {/* Cards */}
      <main className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`cursor-pointer rounded-xl shadow-lg p-8 text-white text-center transform transition duration-300 hover:scale-105 ${
                card.id === 1
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-2xl font-semibold">{card.title}</h3>
            </div>
          ))}
        </div>

        {/* Testlar Boshqaruvi */}
        <section ref={testSectionRef} className="mb-12">
          {activeCard === 1 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4">Testlar Boshqaruvi</h3>
              <form onSubmit={addTest} className="space-y-3 mb-6">
                <input
                  type="text"
                  placeholder="Test nomi"
                  value={newTest.title}
                  onChange={(e) =>
                    setNewTest({ ...newTest, title: e.target.value })
                  }
                  className="w-full p-3 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  placeholder="Tavsif"
                  value={newTest.description}
                  onChange={(e) =>
                    setNewTest({ ...newTest, description: e.target.value })
                  }
                  className="w-full p-3 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={newTest.username}
                  onChange={(e) =>
                    setNewTest({ ...newTest, username: e.target.value })
                  }
                  className="w-full p-3 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newTest.password}
                  onChange={(e) =>
                    setNewTest({ ...newTest, password: e.target.value })
                  }
                  className="w-full p-3 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="file"
                  accept=".docx"
                  onChange={(e) =>
                    setNewTest({ ...newTest, file: e.target.files[0] })
                  }
                  className="w-full p-3 rounded border border-gray-300 dark:border-gray-600"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  Qo'shish
                </button>
              </form>

              <h4 className="font-semibold mb-2">Testlar Ro'yxati</h4>
              <ul className="list-disc ml-6">
                {tests.map((t, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center mb-2"
                  >
                    <span>
                      {t.title} - {t.username}/{t.password}
                    </span>
                    <button
                      onClick={() => removeTest(i)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Natijalar */}
        <section ref={resultSectionRef}>
          {activeCard === 2 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4">Natijalar</h3>
              {tests.length === 0 ? (
                <p className="text-gray-500">Hozircha test qo'shilmagan.</p>
              ) : (
                tests.map((test, idx) => (
                  <div
                    key={idx}
                    className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{test.title}</h4>
                      <button
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1 rounded"
                        onClick={() => analyzeTest(test)}
                      >
                        Tahlil
                      </button>
                    </div>

                    {analyzedTest === test &&
                      test.results.map((r, i) => (
                        <div key={i} className="mb-2">
                          <div className="font-semibold">
                            {r.studentName} - {r.score}/{r.total}
                          </div>
                          {r.answers.map((a, j) => (
                            <div
                              key={j}
                              className={`p-2 rounded mb-1 text-white ${
                                a.correct ? "bg-green-500" : "bg-red-500"
                              }`}
                            >
                              {a.question}: {a.userAnswer}
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 mt-16 text-center">
        &copy; {new Date().getFullYear()} Online Test Platform. Barcha huquqlar
        himoyalangan.
      </footer>
    </div>
  );
}
