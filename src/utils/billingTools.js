import { logUserActivity } from "./activityLog";
import { pushNotification } from "./notificationTools";
import { resolvePaymentPricing, trackMarketingUsage } from "./marketingTools";

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");
const FALLBACK_BASE_URL = "https://online-test-backend-2.onrender.com";
const BILLING_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || FALLBACK_BASE_URL;
const BILLING_API_URL = `${BILLING_BASE_URL}/api`;

const PAYMENT_REQUESTS_KEY = "billing_payment_requests_v1";
const USER_SUBSCRIPTIONS_KEY = "billing_user_subscriptions_v1";
const STUDENT_TEST_PACKS_KEY = "billing_student_test_packs_v1";
const OAUTH_USERS_KEY = "billing_oauth_users_v1";
const DEVICE_LOCKS_KEY = "billing_device_locks_v1";
const SUPPORTED_DEVICE_ROLES = new Set(["admin", "teacher", "student"]);
const TELEGRAM_CONFIG_KEY = "billing_telegram_config_v1";
const TELEGRAM_SYNC_KEY = "billing_telegram_sync_v1";

export const PAYMENT_CONFIG = {
  cardNumber: "5614 6819 0341 1746",
  teacherMonthlyAmount: 49000,
  schoolMonthlyAmount: 1499000,
  studentMonthlyAmount: 39000,
  studentPack20Amount: 29000,
  studentPack50Amount: 59000,
  currency: "so'm",
  domain: "testonlinee.uz",
  supportTelegram: "@Dostonbek_Solijonov",
  supportInstagram: "@soliyev_web",
  supportPhone: "+998 91 660 56 06",
  telegramBotToken: "8542512239:AAGU79I8KkdinR1V7xIAi2jmd-12-TEkUVg",
  telegramChatId: "8389397224",
};

const normalizePaymentStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "paid" || normalized === "success") return "approved";
  if (normalized === "rejected" || normalized === "failed" || normalized === "cancelled" || normalized === "canceled")
    return "rejected";
  if (normalized === "pending" || normalized === "waiting") return "pending";
  return "";
};

const buildTelegramPaymentMessageText = ({
  requestId,
  userId,
  fullName,
  email,
  userType,
  amount,
  receipt,
  planId = "",
  promoCode = "",
  referralCode = "",
  discountPercent = 0,
  discountAmount = 0,
  baseAmount = 0,
  status = "pending",
  adminNote = "",
  createdAt = null,
} = {}) => {
  const statusLine = String(status || "pending").toUpperCase();
  const noteLine = adminNote ? `📝 Admin izoh: ${adminNote}\n` : "";
  const timestamp = createdAt ? new Date(createdAt).toLocaleString("uz-UZ") : new Date().toLocaleString("uz-UZ");

  return (
    `💳 Obuna to'lov so'rovi\n\n` +
    `🆔 ID: ${requestId}\n` +
    `🔑 User ID: ${userId || "-"}\n` +
    `👤 Ism: ${fullName || "-"}\n` +
    `📧 Email/Login: ${email || "-"}\n` +
    `🧩 Rol: ${userType}\n` +
    `🗂 Tarif: ${planId || "-"}\n` +
    `🏷 Promo: ${promoCode || "-"}\n` +
    `🔗 Referral: ${referralCode || "-"}\n` +
    `📉 Chegirma: ${Number(discountPercent || 0)}% (${Number(discountAmount || 0).toLocaleString("uz-UZ")} ${
      PAYMENT_CONFIG.currency
    })\n` +
    `💵 Asl summa: ${Number(baseAmount || amount || 0).toLocaleString("uz-UZ")} ${PAYMENT_CONFIG.currency}\n` +
    `💰 Summa: ${Number(amount || 0).toLocaleString("uz-UZ")} ${PAYMENT_CONFIG.currency}\n` +
    `🧾 Izoh: ${receipt || "-"}\n` +
    `📌 Holat: ${statusLine}\n` +
    noteLine +
    `🕒 ${timestamp}`
  );
};

const safeJsonParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readObject = (key) => {
  const raw = localStorage.getItem(key);
  const parsed = safeJsonParse(raw || "{}", {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const writeObject = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value || {}));
};

