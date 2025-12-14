import React, { useState, useRef, useEffect } from "react";
import {
  FaClipboardList,
  FaUsers,
  FaTrash,
  FaSignOutAlt,
  FaPlay,
  FaCheckCircle,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

// API lar
import {
  teacherUploadTest,
  getTeacherTests,
  startTestApi,
  deleteTestApi,
  getResultsApi,
  getAnalysisApi,
} from "../api/api";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(1);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  // Yangi test formasi
  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    username: "",
    password: "",
    duration: 20,
    file: null,
  });

  // Tahlil uchun state-lar
  const [analyzedTestId, setAnalyzedTestId] = useState(null); // Qaysi test natijalari ochiq
  const [resultsData, setResultsData] = useState([]); // Test natijalari ro'yxati

  // MODAL UCHUN YANGI STATE-LAR
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentAnalysis, setSelectedStudentAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const testSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  const cards = [
    { id: 1, title: "Testlar Boshqaruvi", icon: <FaClipboardList /> },
    { id: 2, title: "Natijalar", icon: <FaUsers /> },
  ];

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) {
      navigate("/teacher/login");
    } else {
      setTeacherName(name);
      loadTests(id);
    }
  }, []);

  const loadTests = async (id) => {
    try {
      const { data } = await getTeacherTests(
        id || localStorage.getItem("teacherId")
      );
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
      toast.warning("Barcha maydonlarni to'ldiring!");
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
      toast.success("Test yuklandi!");
      setNewTest({
        title: "",
        description: "",
        username: "",
        password: "",
        duration: 20,
        file: null,
      });
      loadTests(localStorage.getItem("teacherId"));
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const removeTest = async (testId) => {
    if (!window.confirm("Rostdan ham o'chirmoqchimisiz?")) return;
    try {
      await deleteTestApi(testId);
      toast.info("Test o'chirildi");
      loadTests(localStorage.getItem("teacherId"));
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const startTest = async (testId) => {
    try {
      await startTestApi(testId);
      toast.success("Test boshlandi!");
      loadTests(localStorage.getItem("teacherId"));
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/teacher/login");
  };

  // Natijalar ro'yxatini olish
  const analyzeTest = async (testId) => {
    if (analyzedTestId === testId) {
      setAnalyzedTestId(null);
      return;
    }
    try {
      const { data } = await getResultsApi(testId);
      if (data.length === 0) toast.warning("Natijalar yo'q");
      setResultsData(data);
      setAnalyzedTestId(testId);
    } catch (error) {
      toast.error("Natijalarni olishda xatolik");
    }
  };

  // --- YANGI: Aniq bir o'quvchining javoblarini tahlil qilish ---
  const handleStudentAnalysis = async (resultId) => {
    setIsModalOpen(true);
    setLoadingAnalysis(true);
    try {
      const { data } = await getAnalysisApi(resultId);
      setSelectedStudentAnalysis(data);
    } catch (error) {
      toast.error("Tahlilni yuklab bo'lmadi");
      setIsModalOpen(false);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleCardClick = (id) => {
    setActiveCard(id);
    setTimeout(() => {
      if (id === 1 && testSectionRef.current)
        testSectionRef.current.scrollIntoView({ behavior: "smooth" });
      if (id === 2 && resultSectionRef.current)
        resultSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans relative">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <FaUsers className="text-blue-600" /> {teacherName}
        </h1>
        <button
          className="flex items-center space-x-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          onClick={logout}
        >
          <FaSignOutAlt /> <span>Chiqish</span>
        </button>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12 px-6 shadow-lg text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-2">
          O'qituvchi Paneli
        </h2>
        <p className="opacity-90">
          Test yarating va o'quvchilar bilimini tahlil qiling
        </p>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`cursor-pointer rounded-xl shadow-lg p-6 text-white text-center transform transition duration-300 hover:scale-105 flex flex-col items-center ${
                card.id === 1 ? "bg-blue-500" : "bg-green-500"
              }`}
            >
              <div className="text-4xl mb-2 opacity-90">{card.icon}</div>
              <h3 className="text-xl font-bold">{card.title}</h3>
            </div>
          ))}
        </div>

        {/* 1. Testlar Bo'limi */}
        <section ref={testSectionRef} className="mb-12 scroll-mt-24">
          {activeCard === 1 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-2">
                Yangi Test Yuklash
              </h3>

              <form
                onSubmit={addTest}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl"
              >
                <input
                  required
                  placeholder="Test Nomi"
                  className="p-3 rounded border"
                  value={newTest.title}
                  onChange={(e) =>
                    setNewTest({ ...newTest, title: e.target.value })
                  }
                />
                <input
                  placeholder="Tavsif"
                  className="p-3 rounded border"
                  value={newTest.description}
                  onChange={(e) =>
                    setNewTest({ ...newTest, description: e.target.value })
                  }
                />
                <input
                  required
                  placeholder="Login"
                  className="p-3 rounded border"
                  value={newTest.username}
                  onChange={(e) =>
                    setNewTest({ ...newTest, username: e.target.value })
                  }
                />
                <input
                  required
                  placeholder="Parol"
                  className="p-3 rounded border"
                  value={newTest.password}
                  onChange={(e) =>
                    setNewTest({ ...newTest, password: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Vaqt (daqiqa)"
                  className="p-3 rounded border"
                  value={newTest.duration}
                  onChange={(e) =>
                    setNewTest({ ...newTest, duration: e.target.value })
                  }
                />
                <input
                  required
                  type="file"
                  accept=".docx"
                  className="p-2 bg-white rounded border"
                  onChange={(e) =>
                    setNewTest({ ...newTest, file: e.target.files[0] })
                  }
                />
                <button
                  disabled={loading}
                  className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow"
                >
                  {loading ? "Yuklanmoqda..." : "Testni Yaratish"}
                </button>
              </form>

              <h4 className="font-bold text-lg mb-4 dark:text-white">
                Mavjud Testlar
              </h4>
              <div className="space-y-3">
                {tests.map((t) => (
                  <div
                    key={t._id}
                    className="flex flex-col md:flex-row justify-between items-center bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500"
                  >
                    <div>
                      <h5 className="font-bold dark:text-white">{t.title}</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        Login: {t.testLogin} | Parol: {t.testPassword}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-2 md:mt-0">
                      {t.isStarted ? (
                        <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                          <FaCheckCircle /> Faol
                        </span>
                      ) : (
                        <button
                          onClick={() => startTest(t._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1"
                        >
                          <FaPlay /> Boshlash
                        </button>
                      )}
                      <button
                        onClick={() => removeTest(t._id)}
                        className="bg-red-100 text-red-600 p-2 rounded hover:bg-red-200"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. Natijalar Bo'limi */}
        <section ref={resultSectionRef} className="scroll-mt-24">
          {activeCard === 2 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
              <h3 className="text-xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-2">
                Natijalar
              </h3>
              <div className="space-y-4">
                {tests.map((test) => (
                  <div
                    key={test._id}
                    className="border dark:border-gray-600 rounded-xl overflow-hidden"
                  >
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 flex justify-between items-center">
                      <h4 className="font-bold dark:text-white">
                        {test.title}
                      </h4>
                      <button
                        className={`px-3 py-1 rounded text-sm font-semibold transition ${
                          analyzedTestId === test._id
                            ? "bg-gray-300"
                            : "bg-blue-100 text-blue-700"
                        }`}
                        onClick={() => analyzeTest(test._id)}
                      >
                        {analyzedTestId === test._id ? "Yopish" : "Ko'rish"}
                      </button>
                    </div>

                    {analyzedTestId === test._id && (
                      <div className="p-4 bg-white dark:bg-gray-800 overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-700 dark:text-gray-200">
                          <thead className="bg-gray-50 dark:bg-gray-600 uppercase text-xs">
                            <tr>
                              <th className="p-2">#</th>
                              <th className="p-2">O'quvchi</th>
                              <th className="p-2">Ball</th>
                              <th className="p-2 text-center text-green-600">
                                To'g'ri
                              </th>
                              <th className="p-2 text-center text-red-500">
                                Xato
                              </th>
                              <th className="p-2 text-center">Tahlil</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultsData.map((res, idx) => (
                              <tr
                                key={res._id}
                                className="border-b hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <td className="p-2">{idx + 1}</td>
                                <td className="p-2 font-medium">
                                  {res.studentName}
                                </td>
                                <td className="p-2 font-bold text-blue-600">
                                  {res.totalScore}
                                </td>
                                <td className="p-2 text-center font-bold text-green-600">
                                  {res.correctAnswersCount}
                                </td>
                                <td className="p-2 text-center font-bold text-red-500">
                                  {res.wrongAnswersCount}
                                </td>
                                <td className="p-2 text-center">
                                  {/* TAHLIL TUGMASI */}
                                  <button
                                    onClick={() =>
                                      handleStudentAnalysis(res._id)
                                    }
                                    className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded flex items-center justify-center gap-1 mx-auto"
                                  >
                                    <FaEye />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* --- TAHLIL MODAL OYNASI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {loadingAnalysis
                  ? "Yuklanmoqda..."
                  : `${selectedStudentAnalysis?.studentName} - Natija Tahlili`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-red-500 transition text-xl"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto bg-gray-50 dark:bg-gray-700">
              {loadingAnalysis ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <p className="text-xs text-blue-600">Jami Ball</p>
                      <p className="font-bold text-blue-800">
                        {selectedStudentAnalysis?.totalScore}
                      </p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-lg">
                      <p className="text-xs text-green-600">To'g'ri</p>
                      <p className="font-bold text-green-800">
                        {selectedStudentAnalysis?.correctAnswersCount}
                      </p>
                    </div>
                    <div className="bg-red-100 p-2 rounded-lg">
                      <p className="text-xs text-red-600">Xato</p>
                      <p className="font-bold text-red-800">
                        {selectedStudentAnalysis?.wrongAnswersCount}
                      </p>
                    </div>
                  </div>

                  {selectedStudentAnalysis?.studentAnswers.map((ans, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-l-4 shadow-sm bg-white dark:bg-gray-800 ${
                        ans.isCorrect ? "border-green-500" : "border-red-500"
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-gray-700 dark:text-gray-200">
                          {idx + 1}-savol
                        </span>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 dark:bg-gray-600">
                          {ans.points} ball
                        </span>
                      </div>
                      <p className="text-gray-800 dark:text-gray-300 mb-3 text-sm">
                        {ans.questionText}
                      </p>

                      <div className="text-sm grid gap-1">
                        <div
                          className={`flex items-center gap-2 p-2 rounded ${
                            ans.isCorrect
                              ? "bg-green-50 text-green-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          <span>{ans.isCorrect ? "✅" : "❌"}</span>
                          <span>
                            O'quvchi javobi:{" "}
                            <strong>
                              {ans.selectedOption || "Belgilanmagan"}
                            </strong>
                          </span>
                        </div>

                        {!ans.isCorrect && (
                          <div className="flex items-center gap-2 p-2 rounded bg-green-50 text-green-800 mt-1 border border-green-200">
                            <span>✅</span>
                            <span>
                              To'g'ri javob:{" "}
                              <strong>{ans.correctOption}</strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded shadow transition"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
