import React, { useState, useEffect } from "react";
import {
  FaClipboardList,
  FaUsers,
  FaPlay,
  FaCheckCircle,
  FaStop,
  FaChartBar,
  FaUserGraduate,
  FaBolt,
  FaBook,
  FaArrowRight
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { 
  getTeacherTests, 
  getTeacherStats,
  getRetakeRequests, // ✅
  BASE_URL
} from "../api/api";

const socket = io(BASE_URL, { transports: ["websocket", "polling"] });

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [teacherName, setTeacherName] = useState("");
  const [stats, setStats] = useState({
    totalTests: 0,
    totalStudents: 0,
    averageScore: 0,
    activeTestsCount: 0
  });
  const [retakeRequests, setRetakeRequests] = useState([]); // ✅
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info"
  });

  const showConfirm = (message, onConfirm, type = "info", title = "Tasdiqlash") => {
    setModalConfig({ isOpen: true, title, message, onConfirm, type });
  };


  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else {
      setTeacherName(name);
      loadTests(id);
      fetchStats(id);
      fetchRetakeRequests(id); // ✅
    }

    // 🔥 REAL-TIME RETAKE REQUESTS
    socket.on("new-retake-request", ({ teacherId, request }) => {
      const myId = localStorage.getItem("teacherId");
      if (teacherId === myId) {
        toast.info("Yangi qayta yechish so'rovi keldi!");
        setRetakeRequests(prev => [request, ...prev]);
      }
    });

    return () => socket.off("new-retake-request");
  }, [navigate]);

  const loadTests = async (id) => {
    try {
      const { data } = await getTeacherTests(id || localStorage.getItem("teacherId"));
      setTests(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  };

  const fetchStats = async (id) => {
    try {
      const { data } = await getTeacherStats(id || localStorage.getItem("teacherId"));
      setStats(data);
    } catch (err) {
    }
  };

  const fetchRetakeRequests = async (tid) => {
    try {
      const { data } = await getRetakeRequests(tid);
      setRetakeRequests(data);
    } catch {}
  };

  const handleForceStop = (testLogin) => {
    showConfirm(
      "Barcha o'quvchilar uchun testni majburiy to'xtatmoqchimisiz?",
      () => {
        socket.emit("force-stop-test", testLogin);
        toast.warning("Test majburiy to'xtatildi!");
      },
      "danger",
      "Testni to'xtatish"
    );
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <ConfirmationModal 
        {...modalConfig} 
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
      <section className="relative z-10 pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-8 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
              Asosiy <span className="text-indigo-600 dark:text-indigo-400">Panel</span>
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              Xush kelibsiz, {teacherName}! Bugungi ko'rsatkichlaringiz bilan tanishing.
            </p>
          </div>
          <div className="text-right">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest animate-pulse">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                Xizmatlar Faol
             </div>
          </div>
        </div>

        {/* ✅ RE-TAKE REQUESTS NOTIFICATION */}
        {retakeRequests.length > 0 && (
          <div className="mb-12 animate-in slide-in-from-top-4 duration-700">
             <div 
               onClick={() => navigate("/teacher/results")}
               className="p-6 bg-yellow-500/10 border-2 border-dashed border-yellow-500/30 rounded-[2rem] flex items-center justify-between cursor-pointer hover:bg-yellow-500/20 transition-all group"
             >
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-yellow-500 flex items-center justify-center text-white shadow-lg shadow-yellow-500/20 group-hover:rotate-12 transition-transform">
                      <FaBolt size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">Qayta yechish so'rovlari!</h3>
                      <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Sizda <span className="text-yellow-600 font-black">{retakeRequests.length} ta</span> yangi so'rov mavjud</p>
                   </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-yellow-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20">
                   Ko'rish <FaArrowRight />
                </div>
             </div>
          </div>
        )}
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto space-y-12 pb-20">
        {/* Statistics Grid */}
        <section className="bento-grid">
          <div className="premium-card md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500"><FaBook size={24} /></div>
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">Jami <span className="text-indigo-600">Testlar</span></h2>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black text-primary tracking-tighter">{tests.length}</span>
              <button onClick={() => navigate("/teacher/tests")} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 hover:translate-x-1 transition-transform">
                Hammasi <FaArrowRight />
              </button>
            </div>
          </div>

          <div className="premium-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500/10 rounded-2xl text-green-500"><FaChartBar size={24} /></div>
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">O'rtacha <span className="text-green-500">Ball</span></h2>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black text-primary tracking-tighter">{stats.averageScore}%</span>
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Live Natija</span>
            </div>
          </div>

          <div className="premium-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><FaUserGraduate size={24} /></div>
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter">O'quvchi<span className="text-blue-500">lar</span></h2>
            </div>
            <div className="flex items-end justify-between">
              <span className="text-5xl font-black text-primary tracking-tighter">{stats.totalStudents}</span>
              <button onClick={() => navigate("/teacher/groups")} className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2 hover:translate-x-1 transition-transform">
                Guruhlar <FaArrowRight />
              </button>
            </div>
          </div>
        </section>

        {/* Live Monitoring Section */}
        <section className="premium-card border-indigo-500/10">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 animate-pulse font-black"><FaBolt size={24} /></div>
              <div>
                <h3 className="text-2xl font-black text-primary italic uppercase tracking-tighter">Jonli Monitoring</h3>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">Hozirda davom etayotgan testlar</p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.filter(t => t.isStarted).length > 0 ? (
              tests.filter(t => t.isStarted).map(t => (
                <div key={t._id} className="bg-secondary/50 border border-primary p-6 rounded-3xl group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  </div>
                  <h4 className="font-black text-primary uppercase text-sm mb-4">{t.title}</h4>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted">
                      <span>O'quvchilar</span>
                      <span>12 ta</span>
                    </div>
                    <div className="w-full h-1.5 bg-primary rounded-full overflow-hidden">
                      <div className="w-[75%] h-full bg-indigo-500 rounded-full" />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleForceStop(t.testLogin)}
                    className="w-full py-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                  >
                    Majburiy To'xtatish
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-primary rounded-3xl opacity-40">
                <p className="text-muted font-black uppercase tracking-widest italic">Faol testlar mavjud emas</p>
                <button onClick={() => navigate("/teacher/tests")} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                  Yangi test boshlash
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Quick Access Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
           <QuickNavCard 
             title="Natijalar" 
             desc="Test natijalarini ko'rish" 
             icon={<FaUsers />} 
             path="/teacher/results" 
             color="from-indigo-500 to-blue-600" 
             navigate={navigate}
           />
           <QuickNavCard 
             title="Fanlar (Tez orada)" 
             desc="Fanlarni boshqarish" 
             icon={<FaBook />} 
             path="/teacher/dashboard" 
             color="from-blue-500 to-indigo-600" 
             navigate={navigate}
           />
           <QuickNavCard 
             title="Do'kon (Tez orada)" 
             desc="Premium paketlar" 
             icon={<FaBolt />} 
             path="/teacher/dashboard" 
             color="from-purple-500 to-pink-600" 
             navigate={navigate}
           />
           <QuickNavCard 
             title="Resurslar (Tez orada)" 
             desc="Metodik qo'llanmalar" 
             icon={<FaClipboardList />} 
             path="/teacher/dashboard" 
             color="from-emerald-500 to-teal-600" 
             navigate={navigate}
           />
        </section>
      </main>
    </DashboardLayout>
  );
}

const QuickNavCard = ({ title, desc, icon, path, color, navigate }) => (
  <div 
    onClick={() => navigate(path)}
    className="premium-card text-center group cursor-pointer hover:border-indigo-500/50 transition-all"
  >
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white mx-auto mb-4 shadow-lg group-hover:rotate-12 transition-transform`}>
      {icon}
    </div>
    <h4 className="font-black text-primary uppercase text-xs tracking-tighter mb-1">{title}</h4>
    <p className="text-[9px] text-muted font-bold uppercase tracking-widest opacity-60">{desc}</p>
  </div>
);
