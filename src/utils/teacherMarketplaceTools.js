import { logUserActivity } from "./activityLog";
import { pushNotification } from "./notificationTools";

const SALE_REQUESTS_KEY = "teacher_test_sale_requests_v1";
const MARKET_TESTS_KEY = "admin_teacher_market_tests_v1";
const BONUS_BALANCES_KEY = "teacher_bonus_balances_v1";

export const TEACHER_TEST_SALE_BONUS = 1000;

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readArray = (key) => {
  const parsed = safeParse(localStorage.getItem(key) || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
};

const readObject = (key) => {
  const parsed = safeParse(localStorage.getItem(key) || "{}", {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const writeObject = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value || {}));
};

const buildRequestId = () =>
  `SALE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const getTeacherTestSaleRequests = () => {
  return readArray(SALE_REQUESTS_KEY).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
  );
};

export const getTeacherSaleRequestsByTeacher = (teacherId) => {
  const id = String(teacherId || "").trim();
  if (!id) return [];
  return getTeacherTestSaleRequests().filter((row) => String(row.teacherId || "") === id);
};

export const hasPendingSaleRequest = (teacherId, testId) => {
  const tid = String(teacherId || "").trim();
  const targetTestId = String(testId || "").trim();
  if (!tid || !targetTestId) return false;
  return getTeacherTestSaleRequests().some(
    (row) =>
      String(row.teacherId || "") === tid &&
      String(row.testId || "") === targetTestId &&
      String(row.status || "").toLowerCase() === "pending"
  );
};

export const createTeacherTestSaleRequest = ({
  teacherId,
  teacherName = "",
  test = {},
} = {}) => {
  const tid = String(teacherId || "").trim();
  const testId = String(test?._id || "").trim();
  if (!tid || !testId) {
    throw new Error("Teacher yoki test ma'lumoti to'liq emas");
  }

  if (hasPendingSaleRequest(tid, testId)) {
    throw new Error("Bu test bo'yicha pending so'rov allaqachon yuborilgan");
  }

  const requestId = buildRequestId();
  const nextRow = {
    requestId,
    teacherId: tid,
    teacherName: String(teacherName || "").trim() || "Teacher",
    testId,
    testTitle: String(test?.title || "Nomsiz test").trim(),
    testDescription: String(test?.description || "").trim(),
    duration: Number(test?.duration || 0),
    accessType: String(test?.accessType || "public"),
    questionCount: Array.isArray(test?.questions) ? test.questions.length : Number(test?.questionCount || 0),
    status: "pending",
    bonusAmount: TEACHER_TEST_SALE_BONUS,
    adminNote: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const current = getTeacherTestSaleRequests();
  writeArray(SALE_REQUESTS_KEY, [nextRow, ...current]);
  logUserActivity({
    action: "teacher_test_sale_request_created",
    area: "market",
    status: "success",
    message: "Teacher test sotuv so'rovi yubordi",
    targetRole: "teacher",
    targetId: tid,
    meta: {
      requestId,
      testId,
      bonusAmount: TEACHER_TEST_SALE_BONUS,
    },
  });
  pushNotification({
    title: "Yangi test sotuv so'rovi",
    message: `${nextRow.teacherName} test sotuvga yubordi (${requestId})`,
    level: "info",
    targetRole: "admin",
    link: "/admin/market",
    meta: {
      requestId,
      testId,
      teacherId: tid,
    },
  });
  return requestId;
};

const creditTeacherBonus = (teacherId, amount) => {
  const tid = String(teacherId || "").trim();
  if (!tid) return 0;
  const bonusMap = readObject(BONUS_BALANCES_KEY);
  const current = Number(bonusMap[tid] || 0);
  const next = current + Number(amount || 0);
  bonusMap[tid] = next;
  writeObject(BONUS_BALANCES_KEY, bonusMap);
  return next;
};

export const getTeacherBonusMap = () => readObject(BONUS_BALANCES_KEY);

export const getTeacherBonusBalance = (teacherId) => {
  const tid = String(teacherId || "").trim();
  if (!tid) return 0;
  const bonusMap = getTeacherBonusMap();
  return Number(bonusMap[tid] || 0);
};

export const getTeacherMarketTests = () => {
  return readArray(MARKET_TESTS_KEY).sort(
    (a, b) => new Date(b.approvedAt || b.createdAt || 0).getTime() - new Date(a.approvedAt || a.createdAt || 0).getTime()
  );
};

const upsertApprovedMarketTest = (request) => {
  const current = getTeacherMarketTests();
  const key = `${String(request.teacherId || "")}::${String(request.testId || "")}`;
  const row = {
    marketId: `MKT-${Date.now().toString(36).toUpperCase()}`,
    sourceKey: key,
    teacherId: request.teacherId,
    teacherName: request.teacherName,
    testId: request.testId,
    title: request.testTitle,
    description: request.testDescription,
    duration: request.duration,
    questionCount: request.questionCount,
    bonusAmount: Number(request.bonusAmount || TEACHER_TEST_SALE_BONUS),
    approvedAt: new Date().toISOString(),
    createdAt: request.createdAt || new Date().toISOString(),
  };

  const withoutSame = current.filter((item) => String(item.sourceKey || "") !== key);
  writeArray(MARKET_TESTS_KEY, [row, ...withoutSame]);
  return row;
};

export const decideTeacherSaleRequest = (requestId, status, adminNote = "") => {
  const allowed = new Set(["approved", "rejected", "pending"]);
  const nextStatus = allowed.has(String(status || "").toLowerCase())
    ? String(status || "").toLowerCase()
    : "pending";

  const current = getTeacherTestSaleRequests();
  let target = null;
  const next = current.map((row) => {
    if (String(row.requestId || "") !== String(requestId || "")) return row;
    target = row;
    return {
      ...row,
      status: nextStatus,
      adminNote: String(adminNote || ""),
      updatedAt: new Date().toISOString(),
      processedBy: String(localStorage.getItem("adminPrincipalLogin") || "admin"),
    };
  });
  if (!target) return null;

  writeArray(SALE_REQUESTS_KEY, next);
  const updated = next.find((row) => String(row.requestId || "") === String(requestId || ""));

  if (nextStatus === "approved") {
    upsertApprovedMarketTest(updated);
    creditTeacherBonus(updated.teacherId, Number(updated.bonusAmount || TEACHER_TEST_SALE_BONUS));
  }

  logUserActivity({
    action: "teacher_test_sale_request_updated",
    area: "market",
    status: "success",
    message: `Test sotuv so'rovi ${nextStatus} holatiga o'tdi`,
    targetRole: "teacher",
    targetId: String(updated.teacherId || ""),
    meta: {
      requestId: updated.requestId,
      status: nextStatus,
      bonusAmount: Number(updated.bonusAmount || 0),
    },
  });
  pushNotification({
    title: "Test sotuv holati yangilandi",
    message: `${updated.testTitle} so'rovi: ${nextStatus}`,
    level: nextStatus === "approved" ? "success" : nextStatus === "rejected" ? "warning" : "info",
    targetRole: "teacher",
    targetId: String(updated.teacherId || ""),
    link: "/teacher/tests",
    meta: {
      requestId: updated.requestId,
      status: nextStatus,
    },
  });
  return updated;
};