const readArray = (key) => {
  const raw = localStorage.getItem(key);
  const parsed = safeJsonParse(raw || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
};

const toKey = (userType, userId) => `${String(userType || "").trim()}::${String(userId || "").trim()}`;

const generateCandidate = () =>
  `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const generateUniquePaymentId = () => {
  const requests = readArray(PAYMENT_REQUESTS_KEY);
  const used = new Set(requests.map((request) => request?.requestId).filter(Boolean));

  let candidate = generateCandidate();
  while (used.has(candidate)) {
    candidate = generateCandidate();
  }
  return candidate;
};

export const getAllPaymentRequests = () => readArray(PAYMENT_REQUESTS_KEY);

const toAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

const emptyRoleSummary = () => ({
  count: 0,
  approvedAmount: 0,
  pendingAmount: 0,
  rejectedAmount: 0,
});

export const getBillingSummary = (requestsInput = null) => {
  const requests = Array.isArray(requestsInput) ? requestsInput : getAllPaymentRequests();
  const summary = {
    totalRequests: requests.length,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
    byUserType: {
      teacher: emptyRoleSummary(),
      student: emptyRoleSummary(),
      school: emptyRoleSummary(),
      other: emptyRoleSummary(),
    },
  };

  requests.forEach((request) => {
    const status = String(request?.status || "pending").toLowerCase();
    const userType = String(request?.userType || "other").toLowerCase();
    const roleKey = summary.byUserType[userType] ? userType : "other";
    const amount = toAmount(request?.amount);

    summary.byUserType[roleKey].count += 1;
    if (status === "approved") {
      summary.approvedCount += 1;
      summary.approvedAmount += amount;
      summary.byUserType[roleKey].approvedAmount += amount;
      return;
    }
    if (status === "rejected") {
      summary.rejectedCount += 1;
      summary.rejectedAmount += amount;
      summary.byUserType[roleKey].rejectedAmount += amount;
      return;
    }

    summary.pendingCount += 1;
    summary.pendingAmount += amount;
    summary.byUserType[roleKey].pendingAmount += amount;
  });

  return summary;
};

export const createPaymentRequest = ({
  userType,
  userId,
  planId,
  amount,
  baseAmount = 0,
  discountAmount = 0,
  discountPercent = 0,
  promoCode = "",
  referralCode = "",
  fullName = "",
  email = "",
  receipt = "",
  receiptFileName = "",
  requestId = "",
  botDelivered = false,
  botMessageId = null,
  botPhotoMessageId = null,
}) => {
  const finalRequestId = requestId || generateUniquePaymentId();
  const next = [
    {
      requestId: finalRequestId,
      userType,
      userId,
      planId,
      amount,
      baseAmount,
      discountAmount,
      discountPercent,
      promoCode,
      referralCode,
      fullName,
      email,
      receipt,
      receiptFileName,
      botDelivered,
      botMessageId,
      botPhotoMessageId,
      channel: botDelivered ? "telegram_bot" : "manual",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    ...getAllPaymentRequests(),
  ];
  writeArray(PAYMENT_REQUESTS_KEY, next);
  logUserActivity({
    action: "payment_request_created",
    area: "billing",
    status: "success",
    message: `${userType} uchun to'lov so'rovi yaratildi`,
    targetRole: userType,
    targetId: String(userId || ""),
    meta: {
      requestId: finalRequestId,
      amount: Number(amount || 0),
      planId: String(planId || ""),
      baseAmount: Number(baseAmount || 0),
      discountAmount: Number(discountAmount || 0),
      discountPercent: Number(discountPercent || 0),
      promoCode: String(promoCode || ""),
      referralCode: String(referralCode || ""),
    },
  });
  trackMarketingUsage({
    requestId: finalRequestId,
    userType,
    userId,
    planId,
    promoCode,
    referralCode,
    discountPercent,
    discountAmount,
  });
  pushNotification({
    title: "Yangi to'lov so'rovi",
    message: `${userType} foydalanuvchidan yangi so'rov keldi (${finalRequestId})`,
    level: "info",
    targetRole: "admin",
    link: "/admin/billing",
    meta: {
      requestId: finalRequestId,
      planId: String(planId || ""),
      amount: Number(amount || 0),
    },
  });
  return finalRequestId;
};

export const submitPaymentRequest = async ({
  userType,
  userId,
  planId,
  amount,
  promoCode = "",
  referralCode = "",
  fullName = "",
  email = "",
  receipt = "",
  receiptFile = null,
}) => {
  const pricing = resolvePaymentPricing({
    baseAmount: amount,
    userType,
    planId,
    promoCode,
    referralCode,
  });

  try {
    const serverRow = await createPaymentRequestOnServer({
      userType,
      userId,
      planId,
      amount: pricing.finalAmount,
      fullName,
      email,
      receipt,
      receiptFile,
    });

    if (serverRow?.requestId) {
      createPaymentRequest({
        requestId: serverRow.requestId,
        userType,
        userId,
        planId,
        amount: pricing.finalAmount,
        baseAmount: pricing.baseAmount,
        discountAmount: pricing.discountAmount,
        discountPercent: pricing.discountPercent,
        promoCode: pricing.promo.valid ? pricing.promo.code : "",
        referralCode: pricing.referral.valid ? pricing.referral.code : "",
        fullName,
        email,
        receipt,
        receiptFileName: serverRow.receiptFileName || receiptFile?.name || "",
        botDelivered: Boolean(serverRow.botMessageId),
        botMessageId: serverRow.botMessageId ?? null,
        botPhotoMessageId: serverRow.botPhotoMessageId ?? null,
      });
      return serverRow.requestId;
    }
  } catch (error) {
    // fallback below
    logUserActivity({
      action: "payment_request_server_failed",
      area: "billing",
      status: "failed",
      message: error?.message || "Server billing xatoligi",
      targetRole: String(userType || ""),
      targetId: String(userId || ""),
    });
  }

  const requestId = generateUniquePaymentId();
  const telegramInfo = await sendPaymentRequestToTelegram({
    requestId,
    fullName,
    email,
    userId,
    userType,
    amount: pricing.finalAmount,
    receipt,
    receiptFile,
    planId,
    promoCode: pricing.promo.valid ? pricing.promo.code : "",
    referralCode: pricing.referral.valid ? pricing.referral.code : "",
    discountPercent: pricing.discountPercent,
    discountAmount: pricing.discountAmount,
    baseAmount: pricing.baseAmount,
  });
  createPaymentRequest({
    requestId,
    userType,
    userId,
    planId,
    amount: pricing.finalAmount,
    baseAmount: pricing.baseAmount,
    discountAmount: pricing.discountAmount,
    discountPercent: pricing.discountPercent,
    promoCode: pricing.promo.valid ? pricing.promo.code : "",
    referralCode: pricing.referral.valid ? pricing.referral.code : "",
    fullName,
    email,
    receipt,
    receiptFileName: receiptFile?.name || "",
    botDelivered: true,
    botMessageId: telegramInfo?.messageId ?? null,
    botPhotoMessageId: telegramInfo?.photoMessageId ?? null,
  });
  return requestId;
};

