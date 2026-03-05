import React, { useEffect, useMemo, useState } from "react";
import {
  FaPlay,
  FaTrash,
  FaCheckCircle,
  FaStop,
  FaFileUpload,
  FaBolt,
  FaPlus,
  FaUsers,
  FaGlobe,
  FaCogs,
  FaArchive,
  FaInbox,
  FaDownload,
  FaFileCode,
  FaFileAlt,
  FaFileCsv,
  FaFileWord,
  FaFilePdf
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import RichTextMath from "../components/RichTextMath";
import { 
  teacherUploadTest, 
  parseTextApi,
  parsePreviewApi,
  uploadPreviewApi,
  createManualTestApi,
  getTeacherTests, 
  getTeacherGroups,
  startTestApi, 
  stopTestApi,
  updateTestAccess,
  deleteTestApi, 
  duplicateTestApi, // ✅
  updateTestApi, // ✅
  BASE_URL
} from "../api/api";
import {
  downloadTestTemplate,
  exportTestByFormat,
  normalizeFormulaInput,
  validateFormulaSyntax,
} from "../utils/academicTools";
import {
  buildBlockExamDescription,
  getBlockExamMeta,
  stripBlockExamMetaFromDescription,
} from "../utils/blockExamTools";
import { formatLimit, getTeacherSubscription } from "../utils/subscriptionTools";
import { getAssignedStudentsByTest } from "../utils/studentTestAssignments";
import { isTeacherProActive } from "../utils/teacherAccessTools";
import {
  getAllPaymentRequests,
  PAYMENT_CONFIG,
  submitPaymentRequest,
} from "../utils/billingTools";
import {
  incrementTeacherTestUsage,
  syncTeacherTestUsageWithCurrent,
} from "../utils/testUsageTools";
import { getTeacherSolveLimitSnapshot } from "../utils/teacherSolveUsageTools";
import {
  createTeacherTestSaleRequest,
  getTeacherSaleRequestsByTeacher,
  hasPendingSaleRequest,
  TEACHER_TEST_SALE_BONUS,
} from "../utils/teacherMarketplaceTools";


const socket = io(BASE_URL, { transports: ["polling", "websocket"] });
const createEmptyBlockItem = () => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  subject: "",
  sourceType: "file", // "file" | "text"
  file: null,
  text: "",
});

