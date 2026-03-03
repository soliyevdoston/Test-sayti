import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaPlus,
  FaTrash,
  FaUserGraduate,
  FaCalendarAlt,
  FaRandom,
  FaCopy,
  FaFileDownload
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client"; // ✅
import DashboardLayout from "../components/DashboardLayout";
import ChatBox from "../components/ChatBox";
import ConfirmationModal from "../components/ConfirmationModal";
import PromptModal from "../components/PromptModal";

import { 
  getTeacherGroups, 
  addTeacherGroup, 
  deleteTeacherGroup,
  getTeacherStudents,
  getGroupStudents,
  addStudentApi,
  deleteStudentApi,
  getRetakeRequests, // ✅
  handleRetakeRequest, // ✅
  BASE_URL // ✅
} from "../api/api";
import { formatLimit, getTeacherSubscription } from "../utils/subscriptionTools";
import {
  buildCredentialsText,
  downloadStudentsTemplate,
  parseBulkStudents,
  prepareStudentRecord,
} from "../utils/academicTools";
import { isTeacherProActive } from "../utils/teacherAccessTools";

const socket = io(BASE_URL, { transports: ["polling", "websocket"] }); // ✅

export default function TeacherGroups() {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentModal, setStudentModal] = useState({ open: false, group: null });
  const [students, setStudents] = useState([]);
  const [studentLoading, setStudentLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({ fullName: "", username: "", password: "" });
  const [manualCredentials, setManualCredentials] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // { studentId, fullName }
  const [retakeRequests, setRetakeRequests] = useState([]); // ✅ NEW
  const [studentCapacity, setStudentCapacity] = useState({
    loading: true,
    planLabel: "Bepul",
    maxStudents: 100,
    currentStudents: 0,
    limitReached: false,
  });
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

  const [promptConfig, setPromptConfig] = useState({
    isOpen: false,
    title: "",
    label: "",
    placeholder: "",
    onConfirm: () => {}
  });

  const showPrompt = (title, label, placeholder, onConfirm) => {
    setPromptConfig({ isOpen: true, title, label, placeholder, onConfirm });
  };

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) {
      navigate("/teacher/login");
      return undefined;
    }
    if (!isTeacherProActive(id)) {
      toast.info("Guruhlar bo'limi faqat Pro tarifda ishlaydi.");
      navigate("/teacher/subscription");
      return undefined;
    }
    setTeacherName(name);
    loadGroups(id);
    fetchRetakeRequests(id);
    refreshStudentCapacity(id);

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

  const refreshStudentCapacity = async (teacherId) => {
    if (!teacherId) return;
    try {
      const subscription = getTeacherSubscription(teacherId);
      const { data } = await getTeacherStudents(teacherId);
      const totalStudents = Array.isArray(data) ? data.length : 0;
      const hasLimit = Number.isFinite(subscription.maxStudents);
      setStudentCapacity({
        loading: false,
        planLabel: subscription.label,
        maxStudents: subscription.maxStudents,
        currentStudents: totalStudents,
        limitReached: hasLimit && totalStudents >= subscription.maxStudents,
      });
    } catch {
      setStudentCapacity((prev) => ({ ...prev, loading: false }));
    }
  };

  const loadGroups = async (id) => {
    try {
      setLoading(true);
      const { data } = await getTeacherGroups(id || localStorage.getItem("teacherId"));
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Guruhlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = () => {
    showPrompt(
      "Yangi guruh",
      "Guruh nomini kiriting",
      "Masalan: 10-A",
      async (name) => {
        try {
          await addTeacherGroup({ 
            name, 
            teacherId: localStorage.getItem("teacherId") 
          });
          toast.success("Guruh ochildi");
          loadGroups();
        } catch {
          toast.error("Guruh ochishda xatolik");
        }
      }
    );
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Rostdan ham ushbu guruhni o'chirmoqchimisiz?",
      async () => {
        try {
          await deleteTeacherGroup(id);
          toast.success("Guruh o'chirildi");
          loadGroups();
        } catch {
          toast.error("Guruhni o'chirishda xatolik");
        }
      },
      "danger",
      "Guruhni o'chirish"
    );
  };

  const openStudentModal = async (group) => {
    setStudentModal({ open: true, group });
    setActiveChat(null);
    setManualCredentials(false);
    setBulkText("");
    setNewStudent({ fullName: "", username: "", password: "" });
    fetchStudents(group._id);
  };

  const fetchStudents = async (groupId) => {
    try {
      setStudentLoading(true);
      const { data } = await getGroupStudents(groupId);
      setStudents(Array.isArray(data) ? data : []);
    } catch {
      toast.error("O'quvchilarni yuklashda xatolik");
    } finally {
      setStudentLoading(false);
    }
  };

  const getUsedUsernameSet = () =>
    new Set(students.map((student) => student.username).filter(Boolean));

  const copyCredentials = async (records) => {
    const text = buildCredentialsText(records);
    if (!text) {
      toast.warning("Nusxa olish uchun ma'lumot topilmadi");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Login-parollar clipboard'ga nusxalandi");
    } catch {
      toast.error("Clipboard'ga nusxalab bo'lmadi");
    }
  };

  const handleGenerateCredentials = () => {
    if (!newStudent.fullName.trim()) {
      toast.warning("Avval o'quvchi F.I.Sh kiriting");
      return;
    }
    const generated = prepareStudentRecord({ fullName: newStudent.fullName }, getUsedUsernameSet());
    setNewStudent(generated);
    toast.info("Auto login-parol yaratildi");
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast.warning("Ro'yxat matnini kiriting");
      return;
    }

    const parsedRecords = parseBulkStudents(bulkText).filter((record) => record.fullName?.trim());
    if (!parsedRecords.length) {
      toast.warning("Import uchun kamida bitta satr kerak");
      return;
    }

    const hasLimit = Number.isFinite(studentCapacity.maxStudents);
    const availableSlots = hasLimit ? Math.max(studentCapacity.maxStudents - studentCapacity.currentStudents, 0) : Number.POSITIVE_INFINITY;
    if (hasLimit && availableSlots <= 0) {
      toast.warning(`O'quvchi limiti tugagan (${formatLimit(studentCapacity.maxStudents)} ta).`);
      return;
    }
    if (hasLimit && parsedRecords.length > availableSlots) {
      toast.warning(`Faqat ${availableSlots} ta o'quvchi qo'shish mumkin. Import satrlarini kamaytiring.`);
      return;
    }

    const teacherId = localStorage.getItem("teacherId");
    const usedSet = getUsedUsernameSet();
    const prepared = parsedRecords.map((record) => prepareStudentRecord(record, usedSet));

    setBulkLoading(true);
    const success = [];
    let failedCount = 0;

    for (const record of prepared) {
      try {
        await addStudentApi({
          ...record,
          groupId: studentModal.group._id,
          teacherId,
        });
        success.push(record);
      } catch {
        failedCount += 1;
      }
    }

    setBulkLoading(false);

    if (success.length) {
      toast.success(`${success.length} ta o'quvchi qo'shildi`);
      setBulkText("");
      fetchStudents(studentModal.group._id);
      loadGroups();
      refreshStudentCapacity(teacherId);
      copyCredentials(success);
    }

    if (!success.length || failedCount) {
      toast.warning(`Xatoliklar: ${failedCount} ta satr qo'shilmadi`);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (studentCapacity.limitReached) {
      return toast.warning(`O'quvchi limiti tugagan (${formatLimit(studentCapacity.maxStudents)} ta).`);
    }
    if (!newStudent.fullName.trim()) {
      return toast.warning("To'liq ismni kiriting");
    }
    if (manualCredentials && (!newStudent.username.trim() || !newStudent.password.trim())) {
      return toast.warning("Manual rejimda login va parol majburiy");
    }

    const record = manualCredentials
      ? {
          fullName: newStudent.fullName.trim(),
          username: newStudent.username.trim(),
          password: newStudent.password.trim(),
        }
      : prepareStudentRecord({ fullName: newStudent.fullName }, getUsedUsernameSet());

    try {
      await addStudentApi({
        ...record,
        groupId: studentModal.group._id,
        teacherId: localStorage.getItem("teacherId")
      });
      toast.success(`O'quvchi qo'shildi: ${record.username} / ${record.password}`);
      setNewStudent({ fullName: "", username: "", password: "" });
      fetchStudents(studentModal.group._id);
      loadGroups(); // Update count
      refreshStudentCapacity(localStorage.getItem("teacherId"));
    } catch (err) {
      toast.error(err.response?.data?.msg || err.message || "Xatolik");
    }
  };

  const handleDeleteStudent = async (id) => {
    showConfirm(
      "O'quvchini o'chirishni tasdiqlaysizmi?",
      async () => {
        try {
          await deleteStudentApi(id);
          toast.info("O'chirildi");
          fetchStudents(studentModal.group._id);
          loadGroups(); // Update count
          refreshStudentCapacity(localStorage.getItem("teacherId"));
        } catch {
          toast.error("Xatolik");
        }
      },
      "danger",
      "O'quvchini o'chirish"
    );
  };

  const fetchRetakeRequests = async (tid) => {
    try {
      const { data } = await getRetakeRequests(tid || localStorage.getItem("teacherId"));
      setRetakeRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetakeResolve = async (requestId, status) => {
    try {
      await handleRetakeRequest({ requestId, status });
      toast.success(status === "approved" ? "Ruxsat berildi" : "Rad etildi");
      fetchRetakeRequests();
    } catch {
      toast.error("Xatolik");
    }
  };

  return (
    <DashboardLayout role="teacher" userName={teacherName}>
      <ConfirmationModal 
        {...modalConfig} 
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />
      <PromptModal 
        {...promptConfig}
        onClose={() => setPromptConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <section className="relative z-10 pt-12 pb-6 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary pb-8 mb-12">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-primary mb-2 uppercase italic">
              Mening <span className="text-indigo-600 dark:text-indigo-400">Guruhlarim</span>
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              O'quvchi guruhlari va dars jadvallarini boshqarish
            </p>
            <p className={`text-xs font-semibold mt-2 ${studentCapacity.limitReached ? "text-red-600" : "text-secondary"}`}>
              Obuna: {studentCapacity.planLabel} | O'quvchi limiti: {formatLimit(studentCapacity.maxStudents)} | Joriy: {studentCapacity.currentStudents}
            </p>
          </div>
          <button 
            onClick={handleAddGroup}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
          >
            <FaPlus /> Yangi Guruh Ochish
          </button>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto pb-20">
        <div className="grid lg:grid-cols-2 gap-8">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Yuklanmoqda...</p>
            </div>
          ) : groups.length > 0 ? (
            groups.map((group, idx) => (
              <div key={group._id || idx} className="premium-card p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 group hover:border-indigo-500/50 transition-all">
                <div className="flex items-center justify-between md:hidden">
                    <div className="flex items-center gap-4">
                       <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                         <FaUsers size={24} />
                       </div>
                       <div>
                         <h3 className="text-xl font-black text-primary uppercase tracking-tighter italic">{group.name}</h3>
                         <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5 italic">Aktiv Guruh</p>
                       </div>
                    </div>
                    {/* Mobile Actions */}
                    <div className="flex gap-2">
                       <button onClick={() => handleDelete(group._id)} className="w-8 h-8 bg-secondary border border-primary rounded-lg flex items-center justify-center text-red-500"><FaTrash size={12} /></button>
                    </div>
                </div>

                <div className="hidden md:flex w-24 h-24 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 items-center justify-center text-indigo-500 shrink-0 group-hover:scale-110 transition-transform">
                  <FaUsers size={40} />
                </div>
                
                <div className="flex-1 space-y-6">
                  <div className="hidden md:flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-black text-primary uppercase tracking-tighter italic">{group.name}</h3>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1 italic">Aktiv Guruh</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDelete(group._id)}
                        className="w-10 h-10 bg-secondary border border-primary rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 md:gap-6 bg-secondary/30 p-4 rounded-2xl border border-primary/50">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5"><FaUserGraduate size={10} /> O'quvchilar</p>
                      <p className="text-lg font-black text-primary">{group.pupilsCount || group.pupils || 0} ta</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5"><FaCalendarAlt size={10} /> Kunlar</p>
                      <p className="text-xs font-black text-primary italic truncate">{group.days || "Belgilanmagan"}</p>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-primary/50">
                     <div className="text-[9px] font-black text-indigo-600 bg-indigo-500/10 px-3 py-1.5 rounded-lg tracking-widest uppercase w-full sm:w-auto text-center">{group.time || "Vaqt yo'q"}</div>
                     <button 
                       onClick={() => openStudentModal(group)}
                       className="w-full sm:w-auto text-[9px] font-black uppercase tracking-widest text-white bg-indigo-600 px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all text-center"
                     >
                        Barcha o'quvchilar →
                     </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-40 text-center border-2 border-dashed border-primary rounded-[3rem]">
              <p className="text-muted font-black uppercase tracking-[0.3em] italic opacity-30">Guruhlar ro'yxati bo'sh</p>
            </div>
          )}
          
          <div 
            onClick={handleAddGroup}
            className="border-2 border-dashed border-primary rounded-[3rem] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-indigo-500/[0.02] hover:border-indigo-500/30 transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary border border-primary flex items-center justify-center text-muted mb-4 group-hover:scale-110 transition-all">
              <FaPlus size={24} />
            </div>
            <h4 className="text-sm font-black text-muted uppercase tracking-[0.2em] group-hover:text-primary">Yangi Guruh Qo'shish</h4>
            <p className="text-[10px] text-muted font-bold mt-2 opacity-50">Ro'yxatni kengaytirish</p>
          </div>
        </div>
      </main>

      {/* Student Management Modal */}
      {studentModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setStudentModal({ open: false, group: null })}
          ></div>
          <div className="relative w-full max-w-4xl bg-primary border border-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col lg:flex-row h-[80vh]">
              {/* Left Side: Register */}
              <div className="lg:w-1/3 p-8 border-r border-primary bg-secondary/30">
                <div className="mb-8">
                  <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter mb-1">
                    Yangi <span className="text-indigo-500">O'quvchi</span>
                  </h3>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                    {studentModal.group.name} guruhi uchun
                  </p>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">To'liq ismi</label>
                    <input 
                      placeholder="F.I.Sh"
                      value={newStudent.fullName}
                      onChange={(e) => setNewStudent({...newStudent, fullName: e.target.value})}
                      className="w-full bg-primary border border-primary rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualCredentials(false)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!manualCredentials ? "bg-indigo-600 text-white border-indigo-600" : "bg-primary border-primary text-muted"}`}
                    >
                      Auto login/parol
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualCredentials(true)}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${manualCredentials ? "bg-indigo-600 text-white border-indigo-600" : "bg-primary border-primary text-muted"}`}
                    >
                      Manual login/parol
                    </button>
                  </div>

                  {manualCredentials ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Username</label>
                        <input 
                          placeholder="login"
                          value={newStudent.username}
                          onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                          className="w-full bg-primary border border-primary rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Parol</label>
                        <input 
                          placeholder="parol"
                          value={newStudent.password}
                          onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                          className="w-full bg-primary border border-primary rounded-xl px-4 py-3 outline-none focus:border-indigo-500 text-xs font-bold"
                        />
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateCredentials}
                      className="w-full py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <FaRandom /> Auto yaratib ko'rsatish
                    </button>
                  )}

                  <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all">
                    Qo'shish
                  </button>
                </form>

                <div className="mt-6 p-4 rounded-2xl border border-primary bg-primary/40 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Bulk import (ro'yxat)</p>
                    <button
                      type="button"
                      onClick={downloadStudentsTemplate}
                      className="text-[9px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1"
                    >
                      <FaFileDownload size={10} /> Shablon
                    </button>
                  </div>
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-28 bg-primary border border-primary rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-xs font-medium resize-none"
                    placeholder={"Ali Valiyev,ali_valiyev,Ali@2026\nVali Karimov,,\nDilshod Qodirov,dilshod_q,12345"}
                  />
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    disabled={bulkLoading}
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-60"
                  >
                    {bulkLoading ? "Yuklanmoqda..." : "Ro'yxatdan qo'shish"}
                  </button>
                </div>
              </div>

              {/* Right Side: List or Chat */}
              <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">
                    {activeChat ? (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveChat(null)}
                          className="text-xs font-black text-muted hover:text-primary transition-colors"
                        >
                          Ro'yxat ←
                        </button>
                        <span>{activeChat.fullName} bilan <span className="text-indigo-500">Chat</span></span>
                      </div>
                    ) : (
                      <>O'quvchilar <span className="text-indigo-500">Ro'yxati</span></>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    {!activeChat && (
                      <button
                        type="button"
                        onClick={() => copyCredentials(students)}
                        className="p-2 hover:bg-indigo-500/10 text-indigo-600 rounded-xl transition-all flex items-center gap-1.5"
                        title="Login-parollarni nusxalash"
                      >
                        <FaCopy size={12} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Copy</span>
                      </button>
                    )}
                    <button 
                      onClick={() => setStudentModal({ open: false, group: null })}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                    >
                      Yopish
                    </button>
                  </div>
                </div>

                {activeChat ? (
                  <div className="h-[60vh]">
                    <ChatBox 
                      teacherId={localStorage.getItem("teacherId")}
                      studentId={activeChat.studentId}
                      role="teacher"
                    />
                  </div>
                ) : studentLoading ? (
                  <div className="py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : students.length > 0 ? (
                  <div className="space-y-3">
                    {students.map((s, idx) => (
                      <div key={s._id} className="flex flex-col gap-2 p-4 rounded-2xl bg-solid-secondary border border-primary group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary border border-primary flex items-center justify-center text-xs font-black text-indigo-500">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="text-sm font-black text-primary uppercase tracking-tight">{s.fullName}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-0.5">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                                   <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Login:</span>
                                   <span className="text-[10px] font-bold text-primary">{s.username}</span>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                                   <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Parol:</span>
                                   <span className="text-[10px] font-bold text-primary">{s.password}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block mr-2">
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{s.totalScore || 0} ball</p>
                            </div>
                            
                            <button 
                              onClick={() => setActiveChat({ studentId: s._id, fullName: s.fullName })}
                              className="p-2 border border-primary rounded-lg text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2"
                            >
                              <span className="text-[8px] font-black uppercase tracking-widest px-1">Chat</span>
                            </button>

                            <button 
                              onClick={() => handleDeleteStudent(s._id)}
                              className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10 rounded-lg shadow-sm"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </div>

                        {/* ✅ QAYTA YECHISH SO'ROVLARI (STUDENT DARAXTIDA) */}
                        {retakeRequests.filter(r => String(r.studentId?._id) === String(s._id)).map(req => (
                          <div key={req._id} className="mt-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between animate-in slide-in-from-top-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest">
                                Qayta yechish: <span className="text-indigo-600">{req.testId?.title}</span>
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleRetakeResolve(req._id, "rejected")}
                                className="px-2 py-1 text-[8px] font-black uppercase tracking-tighter text-red-500 hover:bg-red-500/10 rounded-md"
                              >Rad etish</button>
                              <button 
                                onClick={() => handleRetakeResolve(req._id, "approved")}
                                className="px-2 py-1 text-[8px] font-black uppercase tracking-tighter bg-indigo-600 text-white rounded-md shadow-lg shadow-indigo-600/20"
                              >Ruxsat berish</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-primary rounded-3xl opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest">Hozircha o'quvchi yo'q</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