export const updatePaymentRequestStatus = (requestId, status, adminNote = "") => {
  const allowed = new Set(["pending", "approved", "rejected"]);
  const nextStatus = allowed.has(status) ? status : "pending";

  const requests = getAllPaymentRequests();
  const next = requests.map((request) => {
    if (request.requestId !== requestId) return request;
    return {
      ...request,
      status: nextStatus,
      adminNote,
      updatedAt: new Date().toISOString(),
    };
  });
  writeArray(PAYMENT_REQUESTS_KEY, next);
  const updated = next.find((request) => request.requestId === requestId);

  if (updated?.botMessageId) {
    try {
      const { botToken, chatId } = getTelegramBotConfig();
      const text = buildTelegramPaymentMessageText({
        requestId: updated.requestId,
        userId: updated.userId,
        fullName: updated.fullName,
        email: updated.email,
        userType: updated.userType,
        amount: updated.amount,
        receipt: updated.receipt,
        planId: updated.planId,
        promoCode: updated.promoCode,
        referralCode: updated.referralCode,
        discountPercent: updated.discountPercent,
        discountAmount: updated.discountAmount,
        baseAmount: updated.baseAmount,
        status: nextStatus,
        adminNote,
        createdAt: updated.createdAt,
      });

      fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: updated.botMessageId,
          text,
        }),
      }).catch(() => {});
    } catch {
      // no-op: telegram edit optional
    }
  }

  logUserActivity({
    action: "payment_request_status_updated",
    area: "billing",
    status: "success",
    message: `So'rov holati ${nextStatus} ga o'zgardi`,
    targetRole: String(updated?.userType || ""),
    targetId: String(updated?.userId || ""),
    meta: {
      requestId,
      status: nextStatus,
      adminNote,
    },
  });

  const approved = next.find((request) => request.requestId === requestId && request.status === "approved");
  if (updated?.userType && updated?.userId) {
    pushNotification({
      title: "To'lov holati yangilandi",
      message: `${updated.requestId} so'rovi ${nextStatus} holatiga o'tdi`,
      level: nextStatus === "approved" ? "success" : nextStatus === "rejected" ? "warning" : "info",
      targetRole: updated.userType,
      targetId: String(updated.userId || ""),
      link: updated.userType === "teacher" ? "/teacher/subscription" : "/student/subscription",
      meta: {
        requestId: updated.requestId,
        status: nextStatus,
      },
    });
  }
  if (approved) {
    activateSubscriptionFromPayment(approved);
  }
};

