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
  FaStop,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  teacherUploadTest,
  getTeacherTests,
  startTestApi,
  deleteTestApi,
  getResultsApi,
  getAnalysisApi,
} from "../api/api";
const Footer = () => {
  return (
    <footer className="mt-24 border-t border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400">
        <p className="text-sm">
          © {new Date().getFullYear()} Knowledge Gateway
        </p>
        <p className="text-sm">
          Teacher Panel · Built by{" "}
          <span className="text-white font-medium">Soliyev</span>
        </p>
      </div>
    </footer>
  );
};
const SOCKET_URL = "https://kayleigh-phototropic-cristine.ngrok-free.dev";
const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeCard, setActiveCard] = useState(1);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState("");

  const [newTest, setNewTest] = useState({
    title: "",
    description: "",
    username: "",
    password: "",
    duration: 20,
    file: null,
  });

  const [analyzedTestId, setAnalyzedTestId] = useState(null);
  const [resultsData, setResultsData] = useState([]);
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
    if (!name || !id) navigate("/teacher/login");
    else {
      setTeacherName(name);
      loadTests(id);
    }
  }, [navigate]);

  const loadTests = async (id) => {
    try {
      const { data } = await getTeacherTests(
        id || localStorage.getItem("teacherId")
      );
      setTests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Testlarni yuklashda xatolik");
      setTests([]);
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
    Object.entries({
      file: newTest.file,
      title: newTest.title,
      description: newTest.description,
      duration: newTest.duration,
      testLogin: newTest.username,
      testPassword: newTest.password,
      teacherId: localStorage.getItem("teacherId"),
    }).forEach(([k, v]) => formData.append(k, v));

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
    } catch {
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
    } catch {
      toast.error("Xatolik");
    }
  };

  const startTest = async (testId) => {
    try {
      await startTestApi(testId);
      toast.success("Test boshlandi!");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Xatolik");
    }
  };

  const handleForceStop = (testLogin) => {
    if (
      window.confirm(
        "Barcha o'quvchilar uchun testni majburiy to'xtatmoqchimisiz?"
      )
    ) {
      socket.emit("force-stop-test", testLogin);
      toast.warning("Test majburiy to'xtatildi!");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/teacher/login");
  };

  const analyzeTest = async (testId) => {
    if (analyzedTestId === testId) {
      setAnalyzedTestId(null);
      return;
    }
    try {
      const { data } = await getResultsApi(testId);
      setResultsData(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0)
        toast.warning("Hozircha natijalar yo'q");
      setAnalyzedTestId(testId);
    } catch {
      toast.error("Natijalarni olishda xatolik");
      setResultsData([]);
    }
  };

  const handleStudentAnalysis = async (resultId) => {
    setIsModalOpen(true);
    setLoadingAnalysis(true);
    try {
      const { data } = await getAnalysisApi(resultId);
      setSelectedStudentAnalysis(data);
    } catch {
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
    <div className="relative min-h-screen bg-black text-white overflow-hidden px-6 font-sans">
      {/* Glow Background */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl" />

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center py-6 px-4">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <FaUsers className="text-cyan-400" /> {teacherName}
        </h1>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-xl hover:bg-red-700 transition shadow"
        >
          <FaSignOutAlt /> Chiqish
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 text-center py-12 px-6">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-2 text-white">
          O'qituvchi Paneli
        </h2>
        <p className="text-gray-300 opacity-90">
          Test yarating va o'quvchilar bilimini tahlil qiling
        </p>
      </section>

      {/* Cards */}
      <main className="relative z-10 container mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`cursor-pointer rounded-2xl p-6 shadow-2xl text-center transform transition duration-300 hover:scale-105 bg-white/5 border border-white/10 backdrop-blur-xl`}
            >
              <div className="text-4xl mb-2 opacity-90">{card.icon}</div>
              <h3 className="text-xl font-bold">{card.title}</h3>
            </div>
          ))}
        </div>

        {/* Testlar bo'limi */}
        {activeCard === 1 && (
          <div
            ref={testSectionRef}
            className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-6">Yangi Test Yuklash</h3>
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
              onSubmit={addTest}
            >
              <input
                required
                placeholder="Test Nomi"
                className="p-3 rounded-lg bg-black/40 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                value={newTest.title}
                onChange={(e) =>
                  setNewTest({ ...newTest, title: e.target.value })
                }
              />
              <input
                placeholder="Tavsif"
                className="p-3 rounded-lg bg-black/40 border border-white/10"
                value={newTest.description}
                onChange={(e) =>
                  setNewTest({ ...newTest, description: e.target.value })
                }
              />
              <input
                required
                placeholder="Login"
                className="p-3 rounded-lg bg-black/40 border border-white/10"
                value={newTest.username}
                onChange={(e) =>
                  setNewTest({ ...newTest, username: e.target.value })
                }
              />
              <input
                required
                placeholder="Parol"
                className="p-3 rounded-lg bg-black/40 border border-white/10"
                value={newTest.password}
                onChange={(e) =>
                  setNewTest({ ...newTest, password: e.target.value })
                }
              />
              <input
                required
                type="number"
                placeholder="Vaqt (daqiqa)"
                className="p-3 rounded-lg bg-black/40 border border-white/10"
                value={newTest.duration}
                onChange={(e) =>
                  setNewTest({ ...newTest, duration: e.target.value })
                }
              />
              <input
                required
                type="file"
                accept=".docx"
                className="p-2 rounded-lg bg-black/40 border border-white/10"
                onChange={(e) =>
                  setNewTest({ ...newTest, file: e.target.files[0] })
                }
              />
              <button
                disabled={loading}
                className={`col-span-2 py-3 rounded-xl font-semibold transition transform ${
                  loading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105"
                }`}
              >
                {loading ? "Yuklanmoqda..." : "Testni Yaratish"}
              </button>
            </form>

            <h4 className="font-bold text-lg mb-4">Mavjud Testlar</h4>
            <div className="space-y-3">
              {Array.isArray(tests) && tests.length > 0 ? (
                tests.map((t) => (
                  <div
                    key={t._id}
                    className="flex flex-col md:flex-row justify-between items-center p-4 rounded-xl bg-white/5 border border-white/10 shadow-2xl"
                  >
                    <div className="mb-2 md:mb-0">
                      <h5 className="font-bold text-lg">{t.title}</h5>
                      <p className="text-sm opacity-80">
                        Login: {t.testLogin} | Parol: {t.testPassword}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      {t.isStarted ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-500 bg-green-100 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 border border-green-200">
                            <FaCheckCircle /> Faol
                          </span>
                          <button
                            onClick={() => handleForceStop(t.testLogin)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow transition"
                          >
                            <FaStop /> STOP
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startTest(t._id)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 rounded-xl hover:scale-105 flex items-center gap-2 font-semibold shadow"
                        >
                          <FaPlay size={14} /> Boshlash
                        </button>
                      )}
                      <button
                        onClick={() => removeTest(t._id)}
                        className="bg-red-100 text-red-600 p-2.5 rounded-lg hover:bg-red-200 hover:text-red-700 transition"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">
                  Hozircha testlar yo'q.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Natijalar bo'limi */}
        {activeCard === 2 && (
          <div
            ref={resultSectionRef}
            className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-6">Natijalar</h3>
            <div className="space-y-4">
              {Array.isArray(tests) &&
                tests.map((test) => (
                  <div
                    key={test._id}
                    className="rounded-xl overflow-hidden border border-white/10"
                  >
                    <div className="bg-white/10 p-4 flex justify-between items-center">
                      <h4 className="font-bold">{test.title}</h4>
                      <button
                        className={`px-3 py-1 rounded text-sm font-semibold transition ${
                          analyzedTestId === test._id
                            ? "bg-white/20"
                            : "bg-white/5 hover:bg-white/10"
                        }`}
                        onClick={() => analyzeTest(test._id)}
                      >
                        {analyzedTestId === test._id ? "Yopish" : "Ko'rish"}
                      </button>
                    </div>
                    {analyzedTestId === test._id && (
                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-left text-sm text-white">
                          <thead className="bg-white/10 uppercase text-xs">
                            <tr>
                              <th className="p-2">#</th>
                              <th className="p-2">O'quvchi</th>
                              <th className="p-2">Ball</th>
                              <th className="p-2 text-center text-green-400">
                                To'g'ri
                              </th>
                              <th className="p-2 text-center text-red-400">
                                Xato
                              </th>
                              <th className="p-2 text-center">Tahlil</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(resultsData) &&
                              resultsData.map((res, idx) => (
                                <tr
                                  key={res._id}
                                  className="border-b border-white/10 hover:bg-white/10"
                                >
                                  <td className="p-2">{idx + 1}</td>
                                  <td className="p-2 font-medium">
                                    {res.studentName}
                                  </td>
                                  <td className="p-2 font-bold text-cyan-400">
                                    {res.totalScore}
                                  </td>
                                  <td className="p-2 text-center font-bold text-green-400">
                                    {res.correctAnswersCount}
                                  </td>
                                  <td className="p-2 text-center font-bold text-red-400">
                                    {res.wrongAnswersCount}
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() =>
                                        handleStudentAnalysis(res._id)
                                      }
                                      className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded flex items-center justify-center gap-1 mx-auto"
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
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white/5 backdrop-blur-xl w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {loadingAnalysis
                  ? "Yuklanmoqda..."
                  : `${selectedStudentAnalysis?.studentName} - Natija Tahlili`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-red-500 text-xl"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {loadingAnalysis ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center mb-6">
                    <div className="bg-white/10 p-2 rounded-lg">
                      <p className="text-xs text-cyan-400">Jami Ball</p>
                      <p className="font-bold text-white">
                        {selectedStudentAnalysis?.totalScore}
                      </p>
                    </div>
                    <div className="bg-green-100/20 p-2 rounded-lg">
                      <p className="text-xs text-green-400">To'g'ri</p>
                      <p className="font-bold text-green-400">
                        {selectedStudentAnalysis?.correctAnswersCount}
                      </p>
                    </div>
                    <div className="bg-red-100/20 p-2 rounded-lg">
                      <p className="text-xs text-red-400">Xato</p>
                      <p className="font-bold text-red-400">
                        {selectedStudentAnalysis?.wrongAnswersCount}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2">
                      Savollar bo'yicha tahlil:
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {selectedStudentAnalysis?.questions?.map((q, idx) => (
                        <li
                          key={idx}
                          className={`p-2 rounded ${
                            q.isCorrect ? "bg-green-100/10" : "bg-red-100/10"
                          }`}
                        >
                          <span className="font-semibold">{q.question}</span> -{" "}
                          {q.isCorrect ? "To'g'ri" : "Xato"} (Javob: {q.answer})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer></Footer>
    </div>
  );
}
