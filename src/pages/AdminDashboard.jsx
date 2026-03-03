import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  BookOpen,
  Bell,
  CheckCircle,
  Clock3,
  Download,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Layers,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Users,
  Wallet,
  XCircle,
  BarChart3,
  CreditCard,
} from "lucide-react";
import {
  addStudentApi,
  deleteTeacher,
  getMyResults,
  getResultsApi,
  getTeacherGroups,
  getTeachers,
  getTeacherStudents,
  getTeacherTests,
  updateTeacher,
} from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import ConfirmationModal from "../components/ConfirmationModal";
import { buildCredentialsText, prepareStudentRecord } from "../utils/academicTools";
import {
  formatLimit,
  getTeacherSubscription,
} from "../utils/subscriptionTools";
import {
  assignTestToStudent,
  getAssignedTestsByStudent,
  removeAssignedTestFromStudent,
} from "../utils/studentTestAssignments";
import { getTeacherTestUsage } from "../utils/testUsageTools";
import {
  activateSubscription,
  getAllPaymentRequests,
  getBillingSummary,
  getOauthUsers,
  getSubscription,
  getTelegramBotConfig,
  getDeviceLocksReport,
  isSubscriptionActive,
  PAYMENT_CONFIG,
  saveTelegramBotConfig,
  unlockDevicePrincipal,
  updatePaymentRequestStatus,
} from "../utils/billingTools";
import { clearActivityLogs, getActivityLogs, getActivityStats } from "../utils/activityLog";
import { getAssignedCatalogIds, setAssignedCatalogIds } from "../utils/personalAssignmentsTools";
import {
  DEFAULT_STUDENT_DIRECTIONS,
  getStudentCatalogTests,
  removeStudentCatalogTest,
  setStudentCatalogTestActive,
  upsertStudentCatalogTest,
} from "../utils/studentCatalogTools";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const formatMoney = (amount) => `${Number(amount || 0).toLocaleString("uz-UZ")} ${PAYMENT_CONFIG.currency}`;
const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (filename, headers, rows) => {
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => csvEscape(cell)).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const StatCard = ({ title, value, icon: Icon, loading = false }) => (
  <div className="premium-card">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-muted">{title}</p>
        <p className="text-3xl font-extrabold text-primary mt-1">{loading ? "..." : value}</p>
      </div>
      <div className="w-11 h-11 rounded-xl bg-accent text-blue-600 flex items-center justify-center">
        {React.createElement(Icon, { size: 20 })}
      </div>
    </div>
  </div>
);

const ADMIN_SECTIONS = ["overview", "teachers", "students", "billing", "catalog", "access"];
const resolveAdminSection = (section) =>
  ADMIN_SECTIONS.includes(section) ? section : "overview";