export const patchPaymentRequest = (requestId, patch = {}) => {
  const id = String(requestId || "").trim();
  if (!id) return false;
  const updates = patch && typeof patch === "object" ? patch : {};

  const requests = getAllPaymentRequests();
  let changed = false;
  const next = requests.map((request) => {
    if (request?.requestId !== id) return request;
    changed = true;
    return {
      ...request,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  });
  if (changed) writeArray(PAYMENT_REQUESTS_KEY, next);
  return changed;
};

const getAllSubscriptions = () => readObject(USER_SUBSCRIPTIONS_KEY);
const getAllStudentTestPacks = () => readObject(STUDENT_TEST_PACKS_KEY);

const saveAllSubscriptions = (subscriptions) => writeObject(USER_SUBSCRIPTIONS_KEY, subscriptions);
const saveAllStudentTestPacks = (packs) => writeObject(STUDENT_TEST_PACKS_KEY, packs);

const getDaysFromPlan = (planId) => {
  if (planId === "school_monthly") return 30;
  if (planId === "teacher_monthly") return 30;
  if (planId === "student_monthly") return 30;
  return 0;
};

const addDays = (isoString, days) => {
  const base = new Date(isoString);
  base.setDate(base.getDate() + days);
  return base.toISOString();
};

export const activateSubscription = ({ userType, userId, planId, activatedBy = "system" }) => {
  if (!userType || !userId || !planId) return;
  const key = toKey(userType, userId);
  const subscriptions = getAllSubscriptions();
  const startedAt = new Date().toISOString();
  const expiresAt = addDays(startedAt, getDaysFromPlan(planId));

  subscriptions[key] = {
    userType,
    userId,
    planId,
    status: "active",
    startedAt,
    expiresAt,
    activatedBy,
    updatedAt: startedAt,
  };
  saveAllSubscriptions(subscriptions);
  logUserActivity({
    action: "subscription_activated",
    area: "billing",
    status: "success",
    message: `${userType} obunasi faollashtirildi`,
    targetRole: userType,
    targetId: String(userId || ""),
    meta: {
      planId,
      activatedBy,
      expiresAt,
    },
  });
};

export const upsertSubscriptionFromServer = ({ userType, userId, planId, expiresAt, activatedBy = "server" }) => {
  if (!userType || !userId) return;
  const key = toKey(userType, userId);
  const subscriptions = getAllSubscriptions();
  const now = new Date().toISOString();
  const resolvedPlanId = String(planId || "").trim() || "free";
  const normalizedExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;

  subscriptions[key] = {
    userType,
    userId,
    planId: resolvedPlanId,
    status: resolvedPlanId === "free" || !normalizedExpiresAt ? "inactive" : "active",
    startedAt: normalizedExpiresAt ? (subscriptions[key]?.startedAt || now) : null,
    expiresAt: normalizedExpiresAt,
    activatedBy: String(activatedBy || "server"),
    updatedAt: now,
  };
  saveAllSubscriptions(subscriptions);
};

export const rejectSubscription = ({ userType, userId, planId = "" }) => {
  if (!userType || !userId) return;
  const key = toKey(userType, userId);
  const subscriptions = getAllSubscriptions();
  subscriptions[key] = {
    userType,
    userId,
    planId,
    status: "rejected",
    startedAt: null,
    expiresAt: null,
    updatedAt: new Date().toISOString(),
  };
  saveAllSubscriptions(subscriptions);
  logUserActivity({
    action: "subscription_rejected",
    area: "billing",
    status: "success",
    message: `${userType} obunasi rad etildi`,
    targetRole: userType,
    targetId: String(userId || ""),
    meta: { planId },
  });
};

export const getSubscription = (userType, userId) => {
  if (!userType || !userId) return null;
  const key = toKey(userType, userId);
  const subscriptions = getAllSubscriptions();
  return subscriptions[key] || null;
};

export const isSubscriptionActive = (userType, userId) => {
  const subscription = getSubscription(userType, userId);
  if (!subscription || subscription.status !== "active") return false;
  if (!subscription.expiresAt) return false;
  return new Date(subscription.expiresAt).getTime() > Date.now();
};

export const hasActiveTeacherSubscription = (teacherId) =>
  isSubscriptionActive("teacher", teacherId);

export const hasActiveSchoolSubscription = () => {
  const all = getAllSubscriptions();
  return Object.values(all).some((subscription) => {
    if (!subscription || subscription.userType !== "school" || subscription.status !== "active") return false;
    if (!subscription.expiresAt) return false;
    return new Date(subscription.expiresAt).getTime() > Date.now();
  });
};

export const hasActiveStudentSubscription = (studentId) =>
  isSubscriptionActive("student", studentId);

const parseStudentPackTests = (planId = "") => {
  const match = String(planId || "").match(/^student_pack_(\d+)$/i);
  const value = Number(match?.[1] || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const getStudentPurchasedTests = (studentId) => {
  const id = String(studentId || "").trim();
  if (!id) return 0;
  const packs = getAllStudentTestPacks();
  return Math.max(Number(packs[id]?.tests || 0), 0);
};

export const grantStudentPurchasedTests = ({
  studentId,
  tests = 0,
  source = "admin",
  requestId = "",
} = {}) => {
  const id = String(studentId || "").trim();
  const count = Math.max(Number(tests || 0), 0);
  if (!id || !count) return 0;

  const packs = getAllStudentTestPacks();
  const current = Math.max(Number(packs[id]?.tests || 0), 0);
  const next = current + count;
  packs[id] = {
    tests: next,
    updatedAt: new Date().toISOString(),
    source: String(source || "admin"),
    requestId: String(requestId || ""),
  };
  saveAllStudentTestPacks(packs);
  logUserActivity({
    action: "student_test_pack_granted",
    area: "billing",
    status: "success",
    message: `Student test paketi qo'shildi: +${count}`,
    targetRole: "student",
    targetId: id,
    meta: {
      testsAdded: count,
      totalPurchased: next,
      requestId: String(requestId || ""),
    },
  });
  return next;
};

const activateSubscriptionFromPayment = (payment) => {
  if (payment.userType === "teacher") {
    activateSubscription({
      userType: "teacher",
      userId: payment.userId,
      planId: payment.planId || "teacher_monthly",
      activatedBy: "admin",
    });
    return;
  }

  if (payment.userType === "student") {
    const planId = String(payment.planId || "student_monthly");
    const packTests = parseStudentPackTests(planId);
    if (packTests > 0) {
      grantStudentPurchasedTests({
        studentId: payment.userId,
        tests: packTests,
        source: "admin_approved_payment",
        requestId: payment.requestId || "",
      });
      pushNotification({
        title: "Test paketi faollashdi",
        message: `${packTests} ta qo'shimcha test ishlatish huquqi berildi`,
        level: "success",
        targetRole: "student",
        targetId: String(payment.userId || ""),
        link: "/student/subscription",
        meta: {
          planId,
          requestId: payment.requestId || "",
          tests: packTests,
        },
      });
      return;
    }
    activateSubscription({
      userType: "student",
      userId: payment.userId,
      planId,
      activatedBy: "admin",
    });
    return;
  }

  if (payment.userType === "school") {
    activateSubscription({
      userType: "school",
      userId: payment.userId,
      planId: payment.planId || "school_monthly",
      activatedBy: "admin",
    });
  }
};

export const registerOauthUser = ({
  provider = "google",
  role = "teacher",
  userId = "",
  fullName = "",
  email = "",
}) => {
  if (!email) return;
  const users = readArray(OAUTH_USERS_KEY);
  const normalized = String(email).trim().toLowerCase();
  const exists = users.some((item) => String(item.email).toLowerCase() === normalized && item.role === role);
  if (exists) return;

  users.unshift({
    provider,
    role,
    userId,
    fullName,
    email: normalized,
    createdAt: new Date().toISOString(),
  });
  writeArray(OAUTH_USERS_KEY, users);
  logUserActivity({
    action: "oauth_user_registered",
    area: "auth",
    status: "success",
    message: `${role} roli uchun OAuth foydalanuvchi qo'shildi`,
    targetRole: role,
    targetId: String(userId || ""),
    meta: {
      provider,
      email: normalized,
    },
  });
};

export const getOauthUsers = () => readArray(OAUTH_USERS_KEY);

export const getTelegramBotConfig = () => {
  const saved = readObject(TELEGRAM_CONFIG_KEY);
  return {
    botToken: String(saved.botToken || PAYMENT_CONFIG.telegramBotToken || "").trim(),
    chatId: String(saved.chatId || PAYMENT_CONFIG.telegramChatId || "").trim(),
  };
};

export const saveTelegramBotConfig = ({ botToken = "", chatId = "" }) => {
  writeObject(TELEGRAM_CONFIG_KEY, {
    botToken: String(botToken || "").trim(),
    chatId: String(chatId || "").trim(),
    updatedAt: new Date().toISOString(),
  });
  logUserActivity({
    action: "telegram_config_updated",
    area: "billing",
    status: "success",
    message: "Telegram bot sozlamalari yangilandi",
  });
};

const getTelegramSyncState = () => {
  const saved = readObject(TELEGRAM_SYNC_KEY);
  return {
    lastUpdateId: Number(saved.lastUpdateId || 0),
    syncedAt: String(saved.syncedAt || ""),
  };
};

const saveTelegramSyncState = ({ lastUpdateId = 0 } = {}) => {
  writeObject(TELEGRAM_SYNC_KEY, {
    lastUpdateId: Number(lastUpdateId || 0),
    syncedAt: new Date().toISOString(),
  });
};

export const getDeviceFingerprint = () => {
  const parts = [
    navigator.userAgent || "",
    navigator.platform || "",
    navigator.language || "",
    navigator.hardwareConcurrency || "",
    screen?.width || "",
    screen?.height || "",
  ];
  return btoa(parts.join("|")).slice(0, 48);
};

const normalizeDeviceRole = (role) => String(role || "").trim().toLowerCase();

const getRoleLocksByFingerprint = (locks, fingerprint, roleForMigration) => {
  const current = locks[fingerprint];
  if (!current) return {};

  if (typeof current === "string") {
    const legacyPrincipal = String(current || "").trim().toLowerCase();
    const normalizedRole = normalizeDeviceRole(roleForMigration);
    const migratedRole = SUPPORTED_DEVICE_ROLES.has(normalizedRole) ? normalizedRole : "teacher";
    const migrated = legacyPrincipal ? { [migratedRole]: legacyPrincipal } : {};
    locks[fingerprint] = migrated;
    writeObject(DEVICE_LOCKS_KEY, locks);
    return migrated;
  }

  if (typeof current === "object" && !Array.isArray(current)) {
    return current;
  }

  return {};
};

export const canUseDeviceForPrincipal = (role, principalId) => {
  const normalizedRole = normalizeDeviceRole(role);
  const principal = String(principalId || "").trim().toLowerCase();
  if (!principal || !SUPPORTED_DEVICE_ROLES.has(normalizedRole)) return false;
  const fingerprint = getDeviceFingerprint();
  const locks = readObject(DEVICE_LOCKS_KEY);
  const roleLocks = getRoleLocksByFingerprint(locks, fingerprint, normalizedRole);
  const lockedPrincipal = String(roleLocks[normalizedRole] || "").trim().toLowerCase();
  const allowed = !lockedPrincipal || lockedPrincipal === principal;
  if (!allowed) {
    logUserActivity({
      action: "device_login_blocked",
      area: "security",
      status: "failed",
      message: `${normalizedRole} roli boshqa login bilan bloklangan`,
      targetRole: normalizedRole,
      meta: {
        fingerprint,
        lockedPrincipal,
        attemptedPrincipal: principal,
      },
    });
  }
  return allowed;
};

export const lockDeviceForPrincipal = (role, principalId) => {
  const normalizedRole = normalizeDeviceRole(role);
  const principal = String(principalId || "").trim().toLowerCase();
  if (!principal || !SUPPORTED_DEVICE_ROLES.has(normalizedRole)) return;
  const fingerprint = getDeviceFingerprint();
  const locks = readObject(DEVICE_LOCKS_KEY);
  const roleLocks = getRoleLocksByFingerprint(locks, fingerprint, normalizedRole);
  if (!roleLocks[normalizedRole]) {
    roleLocks[normalizedRole] = principal;
    locks[fingerprint] = roleLocks;
    writeObject(DEVICE_LOCKS_KEY, locks);
    logUserActivity({
      action: "device_role_locked",
      area: "security",
      status: "success",
      message: `${normalizedRole} roli qurilmaga biriktirildi`,
      targetRole: normalizedRole,
      meta: {
        fingerprint,
        principal,
      },
    });
  }
};

export const getDeviceLocksReport = () => {
  const locks = readObject(DEVICE_LOCKS_KEY);
  const rows = [];
  Object.entries(locks).forEach(([fingerprint, roleMap]) => {
    if (!roleMap || typeof roleMap !== "object" || Array.isArray(roleMap)) return;
    Object.entries(roleMap).forEach(([role, principal]) => {
      rows.push({
        fingerprint,
        role: normalizeDeviceRole(role),
        principal: String(principal || ""),
      });
    });
  });
  return rows;
};

export const unlockDevicePrincipal = (role, principalId) => {
  const normalizedRole = normalizeDeviceRole(role);
  const principal = String(principalId || "").trim().toLowerCase();
  if (!normalizedRole || !principal) return false;

  const locks = readObject(DEVICE_LOCKS_KEY);
  let changed = false;

  Object.keys(locks).forEach((fingerprint) => {
    const roleMap = locks[fingerprint];
    if (!roleMap || typeof roleMap !== "object" || Array.isArray(roleMap)) return;
    if (String(roleMap[normalizedRole] || "").trim().toLowerCase() !== principal) return;
    delete roleMap[normalizedRole];
    if (!Object.keys(roleMap).length) {
      delete locks[fingerprint];
    } else {
      locks[fingerprint] = roleMap;
    }
    changed = true;
  });

  if (changed) {
    writeObject(DEVICE_LOCKS_KEY, locks);
    logUserActivity({
      action: "device_role_unlocked",
      area: "security",
      status: "success",
      message: `${normalizedRole} roli blokdan chiqarildi`,
      targetRole: normalizedRole,
      meta: { principal },
    });
  }

  return changed;
};

export const sendPaymentRequestToTelegram = async ({
  requestId,
  fullName,
  email,
  userId,
  userType,
  amount,
  receipt,
  planId = "",
  promoCode = "",
  referralCode = "",
  discountPercent = 0,
  discountAmount = 0,
  baseAmount = 0,
  receiptFile = null,
}) => {
  const { botToken, chatId } = getTelegramBotConfig();
  if (!botToken || !chatId) {
    throw new Error("Bot sozlanmagan. Admin panelda bot token va chat ID kiriting.");
  }

  const text = buildTelegramPaymentMessageText({
    requestId,
    userId,
    fullName,
    email,
    userType,
    amount,
    receipt,
    planId,
    promoCode,
    referralCode,
    discountPercent,
    discountAmount,
    baseAmount,
    status: "pending",
  });

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!res.ok) {
    throw new Error("Botga yuborib bo'lmadi");
  }

  const msgData = await res.json().catch(() => ({}));
  let photoMessageId = null;
  if (receiptFile) {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", `Chek rasmi | ID: ${requestId}`);
    formData.append("photo", receiptFile);

    const photoRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: formData,
    });
    if (!photoRes.ok) {
      throw new Error("Chek rasmini botga yuborib bo'lmadi");
    }
    const photoData = await photoRes.json().catch(() => ({}));
    photoMessageId = photoData?.result?.message_id ?? null;
  }

  return {
    messageId: msgData?.result?.message_id ?? null,
    photoMessageId,
  };
};