export default function TeacherTests() {
  const navigate = useNavigate();
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
    accessType: "public",
    groupId: "",
  });
  const [groups, setGroups] = useState([]);
  const [createMode, setCreateMode] = useState("file"); // "file" | "text" | "block"
  const [pasteText, setPasteText] = useState("");
  const [blockItems, setBlockItems] = useState(() => [createEmptyBlockItem()]);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, test: null }); // ✅
  const [archivedTestIds, setArchivedTestIds] = useState([]);
  const [testUsageCount, setTestUsageCount] = useState(0);
  const [solveUsageCount, setSolveUsageCount] = useState(0);
  const [paymentReceipt, setPaymentReceipt] = useState("");
  const [paymentReceiptImage, setPaymentReceiptImage] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [latestPaymentId, setLatestPaymentId] = useState("");
  const [saleRequests, setSaleRequests] = useState([]);
  const [sellingTestId, setSellingTestId] = useState("");

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

  const getArchiveStorageKey = (teacherId) => `teacher_test_archive_${teacherId}`;

  const loadArchivedIds = (teacherId) => {
    try {
      const raw = localStorage.getItem(getArchiveStorageKey(teacherId));
      const ids = JSON.parse(raw || "[]");
      setArchivedTestIds(Array.isArray(ids) ? ids : []);
    } catch {
      setArchivedTestIds([]);
    }
  };

  const persistArchivedIds = (teacherId, ids) => {
    localStorage.setItem(getArchiveStorageKey(teacherId), JSON.stringify(ids));
    setArchivedTestIds(ids);
  };

  const refreshSaleRequests = (targetTeacherId = localStorage.getItem("teacherId")) => {
    setSaleRequests(getTeacherSaleRequestsByTeacher(targetTeacherId));
  };

  useEffect(() => {
    const name = localStorage.getItem("teacherName");
    const id = localStorage.getItem("teacherId");
    if (!name || !id) navigate("/teacher/login");
    else {
      setTeacherName(name);
      loadTests(id);
      loadGroups(id);
      loadArchivedIds(id);
      refreshSaleRequests(id);
    }
    // Initial bootstrap only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const activeTests = tests.filter((test) => !archivedTestIds.includes(test._id));
  const archivedTests = tests.filter((test) => archivedTestIds.includes(test._id));
  const teacherId = localStorage.getItem("teacherId");
  const isProPlan = isTeacherProActive(teacherId);
  const subscription = getTeacherSubscription(teacherId);
  const hasTestLimit = Number.isFinite(subscription.maxTests);
  const remainingTestSlots = hasTestLimit
    ? Math.max(subscription.maxTests - testUsageCount, 0)
    : null;
  const testLimitReached = hasTestLimit && testUsageCount >= subscription.maxTests;
  const hasSolveLimit = Number.isFinite(subscription.maxSolved);
  const remainingSolveSlots = hasSolveLimit
    ? Math.max(subscription.maxSolved - solveUsageCount, 0)
    : null;
  const solveLimitReached = hasSolveLimit && solveUsageCount >= subscription.maxSolved;
  const usageBlocked = testLimitReached || solveLimitReached;
  const saleStatusByTestId = useMemo(() => {
    const map = {};
    saleRequests.forEach((row) => {
      const testId = String(row.testId || "");
      if (!testId || map[testId]) return;
      map[testId] = String(row.status || "pending").toLowerCase();
    });
    return map;
  }, [saleRequests]);
  const pendingTeacherPayment = getAllPaymentRequests().find(
    (request) =>
      request.userType === "teacher" &&
      String(request.userId) === String(teacherId) &&
      request.status === "pending"
  );

  const getFileExt = (file) => String(file?.name || "").toLowerCase().split(".").pop();
  const isDocFile = (ext) => ext === "docx" || ext === "docm";
  const isTextFile = (ext) => ext === "txt" || ext === "csv";

  const getLimitBlockMessage = () => {
    if (testLimitReached) {
      return `Yangi test qo'shish limiti tugagan (${formatLimit(subscription.maxTests)} ta).`;
    }
    if (solveLimitReached) {
      return `Yechish limiti tugagan (${formatLimit(subscription.maxSolved)} ta). Davom etish uchun obuna kerak.`;
    }
    return "Bu amal uchun faol limit mavjud emas.";
  };

  const ensureProForHelpers = () => {
    if (isProPlan) return true;
    toast.info("Bu funksiya faqat Oylik Pro tarifida ishlaydi.");
    navigate("/teacher/subscription");
    return false;
  };

  const readTextFileContent = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Faylni o'qib bo'lmadi"));
      reader.readAsText(file, "utf-8");
    });

  const resetCreateDraft = () => {
    setNewTest({
      title: "",
      description: "",
      username: "",
      password: "",
      duration: 20,
      file: null,
      accessType: "public",
      groupId: "",
    });
    setPasteText("");
    setBlockItems([createEmptyBlockItem()]);
    setPreviewData(null);
  };

  const addBlockItem = () => {
    setBlockItems((prev) => [...prev, createEmptyBlockItem()]);
  };

  const updateBlockItem = (blockId, patch) => {
    setBlockItems((prev) =>
      prev.map((item) => (item.id === blockId ? { ...item, ...patch } : item))
    );
  };

  const removeBlockItem = (blockId) => {
    setBlockItems((prev) => (prev.length <= 1 ? prev : prev.filter((item) => item.id !== blockId)));
  };

  const parseSourceQuestions = async ({ sourceType, file, text }) => {
    if (sourceType === "file") {
      if (!file) throw new Error("Fayl tanlanmagan");
      const ext = getFileExt(file);
      if (isTextFile(ext)) {
        const fileText = await readTextFileContent(file);
        const normalizedText = normalizeFormulaInput(fileText);
        const formulaCheck = validateFormulaSyntax(normalizedText);
        if (!formulaCheck.isValid) throw new Error(formulaCheck.issues[0]);
        const res = await parsePreviewApi({ text: normalizedText });
        return Array.isArray(res.data?.questions) ? res.data.questions : [];
      }
      if (isDocFile(ext)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadPreviewApi(formData);
        return Array.isArray(res.data?.questions) ? res.data.questions : [];
      }
      if (ext === "doc") {
        throw new Error("`.doc` format qo'llanmaydi. Iltimos Word faylni `.docx` yoki `.docm` qilib saqlang.");
      }
      throw new Error("Faqat .docx/.docm/.txt/.csv fayl yuklang");
    }

    const normalizedText = normalizeFormulaInput(String(text || ""));
    const formulaCheck = validateFormulaSyntax(normalizedText);
    if (!formulaCheck.isValid) throw new Error(formulaCheck.issues[0]);
    const res = await parsePreviewApi({ text: normalizedText });
    return Array.isArray(res.data?.questions) ? res.data.questions : [];
  };

  const parseBlockQuestions = async () => {
    const parsedBlocks = [];
    for (let index = 0; index < blockItems.length; index += 1) {
      const block = blockItems[index];
      const subject = String(block.subject || "").trim() || `Fan ${index + 1}`;
      if (block.sourceType === "file" && !block.file) {
        throw new Error(`${subject}: fayl tanlang`);
      }
      if (block.sourceType === "text" && !String(block.text || "").trim()) {
        throw new Error(`${subject}: matnni kiriting`);
      }
      const questions = await parseSourceQuestions(block);
      if (!questions.length) {
        throw new Error(`${subject}: savollar topilmadi`);
      }
      parsedBlocks.push({ subject, questions });
    }
    return parsedBlocks;
  };

  const buildManualQuestionsFromBlocks = (parsedBlocks) =>
    parsedBlocks.flatMap(({ subject, questions }) =>
      questions.map((question) => ({
        text: `[${subject}] ${String(question?.text || "").trim()}`,
        points: Number(question?.points || 1),
        options: Array.isArray(question?.options)
          ? question.options.map((option) => ({
              text: String(option?.text || "").trim(),
              isCorrect: Boolean(option?.isCorrect),
            }))
          : [],
      }))
    );

  const loadGroups = async (id) => {
    const activeTeacherId = id || localStorage.getItem("teacherId");
    if (!isTeacherProActive(activeTeacherId)) {
      setGroups([]);
      return;
    }
    try {
      const { data } = await getTeacherGroups(activeTeacherId);
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Guruhlarni yuklashda xatolik");
    }
  };

  const loadTests = async (id) => {
    try {
      const { data } = await getTeacherTests(
        id || localStorage.getItem("teacherId")
      );
      const normalized = Array.isArray(data) ? data : [];
      setTests(normalized);
      const resolvedUsage = syncTeacherTestUsageWithCurrent(
        id || localStorage.getItem("teacherId"),
        normalized.length
      );
      setTestUsageCount(resolvedUsage);
      const solveSnapshot = await getTeacherSolveLimitSnapshot(
        id || localStorage.getItem("teacherId"),
        normalized
      );
      setSolveUsageCount(Number(solveSnapshot.usedSolved || 0));
      localStorage.setItem("teacherTestCount", String(normalized.length));
    } catch {
      toast.error("Testlarni yuklashda xatolik");
      setTests([]);
    }
  };

  const handleSendTeacherPayment = async () => {
    if (!teacherId) return toast.warning("Teacher ID topilmadi");
    if (pendingTeacherPayment) {
      toast.info("Sizda allaqachon pending to'lov so'rovi bor.");
      return;
    }
    if (!paymentReceiptImage) {
      toast.warning("Chek rasmini yuklang");
      return;
    }

    try {
      setPaymentSubmitting(true);
      const requestId = await submitPaymentRequest({
        userType: "teacher",
        userId: teacherId,
        planId: "teacher_monthly",
        amount: PAYMENT_CONFIG.teacherMonthlyAmount,
        fullName: teacherName,
        email: localStorage.getItem("teacherEmail") || localStorage.getItem("teacherLogin") || "",
        receipt: paymentReceipt.trim(),
        receiptFile: paymentReceiptImage,
      });

      setLatestPaymentId(requestId);
      setPaymentReceipt("");
      setPaymentReceiptImage(null);
      toast.success(`To'lov so'rovi yuborildi. ID: ${requestId}`);
    } catch (err) {
      toast.error(err.message || "To'lov so'rovini yuborishda xatolik");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleSubmitTestForSale = async (test) => {
    if (!isProPlan) {
      toast.info("Test sotish funksiyasi faqat Pro tarifda ochiladi.");
      navigate("/teacher/subscription");
      return;
    }
    if (!teacherId) {
      toast.warning("Teacher ID topilmadi");
      return;
    }
    if (!test?._id) {
      toast.warning("Test ma'lumoti to'liq emas");
      return;
    }
    if (hasPendingSaleRequest(teacherId, test._id)) {
      toast.info("Bu test uchun pending so'rov allaqachon yuborilgan.");
      refreshSaleRequests(teacherId);
      return;
    }

    try {
      setSellingTestId(test._id);
      const requestId = createTeacherTestSaleRequest({
        teacherId,
        teacherName,
        test,
      });
      refreshSaleRequests(teacherId);
      toast.success(`So'rov yuborildi: ${requestId}`);
    } catch (err) {
      toast.error(err.message || "Test sotuvga yuborilmadi");
    } finally {
      setSellingTestId("");
    }
  };

  const handleDownloadTemplate = (format) => {
    if (!ensureProForHelpers()) return;
    downloadTestTemplate(format);
    toast.success(`Shablon yuklandi: ${format.toUpperCase()}`);
  };

  const handleExportTest = (test, format) => {
    try {
      if (!ensureProForHelpers()) return;
      exportTestByFormat(test, format);
      toast.success(format === "pdf" ? "Print oynasi ochildi. PDF saqlashni tanlang." : `Test ${format.toUpperCase()} formatida yuklandi`);
    } catch {
      toast.error("Yuklab olishda xatolik");
    }
  };

  const toggleArchive = (testId) => {
    const teacherId = localStorage.getItem("teacherId");
    if (!teacherId) return;

    const exists = archivedTestIds.includes(testId);
    const nextIds = exists
      ? archivedTestIds.filter((id) => id !== testId)
      : [...archivedTestIds, testId];

    persistArchivedIds(teacherId, nextIds);
    toast.info(exists ? "Test arxivdan chiqarildi" : "Test arxivga olindi");
  };

  const handlePreview = async () => {
    if (!ensureProForHelpers()) return;
    if (createMode === "file" && !newTest.file) return toast.warning("Fayl tanlang");
    if (createMode === "text" && !pasteText.trim()) return toast.warning("Matnni kiriting");
    if (createMode === "block" && !blockItems.length) return toast.warning("Kamida bitta fan bloki qo'shing");

    try {
      setPreviewLoading(true);
      if (createMode === "block") {
        const parsedBlocks = await parseBlockQuestions();
        const mergedQuestions = buildManualQuestionsFromBlocks(parsedBlocks);
        setPreviewData({
          questions: mergedQuestions,
          blockMeta: parsedBlocks.map((block) => ({
            subject: block.subject,
            count: block.questions.length,
          })),
        });
        toast.success(
          `Blok preview: ${parsedBlocks.length} ta fan, ${mergedQuestions.length} ta savol topildi`
        );
        return;
      }

      const questions = await parseSourceQuestions(
        createMode === "file"
          ? { sourceType: "file", file: newTest.file }
          : { sourceType: "text", text: pasteText }
      );
      setPreviewData({ questions });
      toast.success(`${questions.length} ta savol topildi`);
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || "Tahlil qilishda xatolik";
      if (String(msg).toLowerCase().includes("doc")) {
        toast.error("Word fayl xatosi. Faylni qayta saqlang va `.docx` yoki `.docm` formatda yuklang.");
      } else {
        toast.error(msg);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const addTest = async (e) => {
    e.preventDefault();
    if (usageBlocked) {
      toast.warning(getLimitBlockMessage());
      return;
    }
    if (!isProPlan && newTest.accessType === "group") {
      toast.info("Guruhga yopiq testlar faqat Pro tarifda ochiladi.");
      navigate("/teacher/subscription");
      return;
    }
    if (!newTest.title || !newTest.username || !newTest.password) {
      toast.warning("Asosiy maydonlarni to'ldiring!");
      return;
    }

    if (createMode === "file" && !newTest.file) {
      toast.warning("Fayl tanlang!");
      return;
    }

    if (createMode === "text" && !pasteText.trim()) {
      toast.warning("Matnni kiriting!");
      return;
    }
    if (createMode === "block" && !isProPlan) {
      toast.info("Blok imtihon funksiyasi faqat Pro tarifda ishlaydi.");
      navigate("/teacher/subscription");
      return;
    }
    if (createMode === "block" && !blockItems.length) {
      toast.warning("Kamida bitta fan bloki qo'shing.");
      return;
    }

    try {
      setLoading(true);
      const sanitizedDescription = stripBlockExamMetaFromDescription(newTest.description);

      if (createMode === "block") {
        const parsedBlocks = await parseBlockQuestions();
        const manualQuestions = buildManualQuestionsFromBlocks(parsedBlocks);
        if (!manualQuestions.length) {
          toast.warning("Blok savollari topilmadi");
          setLoading(false);
          return;
        }

        const blockSubjects = parsedBlocks.map((block) => block.subject);
        await createManualTestApi({
          title: newTest.title,
          description: buildBlockExamDescription(sanitizedDescription, blockSubjects),
          duration: newTest.duration,
          testLogin: newTest.username,
          testPassword: newTest.password,
          accessType: newTest.accessType,
          groupId: newTest.groupId,
          teacherId: localStorage.getItem("teacherId"),
          blockExam: {
            enabled: true,
            subjects: blockSubjects,
          },
          questions: manualQuestions,
        });

        toast.success(
          `Blok imtihon saqlandi: ${parsedBlocks.length} ta fan, ${manualQuestions.length} ta savol`
        );
      } else if (createMode === "file") {
        const ext = getFileExt(newTest.file);
        if (isTextFile(ext)) {
          const fileText = await readTextFileContent(newTest.file);
          const normalizedText = normalizeFormulaInput(fileText);
          const formulaCheck = validateFormulaSyntax(normalizedText);
          if (!formulaCheck.isValid) {
            toast.warning(formulaCheck.issues[0]);
            setLoading(false);
            return;
          }
          const payload = {
            text: normalizedText,
            title: newTest.title,
            description: sanitizedDescription,
            duration: newTest.duration,
            testLogin: newTest.username,
            testPassword: newTest.password,
            accessType: newTest.accessType,
            groupId: newTest.groupId,
            teacherId: localStorage.getItem("teacherId"),
          };
          const res = await parseTextApi(payload);
          toast.success(`${res.data.count || ""} ta savol muvaffaqiyatli saqlandi!`);
        } else if (isDocFile(ext)) {
          const formData = new FormData();
          Object.entries({
            file: newTest.file,
            title: newTest.title,
            description: sanitizedDescription,
            duration: newTest.duration,
            testLogin: newTest.username,
            testPassword: newTest.password,
            accessType: newTest.accessType,
            groupId: newTest.groupId,
            teacherId: localStorage.getItem("teacherId"),
          }).forEach(([k, v]) => formData.append(k, v));
          const res = await teacherUploadTest(formData);
          toast.success(`${res.data.count || ""} ta savol yuklandi!`);
        } else {
            if (ext === "doc") {
              toast.warning("`.doc` format qo'llanmaydi. Iltimos `.docx` yoki `.docm` formatga o'tkazing.");
            } else {
              toast.warning("Fayl formati noto'g'ri. .docx/.docm/.txt/.csv yuklang.");
            }
            setLoading(false);
            return;
        }
      } else {
        const normalizedText = normalizeFormulaInput(pasteText);
        const formulaCheck = validateFormulaSyntax(normalizedText);
        if (!formulaCheck.isValid) {
          toast.warning(formulaCheck.issues[0]);
          setLoading(false);
          return;
        }
        const payload = {
          text: normalizedText,
          title: newTest.title,
          description: sanitizedDescription,
          duration: newTest.duration,
          testLogin: newTest.username,
          testPassword: newTest.password,
          accessType: newTest.accessType,
          groupId: newTest.groupId,
          teacherId: localStorage.getItem("teacherId"),
        };
        const res = await parseTextApi(payload);
        toast.success(`${res.data.count || ""} ta savol muvaffaqiyatli saqlandi!`);
      }

      resetCreateDraft();
      setTestUsageCount(
        incrementTeacherTestUsage(localStorage.getItem("teacherId"), 1, tests.length)
      );
      loadTests(localStorage.getItem("teacherId"));
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || "Xatolik yuz berdi";
      if (String(msg).toLowerCase().includes("doc")) {
        toast.error("Word fayl xatosi. `.docx` yoki `.docm` formatda yuklashni tavsiya qilamiz.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const removeTest = async (testId) => {
    showConfirm(
      "Rostdan ham ushbu testni o'chirmoqchimisiz?",
      async () => {
        try {
          await deleteTestApi(testId);
          toast.info("Test o'chirildi");
          loadTests(localStorage.getItem("teacherId"));
        } catch {
          toast.error("Xatolik");
        }
      },
      "danger",
      "Testni o'chirish"
    );
  };

  const startTest = async (testId, testLogin) => {
    if (usageBlocked) {
      toast.warning(getLimitBlockMessage());
      return;
    }
    try {
      await startTestApi(testId);
      socket.emit("start-test", testLogin);
      toast.success("Test boshlandi!");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Xatolik");
    }
  };

  const stopTest = async (testId, testLogin) => {
    try {
      // API call to update DB
      await stopTestApi(testId);
    } catch (err) {
      console.error("API Stop Error:", err);
      // Even if API fails, we should still try to emit socket for real-time stop
    }
    
    try {
      socket.emit("force-stop-test", testLogin);
      toast.info("Test to'xtatildi!");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleUpdateAccess = async (testId, accessType, groupId = null) => {
    if (!isProPlan && accessType === "group") {
      toast.info("Guruhga cheklash funksiyasi faqat Pro tarifda ishlaydi.");
      navigate("/teacher/subscription");
      return;
    }
    try {
      await updateTestAccess(testId, { accessType, groupId });
      toast.success("Ruxsat holati yangilandi");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDuplicate = async (testId) => {
    if (usageBlocked) {
      toast.warning(getLimitBlockMessage());
      return;
    }
    try {
      setLoading(true);
      await duplicateTestApi(testId);
      setTestUsageCount(
        incrementTeacherTestUsage(localStorage.getItem("teacherId"), 1, tests.length)
      );
      toast.success("Test nusxalandi");
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Nusxalashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTest = async (e) => {
    e.preventDefault();
    if (!isProPlan && editModal.test.accessType === "group") {
      toast.info("Guruhga cheklash funksiyasi faqat Pro tarifda ishlaydi.");
      navigate("/teacher/subscription");
      return;
    }
    try {
      setLoading(true);
      await updateTestApi(editModal.test._id, editModal.test);
      toast.success("O'zgarishlar saqlandi");
      setEditModal({ open: false, test: null });
      loadTests(localStorage.getItem("teacherId"));
    } catch {
      toast.error("Yangilashda xatolik");
    } finally {
      setLoading(false);
    }
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
              Testlar <span className="text-indigo-600 dark:text-indigo-400">Boshqaruvi</span>
            </h2>
            <p className="text-secondary font-medium uppercase tracking-widest text-xs opacity-70">
              Yangi testlar yuklash va mavjudlarini boshqarish
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/teacher/subscription")}
              className="px-5 py-3 border rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white"
            >
              Obuna
            </button>
            <button 
              onClick={() => {
                if (usageBlocked) {
                  toast.warning(getLimitBlockMessage());
                  return;
                }
                navigate("/teacher/create-test");
              }}
              className={`px-6 py-3 border rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg group ${
                usageBlocked
                  ? "bg-slate-500/10 text-slate-500 border-slate-500/20 cursor-not-allowed"
                  : "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 hover:bg-indigo-500 hover:text-white shadow-indigo-500/5"
              }`}
            >
              <FaPlus className="group-hover:rotate-90 transition-transform duration-300" /> Qo'lda Yaratish
            </button>
          </div>
        </div>
      </section>

      <main className="relative z-10 px-6 max-w-7xl mx-auto space-y-12 pb-20">
        <div className={`p-4 rounded-2xl border ${usageBlocked ? "bg-red-500/10 border-red-500/20" : "bg-indigo-500/5 border-indigo-500/20"}`}>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary">
            Obuna: <span className="text-indigo-600">{subscription.label}</span> | Test limiti:{" "}
            <span className="text-indigo-600">{formatLimit(subscription.maxTests)}</span> | Yechish limiti:{" "}
            <span className="text-indigo-600">{formatLimit(subscription.maxSolved)}</span>
          </p>
          <p className={`text-xs mt-1 font-semibold ${usageBlocked ? "text-red-600" : "text-secondary"}`}>
            {hasTestLimit
              ? `Joriy testlar: ${tests.length}. Umumiy qo'shilgan: ${testUsageCount}. Qolgan imkon: ${remainingTestSlots}.`
              : `Joriy testlar: ${tests.length}. Umumiy qo'shilgan: ${testUsageCount}. Sizda test yuklash cheksiz.`}
          </p>
          <p className={`text-xs mt-1 font-semibold ${usageBlocked ? "text-red-600" : "text-secondary"}`}>
            {hasSolveLimit
              ? `Yechilgan jami: ${solveUsageCount}. Qolgan yechish imkoni: ${remainingSolveSlots}.`
              : `Yechilgan jami: ${solveUsageCount}. Sizda yechish limiti cheksiz.`}
          </p>
          <p className="text-xs mt-1 font-semibold text-secondary">
            {isProPlan
              ? "Pro tarif: blok imtihon, preview, shablon, eksport va guruhga yopiq test funksiyalari ochiq."
              : "Bepul tarif: test yaratish va boshlash ochiq. Blok imtihon, preview, shablon, eksport va guruh funksiyalari Pro tarifda."}
          </p>
        </div>

        {!isProPlan && (
          <div className="premium-card border border-blue-500/20 bg-blue-500/5">
            <h4 className="text-lg font-black text-primary">Bepul rejim faol</h4>
            <p className="text-sm text-secondary mt-2">
              Siz test yaratish, boshlash, tahrirlash va to'xtatishdan foydalanasiz. Qo'shimcha funksiyalar Pro tarifga
              o'tgandan keyin ochiladi.
            </p>
            <button type="button" className="btn-primary mt-4" onClick={() => navigate("/teacher/subscription")}>
              Pro tarifga o'tish
            </button>
          </div>
        )}

        {usageBlocked && (
          <div className="premium-card border border-amber-500/30 bg-amber-500/5">
            <h4 className="text-lg font-black text-primary">
              Bepul tarif limiti tugagan. Oylik obuna kerak.
            </h4>
            <p className="text-sm text-secondary mt-2">
              Summa:{" "}
              <span className="font-bold text-amber-600">
                {PAYMENT_CONFIG.teacherMonthlyAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}
              </span>{" "}
              | Karta: <span className="font-bold">{PAYMENT_CONFIG.cardNumber}</span>
            </p>

            {pendingTeacherPayment ? (
              <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-sm">
                Pending so'rov mavjud. ID: <span className="font-bold">{pendingTeacherPayment.requestId}</span>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  className="input-clean"
                  placeholder="To'lov izohi (ixtiyoriy)"
                  value={paymentReceipt}
                  onChange={(e) => setPaymentReceipt(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="input-clean"
                  onChange={(e) => setPaymentReceiptImage(e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSendTeacherPayment}
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? "Yuborilmoqda..." : "Chekni botga yuborish"}
                </button>
              </div>
            )}

            {latestPaymentId && (
              <p className="mt-3 text-xs text-muted">Yangi so'rov ID: {latestPaymentId}</p>
            )}
          </div>
        )}

        <div className="premium-card border border-indigo-500/20 bg-indigo-500/5">
          <h4 className="text-lg font-black text-primary">Test sotish bo'limi</h4>
          <p className="text-sm text-secondary mt-2">
            Bu bo'lim orqali testingizni boshqa o'quvchilar ham ishlashi uchun admin tasdig'iga yuborasiz.
            Tasdiqlangan har bir test uchun hisobingizga {TEACHER_TEST_SALE_BONUS.toLocaleString("uz-UZ")} so'm bonus yoziladi.
          </p>
          <div className="grid sm:grid-cols-3 gap-2 mt-4 text-sm">
            <div className="rounded-xl border border-primary bg-secondary/60 p-3">
              <p className="text-xs text-muted uppercase tracking-[0.12em] font-bold">Jami so'rov</p>
              <p className="text-xl font-extrabold mt-1">{saleRequests.length}</p>
            </div>
            <div className="rounded-xl border border-primary bg-secondary/60 p-3">
              <p className="text-xs text-muted uppercase tracking-[0.12em] font-bold">Pending</p>
              <p className="text-xl font-extrabold mt-1">
                {saleRequests.filter((item) => item.status === "pending").length}
              </p>
            </div>
            <div className="rounded-xl border border-primary bg-secondary/60 p-3">
              <p className="text-xs text-muted uppercase tracking-[0.12em] font-bold">Tasdiqlangan</p>
              <p className="text-xl font-extrabold mt-1">
                {saleRequests.filter((item) => item.status === "approved").length}
              </p>
            </div>
          </div>
          <p className="text-xs text-secondary mt-2">
            Jami bonus hisob-kitobi:{" "}
            <span className="font-bold text-indigo-600">
              {(
                saleRequests
                  .filter((item) => item.status === "approved")
                  .reduce((acc, item) => acc + Number(item.bonusAmount || TEACHER_TEST_SALE_BONUS), 0)
              ).toLocaleString("uz-UZ")}{" "}
              so'm
            </span>
          </p>
        </div>

        {/* Upload Section */}
        <div className={`premium-card ${usageBlocked ? "opacity-70" : ""}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500"><FaFileUpload size={24} /></div>
              <div>
                <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">
                  Yangi test{" "}
                  {createMode === "file"
                    ? "yuklash"
                    : createMode === "text"
                      ? "yaratish"
                      : "blok imtihon yaratish"}
                </h3>
                <p className="text-xs text-muted font-bold uppercase tracking-widest">
                  {createMode === "file"
                    ? "Word/TXT/CSV fayl tanlang"
                    : createMode === "text"
                      ? "Matnni nusxalab joylashtiring"
                      : "Bir test ichida 1-2-3+ fan bo'limlari va umumiy vaqt"}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap bg-primary/30 p-1 rounded-xl border border-primary/50 self-start gap-1">
              <button 
                type="button"
                onClick={() => setCreateMode("file")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${createMode === "file" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted hover:text-primary'}`}
              >
                Word Fayl
              </button>
              <button 
                type="button"
                onClick={() => setCreateMode("text")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${createMode === "text" ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-muted hover:text-primary'}`}
              >
                Matnli Test
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isProPlan) {
                    toast.info("Blok imtihon funksiyasi faqat Pro tarifda.");
                    navigate("/teacher/subscription");
                    return;
                  }
                  setCreateMode("block");
                }}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  createMode === "block"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-muted hover:text-primary"
                }`}
              >
                Blok Imtihon (Pro)
              </button>
            </div>
          </div>

          <div className="mb-8 p-5 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-indigo-600">
                Shablonlar va formulalar
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("txt")}
                  disabled={!isProPlan}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                    isProPlan
                      ? "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                      : "bg-primary/50 border-primary text-muted cursor-not-allowed"
                  }`}
                >
                  <FaFileAlt /> TXT shablon
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("csv")}
                  disabled={!isProPlan}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                    isProPlan
                      ? "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                      : "bg-primary/50 border-primary text-muted cursor-not-allowed"
                  }`}
                >
                  <FaFileCsv /> CSV shablon
                </button>
              </div>
            </div>
            <p className="text-xs text-muted font-semibold leading-relaxed">
              Matematika uchun tavsiya: <code>x^2</code>, <code>x_1</code>, <code>\frac{"{a}"}{"{b}"}</code>, <code>\sqrt{"{16}"}</code> yoki <code>$...$</code> formatidan foydalaning.
            </p>
            <p className="text-xs text-muted font-semibold leading-relaxed mt-2">
              Rasmli savol/variant uchun Word (.docx/.docm) ichiga rasm joylang yoki matnda <code>[img:https://.../rasm.png]</code> formatidan foydalaning.
            </p>
            {!isProPlan && (
              <p className="text-xs mt-2 text-amber-600 font-semibold">
                Eslatma: Shablon yuklash va preview funksiyalari Pro tarifda ishlaydi.
              </p>
            )}
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" onSubmit={addTest}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Test Nomi</label>
              <input
                required
                placeholder="Masalan: Matematika 1-chorak"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.title}
                onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Tavsif</label>
              <input
                placeholder="Qisqacha tavsif"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.description}
                onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Login (O'quvchilar uchun)</label>
              <input
                required
                placeholder="test_user"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.username}
                onChange={(e) => setNewTest({ ...newTest, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Parol</label>
              <input
                required
                placeholder="123456"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.password}
                onChange={(e) => setNewTest({ ...newTest, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Vaqt (Daqiqa)</label>
              <input
                required
                type="number"
                className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                value={newTest.duration}
                onChange={(e) => setNewTest({ ...newTest, duration: e.target.value })}
              />
            </div>
            <div className="col-span-full space-y-2">
              {createMode !== "block" ? (
                <>
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">
                    {createMode === "file" ? "Fayl (.docx/.docm/.txt/.csv)" : "Matnni shu yerga joylashtiring"}
                  </label>
                  {createMode === "file" ? (
                    <input
                      required
                      type="file"
                      accept=".docx,.docm,.txt,.csv,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="w-full p-3.5 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-500/10 file:text-indigo-500 hover:file:bg-indigo-500/20"
                      onChange={(e) => setNewTest({ ...newTest, file: e.target.files[0] })}
                    />
                  ) : (
                    <textarea
                      required
                      placeholder="1. Savol... A) Javob... B) Javob..."
                      className="w-full h-48 p-6 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm resize-none text-sm leading-relaxed"
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                    />
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      Blok fanlari (umumiy vaqt: {newTest.duration} daqiqa)
                    </p>
                    <button
                      type="button"
                      onClick={addBlockItem}
                      className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white"
                    >
                      + Fan qo'shish
                    </button>
                  </div>

                  {blockItems.map((block, idx) => (
                    <div key={block.id} className="rounded-2xl border border-primary bg-primary/30 p-4 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <input
                          type="text"
                          value={block.subject}
                          onChange={(e) => updateBlockItem(block.id, { subject: e.target.value })}
                          placeholder={`Fan nomi ${idx + 1} (masalan: Matematika)`}
                          className="flex-1 p-3 rounded-xl bg-secondary border border-primary outline-none focus:border-indigo-500 text-sm font-semibold"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateBlockItem(block.id, { sourceType: "file", text: "" })}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              block.sourceType === "file"
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-secondary border-primary text-muted"
                            }`}
                          >
                            Fayl
                          </button>
                          <button
                            type="button"
                            onClick={() => updateBlockItem(block.id, { sourceType: "text", file: null })}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              block.sourceType === "text"
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-secondary border-primary text-muted"
                            }`}
                          >
                            Matn
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlockItem(block.id)}
                            disabled={blockItems.length <= 1}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              blockItems.length <= 1
                                ? "bg-secondary/50 border-primary text-muted cursor-not-allowed"
                                : "bg-red-500/10 border-red-500/30 text-red-600"
                            }`}
                          >
                            O'chirish
                          </button>
                        </div>
                      </div>

                      {block.sourceType === "file" ? (
                        <input
                          type="file"
                          accept=".docx,.docm,.txt,.csv,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="w-full p-3 rounded-xl bg-secondary border border-primary outline-none focus:border-indigo-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-500/10 file:text-indigo-500"
                          onChange={(e) =>
                            updateBlockItem(block.id, { file: e.target.files?.[0] || null })
                          }
                        />
                      ) : (
                        <textarea
                          value={block.text}
                          onChange={(e) => updateBlockItem(block.id, { text: e.target.value })}
                          placeholder="Fan savollarini shu yerga joylashtiring..."
                          className="w-full h-36 p-4 rounded-xl bg-secondary border border-primary outline-none focus:border-indigo-500 text-sm resize-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🔥 Visibility Control */}
            <div className="col-span-full grid md:grid-cols-2 gap-6 bg-primary p-6 rounded-3xl border border-primary">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-2">Kirish ruxsati</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setNewTest({...newTest, accessType: "public", groupId: ""})}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${newTest.accessType === 'public' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                  >
                    Umumiy (Barchaga)
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!isProPlan) {
                        toast.info("Guruhga yopiq testlar faqat Pro tarifda.");
                        navigate("/teacher/subscription");
                        return;
                      }
                      setNewTest({ ...newTest, accessType: "group" });
                    }}
                    disabled={!isProPlan}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      newTest.accessType === "group"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                        : "bg-secondary text-muted border-primary hover:text-primary"
                    } ${!isProPlan ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    Faqat Guruhga {!isProPlan ? "(Pro)" : ""}
                  </button>
                </div>
              </div>

              {newTest.accessType === "group" && isProPlan && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-2">Guruhni Tanlang</label>
                  <select 
                    required
                    value={newTest.groupId}
                    onChange={(e) => setNewTest({...newTest, groupId: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm text-xs"
                  >
                    <option value="">Guruhni tanlang...</option>
                    {groups.map(g => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="col-span-full flex gap-4">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading || loading || !isProPlan}
                className="flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition group flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {previewLoading ? "Tahlil qilinmoqda..." : (
                  <>
                    <FaCheckCircle className="group-hover:scale-110 transition-transform" />
                    {isProPlan
                      ? createMode === "block"
                        ? "Blokni Tahlil Qilish"
                        : "Tahlil Qilish (Preview)"
                      : "Preview (Pro)"}
                  </>
                )}
              </button>
              <button
                disabled={loading || previewLoading || usageBlocked}
                className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-white transition transform ${
                  loading || usageBlocked
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-500 to-indigo-700 hover:scale-[1.02] shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
                }`}
              >
                {loading ? "Saqlanmoqda..." : usageBlocked ? "Limit Tugagan" : "Testni Yaratish va Saqlash"}
              </button>
            </div>
          </form>

          {/* Preview Results */}
          {previewData && (
            <div className="mt-12 p-8 border-2 border-primary rounded-[2.5rem] bg-solid-secondary animate-in slide-in-from-top duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white"><FaCheckCircle size={20} /></div>
                  <h4 className="text-xl font-black text-primary uppercase italic tracking-tighter">Tahlil Natijasi</h4>
                </div>
                <div className="px-4 py-2 bg-indigo-500/20 rounded-xl text-indigo-500 text-[10px] font-black uppercase tracking-widest">
                  {previewData.questions.length} Savol Aniqlanadi
                </div>
              </div>

              {Array.isArray(previewData.blockMeta) && previewData.blockMeta.length > 0 && (
                <div className="mb-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2">
                    Blok fanlar kesimi
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {previewData.blockMeta.map((item, idx) => (
                      <p key={`${item.subject}-${idx}`} className="text-xs font-semibold text-secondary">
                        {item.subject}: <span className="text-primary font-bold">{item.count} ta savol</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-indigo-500/20">
                {previewData.questions.map((q, idx) => {
                  const questionText = q.imageUrl
                    ? `${q.text || ""}${q.text ? "\n" : ""}[img:${q.imageUrl}]`
                    : q.text;
                  return (
                  <div key={idx} className="p-6 bg-secondary/50 border border-primary/50 rounded-2xl">
                    <div className="text-sm font-bold text-primary mb-4 flex gap-3">
                      <span className="text-indigo-500">#{idx + 1}</span>
                      <RichTextMath text={questionText} as="p" className="flex-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt, oIdx) => {
                        const optionText = opt.imageUrl
                          ? `${opt.text || ""}${opt.text ? "\n" : ""}[img:${opt.imageUrl}]`
                          : opt.text;
                        return (
                        <div key={oIdx} className={`px-4 py-2 rounded-xl text-[10px] font-bold flex items-center justify-between ${opt.isCorrect ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-primary/20 text-muted border border-primary/20'}`}>
                          <span className="flex-1">
                            {String.fromCharCode(65 + oIdx)}){" "}
                            <RichTextMath text={optionText} as="span" preserveLines={false} />
                          </span>
                          {opt.isCorrect && <FaCheckCircle size={10} />}
                        </div>
                      )})}
                    </div>
                  </div>
                )})}
              </div>
            </div>
          )}
        </div>

        {/* Tests List Section */}
        <div className="premium-card">
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500"><FaBolt size={24} /></div>
              <h3 className="text-xl font-black text-primary uppercase italic tracking-tighter">Mavjud Testlar Ro'yxati</h3>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 border border-green-500/20">
                Aktiv: {activeTests.length}
              </span>
              <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-500/10 text-slate-600 border border-slate-500/20">
                Arxiv: {archivedTests.length}
              </span>
            </div>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {activeTests.length > 0 ? (
              activeTests.map((t) => {
                const assignedStudentsCount = getAssignedStudentsByTest(t._id).length;
                const blockMeta = getBlockExamMeta(t);
                const previewDescription = stripBlockExamMetaFromDescription(t.description);
                const saleStatus = saleStatusByTestId[t._id] || "none";
                return (
                <div key={t._id} className="group relative p-5 md:p-6 rounded-[2rem] bg-solid-secondary border border-primary hover:border-indigo-500/50 transition-all flex flex-col h-full shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                    <div className="flex items-start gap-3 md:gap-4 w-full">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary border border-primary flex items-center justify-center text-indigo-500 font-black text-lg md:text-xl shadow-inner shrink-0 mt-1">
                        {(t.title || "T").charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-primary uppercase tracking-tight text-sm md:text-base break-words leading-tight">{t.title}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest bg-primary/50 px-2 py-1 rounded-lg border border-primary/50">Login: {t.testLogin}</span>
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest bg-primary/50 px-2 py-1 rounded-lg border border-primary/50">Parol: {t.testPassword}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.accessType === "group" ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/10">
                              <FaUsers size={10} /> Faqat Guruh
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded-lg border border-green-500/10">
                              <FaGlobe size={10} /> Umumiy
                            </span>
                          )}
                           <div className="px-2 py-1 bg-indigo-500/10 rounded-lg text-indigo-500 text-[9px] font-black uppercase tracking-widest flex items-center border border-indigo-500/10">
                              {t.duration} Daq
                           </div>
                          {assignedStudentsCount > 0 && (
                            <span className="px-2 py-1 bg-blue-500/10 rounded-lg text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-500/20">
                              Biriktirilgan: {assignedStudentsCount}
                            </span>
                          )}
                          {blockMeta.isBlockExam && (
                            <span className="px-2 py-1 bg-indigo-500/10 rounded-lg text-indigo-600 text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                              Blok imtihon: {blockMeta.subjects.length} fan
                            </span>
                          )}
                        </div>
                        {blockMeta.isBlockExam && (
                          <p className="text-[11px] text-secondary mt-2 break-words">
                            Fanlar: <span className="font-bold text-primary">{blockMeta.subjects.join(", ")}</span>
                          </p>
                        )}
                        {previewDescription && (
                          <p className="text-[11px] text-muted mt-1 line-clamp-2">{previewDescription}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 🔥 Dynamic Access Control - Mobile Optimized Position */}
                     <div className="relative group/access self-end sm:self-start">
                        <button className="w-8 h-8 rounded-xl bg-secondary border border-primary flex items-center justify-center text-primary hover:border-indigo-500 transition-all shadow-sm">
                           <FaCogs size={14} />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-solid-primary border border-primary rounded-xl shadow-2xl opacity-0 invisible group-hover/access:opacity-100 group-hover/access:visible transition-all z-20 overflow-hidden">
                           <div className="p-2 border-b border-primary bg-secondary/30">
                              <p className="text-[8px] font-black uppercase text-muted tracking-widest">Tizimni o'zgartirish</p>
                           </div>
                           <button 
                             onClick={() => handleUpdateAccess(t._id, "public")}
                             className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-green-500/10 hover:text-green-500 transition-all ${t.accessType === 'public' ? 'text-green-500 bg-green-500/5' : 'text-muted'}`}
                           >
                              <FaGlobe /> Umumiyga O'tkazish
                           </button>
                           <div className="border-t border-primary">
                              <p className="px-4 py-2 text-[8px] font-black uppercase text-muted tracking-widest bg-secondary/10">Guruhga yo'naltirish</p>
                              {isProPlan ? (
                                groups.map((g) => (
                                  <button
                                    key={g._id}
                                    onClick={() => handleUpdateAccess(t._id, "group", g._id)}
                                    className={`w-full text-left px-4 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500/10 hover:text-indigo-500 transition-all ${
                                      t.groupId === g._id ? "text-indigo-500 bg-indigo-500/5" : "text-muted"
                                    }`}
                                  >
                                    <FaUsers /> {g.name}
                                  </button>
                                ))
                              ) : (
                                <p className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                  Faqat Pro tarifda
                                </p>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="mt-auto space-y-3 pt-4 border-t border-primary/50">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {t.isStarted ? (
                        <button
                          onClick={() => stopTest(t._id, t.testLogin)}
                          className="w-full sm:flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-500/20"
                        >
                          <FaStop /> TO'XTATISH
                        </button>
                      ) : (
                        <button
                          onClick={() => startTest(t._id, t.testLogin)}
                          disabled={usageBlocked}
                          className={`w-full sm:flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all ${
                            usageBlocked
                              ? "bg-slate-500/20 text-slate-500 cursor-not-allowed border border-slate-400/30"
                              : "bg-gradient-to-r from-indigo-500 to-indigo-700 text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20"
                          }`}
                        >
                          <FaPlay size={10} /> BOSHLASH
                        </button>
                      )}
                      <button
                        onClick={() => setEditModal({ open: true, test: t })}
                        className="w-full sm:w-12 h-10 sm:h-auto bg-secondary border border-primary text-indigo-500 rounded-xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                        title="Tahrirlash"
                      >
                        <FaCogs size={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicate(t._id)}
                        disabled={usageBlocked || !isProPlan}
                        className={`w-full sm:w-12 h-10 sm:h-auto border rounded-xl flex items-center justify-center transition-all shadow-sm ${
                          usageBlocked || !isProPlan
                            ? "bg-slate-200/40 border-slate-300 text-slate-400 cursor-not-allowed"
                            : "bg-secondary border-primary text-green-500 hover:bg-green-500 hover:text-white"
                        }`}
                        title="Nusxa olish"
                      >
                        <FaPlus size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleExportTest(t, "json")}
                        disabled={!isProPlan}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                          isProPlan
                            ? "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                            : "bg-primary/50 border-primary text-muted cursor-not-allowed"
                        }`}
                      >
                        <FaFileCode /> JSON
                      </button>
                      <button
                        onClick={() => handleExportTest(t, "txt")}
                        disabled={!isProPlan}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                          isProPlan
                            ? "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                            : "bg-primary/50 border-primary text-muted cursor-not-allowed"
                        }`}
                      >
                        <FaFileAlt /> TXT
                      </button>
                      <button
                        onClick={() => handleExportTest(t, "csv")}
                        disabled={!isProPlan}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                          isProPlan
                            ? "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                            : "bg-primary/50 border-primary text-muted cursor-not-allowed"
                        }`}
                      >
                        <FaFileCsv /> CSV
                      </button>
                      <button
                        onClick={() => handleExportTest(t, "word")}
                        disabled={!isProPlan}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                          isProPlan
                            ? "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                            : "bg-primary/50 border-primary text-muted cursor-not-allowed"
                        }`}
                      >
                        <FaFileWord /> WORD
                      </button>
                      <button
                        onClick={() => handleExportTest(t, "pdf")}
                        disabled={!isProPlan}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                          isProPlan
                            ? "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                            : "bg-primary/50 border-primary text-muted cursor-not-allowed"
                        }`}
                      >
                        <FaFilePdf /> PDF
                      </button>
                      <button
                        onClick={() => handleSubmitTestForSale(t)}
                        disabled={!isProPlan || saleStatus === "pending" || sellingTestId === t._id}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${
                          !isProPlan
                            ? "bg-primary/50 border-primary text-muted cursor-not-allowed"
                            : saleStatus === "approved"
                              ? "bg-green-500/10 border-green-500/20 text-green-600"
                              : saleStatus === "pending"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 cursor-not-allowed"
                                : "bg-primary border-primary hover:border-indigo-500 hover:text-indigo-600"
                        }`}
                        title="Test sotuvga yuborish"
                      >
                        <FaDownload />
                        {sellingTestId === t._id
                          ? "Yuborilmoqda"
                          : saleStatus === "approved"
                            ? "Tasdiqlangan"
                            : saleStatus === "pending"
                              ? "Pending"
                              : "Sotuvga yuborish"}
                      </button>
                      <button
                        onClick={() => toggleArchive(t._id)}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary border border-primary hover:border-slate-500 hover:text-slate-600 transition-all flex items-center gap-2"
                      >
                        <FaArchive /> Arxiv
                      </button>
                      <button
                        onClick={() => removeTest(t._id)}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary border border-primary hover:border-red-500 hover:text-red-600 transition-all flex items-center gap-2"
                      >
                        <FaTrash /> O'chirish
                      </button>
                    </div>
                  </div>
                </div>
              );
              })
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-primary rounded-[2.5rem]">
                <p className="text-muted font-bold uppercase tracking-widest italic opacity-40">Aktiv testlar yo'q</p>
              </div>
            )}
          </div>

          {archivedTests.length > 0 && (
            <div className="mt-10 pt-8 border-t border-primary/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-600 flex items-center justify-center">
                  <FaInbox />
                </div>
                <h4 className="text-lg font-black text-primary uppercase tracking-tight italic">Testlar Arxivi</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {archivedTests.map((test) => (
                  <div key={test._id} className="p-5 rounded-2xl border border-primary bg-primary/30 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-black text-primary uppercase">{test.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1">Login: {test.testLogin}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportTest(test, "json")}
                        disabled={!isProPlan}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                          isProPlan
                            ? "border-primary bg-secondary text-indigo-500"
                            : "border-primary bg-secondary/50 text-muted cursor-not-allowed"
                        }`}
                        title="JSON yuklash"
                      >
                        <FaDownload size={12} />
                      </button>
                      <button
                        onClick={() => handleExportTest(test, "word")}
                        disabled={!isProPlan}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                          isProPlan
                            ? "border-primary bg-secondary text-indigo-500"
                            : "border-primary bg-secondary/50 text-muted cursor-not-allowed"
                        }`}
                        title="WORD yuklash"
                      >
                        <FaFileWord size={12} />
                      </button>
                      <button
                        onClick={() => handleExportTest(test, "pdf")}
                        disabled={!isProPlan}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center ${
                          isProPlan
                            ? "border-primary bg-secondary text-indigo-500"
                            : "border-primary bg-secondary/50 text-muted cursor-not-allowed"
                        }`}
                        title="PDF yuklash"
                      >
                        <FaFilePdf size={12} />
                      </button>
                      <button
                        onClick={() => toggleArchive(test._id)}
                        className="px-3 py-2 rounded-lg border border-primary bg-secondary text-[10px] font-black uppercase tracking-widest text-slate-600"
                      >
                        Qaytarish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Edit Test Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEditModal({ open: false, test: null })}
          ></div>
          <div className="relative w-full max-w-2xl bg-solid-primary border border-primary rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 p-8 md:p-12">
            <h3 className="text-2xl font-black text-primary uppercase italic tracking-tighter mb-8">
              Testni <span className="text-indigo-500">Tahrirlash</span>
            </h3>
            
            <form onSubmit={handleUpdateTest} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Test Nomi</label>
                  <input
                    required
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.title}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, title: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Vaqt (Daqiqa)</label>
                  <input
                    required
                    type="number"
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.duration}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, duration: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Login</label>
                  <input
                    required
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.testLogin}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, testLogin: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-2">Parol</label>
                  <input
                    required
                    className="w-full p-4 rounded-2xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm"
                    value={editModal.test.testPassword}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, testPassword: e.target.value } })}
                  />
                </div>
              </div>

              <div className="space-y-3 bg-solid-secondary p-6 rounded-3xl border border-primary">
                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block ml-2">Kirish ruxsati</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setEditModal({ ...editModal, test: { ...editModal.test, accessType: "public", groupId: "" } })}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${editModal.test.accessType === 'public' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-secondary text-muted border-primary hover:text-primary'}`}
                  >
                    Umumiy
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!isProPlan) {
                        toast.info("Guruhga yopiq testlar faqat Pro tarifda.");
                        navigate("/teacher/subscription");
                        return;
                      }
                      setEditModal({ ...editModal, test: { ...editModal.test, accessType: "group" } });
                    }}
                    disabled={!isProPlan}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      editModal.test.accessType === "group"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20"
                        : "bg-secondary text-muted border-primary hover:text-primary"
                    } ${!isProPlan ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    Guruhga {!isProPlan ? "(Pro)" : ""}
                  </button>
                </div>
                {editModal.test.accessType === "group" && isProPlan && (
                  <select 
                    required
                    value={editModal.test.groupId || ""}
                    onChange={(e) => setEditModal({ ...editModal, test: { ...editModal.test, groupId: e.target.value } })}
                    className="w-full mt-4 p-3.5 rounded-xl bg-secondary border border-primary focus:border-indigo-500 transition-all outline-none font-bold text-primary shadow-sm text-xs"
                  >
                    <option value="">Guruhni tanlang...</option>
                    {groups.map(g => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setEditModal({ open: false, test: null })}
                  className="flex-1 py-4 bg-secondary text-muted border border-primary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all"
                >
                  Bekor Qilish
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] transition-all"
                >
                  {loading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
