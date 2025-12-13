import React, { useState, useRef, useEffect } from "react";
import {
  FaClipboardList,
  FaUsers,
  FaTrash,
  FaSignOutAlt,
  FaPlay,
  FaCheckCircle,
  FaPauseCircle,
} from "react-icons/fa";
import { toast } from "react-toastify"; // Toaster o'rniga toastify ishlatamiz
import { useNavigate } from "react-router-dom";

// API lar
import {
  teacherUploadTest,
  getTeacherTests,
  startTestApi,
  deleteTestApi,
  getResultsApi,
} from "../api/api";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(1); // Default ochiq turishi uchun
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  // Yangi test formasi
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    username: "", // testLogin
    password: "", // testPassword
    duration: 20, // Default 20 daqiqa
    file: null,
  });

  // Tahlil uchun
  const [analyzedTestId, setAnalyzedTestId] = useState(null);
  const [resultsData, setResultsData] = useState([]);

  const testSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  const cards = [
    { id: 1, title: "Testlar Boshqaruvi", icon: <FaClipboardList /> },
    { id: 2, title: "Natijalar", icon: <FaUsers /> },
  ];

  // Sahifa yuklanganda ishga tushadi
  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    if (!name) {
      navigate("/teacher/login");
    } else {
      setTeacherName(name);
      loadTests(); // Testlarni bazadan yuklaymiz
    }
  }, []);

  const loadTests = async () => {
    try {
      const { data } = await getTeacherTests();
      setTests(data);
    } catch (error) {
      toast.error("Testlarni yuklashda xatolik");
    }
  };

  const addTest = async (e) => {
    e.preventDefault();
    if (
      !newTest.title ||
      !newTest.username ||
      !newTest.password ||
      !newTest.file
    ) {
      toast.warning("Iltimos, barcha maydonlarni to'ldiring va fayl yuklang!");
      return;
    }

    const formData = new FormData();
    formData.append("file", newTest.file);
    formData.append("title", newTest.title);
    formData.append("description", newTest.description);
    formData.append("duration", newTest.duration);
    formData.append("testLogin", newTest.username);
    formData.append("testPassword", newTest.password);
    formData.append("teacherId", localStorage.getItem("teacherId"));

    try {
      setLoading(true);
      await teacherUploadTest(formData);
      toast.success("Test muvaffaqiyatli yuklandi!");

      // Formani tozalash
      setNewTest({
        title: "",
        description: "",
        username: "",
        password: "",
        duration: 20,
        file: null,
      });
      // Ro'yxatni yangilash
      loadTests();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const removeTest = async (testId) => {
    if (!window.confirm("Testni o'chirmoqchimisiz?")) return;
    try {
      await deleteTestApi(testId);
      toast.info("Test o'chirildi!");
      loadTests();
    } catch (error) {
      toast.error("O'chirishda xatolik");
    }
  };

  const startTest = async (testId) => {
    try {
      await startTestApi(testId);
      toast.success("Test boshlandi! O'quvchilar kirishi mumkin.");
      loadTests();
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const logout = () => {
    localStorage.clear();
    toast.info("Tizimdan chiqildi");
    navigate("/teacher/login");
  };

  const analyzeTest = async (testId) => {
    if (analyzedTestId === testId) {
      setAnalyzedTestId(null); // Yopish
      return;
    }

    try {
      const { data } = await getResultsApi(testId);
      if (data.length === 0) toast.warning("Hozircha natija yo'q!");
      setResultsData(data);
      setAnalyzedTestId(testId);
    } catch (error) {
      toast.error("Natijalarni olishda xatolik");
    }
  };

  const handleCardClick = (id) => {
    setActiveCard(id);
    // Biroz kutib keyin scroll qilamiz (section ochilishi uchun)
    setTimeout(() => {
      if (id === 1 && testSectionRef.current) {
        testSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
      if (id === 2 && resultSectionRef.current) {
        resultSectionRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaUsers className="text-blue-600" /> {teacherName || "O'qituvchi"}
        </h1>
        <button
          className="flex items-center space-x-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          onClick={logout}
        >
          <FaSignOutAlt />
          <span>Chiqish</span>
        </button>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 px-6 shadow-lg text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Xush kelibsiz, Ustoz!
        </h2>
        <p className="text-lg md:text-xl opacity-90">
          Yangi testlar yuklang va natijalarni kuzatib boring.
        </p>
      </section>

      {/* Cards */}
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`cursor-pointer rounded-xl shadow-lg p-8 text-white text-center transform transition duration-300 hover:scale-105 flex flex-col items-center ${
                card.id === 1
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              <div className="text-5xl mb-4 opacity-90">{card.icon}</div>
              <h3 className="text-2xl font-bold">{card.title}</h3>
            </div>
          ))}
        </div>

        {/* 1. Testlar Boshqaruvi */}
        <section ref={testSectionRef} className="mb-12 scroll-mt-24">
          {activeCard === 1 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl animate-fade-in">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-4">
                Testlar Boshqaruvi
              </h3>

              {/* Form */}
              <form
                onSubmit={addTest}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-gray-50 dark:bg-gray-700 p-6 rounded-xl"
              >
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold mb-1">
                    Test Nomi
                  </label>
                  <input
                    type="text"
                    required
                    value={newTest.title}
                    onChange={(e) =>
                      setNewTest({ ...newTest, title: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Masalan: Fizika 9-sinf"
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-sm font-semibold mb-1">
                    Tavsif (Ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    value={newTest.description}
                    onChange={(e) =>
                      setNewTest({ ...newTest, description: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Chorak nazorat ishi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Login (O'quvchi uchun)
                  </label>
                  <input
                    type="text"
                    required
                    value={newTest.username}
                    onChange={(e) =>
                      setNewTest({ ...newTest, username: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="fizika9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Parol
                  </label>
                  <input
                    type="text"
                    required
                    value={newTest.password}
                    onChange={(e) =>
                      setNewTest({ ...newTest, password: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Vaqt (daqiqa)
                  </label>
                  <input
                    type="number"
                    required
                    value={newTest.duration}
                    onChange={(e) =>
                      setNewTest({ ...newTest, duration: e.target.value })
                    }
                    className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Fayl (.docx)
                  </label>
                  <input
                    type="file"
                    accept=".docx"
                    required
                    onChange={(e) =>
                      setNewTest({ ...newTest, file: e.target.files[0] })
                    }
                    className="w-full p-2 bg-white rounded-lg border file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="col-span-2">
                  <button
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow transition transform active:scale-95"
                  >
                    {loading ? "Yuklanmoqda..." : "Testni Yaratish"}
                  </button>
                </div>
              </form>

              {/* List */}
              <h4 className="font-bold text-xl mb-4 text-gray-700 dark:text-gray-200">
                Mavjud Testlar
              </h4>
              <div className="space-y-4">
                {tests.length === 0 ? (
                  <p className="text-gray-400">Hali testlar yo'q.</p>
                ) : (
                  tests.map((t) => (
                    <div
                      key={t._id}
                      className="flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition"
                    >
                      <div className="mb-4 md:mb-0">
                        <h5 className="font-bold text-lg">{t.title}</h5>
                        <p className="text-sm text-gray-500 dark:text-gray-300 flex gap-4 mt-1">
                          <span className="bg-gray-200 px-2 rounded text-xs py-1">
                            Login: {t.testLogin}
                          </span>
                          <span className="bg-gray-200 px-2 rounded text-xs py-1">
                            Parol: {t.testPassword}
                          </span>
                          <span className="bg-gray-200 px-2 rounded text-xs py-1">
                            {t.duration} min
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {t.isStarted ? (
                          <span className="flex items-center gap-1 text-green-600 font-semibold bg-green-100 px-3 py-1 rounded-full text-sm">
                            <FaCheckCircle /> Faol
                          </span>
                        ) : (
                          <button
                            onClick={() => startTest(t._id)}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded shadow transition text-sm"
                          >
                            <FaPlay /> Boshlash
                          </button>
                        )}

                        <button
                          onClick={() => removeTest(t._id)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded transition"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>

        {/* 2. Natijalar Bo'limi */}
        <section ref={resultSectionRef} className="scroll-mt-24">
          {activeCard === 2 && (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl animate-fade-in">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-4">
                Natijalar Tahlili
              </h3>

              {tests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Hozircha testlar yo'q.
                </p>
              ) : (
                <div className="space-y-6">
                  {tests.map((test) => (
                    <div
                      key={test._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-between items-center">
                        <h4 className="font-bold text-lg">{test.title}</h4>
                        <button
                          className={`px-4 py-2 rounded text-sm font-semibold transition ${
                            analyzedTestId === test._id
                              ? "bg-gray-300 text-gray-800"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                          onClick={() => analyzeTest(test._id)}
                        >
                          {analyzedTestId === test._id
                            ? "Yopish"
                            : "Natijalarni Ko'rish"}
                        </button>
                      </div>

                      {analyzedTestId === test._id && (
                        <div className="p-4 bg-white dark:bg-gray-800 overflow-x-auto">
                          {resultsData.length > 0 ? (
                            <table className="w-full text-left text-sm">
                              <thead className="bg-gray-100 dark:bg-gray-600 uppercase text-xs font-semibold text-gray-600 dark:text-gray-200">
                                <tr>
                                  <th className="p-3">#</th>
                                  <th className="p-3">O'quvchi</th>
                                  <th className="p-3">Ball</th>
                                  <th className="p-3 text-center">To'g'ri</th>
                                  <th className="p-3 text-center">Xato</th>
                                </tr>
                              </thead>
                              <tbody>
                                {resultsData.map((res, idx) => (
                                  <tr
                                    key={res._id}
                                    className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <td className="p-3">{idx + 1}</td>
                                    <td className="p-3 font-medium">
                                      {res.studentName}
                                    </td>
                                    <td className="p-3 font-bold text-blue-600">
                                      {res.totalScore} / {res.maxScore}
                                    </td>
                                    <td className="p-3 text-center text-green-600 font-bold">
                                      {res.correctAnswersCount}
                                    </td>
                                    <td className="p-3 text-center text-red-500">
                                      {res.wrongAnswersCount}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-center text-gray-500 py-4">
                              Hozircha hech kim testni yechmadi.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 mt-16 text-center text-sm opacity-70">
        &copy; {new Date().getFullYear()} Online Test Platform.
      </footer>
    </div>
  );
}