const buildServerHeaders = () => ({
  Accept: "application/json",
});

export const syncPaymentRequestsFromServer = async ({ status = "" } = {}) => {
  const q = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${BILLING_API_URL}/billing/payment-requests${q}`, {
    method: "GET",
    headers: buildServerHeaders(),
  });
  if (!res.ok) throw new Error("Serverdan to'lov so'rovlarini olib bo'lmadi");
  const rows = await res.json().catch(() => []);
  const list = Array.isArray(rows) ? rows : [];

  const mapped = list
    .map((row) => ({
      requestId: String(row.requestId || ""),
      userType: String(row.userType || ""),
      userId: String(row.userId || ""),
      planId: String(row.planId || ""),
      amount: Number(row.amount || 0),
      baseAmount: Number(row.baseAmount || row.amount || 0),
      discountAmount: Number(row.discountAmount || 0),
      discountPercent: Number(row.discountPercent || 0),
      promoCode: String(row.promoCode || ""),
      referralCode: String(row.referralCode || ""),
      fullName: String(row.fullName || ""),
      email: String(row.email || ""),
      receipt: String(row.receipt || ""),
      receiptFileName: String(row.receiptFileName || ""),
      receiptUrl: String(row.receiptUrl || ""),
      botDelivered: Boolean(row.botMessageId),
      botMessageId: row.botMessageId ?? null,
      botPhotoMessageId: row.botPhotoMessageId ?? null,
      channel: "server",
      status: String(row.status || "pending").toLowerCase(),
      adminNote: String(row.adminNote || ""),
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || row.createdAt || new Date().toISOString(),
      importedFromServer: true,
    }))
    .filter((item) => item.requestId);

  const existing = getAllPaymentRequests();
  const byId = new Map(existing.map((item) => [item?.requestId, item]).filter(([id]) => id));
  mapped.forEach((row) => {
    byId.set(row.requestId, { ...(byId.get(row.requestId) || {}), ...row });
  });
  const next = Array.from(byId.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  writeArray(PAYMENT_REQUESTS_KEY, next);
  return { count: mapped.length };
};

export const createPaymentRequestOnServer = async ({
  userType,
  userId,
  planId,
  amount,
  fullName = "",
  email = "",
  receipt = "",
  receiptFile = null,
} = {}) => {
  const form = new FormData();
  form.append("userType", String(userType || ""));
  form.append("userId", String(userId || ""));
  form.append("planId", String(planId || ""));
  form.append("amount", String(Number(amount || 0)));
  form.append("fullName", String(fullName || ""));
  form.append("email", String(email || ""));
  form.append("receipt", String(receipt || ""));
  if (receiptFile) form.append("receipt", receiptFile);

  const res = await fetch(`${BILLING_API_URL}/billing/payment-requests`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.msg || "Serverga so'rov yuborib bo'lmadi");
  }
  const data = await res.json().catch(() => ({}));
  return data?.request || null;
};

export const updatePaymentRequestStatusOnServer = async (requestId, status, adminNote = "") => {
  const res = await fetch(`${BILLING_API_URL}/billing/payment-requests/${encodeURIComponent(String(requestId || ""))}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...buildServerHeaders() },
    body: JSON.stringify({ status, adminNote }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.msg || "Serverda statusni yangilab bo'lmadi");
  }
  return true;
};