export default function AdminDashboard({ initialSection = "overview" }) {
  const activeSection = resolveAdminSection(initialSection);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [teacherAnalytics, setTeacherAnalytics] = useState({});

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info",
  });

  const showConfirm = (message, onConfirm, type = "info", title = "Tasdiqlash") => {
    setModalConfig({ isOpen: true, title, message, onConfirm, type });
  };

  const [showPasswords, setShowPasswords] = useState({});
  const [manageTeacherId, setManageTeacherId] = useState("");
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerGroups, setManagerGroups] = useState([]);
  const [managerStudents, setManagerStudents] = useState([]);
  const [managerTests, setManagerTests] = useState([]);
  const [studentGroupId, setStudentGroupId] = useState("");
  const [manualCredentials, setManualCredentials] = useState(false);
  const [studentForm, setStudentForm] = useState({
    fullName: "",
    username: "",
    password: "",
  });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedTestId, setSelectedTestId] = useState("");
  const [, forceAssignmentRefresh] = useState(0);
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [oauthUsers, setOauthUsers] = useState([]);
  const [botConfig, setBotConfig] = useState({ botToken: "", chatId: "" });
  const [catalogEntries, setCatalogEntries] = useState([]);
  const [catalogTeacherId, setCatalogTeacherId] = useState("");
  const [catalogTeacherTests, setCatalogTeacherTests] = useState([]);
  const [catalogDirection, setCatalogDirection] = useState("");
  const [catalogTestId, setCatalogTestId] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [manualGrantType, setManualGrantType] = useState("student");
  const [manualTeacherTargetId, setManualTeacherTargetId] = useState("");
  const [manualStudentTargetId, setManualStudentTargetId] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState("all");
  const [teacherSortBy, setTeacherSortBy] = useState("name");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [oauthSearch, setOauthSearch] = useState("");
  const [oauthRoleFilter, setOauthRoleFilter] = useState("all");
  const [activityLogs, setActivityLogs] = useState([]);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityAreaFilter, setActivityAreaFilter] = useState("all");
  const [activityRoleFilter, setActivityRoleFilter] = useState("all");
  const [deviceLocks, setDeviceLocks] = useState([]);
  const [deviceLockSearch, setDeviceLockSearch] = useState("");
  const [personalStudentStats, setPersonalStudentStats] = useState({});
  const [personalStatsLoading, setPersonalStatsLoading] = useState(false);
  const [selectedPersonalStudentId, setSelectedPersonalStudentId] = useState("");
  const [selectedAssignedCatalogIds, setSelectedAssignedCatalogIds] = useState([]);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const buildTeacherAnalytics = async (teacherId) => {
    const [groupsRes, studentsRes, testsRes] = await Promise.all([
      getTeacherGroups(teacherId).catch(() => ({ data: [] })),
      getTeacherStudents(teacherId).catch(() => ({ data: [] })),
      getTeacherTests(teacherId).catch(() => ({ data: [] })),
    ]);

    const groups = safeArray(groupsRes.data);
    const students = safeArray(studentsRes.data);
    const tests = safeArray(testsRes.data);

    const solvedByTest = await Promise.all(
      tests.map(async (test) => {
        const resultsRes = await getResultsApi(test._id).catch(() => ({ data: [] }));
        const solvedCount = safeArray(resultsRes.data).length;
        return {
          testId: test._id,
          title: test.title || "Nomsiz test",
          solvedCount,
        };
      })
    );

    const totalSolved = solvedByTest.reduce((sum, item) => sum + item.solvedCount, 0);
    const usageCount = getTeacherTestUsage(teacherId, tests.length);

    return {
      groupsCount: groups.length,
      studentsCount: students.length,
      testsCount: tests.length,
      usageCount,
      activeTestsCount: tests.filter((t) => t.isStarted).length,
      totalSolved,
      topSolvedTests: solvedByTest
        .sort((a, b) => b.solvedCount - a.solvedCount)
        .slice(0, 3),
    };
  };

  const loadTeacherAnalytics = async (teacherList) => {
    setAnalyticsLoading(true);
    try {
      const entries = await Promise.all(
        teacherList.map(async (teacher) => {
          const analytics = await buildTeacherAnalytics(teacher._id);
          return [teacher._id, analytics];
        })
      );
      setTeacherAnalytics(Object.fromEntries(entries));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await getTeachers();
      const teacherList = safeArray(res.data);
      setTeachers(teacherList);

      if (!teacherList.length) {
        setTeacherAnalytics({});
        setManageTeacherId("");
        return;
      }

      if (!manageTeacherId || !teacherList.some((teacher) => teacher._id === manageTeacherId)) {
        setManageTeacherId(teacherList[0]._id);
      }
      if (!catalogTeacherId || !teacherList.some((teacher) => teacher._id === catalogTeacherId)) {
        setCatalogTeacherId(teacherList[0]._id);
      }
      if (!manualTeacherTargetId || !teacherList.some((teacher) => teacher._id === manualTeacherTargetId)) {
        setManualTeacherTargetId(teacherList[0]._id);
      }

      await loadTeacherAnalytics(teacherList);
    } catch {
      toast.error("O‘qituvchilar olinmadi");
    }
  };

  useEffect(() => {
    fetchTeachers();
    // fetchTeachers intentionally runs once on initial mount for bootstrap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshCatalogData = () => {
    setCatalogEntries(getStudentCatalogTests());
  };

  const refreshBillingData = () => {
    const requests = getAllPaymentRequests();
    const users = getOauthUsers();
    setPaymentRequests(requests);
    setOauthUsers(users);
    setBotConfig(getTelegramBotConfig());
    setDeviceLocks(getDeviceLocksReport());
  };

  const refreshActivityData = () => {
    setActivityLogs(getActivityLogs());
  };

  useEffect(() => {
    refreshCatalogData();
    refreshBillingData();
    refreshActivityData();
  }, []);

  useEffect(() => {
    if (activeSection !== "access") return;
    refreshBillingData();
    refreshActivityData();
  }, [activeSection]);

  const loadTeacherManagementData = async (teacherId) => {
    if (!teacherId) {
      setManagerGroups([]);
      setManagerStudents([]);
      setManagerTests([]);
      setStudentGroupId("");
      setSelectedStudentId("");
      setSelectedTestId("");
      return;
    }

    setManagerLoading(true);
    try {
      const [groupsRes, studentsRes, testsRes] = await Promise.all([
        getTeacherGroups(teacherId).catch(() => ({ data: [] })),
        getTeacherStudents(teacherId).catch(() => ({ data: [] })),
        getTeacherTests(teacherId).catch(() => ({ data: [] })),
      ]);

      const groups = safeArray(groupsRes.data);
      const students = safeArray(studentsRes.data);
      const tests = safeArray(testsRes.data);

      setManagerGroups(groups);
      setManagerStudents(students);
      setManagerTests(tests);

      setStudentGroupId((prev) => {
        if (prev && groups.some((group) => String(group._id) === String(prev))) return prev;
        return groups[0]?._id || "";
      });

      setSelectedStudentId((prev) => {
        if (prev && students.some((student) => String(student._id) === String(prev))) return prev;
        return students[0]?._id || "";
      });

      setSelectedTestId((prev) => {
        if (prev && tests.some((test) => String(test._id) === String(prev))) return prev;
        return tests[0]?._id || "";
      });
    } finally {
      setManagerLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherManagementData(manageTeacherId);
  }, [manageTeacherId]);

  useEffect(() => {
    setManualStudentTargetId((prev) => {
      if (prev && managerStudents.some((student) => String(student._id) === String(prev))) return prev;
      return managerStudents[0]?._id || "";
    });
  }, [managerStudents]);

  useEffect(() => {
    const loadCatalogTeacherTests = async () => {
      if (!catalogTeacherId) {
        setCatalogTeacherTests([]);
        setCatalogTestId("");
        return;
      }
      setCatalogLoading(true);
      try {
        const testsRes = await getTeacherTests(catalogTeacherId).catch(() => ({ data: [] }));
        const tests = safeArray(testsRes.data);
        setCatalogTeacherTests(tests);
        setCatalogTestId((prev) =>
          prev && tests.some((item) => String(item._id) === String(prev)) ? prev : tests[0]?._id || ""
        );
      } finally {
        setCatalogLoading(false);
      }
    };

    loadCatalogTeacherTests();
  }, [catalogTeacherId]);

  const handleToggleStatus = async (teacher) => {
    try {
      await updateTeacher(teacher._id, { ...teacher, isActive: !teacher.isActive });
      toast.success("Status yangilandi");
      await fetchTeachers();
    } catch {
      toast.error("Statusni yangilashda xato");
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "O‘qituvchini o'chirishni tasdiqlaysizmi?",
      async () => {
        try {
          await deleteTeacher(id);
          toast.success("O‘chirildi");
          await fetchTeachers();
        } catch {
          toast.error("O‘chirishda xato");
        }
      },
      "danger",
      "O'qituvchini o'chirish"
    );
  };

  const copyCredentials = async (records) => {
    const text = buildCredentialsText(records);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Login-parollar nusxalandi");
    } catch {
      toast.warning("Clipboard'ga nusxalab bo'lmadi");
    }
  };

  const handleGenerateCredentials = () => {
    if (!studentForm.fullName.trim()) {
      toast.warning("Avval o'quvchi F.I.Sh kiriting");
      return;
    }
    const usedSet = new Set(managerStudents.map((student) => student.username).filter(Boolean));
    const generated = prepareStudentRecord({ fullName: studentForm.fullName }, usedSet);
    setStudentForm((prev) => ({ ...prev, username: generated.username, password: generated.password }));
    toast.info("Auto login/parol tayyorlandi");
  };

  const handleAdminAddStudent = async (e) => {
    e.preventDefault();
    if (!manageTeacherId) return toast.warning("Avval o'qituvchini tanlang");
    if (!studentGroupId) return toast.warning("Guruh tanlang");
    if (!studentForm.fullName.trim()) return toast.warning("O'quvchi ismini kiriting");

    const subscription = getTeacherSubscription(manageTeacherId);
    const hasStudentLimit = Number.isFinite(subscription.maxStudents);
    if (hasStudentLimit && managerStudents.length >= subscription.maxStudents) {
      return toast.warning(`O'quvchi limiti tugagan (${formatLimit(subscription.maxStudents)} ta).`);
    }

    const usedSet = new Set(managerStudents.map((student) => student.username).filter(Boolean));
    const payload = manualCredentials
      ? {
          fullName: studentForm.fullName.trim(),
          username: studentForm.username.trim(),
          password: studentForm.password.trim(),
        }
      : prepareStudentRecord({ fullName: studentForm.fullName }, usedSet);

    if (!payload.username || !payload.password) {
      return toast.warning("Login va parolni to'ldiring");
    }

    try {
      await addStudentApi({
        ...payload,
        teacherId: manageTeacherId,
        groupId: studentGroupId,
      });
      toast.success(`O'quvchi qo'shildi: ${payload.username} / ${payload.password}`);
      copyCredentials([payload]);
      setStudentForm({ fullName: "", username: "", password: "" });
      await Promise.all([fetchTeachers(), loadTeacherManagementData(manageTeacherId)]);
    } catch (err) {
      toast.error(err.response?.data?.msg || "O'quvchi qo'shishda xatolik");
    }
  };

  const handleAssignTestToStudent = () => {
    if (!selectedStudentId || !selectedTestId) {
      toast.warning("O'quvchi va testni tanlang");
      return;
    }

    const selectedStudent = managerStudents.find((student) => String(student._id) === String(selectedStudentId));
    const selectedTest = managerTests.find((test) => String(test._id) === String(selectedTestId));
    assignTestToStudent(selectedStudentId, selectedTestId);
    forceAssignmentRefresh((value) => value + 1);
    toast.success(`${selectedTest?.title || "Test"} -> ${selectedStudent?.fullName || "O'quvchi"} biriktirildi`);
  };

  const handleUnassignTestFromStudent = (studentId, testId) => {
    removeAssignedTestFromStudent(studentId, testId);
    forceAssignmentRefresh((value) => value + 1);
  };

  const groupNameById = useMemo(() => {
    return Object.fromEntries(managerGroups.map((group) => [String(group._id), group.name || "Nomsiz guruh"]));
  }, [managerGroups]);

  const testTitleById = useMemo(() => {
    return Object.fromEntries(managerTests.map((test) => [String(test._id), test.title || "Nomsiz test"]));
  }, [managerTests]);

  const handleRefreshAllData = async () => {
    setRefreshingAll(true);
    try {
      await fetchTeachers();
      const fallbackTeacherId = manageTeacherId || teachers[0]?._id || "";
      if (fallbackTeacherId) {
        await loadTeacherManagementData(fallbackTeacherId);
      }
      refreshBillingData();
      refreshCatalogData();
      refreshActivityData();
      toast.success("Admin ma'lumotlari yangilandi");
    } finally {
      setRefreshingAll(false);
    }
  };

  const selectedTeacherPlan = getTeacherSubscription(manageTeacherId);
  const studentLimitReached =
    Number.isFinite(selectedTeacherPlan.maxStudents) &&
    managerStudents.length >= selectedTeacherPlan.maxStudents;
  const billingSummary = useMemo(() => getBillingSummary(paymentRequests), [paymentRequests]);

  const teachersWithStats = useMemo(() => {
    return teachers.map((teacher) => {
      const analytics = teacherAnalytics[teacher._id] || {
        groupsCount: 0,
        studentsCount: 0,
        testsCount: 0,
        usageCount: 0,
        totalSolved: 0,
        topSolvedTests: [],
      };
      const plan = getTeacherSubscription(teacher._id);
      const usedForLimit = analytics.usageCount || analytics.testsCount || 0;
      const testLimitReached = Number.isFinite(plan.maxTests) && usedForLimit >= plan.maxTests;
      const solvedLimitReached = Number.isFinite(plan.maxSolved) && Number(analytics.totalSolved || 0) >= plan.maxSolved;
      const limitReached = testLimitReached || solvedLimitReached;
      return { teacher, analytics, plan, usedForLimit, testLimitReached, solvedLimitReached, limitReached };
    });
  }, [teachers, teacherAnalytics]);

  const teacherStatusSummary = useMemo(() => {
    return teachersWithStats.reduce(
      (acc, item) => {
        if (item.teacher.isActive) acc.active += 1;
        else acc.inactive += 1;
        if (item.limitReached) acc.limitReached += 1;
        return acc;
      },
      { active: 0, inactive: 0, limitReached: 0 }
    );
  }, [teachersWithStats]);

  const filteredTeachers = useMemo(() => {
    const query = teacherSearch.trim().toLowerCase();
    const base = teachersWithStats.filter((item) => {
      if (teacherStatusFilter === "active" && !item.teacher.isActive) return false;
      if (teacherStatusFilter === "inactive" && item.teacher.isActive) return false;
      if (!query) return true;
      return (
        String(item.teacher.fullName || "").toLowerCase().includes(query) ||
        String(item.teacher.username || "").toLowerCase().includes(query)
      );
    });

    const sorters = {
      name: (a, b) => String(a.teacher.fullName || "").localeCompare(String(b.teacher.fullName || ""), "uz"),
      students: (a, b) => (b.analytics.studentsCount || 0) - (a.analytics.studentsCount || 0),
      tests: (a, b) => (b.usedForLimit || 0) - (a.usedForLimit || 0),
      solved: (a, b) => (b.analytics.totalSolved || 0) - (a.analytics.totalSolved || 0),
    };
    const sorter = sorters[teacherSortBy] || sorters.name;
    return [...base].sort(sorter);
  }, [teacherSearch, teacherSortBy, teacherStatusFilter, teachersWithStats]);

  const pendingPaymentRequests = useMemo(
    () => paymentRequests.filter((request) => request.status === "pending"),
    [paymentRequests]
  );

  const filteredPaymentRequests = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();
    return paymentRequests.filter((request) => {
      if (showPendingOnly && request.status !== "pending") return false;
      if (paymentStatusFilter !== "all" && request.status !== paymentStatusFilter) return false;
      if (!query) return true;
      const haystack = [
        request.requestId,
        request.fullName,
        request.email,
        request.userType,
        request.planId,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [paymentRequests, paymentSearch, paymentStatusFilter, showPendingOnly]);

  const filteredOauthUsers = useMemo(() => {
    const query = oauthSearch.trim().toLowerCase();
    return oauthUsers.filter((user) => {
      if (oauthRoleFilter !== "all" && String(user.role || "").toLowerCase() !== oauthRoleFilter) return false;
      if (!query) return true;
      const haystack = [user.fullName, user.email, user.role].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [oauthUsers, oauthSearch, oauthRoleFilter]);

  const personalCabinetStudents = useMemo(() => {
    const rows = oauthUsers
      .filter((user) => String(user.role || "").toLowerCase() === "student")
      .map((user) => ({
        userId: String(user.userId || "").trim(),
        fullName: user.fullName || "-",
        email: String(user.email || "").trim().toLowerCase(),
        createdAt: user.createdAt,
      }))
      .filter((row) => row.userId && row.email);

    const uniqueMap = new Map();
    rows.forEach((row) => {
      const key = row.userId || row.email;
      if (!uniqueMap.has(key)) uniqueMap.set(key, row);
    });
    return Array.from(uniqueMap.values());
  }, [oauthUsers]);

  useEffect(() => {
    setSelectedPersonalStudentId((prev) => {
      if (prev && personalCabinetStudents.some((item) => item.userId === prev)) return prev;
      return personalCabinetStudents[0]?.userId || "";
    });
  }, [personalCabinetStudents]);

  useEffect(() => {
    if (!selectedPersonalStudentId) {
      setSelectedAssignedCatalogIds([]);
      return;
    }
    setSelectedAssignedCatalogIds(getAssignedCatalogIds(selectedPersonalStudentId));
  }, [selectedPersonalStudentId, catalogEntries]);

  useEffect(() => {
    let cancelled = false;

    const loadPersonalStudentStats = async () => {
      if (!personalCabinetStudents.length) {
        setPersonalStudentStats({});
        return;
      }

      setPersonalStatsLoading(true);
      try {
        const rows = await Promise.all(
          personalCabinetStudents.map(async (student) => {
            try {
              const { data } = await getMyResults(student.userId);
              const solvedCount = Array.isArray(data) ? data.length : 0;
              return [student.userId, solvedCount];
            } catch {
              return [student.userId, 0];
            }
          })
        );
        if (!cancelled) {
          setPersonalStudentStats(Object.fromEntries(rows));
        }
      } finally {
        if (!cancelled) setPersonalStatsLoading(false);
      }
    };

    loadPersonalStudentStats();
    return () => {
      cancelled = true;
    };
  }, [personalCabinetStudents]);

  const filteredActivityLogs = useMemo(() => {
    const query = activitySearch.trim().toLowerCase();
    return activityLogs.filter((log) => {
      if (activityAreaFilter !== "all" && String(log.area || "").toLowerCase() !== activityAreaFilter) return false;
      if (activityRoleFilter !== "all" && String(log.actorRole || "").toLowerCase() !== activityRoleFilter) return false;
      if (!query) return true;
      const haystack = [
        log.action,
        log.message,
        log.actorName,
        log.actorRole,
        log.targetRole,
        log.targetId,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activityLogs, activitySearch, activityAreaFilter, activityRoleFilter]);

  const activityStats = useMemo(() => getActivityStats(filteredActivityLogs), [filteredActivityLogs]);

  const filteredDeviceLocks = useMemo(() => {
    const query = deviceLockSearch.trim().toLowerCase();
    if (!query) return deviceLocks;
    return deviceLocks.filter((lock) => {
      const haystack = [lock.role, lock.principal, lock.fingerprint].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [deviceLocks, deviceLockSearch]);

  const recentActivity = useMemo(() => {
    const paymentEvents = paymentRequests.map((request) => ({
      id: `payment_${request.requestId}`,
      time: request.updatedAt || request.createdAt,
      title: "To'lov so'rovi",
      subtitle: `${request.requestId} | ${request.userType} | ${request.status}`,
    }));

    const oauthEvents = oauthUsers.map((user, index) => ({
      id: `oauth_${user.email}_${index}`,
      time: user.createdAt,
      title: "Email/Google kirish",
      subtitle: `${user.role} | ${user.email}`,
    }));

    return [...paymentEvents, ...oauthEvents]
      .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
      .slice(0, 12);
  }, [paymentRequests, oauthUsers]);

  const overview = useMemo(() => {
    const totals = Object.values(teacherAnalytics).reduce(
      (acc, item) => {
        acc.groups += item.groupsCount || 0;
        acc.students += item.studentsCount || 0;
        acc.tests += item.usageCount || item.testsCount || 0;
        acc.solved += item.totalSolved || 0;
        return acc;
      },
      { groups: 0, students: 0, tests: 0, solved: 0 }
    );

    return {
      teachers: teachers.length,
      ...totals,
    };
  }, [teachers, teacherAnalytics]);

  const topTeachersBySolved = useMemo(() => {
    return [...teachersWithStats]
      .sort((a, b) => (b.analytics.totalSolved || 0) - (a.analytics.totalSolved || 0))
      .slice(0, 5);
  }, [teachersWithStats]);

  const overviewChartRows = useMemo(() => {
    const rows = [
      { label: "O'qituvchi", value: overview.teachers },
      { label: "Guruh", value: overview.groups },
      { label: "O'quvchi", value: overview.students },
      { label: "Test", value: overview.tests },
      { label: "Yechilgan", value: overview.solved },
    ];
    const max = Math.max(...rows.map((item) => Number(item.value || 0)), 1);
    return rows.map((item) => ({
      ...item,
      percent: Math.round((Number(item.value || 0) / max) * 100),
    }));
  }, [overview]);

  const handleExportTeachersCsv = () => {
    if (!filteredTeachers.length) {
      toast.info("Eksport uchun o'qituvchi topilmadi");
      return;
    }
    const headers = [
      "Ism",
      "Email/Login",
      "Status",
      "Guruhlar",
      "O'quvchilar",
      "Joriy testlar",
      "Yuklangan testlar",
      "Yechilganlar",
      "Tarif",
      "Limit",
    ];
    const rows = filteredTeachers.map((item) => [
      item.teacher.fullName,
      item.teacher.username,
      item.teacher.isActive ? "Aktiv" : "Nofaol",
      item.analytics.groupsCount,
      item.analytics.studentsCount,
      item.analytics.testsCount,
      item.usedForLimit,
      item.analytics.totalSolved,
      item.plan.label,
      formatLimit(item.plan.maxTests),
    ]);
    downloadCsv("admin-teachers.csv", headers, rows);
    toast.success("Teacher CSV yuklandi");
  };

  const handleExportPaymentsCsv = () => {
    if (!filteredPaymentRequests.length) {
      toast.info("Eksport uchun to'lov so'rovi topilmadi");
      return;
    }
    const headers = [
      "Request ID",
      "Foydalanuvchi",
      "Email/Login",
      "Rol",
      "Tarif",
      "Summa",
      "Holat",
      "Bot",
      "Vaqt",
    ];
    const rows = filteredPaymentRequests.map((request) => [
      request.requestId,
      request.fullName || "-",
      request.email || "-",
      request.userType || "-",
      request.planId || "-",
      request.amount || 0,
      request.status || "-",
      request.botDelivered ? "Yuborilgan" : "Yo'q",
      request.updatedAt || request.createdAt || "",
    ]);
    downloadCsv("admin-payments.csv", headers, rows);
    toast.success("Payments CSV yuklandi");
  };

  const handleExportOauthCsv = () => {
    if (!filteredOauthUsers.length) {
      toast.info("Eksport uchun foydalanuvchi topilmadi");
      return;
    }
    const headers = ["Ism", "Email", "Rol", "Vaqt"];
    const rows = filteredOauthUsers.map((user) => [
      user.fullName || "-",
      user.email || "-",
      user.role || "-",
      user.createdAt || "",
    ]);
    downloadCsv("admin-oauth-users.csv", headers, rows);
    toast.success("OAuth users CSV yuklandi");
  };

  const handleBulkPaymentDecision = (status) => {
    const pending = filteredPaymentRequests.filter((request) => request.status === "pending");
    if (!pending.length) {
      toast.info("Tanlangan filtrda pending so'rov topilmadi");
      return;
    }
    const actionText = status === "approved" ? "tasdiqlash" : "rad etish";
    showConfirm(
      `${pending.length} ta pending so'rovni biryo'la ${actionText}ni xohlaysizmi?`,
      () => {
        pending.forEach((request) => {
          updatePaymentRequestStatus(
            request.requestId,
            status,
            status === "approved" ? "Admin bulk tasdiqladi" : "Admin bulk rad etdi"
          );
        });
        refreshBillingData();
        toast.success(`${pending.length} ta so'rov ${actionText} qilindi`);
      },
      status === "approved" ? "info" : "danger",
      "Bulk to'lov nazorati"
    );
  };

  const handleSavePersonalAssignments = () => {
    if (!selectedPersonalStudentId) {
      toast.warning("Avval o'quvchini tanlang");
      return;
    }
    setAssignedCatalogIds(selectedPersonalStudentId, selectedAssignedCatalogIds);
    refreshActivityData();
    toast.success("Shaxsiy kabinet test biriktirishlari saqlandi");
  };

  const handleExportActivityCsv = () => {
    if (!filteredActivityLogs.length) {
      toast.info("Eksport uchun activity yozuvi topilmadi");
      return;
    }
    const headers = ["Vaqt", "Area", "Action", "Status", "Actor", "Role", "Target", "Izoh"];
    const rows = filteredActivityLogs.map((log) => [
      log.createdAt || "",
      log.area || "",
      log.action || "",
      log.status || "",
      log.actorName || "",
      log.actorRole || "",
      `${log.targetRole || ""}:${log.targetId || ""}`,
      log.message || "",
    ]);
    downloadCsv("admin-activity-logs.csv", headers, rows);
    toast.success("Activity CSV yuklandi");
  };

  const handleClearActivities = () => {
    showConfirm(
      "Activity jurnalini tozalashni tasdiqlaysizmi?",
      () => {
        clearActivityLogs();
        refreshActivityData();
        toast.success("Activity jurnali tozalandi");
      },
      "danger",
      "Jurnalni tozalash"
    );
  };

  const handleUnlockDevice = (role, principal) => {
    const ok = unlockDevicePrincipal(role, principal);
    if (!ok) {
      toast.warning("Blok yozuvi topilmadi");
      return;
    }
    setDeviceLocks(getDeviceLocksReport());
    refreshActivityData();
    toast.success("Qurilma blokirovkasi yechildi");
  };

  const handleAutoSeedFreeCatalog = async () => {
    if (!teachers.length) {
      toast.warning("Avval o'qituvchilar ro'yxatini yangilang");
      return;
    }

    try {
      setCatalogLoading(true);
      const collected = [];
      await Promise.all(
        teachers.map(async (teacher) => {
          const testsRes = await getTeacherTests(teacher._id).catch(() => ({ data: [] }));
          safeArray(testsRes.data).forEach((test) => {
            if (!test?.testLogin) return;
            collected.push({
              teacherId: teacher._id,
              teacherName: teacher.fullName || "O'qituvchi",
              test,
            });
          });
        })
      );

      if (!collected.length) {
        toast.warning("Katalogga qo'shish uchun test topilmadi");
        return;
      }

      const seed = collected.slice(0, 10);
      seed.forEach((item, index) => {
        const direction = DEFAULT_STUDENT_DIRECTIONS[index % DEFAULT_STUDENT_DIRECTIONS.length];
        upsertStudentCatalogTest({
          teacherId: item.teacherId,
          teacherName: item.teacherName,
          testId: item.test._id,
          title: item.test.title || `Nomsiz test ${index + 1}`,
          description: item.test.description || "",
          duration: item.test.duration || 30,
          testLogin: item.test.testLogin || "",
          isStarted: Boolean(item.test.isStarted),
          direction,
          active: true,
        });
      });

      refreshCatalogData();
      refreshActivityData();
      toast.success("Bepul 10 ta fan bo'yicha katalog testlari tayyorlandi");
    } finally {
      setCatalogLoading(false);
    }
  };

  const handlePaymentDecision = (requestId, status) => {
    updatePaymentRequestStatus(requestId, status, status === "approved" ? "Admin tasdiqladi" : "Admin rad etdi");
    refreshBillingData();
    refreshActivityData();
    toast.success(status === "approved" ? "To'lov tasdiqlandi" : "To'lov rad etildi");
  };

  const handleSaveBotConfig = () => {
    if (!botConfig.botToken.trim() || !botConfig.chatId.trim()) {
      return toast.warning("Bot token va chat ID ni kiriting");
    }
    saveTelegramBotConfig({
      botToken: botConfig.botToken,
      chatId: botConfig.chatId,
    });
    refreshActivityData();
    toast.success("Bot sozlamalari saqlandi");
  };

  const handleAddCatalogTest = () => {
    if (!catalogTeacherId) return toast.warning("Avval o'qituvchini tanlang");
    if (!catalogTestId) return toast.warning("Testni tanlang");
    if (!catalogDirection.trim()) return toast.warning("Yo'nalishni kiriting");

    const selectedTest = catalogTeacherTests.find((test) => String(test._id) === String(catalogTestId));
    if (!selectedTest) return toast.warning("Test topilmadi");

    const teacherName =
      teachers.find((teacher) => String(teacher._id) === String(catalogTeacherId))?.fullName || "O'qituvchi";

    try {
      upsertStudentCatalogTest({
        teacherId: catalogTeacherId,
        teacherName,
        testId: selectedTest._id,
        title: selectedTest.title || "Nomsiz test",
        description: selectedTest.description || "",
        duration: selectedTest.duration || 30,
        testLogin: selectedTest.testLogin || "",
        isStarted: Boolean(selectedTest.isStarted),
        direction: catalogDirection.trim(),
        active: true,
      });
      refreshCatalogData();
      refreshActivityData();
      toast.success("Shaxsiy kabinet bazasiga qo'shildi");
    } catch (err) {
      toast.error(err.message || "Bazaga qo'shishda xatolik");
    }
  };

  const handleRemoveCatalogTest = (catalogId) => {
    showConfirm(
      "Bu testni shaxsiy kabinet bazasidan o'chirasizmi?",
      () => {
        removeStudentCatalogTest(catalogId);
        refreshCatalogData();
        toast.success("Bazadan o'chirildi");
      },
      "danger",
      "Testni o'chirish"
    );
  };

  const handleToggleCatalogStatus = (catalogId, nextActive) => {
    setStudentCatalogTestActive(catalogId, nextActive);
    refreshCatalogData();
    refreshActivityData();
    toast.success(nextActive ? "Test faollashtirildi" : "Test yopildi");
  };

  const handleGrantSubscription = () => {
    if (manualGrantType === "teacher") {
      if (!manualTeacherTargetId) return toast.warning("O'qituvchi tanlang");
      activateSubscription({
        userType: "teacher",
        userId: manualTeacherTargetId,
        planId: "teacher_monthly",
        activatedBy: "admin_manual",
      });
      refreshActivityData();
      toast.success("O'qituvchiga obuna ulab berildi");
      return;
    }

    if (!manualStudentTargetId) return toast.warning("O'quvchini tanlang");
    activateSubscription({
      userType: "student",
      userId: manualStudentTargetId,
      planId: "student_monthly",
      activatedBy: "admin_manual",
    });
    refreshActivityData();
    toast.success("O'quvchiga obuna ulab berildi");
  };

  const selectedManualTeacher = teachers.find(
    (teacher) => String(teacher._id) === String(manualTeacherTargetId)
  );
  const selectedManualStudent = managerStudents.find(
    (student) => String(student._id) === String(manualStudentTargetId)
  );
  const currentManualSubscription =
    manualGrantType === "teacher"
      ? getSubscription("teacher", manualTeacherTargetId)
      : getSubscription("student", manualStudentTargetId);
  const currentManualSubscriptionActive =
    manualGrantType === "teacher"
      ? isSubscriptionActive("teacher", manualTeacherTargetId)
      : isSubscriptionActive("student", manualStudentTargetId);

  return (
    <DashboardLayout role="admin" userName="Admin">
      <ConfirmationModal
        {...modalConfig}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="max-w-7xl mx-auto space-y-8">
        <section className="premium-card">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted font-bold">Markaziy boshqaruv</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary mt-1">Admin Boshqaruvi</h1>
              <p className="text-sm text-secondary mt-2">
                O'qituvchi, o'quvchi, test, to'lov va kirish nazoratini yagona panelda boshqaring.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-[11px] font-semibold text-blue-700">
                Domen: testonlinee.uz
              </span>
              <span className="px-3 py-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-[11px] font-semibold text-indigo-700">
                Platforma: OsonTestOl
              </span>
            </div>
          </div>
        </section>

        {activeSection === "overview" && (
          <>
            <section className="premium-card">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold">Bosh sahifa diagrammasi</p>
                  <h2 className="text-2xl font-extrabold mt-2">Umumiy ko'rsatkichlar</h2>
                  <p className="text-sm text-secondary mt-1">
                    Raqamlar dinamikasi bo'yicha tezkor taqqoslash.
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={handleRefreshAllData} disabled={refreshingAll}>
                  <RefreshCcw size={14} /> {refreshingAll ? "Yangilanmoqda..." : "Barchasini yangilash"}
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {overviewChartRows.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-secondary mb-1">
                      <span>{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-accent overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="O'qituvchilar" value={overview.teachers} icon={Users} loading={analyticsLoading} />
              <StatCard title="Guruhlar" value={overview.groups} icon={Layers} loading={analyticsLoading} />
              <StatCard title="O'quvchilar" value={overview.students} icon={GraduationCap} loading={analyticsLoading} />
              <StatCard title="Testlar" value={overview.tests} icon={FileText} loading={analyticsLoading} />
              <StatCard title="Yechilgan" value={overview.solved} icon={BarChart3} loading={analyticsLoading} />
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard title="Tasdiqlangan tushum" value={formatMoney(billingSummary.approvedAmount)} icon={Wallet} />
              <StatCard title="Kutilayotgan summa" value={formatMoney(billingSummary.pendingAmount)} icon={Clock3} />
              <StatCard title="Jami so'rovlar" value={billingSummary.totalRequests} icon={CreditCard} />
              <StatCard title="Shaxsiy kabinet bazasi" value={catalogEntries.length} icon={BookOpen} />
            </section>
          </>
        )}

        {activeSection === "overview" && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 premium-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold">Top o'qituvchilar (yechilganlar bo'yicha)</h2>
                <button type="button" className="btn-secondary" onClick={handleExportTeachersCsv}>
                  <Download size={14} /> CSV eksport
                </button>
              </div>
              {topTeachersBySolved.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm text-primary">
                    <thead className="text-muted border-b border-primary uppercase text-[11px] tracking-widest font-bold">
                      <tr>
                        <th className="py-3 text-left">O'qituvchi</th>
                        <th className="py-3 text-left">Faollik</th>
                        <th className="py-3 text-left">Testlar</th>
                        <th className="py-3 text-left">Yechilgan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTeachersBySolved.map((item) => (
                        <tr key={item.teacher._id} className="border-b border-primary">
                          <td className="py-3 pr-2">
                            <p className="font-semibold">{item.teacher.fullName}</p>
                            <p className="text-xs text-blue-600">{item.teacher.username}</p>
                          </td>
                          <td className="py-3 pr-2 text-xs">
                            <span
                              className={`px-2 py-1 rounded-md font-semibold ${
                                item.teacher.isActive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {item.teacher.isActive ? "Aktiv" : "Nofaol"}
                            </span>
                          </td>
                          <td className="py-3 pr-2">{item.usedForLimit}</td>
                          <td className="py-3 pr-2 font-semibold">{item.analytics.totalSolved || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted mt-4">Top reyting uchun ma'lumot yetarli emas.</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="premium-card">
                <p className="text-xs uppercase tracking-[0.16em] text-muted font-bold inline-flex items-center gap-1.5">
                  <Bell size={14} /> Tizim ogohlantirishlari
                </p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="rounded-lg border border-primary bg-accent px-3 py-2 flex items-center justify-between">
                    <span>Nofaol teacher</span>
                    <span className="font-bold">{teacherStatusSummary.inactive}</span>
                  </div>
                  <div className="rounded-lg border border-primary bg-accent px-3 py-2 flex items-center justify-between">
                    <span>Limitga yetgan teacher</span>
                    <span className="font-bold">{teacherStatusSummary.limitReached}</span>
                  </div>
                  <div className="rounded-lg border border-primary bg-accent px-3 py-2 flex items-center justify-between">
                    <span>Pending to'lovlar</span>
                    <span className="font-bold">{pendingPaymentRequests.length}</span>
                  </div>
                </div>
              </div>

              <div className="premium-card">
                <h2 className="text-xl font-extrabold mb-3">So'nggi faollik</h2>
                {recentActivity.length ? (
                  <div className="space-y-2">
                    {recentActivity.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="rounded-lg border border-primary bg-accent px-3 py-2">
                        <p className="text-xs font-bold text-primary">{activity.title}</p>
                        <p className="text-xs text-secondary mt-0.5">{activity.subtitle}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Faollik yozuvlari hali yo'q.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {activeSection === "teachers" && (
          <section className="space-y-6">
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard title="Jami o'qituvchi" value={teachersWithStats.length} icon={Users} loading={analyticsLoading} />
              <StatCard title="Aktivlar" value={teacherStatusSummary.active} icon={CheckCircle} loading={analyticsLoading} />
              <StatCard title="Nofaollar" value={teacherStatusSummary.inactive} icon={XCircle} loading={analyticsLoading} />
              <StatCard title="Limitga yetgan" value={teacherStatusSummary.limitReached} icon={Bell} loading={analyticsLoading} />
            </section>

            <section>
              <div className="premium-card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-extrabold">O'qituvchilar ro'yxati</h2>
                    <p className="text-xs text-muted mt-1">
                      Topildi: <span className="font-bold text-primary">{filteredTeachers.length}</span> ta
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={fetchTeachers} className="btn-secondary">
                      <RefreshCcw size={14} /> Yangilash
                    </button>
                    <button type="button" onClick={handleExportTeachersCsv} className="btn-secondary">
                      <Download size={14} /> CSV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      className="input-clean pl-9"
                      placeholder="Ism yoki email bo'yicha qidirish"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                  </div>
                  <select className="input-clean" value={teacherStatusFilter} onChange={(e) => setTeacherStatusFilter(e.target.value)}>
                    <option value="all">Barcha status</option>
                    <option value="active">Faqat aktiv</option>
                    <option value="inactive">Faqat nofaol</option>
                  </select>
                  <select className="input-clean" value={teacherSortBy} onChange={(e) => setTeacherSortBy(e.target.value)}>
                    <option value="name">Saralash: A-Z</option>
                    <option value="students">Saralash: O'quvchi soni</option>
                    <option value="tests">Saralash: Test soni</option>
                    <option value="solved">Saralash: Yechilganlar</option>
                  </select>
                </div>

                {filteredTeachers.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-primary">
                      <thead className="text-muted border-b border-primary uppercase text-[11px] tracking-widest font-bold">
                        <tr>
                          <th className="py-3 text-left">O'qituvchi</th>
                          <th className="py-3 text-left">Login / Parol</th>
                          <th className="py-3 text-left">Analitika</th>
                          <th className="py-3 text-left">Obuna</th>
                          <th className="py-3 text-center">Status</th>
                          <th className="py-3 text-center">Amallar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.map((item) => {
                          const { teacher, analytics, plan, usedForLimit, limitReached } = item;
                          return (
                            <tr key={teacher._id} className="border-b border-primary align-top">
                              <td className="py-4 pr-2 min-w-[170px]">
                                <p className="font-semibold">{teacher.fullName}</p>
                                <p className="text-xs text-muted mt-1">ID: {teacher._id}</p>
                              </td>

                              <td className="py-4 pr-2 min-w-[185px]">
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-blue-600">{teacher.username}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-muted">
                                      {showPasswords[teacher._id] ? teacher.password : "••••••••"}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowPasswords((prev) => ({
                                          ...prev,
                                          [teacher._id]: !prev[teacher._id],
                                        }))
                                      }
                                      className="text-muted"
                                    >
                                      {showPasswords[teacher._id] ? <EyeOff size={13} /> : <Eye size={13} />}
                                    </button>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 pr-2 min-w-[250px]">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                                    <span className="px-2 py-1 rounded-md bg-accent border border-primary">Guruh: {analytics.groupsCount}</span>
                                    <span className="px-2 py-1 rounded-md bg-accent border border-primary">O'quvchi: {analytics.studentsCount}</span>
                                    <span className="px-2 py-1 rounded-md bg-accent border border-primary">Joriy test: {analytics.testsCount}</span>
                                    <span className="px-2 py-1 rounded-md bg-accent border border-primary">Yuklangan: {usedForLimit}</span>
                                    <span className="px-2 py-1 rounded-md bg-accent border border-primary">Yechilgan: {analytics.totalSolved}</span>
                                  </div>
                                  {analytics.topSolvedTests?.length > 0 && (
                                    <div className="text-[11px] text-muted leading-relaxed">
                                      Top testlar: {analytics.topSolvedTests.map((test) => `${test.title} (${test.solvedCount})`).join(", ")}
                                    </div>
                                  )}
                                </div>
                              </td>

                              <td className="py-4 pr-2 min-w-[190px]">
                                <div className="space-y-2">
                                  <p className="text-sm font-semibold text-primary">{plan.label}</p>
                                  <p className={`text-[11px] font-semibold ${limitReached ? "text-red-600" : "text-secondary"}`}>
                                    Test: {formatLimit(plan.maxTests)} / {usedForLimit} | Yechish: {formatLimit(plan.maxSolved)} / {analytics.totalSolved}
                                  </p>
                                </div>
                              </td>

                              <td className="py-4 text-center min-w-[120px]">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(teacher)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                    teacher.isActive
                                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                                      : "bg-red-500/10 text-red-600 border-red-500/20"
                                  }`}
                                >
                                  {teacher.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                  {teacher.isActive ? "Aktiv" : "Nofaol"}
                                </button>
                              </td>

                              <td className="py-4 text-center min-w-[90px]">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(teacher._id)}
                                    className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 flex items-center justify-center"
                                    title="O'chirish"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-16 text-muted">Filtr bo'yicha o'qituvchi topilmadi</p>
                )}
              </div>
            </section>
          </section>
        )}

        {activeSection === "students" && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="premium-card space-y-5">
              <div>
                <h2 className="text-xl font-extrabold">O'quvchi boshqaruvi</h2>
                <p className="text-xs text-muted mt-1">Admin o'quvchi qo'shadi va test biriktiradi.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">O'qituvchi</label>
                <select
                  value={manageTeacherId}
                  onChange={(e) => setManageTeacherId(e.target.value)}
                  className="input-clean"
                >
                  {teachers.length ? (
                    teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.fullName}
                      </option>
                    ))
                  ) : (
                    <option value="">O'qituvchi yo'q</option>
                  )}
                </select>
                <p className={`text-[11px] font-semibold ${studentLimitReached ? "text-red-600" : "text-secondary"}`}>
                  Limit: {formatLimit(selectedTeacherPlan.maxStudents)} | Joriy o'quvchi: {managerStudents.length}
                </p>
              </div>

              <div className="border-t border-primary pt-4 space-y-3">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Yangi o'quvchi qo'shish</p>
                <form className="space-y-3" onSubmit={handleAdminAddStudent}>
                  <select
                    value={studentGroupId}
                    onChange={(e) => setStudentGroupId(e.target.value)}
                    className="input-clean"
                  >
                    <option value="">Guruhni tanlang</option>
                    {managerGroups.map((group) => (
                      <option key={group._id} value={group._id}>
                        {group.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="O'quvchi F.I.Sh"
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="input-clean"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        !manualCredentials
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-accent text-secondary border-primary"
                      }`}
                      onClick={() => setManualCredentials(false)}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        manualCredentials
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-accent text-secondary border-primary"
                      }`}
                      onClick={() => setManualCredentials(true)}
                    >
                      Manual
                    </button>
                  </div>

                  {manualCredentials ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Login"
                        value={studentForm.username}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, username: e.target.value }))}
                        className="input-clean"
                      />
                      <input
                        type="text"
                        placeholder="Parol"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="input-clean"
                      />
                    </div>
                  ) : (
                    <button type="button" onClick={handleGenerateCredentials} className="btn-secondary w-full">
                      Auto login/parol yaratish
                    </button>
                  )}

                  <button type="submit" className="btn-primary w-full" disabled={managerLoading || studentLimitReached}>
                    O'quvchi qo'shish
                  </button>
                </form>
              </div>

              <div className="border-t border-primary pt-4 space-y-3">
                <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">Test biriktirish</p>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="input-clean"
                >
                  <option value="">O'quvchini tanlang</option>
                  {managerStudents.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.fullName}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="input-clean"
                >
                  <option value="">Testni tanlang</option>
                  {managerTests.map((test) => (
                    <option key={test._id} value={test._id}>
                      {test.title}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={handleAssignTestToStudent} className="btn-primary w-full">
                  Testni biriktirish
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="premium-card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-extrabold">O'quvchilar va biriktirilgan testlar</h2>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => loadTeacherManagementData(manageTeacherId)}
                >
                  Yangilash
                </button>
              </div>

              {managerLoading ? (
                <p className="text-center py-12 text-muted">Yuklanmoqda...</p>
              ) : managerStudents.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-primary">
                    <thead className="text-muted border-b border-primary uppercase text-[11px] tracking-widest font-bold">
                      <tr>
                        <th className="py-3 text-left">O'quvchi</th>
                        <th className="py-3 text-left">Guruh</th>
                        <th className="py-3 text-left">Login / Parol</th>
                        <th className="py-3 text-left">Biriktirilgan testlar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {managerStudents.map((student) => {
                        const groupId =
                          typeof student.groupId === "object" ? student.groupId?._id : student.groupId;
                        const groupName =
                          typeof student.groupId === "object"
                            ? student.groupId?.name || "-"
                            : groupNameById[String(groupId)] || "-";
                        const assignedTests = getAssignedTestsByStudent(student._id);

                        return (
                          <tr key={student._id} className="border-b border-primary align-top">
                            <td className="py-4 pr-2 font-semibold min-w-[180px]">{student.fullName}</td>
                            <td className="py-4 pr-2 min-w-[120px]">{groupName}</td>
                            <td className="py-4 pr-2 min-w-[170px]">
                              <p className="text-xs text-blue-600 font-semibold">{student.username || "-"}</p>
                              <p className="text-xs font-mono text-muted">{student.password || "-"}</p>
                            </td>
                            <td className="py-4 pr-2 min-w-[280px]">
                              {assignedTests.length ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {assignedTests.map((testId) => (
                                    <button
                                      type="button"
                                      key={`${student._id}_${testId}`}
                                      onClick={() => handleUnassignTestFromStudent(student._id, testId)}
                                      className="px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-700 text-[11px]"
                                      title="Biriktirishni bekor qilish"
                                    >
                                      {testTitleById[String(testId)] || "Test"} ×
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted">Biriktirilmagan</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center py-16 text-muted">
                  Tanlangan o'qituvchida o'quvchi topilmadi
                </p>
              )}
            </div>
          </div>
        </section>
        )}

        {activeSection === "billing" && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="premium-card space-y-4">
              <h2 className="text-xl font-extrabold">Telegram Bot sozlamasi</h2>
              <p className="text-sm text-secondary">
                Yangi bot token va chat ID kiriting. Chek rasmlari shu botga tushadi.
              </p>
              <input
                type="text"
                className="input-clean"
                placeholder="Bot token"
                value={botConfig.botToken}
                onChange={(e) => setBotConfig((prev) => ({ ...prev, botToken: e.target.value }))}
              />
              <input
                type="text"
                className="input-clean"
                placeholder="Chat ID"
                value={botConfig.chatId}
                onChange={(e) => setBotConfig((prev) => ({ ...prev, chatId: e.target.value }))}
              />
              <button type="button" onClick={handleSaveBotConfig} className="btn-secondary w-full">
                Bot sozlamasini saqlash
              </button>

              <div className="pt-3 border-t border-primary" />
              <h2 className="text-xl font-extrabold">To'lov nazorati</h2>
              <p className="text-sm text-secondary">
                Admin so'rov yubormaydi. Bu bo'limda faqat kelgan to'lov so'rovlari kuzatiladi.
              </p>
              <div className="rounded-xl border border-primary bg-accent p-3 text-sm">
                <p>
                  Summa:{" "}
                  <span className="font-bold text-indigo-600">
                    {PAYMENT_CONFIG.schoolMonthlyAmount.toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}
                  </span>
                </p>
                <p className="mt-1">
                  Karta: <span className="font-bold">{PAYMENT_CONFIG.cardNumber}</span>
                </p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-secondary leading-relaxed">
                Foydalanuvchi to'lovni qilgandan keyin chekni botga yuboradi. So'rovlar pastdagi jadvalda paydo bo'ladi.
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="premium-card">
              {pendingPaymentRequests.length > 0 && (
                <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-amber-700">
                      Kutayotgan to'lovlar: {pendingPaymentRequests.length} ta
                    </p>
                    <button
                      type="button"
                      className="text-xs font-semibold text-amber-700 underline"
                      onClick={() => {
                        setShowPendingOnly(true);
                        setPaymentStatusFilter("pending");
                      }}
                    >
                      Faqat pendingni ko'rsatish
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {pendingPaymentRequests.slice(0, 5).map((request) => (
                      <div
                        key={`pending_${request.requestId}`}
                        className="rounded-lg border border-amber-500/20 bg-white/60 px-3 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                      >
                        <div className="text-xs">
                          <p className="font-semibold text-primary">{request.requestId}</p>
                          <p className="text-secondary">
                            {(request.fullName || request.email || "-")} | {request.userType}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="px-3 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-semibold"
                            onClick={() => handlePaymentDecision(request.requestId, "approved")}
                          >
                            Tasdiqlash
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded-md bg-red-500/10 text-red-600 text-xs font-semibold"
                            onClick={() => handlePaymentDecision(request.requestId, "rejected")}
                          >
                            Rad etish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <h2 className="text-xl font-extrabold">To'lov so'rovlari</h2>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={refreshBillingData}>
                    <RefreshCcw size={14} /> Yangilash
                  </button>
                  <button type="button" className="btn-secondary" onClick={handleExportPaymentsCsv}>
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 mb-4">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    className="input-clean pl-9"
                    placeholder="ID, ism, email yoki tarif bo'yicha qidirish"
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                  />
                </div>
                <select className="input-clean" value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
                  <option value="all">Barcha holat</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border inline-flex items-center justify-center gap-2 ${
                    showPendingOnly ? "bg-blue-600 text-white border-blue-600" : "bg-accent text-secondary border-primary"
                  }`}
                  onClick={() => setShowPendingOnly((prev) => !prev)}
                >
                  <SlidersHorizontal size={14} /> Pending only
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold"
                  onClick={() => handleBulkPaymentDecision("approved")}
                >
                  Pendinglarni biryo'la tasdiqlash
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-xs font-semibold"
                  onClick={() => handleBulkPaymentDecision("rejected")}
                >
                  Pendinglarni biryo'la rad etish
                </button>
              </div>

              {filteredPaymentRequests.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-primary">
                    <thead className="text-muted border-b border-primary uppercase text-[11px] tracking-widest font-bold">
                      <tr>
                        <th className="py-3 text-left">ID / Foydalanuvchi</th>
                        <th className="py-3 text-left">Reja / Summa</th>
                        <th className="py-3 text-left">Chek</th>
                        <th className="py-3 text-left">Bot</th>
                        <th className="py-3 text-left">Holat</th>
                        <th className="py-3 text-center">Amal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentRequests.map((request) => (
                        <tr key={request.requestId} className="border-b border-primary align-top">
                          <td className="py-4 pr-2 min-w-[190px]">
                            <p className="text-xs font-bold">{request.requestId}</p>
                            <p className="text-xs text-secondary">{request.fullName || request.email || "-"}</p>
                            <p className="text-[11px] text-muted uppercase">{request.userType}</p>
                          </td>
                          <td className="py-4 pr-2 min-w-[150px]">
                            <p className="text-xs font-semibold">{request.planId || "-"}</p>
                            <p className="text-xs text-indigo-600 font-bold">
                              {Number(request.amount || 0).toLocaleString("uz-UZ")} {PAYMENT_CONFIG.currency}
                            </p>
                          </td>
                          <td className="py-4 pr-2 min-w-[180px] text-xs text-secondary break-all">
                            {request.receiptFileName ? `Rasm: ${request.receiptFileName}` : request.receipt || "-"}
                          </td>
                          <td className="py-4 pr-2 min-w-[100px]">
                            <span
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                                request.botDelivered
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {request.botDelivered ? "Yuborilgan" : "Yo'q"}
                            </span>
                          </td>
                          <td className="py-4 pr-2 min-w-[120px]">
                            <span
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold ${
                                request.status === "approved"
                                  ? "bg-green-500/10 text-green-600"
                                  : request.status === "rejected"
                                    ? "bg-red-500/10 text-red-600"
                                    : "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="py-4 text-center min-w-[160px]">
                            {request.status === "pending" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-semibold"
                                  onClick={() => handlePaymentDecision(request.requestId, "approved")}
                                >
                                  Tasdiqlash
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-md bg-red-500/10 text-red-600 text-xs font-semibold"
                                  onClick={() => handlePaymentDecision(request.requestId, "rejected")}
                                >
                                  Rad etish
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted">Yakunlangan</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-10 text-center text-muted">Filtr bo'yicha to'lov so'rovi topilmadi</p>
              )}
            </div>
          </div>
        </section>
        )}

        {(activeSection === "catalog" || activeSection === "access") && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeSection === "catalog" && (
          <div className="lg:col-span-3">
            <div className="premium-card">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-xl font-extrabold">Shaxsiy kabinet test bazasi</h2>
                  <p className="text-sm text-secondary mt-1">
                    Admin yo'nalish tanlaydi va testni o'quvchi shaxsiy kabinetiga chiqaradi.
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={refreshCatalogData}>
                  Yangilash
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={catalogTeacherId}
                  onChange={(e) => setCatalogTeacherId(e.target.value)}
                  className="input-clean"
                >
                  <option value="">O'qituvchi</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
                <select
                  value={catalogTestId}
                  onChange={(e) => setCatalogTestId(e.target.value)}
                  className="input-clean md:col-span-2"
                >
                  <option value="">{catalogLoading ? "Testlar yuklanmoqda..." : "Testni tanlang"}</option>
                  {catalogTeacherTests.map((test) => (
                    <option key={test._id} value={test._id}>
                      {test.title}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  list="catalog-directions"
                  className="input-clean"
                  placeholder="Yo'nalish (masalan Matematika)"
                  value={catalogDirection}
                  onChange={(e) => setCatalogDirection(e.target.value)}
                />
              </div>
              <datalist id="catalog-directions">
                {DEFAULT_STUDENT_DIRECTIONS.map((direction) => (
                  <option key={direction} value={direction} />
                ))}
              </datalist>

              <div className="mt-3">
                <button type="button" className="btn-primary" onClick={handleAddCatalogTest}>
                  Testni bazaga qo'shish
                </button>
              </div>

              <div className="mt-5">
                {catalogEntries.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-primary">
                      <thead className="text-muted border-b border-primary uppercase text-[11px] tracking-widest font-bold">
                        <tr>
                          <th className="py-3 text-left">Yo'nalish / Test</th>
                          <th className="py-3 text-left">O'qituvchi</th>
                          <th className="py-3 text-left">Test holati</th>
                          <th className="py-3 text-center">Amallar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalogEntries.map((entry) => (
                          <tr key={entry.catalogId} className="border-b border-primary align-top">
                            <td className="py-3 pr-2 min-w-[220px]">
                              <p className="text-xs font-bold text-blue-600 uppercase">{entry.direction}</p>
                              <p className="font-semibold">{entry.title}</p>
                              <p className="text-[11px] text-muted">{entry.testLogin || "-"}</p>
                            </td>
                            <td className="py-3 pr-2 min-w-[150px] text-sm">{entry.teacherName || "-"}</td>
                            <td className="py-3 pr-2 min-w-[160px]">
                              <div className="flex flex-col gap-1.5">
                                <span
                                  className={`px-2 py-1 rounded-md text-[11px] font-semibold w-fit ${
                                    entry.active
                                      ? "bg-green-500/10 text-green-600"
                                      : "bg-red-500/10 text-red-600"
                                  }`}
                                >
                                  {entry.active ? "Kabinetda faol" : "Kabinetda yopiq"}
                                </span>
                                <span className="text-[11px] text-muted">
                                  Test jarayoni: {entry.isStarted ? "Start berilgan" : "Start berilmagan"}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-center min-w-[190px]">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-600 text-xs font-semibold"
                                  onClick={() => handleToggleCatalogStatus(entry.catalogId, !entry.active)}
                                >
                                  {entry.active ? "Yopish" : "Faollashtirish"}
                                </button>
                                <button
                                  type="button"
                                  className="w-8 h-8 rounded-lg border border-red-200 bg-red-50 text-red-600 flex items-center justify-center"
                                  onClick={() => handleRemoveCatalogTest(entry.catalogId)}
                                  title="Bazadan o'chirish"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted">
                    Shaxsiy kabinet bazasiga hali test biriktirilmagan
                  </p>
                )}
              </div>
            </div>
          </div>
          )}

          {activeSection === "access" && (
          <div className="lg:col-span-3 space-y-6">
            <div className="premium-card space-y-3">
              <h2 className="text-xl font-extrabold">Qo'lda obuna ulash</h2>
              <p className="text-xs text-secondary">
                Admin xohlagan o'qituvchi yoki o'quvchiga to'g'ridan-to'g'ri obuna ulaydi.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`py-2 rounded-lg text-xs font-semibold border ${
                    manualGrantType === "student"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-accent text-secondary border-primary"
                  }`}
                  onClick={() => setManualGrantType("student")}
                >
                  O'quvchi
                </button>
                <button
                  type="button"
                  className={`py-2 rounded-lg text-xs font-semibold border ${
                    manualGrantType === "teacher"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-accent text-secondary border-primary"
                  }`}
                  onClick={() => setManualGrantType("teacher")}
                >
                  O'qituvchi
                </button>
              </div>

              {manualGrantType === "teacher" ? (
                <select
                  value={manualTeacherTargetId}
                  onChange={(e) => setManualTeacherTargetId(e.target.value)}
                  className="input-clean"
                >
                  <option value="">O'qituvchi tanlang</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-secondary">
                    O'quvchi ro'yxati hozir tanlangan o'qituvchi bo'yicha chiqadi.
                  </p>
                  <select
                    value={manualStudentTargetId}
                    onChange={(e) => setManualStudentTargetId(e.target.value)}
                    className="input-clean"
                  >
                    <option value="">O'quvchi tanlang</option>
                    {managerStudents.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-xl border border-primary bg-accent p-3 text-xs">
                <p className="font-semibold text-primary">
                  Tanlangan:{" "}
                  <span className="text-blue-600">
                    {manualGrantType === "teacher"
                      ? selectedManualTeacher?.fullName || "-"
                      : selectedManualStudent?.fullName || "-"}
                  </span>
                </p>
                <p className="text-secondary mt-1">
                  Holat:{" "}
                  <span className={currentManualSubscriptionActive ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                    {currentManualSubscriptionActive ? "Faol obuna" : "Faol emas"}
                  </span>
                </p>
                <p className="text-secondary mt-1">
                  Tugash:{" "}
                  {currentManualSubscription?.expiresAt
                    ? new Date(currentManualSubscription.expiresAt).toLocaleString("uz-UZ")
                    : "-"}
                </p>
              </div>

              <button type="button" className="btn-primary w-full" onClick={handleGrantSubscription}>
                30 kunlik obuna ulash
              </button>
            </div>

            <div className="premium-card">
              <h2 className="text-xl font-extrabold mb-4">Rol bo'yicha tushum</h2>
              <div className="space-y-2 text-sm">
                {[
                  ["O'qituvchi", billingSummary.byUserType.teacher],
                  ["O'quvchi", billingSummary.byUserType.student],
                  ["Maktab", billingSummary.byUserType.school],
                ].map(([label, item]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-primary bg-primary px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <span className="font-semibold">{label}</span>
                    <span className="text-xs text-indigo-600 font-bold">
                      {formatMoney(item.approvedAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="premium-card">
              <h2 className="text-xl font-extrabold mb-4">Faollik monitori</h2>
              {recentActivity.length ? (
                <div className="space-y-2">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="rounded-lg border border-primary bg-accent px-3 py-2">
                      <p className="text-xs font-bold text-primary">{activity.title}</p>
                      <p className="text-xs text-secondary mt-0.5">{activity.subtitle}</p>
                      <p className="text-[11px] text-muted mt-1">
                        {activity.time ? new Date(activity.time).toLocaleString("uz-UZ") : "-"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Faollik yozuvlari hali yo'q.</p>
              )}
            </div>
          </div>
          )}
        </section>
        )}

        {activeSection === "access" && (
        <section className="space-y-6">
          <div className="premium-card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-xl font-extrabold">Google foydalanuvchilar</h2>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={refreshBillingData}>
                  <RefreshCcw size={14} /> Yangilash
                </button>
                <button type="button" className="btn-secondary" onClick={handleExportOauthCsv}>
                  <Download size={14} /> CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 mb-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  className="input-clean pl-9"
                  placeholder="Ism yoki email bo'yicha qidirish"
                  value={oauthSearch}
                  onChange={(e) => setOauthSearch(e.target.value)}
                />
              </div>
              <select className="input-clean" value={oauthRoleFilter} onChange={(e) => setOauthRoleFilter(e.target.value)}>
                <option value="all">Barcha rollar</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {filteredOauthUsers.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-primary">
                  <thead className="text-muted border-b border-primary uppercase text-[11px] tracking-widest font-bold">
                    <tr>
                      <th className="py-3 text-left">Ism</th>
                      <th className="py-3 text-left">Email</th>
                      <th className="py-3 text-left">Rol</th>
                      <th className="py-3 text-left">Test soni</th>
                      <th className="py-3 text-left">Qachon</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOauthUsers.map((user, idx) => (
                      <tr key={`${user.email}_${idx}`} className="border-b border-primary">
                        <td className="py-3 pr-2">{user.fullName || "-"}</td>
                        <td className="py-3 pr-2 text-blue-600">{user.email}</td>
                        <td className="py-3 pr-2 uppercase text-xs">{user.role}</td>
                        <td className="py-3 pr-2 text-xs">
                          {(() => {
                            if (user.role !== "teacher") return "-";
                            const matchedTeacher = teachers.find(
                              (teacher) => String(teacher.username || "").toLowerCase() === String(user.email || "").toLowerCase()
                            );
                            if (!matchedTeacher) return "0";
                            return String(teacherAnalytics[matchedTeacher._id]?.testsCount || 0);
                          })()}
                        </td>
                        <td className="py-3 pr-2 text-xs text-secondary">
                          {user.createdAt ? new Date(user.createdAt).toLocaleString("uz-UZ") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-muted">Filtr bo'yicha foydalanuvchi topilmadi</p>
            )}
          </div>

          <div className="premium-card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
              <h2 className="text-xl font-extrabold">Shaxsiy kabinet o'quvchilari</h2>
              <p className="text-xs text-secondary">
                Obunaga qarab katalog testlarini biriktirish mumkin.
              </p>
            </div>

            <div className="grid lg:grid-cols-[1fr_1fr] gap-4">
              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">O'quvchi tanlash</label>
                <select
                  className="input-clean"
                  value={selectedPersonalStudentId}
                  onChange={(e) => setSelectedPersonalStudentId(e.target.value)}
                >
                  <option value="">O'quvchi tanlang</option>
                  {personalCabinetStudents.map((student) => (
                    <option key={student.userId} value={student.userId}>
                      {student.fullName} ({student.email})
                    </option>
                  ))}
                </select>

                <div className="rounded-xl border border-primary bg-accent p-3 text-xs text-secondary">
                  {selectedPersonalStudentId ? (
                    <>
                      <p>
                        Yechilgan testlar:{" "}
                        <span className="font-bold text-primary">
                          {personalStatsLoading ? "..." : personalStudentStats[selectedPersonalStudentId] || 0}
                        </span>
                      </p>
                      <p className="mt-1">
                        Bepul limit:{" "}
                        <span className="font-bold text-primary">
                          {Math.max(10 - Number(personalStudentStats[selectedPersonalStudentId] || 0), 0)} ta qolgan
                        </span>
                      </p>
                      <p className="mt-1">
                        Obuna:{" "}
                        <span className={isSubscriptionActive("student", selectedPersonalStudentId) ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                          {isSubscriptionActive("student", selectedPersonalStudentId) ? "Faol" : "Faol emas"}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p>O'quvchi tanlang.</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-muted uppercase tracking-wider">Biriktiriladigan katalog testlar</label>
                <div className="max-h-60 overflow-auto custom-scrollbar rounded-xl border border-primary p-2 bg-accent/40 space-y-1.5">
                  {catalogEntries.length ? (
                    catalogEntries.map((entry) => (
                      <label key={entry.catalogId} className="flex items-start gap-2 rounded-lg bg-secondary px-2 py-1.5 border border-primary">
                        <input
                          type="checkbox"
                          checked={selectedAssignedCatalogIds.includes(entry.catalogId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAssignedCatalogIds((prev) => Array.from(new Set([...prev, entry.catalogId])));
                            } else {
                              setSelectedAssignedCatalogIds((prev) => prev.filter((id) => id !== entry.catalogId));
                            }
                          }}
                        />
                        <span className="text-xs">
                          <span className="font-semibold text-primary">{entry.title}</span>
                          <span className="block text-muted">{entry.direction}</span>
                        </span>
                      </label>
                    ))
                  ) : (
                    <p className="text-xs text-muted p-2">Katalog testlari yo'q.</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-secondary" onClick={handleAutoSeedFreeCatalog}>
                    Bepul 10 testni avtomatik tayyorlash
                  </button>
                  <button type="button" className="btn-primary" onClick={handleSavePersonalAssignments}>
                    Biriktirishni saqlash
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm text-primary">
                <thead className="text-muted border-b border-primary uppercase text-[11px] tracking-widest font-bold">
                  <tr>
                    <th className="py-3 text-left">Ism</th>
                    <th className="py-3 text-left">Email</th>
                    <th className="py-3 text-left">Yechilgan</th>
                    <th className="py-3 text-left">Obuna</th>
                    <th className="py-3 text-left">Biriktirilgan katalog</th>
                  </tr>
                </thead>
                <tbody>
                  {personalCabinetStudents.map((student) => {
                    const assignedCount = getAssignedCatalogIds(student.userId).length;
                    return (
                      <tr key={student.userId} className="border-b border-primary">
                        <td className="py-2.5 pr-2">{student.fullName}</td>
                        <td className="py-2.5 pr-2 text-blue-600">{student.email}</td>
                        <td className="py-2.5 pr-2">{personalStatsLoading ? "..." : personalStudentStats[student.userId] || 0}</td>
                        <td className="py-2.5 pr-2">
                          <span className={isSubscriptionActive("student", student.userId) ? "text-green-600 font-semibold" : "text-amber-600 font-semibold"}>
                            {isSubscriptionActive("student", student.userId) ? "Faol" : "Faol emas"}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2">{assignedCount || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid xl:grid-cols-2 gap-6">
            <div className="premium-card">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-xl font-extrabold">Qurilma blokirovkasi</h2>
                <button type="button" className="btn-secondary" onClick={() => setDeviceLocks(getDeviceLocksReport())}>
                  <RefreshCcw size={14} /> Yangilash
                </button>
              </div>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  className="input-clean pl-9"
                  placeholder="role / principal / fingerprint qidirish"
                  value={deviceLockSearch}
                  onChange={(e) => setDeviceLockSearch(e.target.value)}
                />
              </div>
              <div className="max-h-72 overflow-auto custom-scrollbar space-y-2 pr-1">
                {filteredDeviceLocks.length ? (
                  filteredDeviceLocks.map((lock, index) => (
                    <div key={`${lock.fingerprint}_${lock.role}_${index}`} className="rounded-lg border border-primary bg-accent px-3 py-2">
                      <p className="text-xs font-semibold uppercase">{lock.role}</p>
                      <p className="text-xs text-secondary mt-1 break-all">{lock.principal}</p>
                      <p className="text-[11px] text-muted mt-1 break-all">{lock.fingerprint}</p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-red-600"
                        onClick={() => handleUnlockDevice(lock.role, lock.principal)}
                      >
                        Blokni yechish
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">Qurilma bloklari topilmadi.</p>
                )}
              </div>
            </div>

            <div className="premium-card">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-xl font-extrabold">Faoliyat jurnali</h2>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={refreshActivityData}>
                    <RefreshCcw size={14} /> Yangilash
                  </button>
                  <button type="button" className="btn-secondary" onClick={handleExportActivityCsv}>
                    <Download size={14} /> CSV
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    className="input-clean pl-9"
                    placeholder="action, actor, target qidirish"
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input-clean" value={activityAreaFilter} onChange={(e) => setActivityAreaFilter(e.target.value)}>
                    <option value="all">Area: barchasi</option>
                    <option value="api">API</option>
                    <option value="billing">Billing</option>
                    <option value="security">Security</option>
                    <option value="auth">Auth</option>
                  </select>
                  <select className="input-clean" value={activityRoleFilter} onChange={(e) => setActivityRoleFilter(e.target.value)}>
                    <option value="all">Role: barchasi</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-secondary mb-3">
                <p>Jami: <span className="font-semibold text-primary">{activityStats.total}</span></p>
                <button type="button" className="text-red-600 font-semibold" onClick={handleClearActivities}>
                  Jurnalni tozalash
                </button>
              </div>

              <div className="max-h-72 overflow-auto custom-scrollbar space-y-2 pr-1">
                {filteredActivityLogs.length ? (
                  filteredActivityLogs.slice(0, 120).map((log) => (
                    <div key={log.id} className="rounded-lg border border-primary bg-accent px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-primary">{log.action}</p>
                        <span className={`text-[11px] font-semibold ${log.status === "failed" ? "text-red-600" : "text-green-600"}`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-secondary mt-0.5">
                        {log.actorRole} | {log.actorName} | {log.area}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("uz-UZ") : "-"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">Filtr bo'yicha activity topilmadi.</p>
                )}
              </div>
            </div>
          </div>
        </section>
        )}
      </div>

    </DashboardLayout>
  );
}
