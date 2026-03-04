const BACKUP_KEYS = [
  "billing_payment_requests_v1",
  "billing_user_subscriptions_v1",
  "billing_student_test_packs_v1",
  "billing_oauth_users_v1",
  "billing_device_locks_v1",
  "billing_telegram_config_v1",
  "teacher_subscription_limits_v1",
  "teacher_test_usage_v1",
  "teacher_solved_usage_v1",
  "admin_student_test_assignments_v1",
  "student_personal_catalog_v1",
  "student_personal_assignments_v1",
  "student_personal_auth_v1",
  "secure_owner_admin_v1",
  "secure_sub_admin_accounts_v1",
  "teacher_question_bank_v1",
  "teacher_test_sale_requests_v1",
  "admin_teacher_market_tests_v1",
  "teacher_bonus_balances_v1",
  "activity_logs_v1",
  "marketing_promo_usage_v1",
  "platform_notifications_v1",
];

const parseStored = (raw) => {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
};

export const buildSystemBackupPayload = () => {
  const storage = {};
  BACKUP_KEYS.forEach((key) => {
    const raw = localStorage.getItem(key);
    if (raw == null) return;
    storage[key] = parseStored(raw);
  });

  return {
    version: 1,
    product: "OsonTestOl",
    domain: "testonlinee.uz",
    exportedAt: new Date().toISOString(),
    keys: BACKUP_KEYS,
    storage,
  };
};

export const downloadBackupFile = (payload, filename = "osontestol-backup.json") => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const importSystemBackupPayload = (payload, mode = "replace") => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Backup formati noto'g'ri");
  }

  const storage = payload.storage;
  if (!storage || typeof storage !== "object") {
    throw new Error("Backup ichida storage topilmadi");
  }

  if (mode === "replace") {
    BACKUP_KEYS.forEach((key) => localStorage.removeItem(key));
  }

  let imported = 0;
  Object.entries(storage).forEach(([key, value]) => {
    if (!BACKUP_KEYS.includes(key)) return;
    localStorage.setItem(key, JSON.stringify(value));
    imported += 1;
  });

  return imported;
};

export const getSystemHealthSnapshot = ({
  teachers = [],
  paymentRequests = [],
  activityLogs = [],
  catalogEntries = [],
  deviceLocks = [],
} = {}) => {
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;

  const inactiveTeachers = (Array.isArray(teachers) ? teachers : []).filter((item) => !item?.isActive).length;
  const pendingPayments = (Array.isArray(paymentRequests) ? paymentRequests : []).filter(
    (row) => String(row?.status || "").toLowerCase() === "pending"
  ).length;
  const failedToday = (Array.isArray(activityLogs) ? activityLogs : []).filter((row) => {
    const createdAt = new Date(row?.createdAt || 0).getTime();
    if (!Number.isFinite(createdAt) || createdAt < dayAgo) return false;
    return String(row?.status || "").toLowerCase() === "failed";
  }).length;

  const warnings = [];
  if (pendingPayments > 12) warnings.push("Pending to'lovlar ko'p: admin tasdiqlashi kechikmoqda.");
  if (failedToday > 35) warnings.push("So'nggi 24 soatda xatoliklar oshgan.");
  if (!Array.isArray(catalogEntries) || catalogEntries.length === 0) {
    warnings.push("Shaxsiy kabinet katalogi bo'sh.");
  }
  if (!Array.isArray(deviceLocks) || deviceLocks.length === 0) {
    warnings.push("Qurilma nazorati bo'yicha lock yozuvlari yo'q.");
  }

  const score = pendingPayments + failedToday + inactiveTeachers;
  const status = score >= 55 ? "critical" : score >= 25 ? "warning" : "stable";

  return {
    status,
    score,
    pendingPayments,
    failedToday,
    inactiveTeachers,
    catalogCount: Array.isArray(catalogEntries) ? catalogEntries.length : 0,
    deviceLocks: Array.isArray(deviceLocks) ? deviceLocks.length : 0,
    warnings,
    checkedAt: new Date().toISOString(),
  };
};