export const activateSubscriptionOnServer = async ({ userType, userId, planId, days = 30 } = {}) => {
  const res = await fetch(`${BILLING_API_URL}/billing/subscriptions/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...buildServerHeaders() },
    body: JSON.stringify({ userType, userId, planId, days }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.msg || "Serverda obunani yoqib bo'lmadi");
  }
  const data = await res.json().catch(() => ({}));
  return data?.subscription || null;
};

const parseTelegramMoney = (value) => {
  const cleaned = String(value || "").replace(/[^\d]/g, "");
  const parsed = Number(cleaned || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseTelegramPaymentText = (text = "") => {
  const payload = {
    requestId: "",
    userId: "",
    fullName: "",
    email: "",
    userType: "",
    planId: "",
    promoCode: "",
    referralCode: "",
    discountPercent: 0,
    discountAmount: 0,
    baseAmount: 0,
    amount: 0,
    receipt: "",
    status: "",
  };

  const raw = String(text || "");
  const matchId = raw.match(/\bPAY-[A-Z0-9-]+\b/i);
  if (matchId) payload.requestId = matchId[0].toUpperCase();

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((line) => {
    const normalized = line.replace(/^[^\w]*\s*/u, "");
    const idx = normalized.indexOf(":");
    if (idx === -1) return;
    const label = normalized.slice(0, idx).trim().toLowerCase();
    const value = normalized.slice(idx + 1).trim();

    if (label === "id") payload.requestId = value.split(/\s+/)[0].toUpperCase();
    else if (label === "user id" || label === "userid" || label === "user_id") payload.userId = value;
    else if (label === "ism") payload.fullName = value;
    else if (
      label === "email/login" ||
      label === "email" ||
      label === "login" ||
      label === "username" ||
      label === "user" ||
      label === "foydalanuvchi"
    ) payload.email = value;
    else if (label === "rol") payload.userType = value;
    else if (label === "role") payload.userType = value;
    else if (label === "tarif") payload.planId = value;
    else if (label === "plan") payload.planId = value;
    else if (label === "promo") payload.promoCode = value === "-" ? "" : value;
    else if (label === "referral") payload.referralCode = value === "-" ? "" : value;
    else if (label === "izoh") payload.receipt = value === "-" ? "" : value;
    else if (label === "chegirma") {
      const percentMatch = value.match(/(\d+(?:[.,]\d+)?)\s*%/);
      payload.discountPercent = Number(String(percentMatch?.[1] || "0").replace(",", ".")) || 0;
      payload.discountAmount = parseTelegramMoney(value);
    } else if (label === "asl summa") payload.baseAmount = parseTelegramMoney(value);
    else if (label === "summa") payload.amount = parseTelegramMoney(value);
    else if (label === "holat" || label === "status") payload.status = normalizePaymentStatus(value);
  });

  return payload;
};

const parseTelegramRequestIdFromCaption = (caption = "") => {
  const match = String(caption || "").match(/\bPAY-[A-Z0-9-]+\b/i);
  return match ? match[0].toUpperCase() : "";
};

const buildTelegramRequestRecord = ({
  requestId,
  messageId,
  photoMessageId = null,
  photoFileId = null,
  messageDateIso = "",
  parsed = null,
}) => {
  const safeParsed = parsed && typeof parsed === "object" ? parsed : {};
  const createdAt = messageDateIso || new Date().toISOString();
  const status = normalizePaymentStatus(safeParsed.status) || "pending";
  return {
    requestId,
    userType: safeParsed.userType || "other",
    userId: safeParsed.userId || "",
    planId: safeParsed.planId || "",
    amount: Number(safeParsed.amount || 0),
    baseAmount: Number(safeParsed.baseAmount || 0),
    discountAmount: Number(safeParsed.discountAmount || 0),
    discountPercent: Number(safeParsed.discountPercent || 0),
    promoCode: safeParsed.promoCode || "",
    referralCode: safeParsed.referralCode || "",
    fullName: safeParsed.fullName || "",
    email: safeParsed.email || "",
    receipt: safeParsed.receipt || "",
    receiptFileName: "",
    botDelivered: true,
    botMessageId: messageId ?? null,
    botPhotoMessageId: photoMessageId ?? null,
    telegramPhotoFileId: photoFileId ?? null,
    channel: "telegram_bot",
    status,
    createdAt,
    updatedAt: createdAt,
    importedFromTelegram: true,
  };
};

const upsertPaymentRequestRecord = (record) => {
  if (!record?.requestId) return { imported: 0, updated: 0, record: null };
  const requests = getAllPaymentRequests();
  const idx = requests.findIndex((item) => item?.requestId === record.requestId);

  if (idx === -1) {
    writeArray(PAYMENT_REQUESTS_KEY, [record, ...requests]);
    return { imported: 1, updated: 0, record };
  }

  const current = requests[idx] || {};
  const incomingStatus = normalizePaymentStatus(record.status) || "pending";
  const currentStatus = normalizePaymentStatus(current.status) || "pending";
  const mergedStatus =
    currentStatus !== "pending"
      ? currentStatus
      : incomingStatus !== "pending"
        ? incomingStatus
        : currentStatus;
  const merged = {
    ...current,
    ...record,
    status: mergedStatus,
    adminNote: current.adminNote || "",
    createdAt: current.createdAt || record.createdAt,
    updatedAt: new Date().toISOString(),
  };
  const next = [...requests];
  next[idx] = merged;
  writeArray(PAYMENT_REQUESTS_KEY, next);
  return { imported: 0, updated: 1, record: merged };
};

export const syncPaymentRequestsFromTelegram = async ({ maxPages = 8, pageSize = 100 } = {}) => {
  const { botToken, chatId } = getTelegramBotConfig();
  if (!botToken || !chatId) {
    throw new Error("Bot sozlanmagan. Admin panelda bot token va chat ID kiriting.");
  }

  const syncState = getTelegramSyncState();
  let offset = syncState.lastUpdateId ? syncState.lastUpdateId + 1 : 0;
  let lastSeenUpdateId = syncState.lastUpdateId || 0;
  let imported = 0;
  let updated = 0;
  let scanned = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offset: offset || undefined,
        limit: pageSize,
        allowed_updates: ["message", "edited_message"],
      }),
    });

    if (!res.ok) {
      throw new Error("Telegramdan so'rovlarni olib bo'lmadi");
    }

    const data = await res.json().catch(() => ({}));
    const updates = Array.isArray(data?.result) ? data.result : [];
    if (!updates.length) break;

    updates.forEach((update) => {
      const updateId = Number(update?.update_id || 0);
      if (updateId) lastSeenUpdateId = Math.max(lastSeenUpdateId, updateId);

      const message = update?.message || update?.edited_message;
      if (!message?.chat?.id) return;
      if (String(message.chat.id) !== String(chatId)) return;

      scanned += 1;
      const messageId = message.message_id ?? null;
      const messageDateIso = message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString();

      if (message.text) {
        const parsed = parseTelegramPaymentText(message.text);
        const requestId = String(parsed.requestId || "").trim();
        if (!requestId) return;
        const record = buildTelegramRequestRecord({
          requestId,
          messageId,
          messageDateIso,
          parsed,
        });
        const result = upsertPaymentRequestRecord(record);
        imported += result.imported;
        updated += result.updated;
        if (String(result.record?.status || "").toLowerCase() === "approved") {
          activateSubscriptionFromPayment(result.record);
        }
        return;
      }

      if (message.photo?.length) {
        const captionText = String(message.caption || "").trim();
        const captionParsed = captionText ? parseTelegramPaymentText(captionText) : null;
        const captionRequestId = captionParsed?.requestId || parseTelegramRequestIdFromCaption(captionText);
        const fallbackRequestId = `TG-${String(message.date || Date.now())}-${String(messageId || Math.random()).replace(/\D/g, "")}`;
        const requestId = captionRequestId || fallbackRequestId;
        const bestPhoto = message.photo[message.photo.length - 1];
        const photoFileId = bestPhoto?.file_id || null;
        const parsed = captionParsed || (captionText ? { receipt: captionText, userType: "other" } : null);
        const record = buildTelegramRequestRecord({
          requestId,
          messageId,
          photoMessageId: messageId,
          photoFileId,
          messageDateIso,
          parsed,
        });
        const result = upsertPaymentRequestRecord(record);
        imported += result.imported;
        updated += result.updated;
        if (String(result.record?.status || "").toLowerCase() === "approved") {
          activateSubscriptionFromPayment(result.record);
        }
      }
    });

    if (!lastSeenUpdateId) break;
    offset = lastSeenUpdateId + 1;
  }

  if (lastSeenUpdateId && lastSeenUpdateId !== syncState.lastUpdateId) {
    saveTelegramSyncState({ lastUpdateId: lastSeenUpdateId });
  }

  logUserActivity({
    action: "telegram_payments_synced",
    area: "billing",
    status: "success",
    message: "Telegramdan to'lov so'rovlari sinxron qilindi",
    targetRole: "admin",
    meta: { imported, updated, scanned, lastUpdateId: lastSeenUpdateId },
  });

  return { imported, updated, scanned, lastUpdateId: lastSeenUpdateId, syncedAt: new Date().toISOString() };
};

export const resolveTelegramFileUrl = async (fileId) => {
  const resolvedId = String(fileId || "").trim();
  if (!resolvedId) return "";
  const { botToken } = getTelegramBotConfig();
  if (!botToken) throw new Error("Bot token topilmadi");

  const res = await fetch(`https://api.telegram.org/bot${botToken}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: resolvedId }),
  });
  if (!res.ok) {
    throw new Error("Telegram faylini topib bo'lmadi");
  }
  const data = await res.json().catch(() => ({}));
  const path = data?.result?.file_path;
  if (!path) return "";
  return `https://api.telegram.org/file/bot${botToken}/${path}`;
};
