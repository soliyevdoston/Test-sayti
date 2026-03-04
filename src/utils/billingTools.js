import { logUserActivity } from "./activityLog";
import { pushNotification } from "./notificationTools";
import { resolvePaymentPricing, trackMarketingUsage } from "./marketingTools";

const PAYMENT_REQUESTS_KEY = "billing_payment_requests_v1";
const USER_SUBSCRIPTIONS_KEY = "billing_user_subscriptions_v1";
const STUDENT_TEST_PACKS_KEY = "billing_student_test_packs_v1";
const OAUTH_USERS_KEY = "billing_oauth_users_v1";
const DEVICE_LOCKS_KEY = "billing_device_locks_v1";
const SUPPORTED_DEVICE_ROLES = new Set(["admin", "teacher", "student"]);
const TELEGRAM_CONFIG_KEY = "billing_telegram_config_v1";

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
  const requestId = generateUniquePaymentId();
  const telegramInfo = await sendPaymentRequestToTelegram({
    requestId,
    fullName,
    email,
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

  const text =
    `💳 Obuna to'lov so'rovi\n\n` +
    `🆔 ID: ${requestId}\n` +
    `👤 Ism: ${fullName || "-"}\n` +
    `📧 Email/Login: ${email || "-"}\n` +
    `🧩 Rol: ${userType}\n` +
    `🗂 Tarif: ${planId || "-"}\n` +
    `🏷 Promo: ${promoCode || "-"}\n` +
    `🔗 Referral: ${referralCode || "-"}\n` +
    `📉 Chegirma: ${Number(discountPercent || 0)}% (${Number(discountAmount || 0).toLocaleString("uz-UZ")} ${PAYMENT_CONFIG.currency})\n` +
    `💵 Asl summa: ${Number(baseAmount || amount || 0).toLocaleString("uz-UZ")} ${PAYMENT_CONFIG.currency}\n` +
    `💰 Summa: ${amount.toLocaleString("uz-UZ")} ${PAYMENT_CONFIG.currency}\n` +
    `🧾 Izoh: ${receipt || "-"}\n` +
    `🕒 ${new Date().toLocaleString("uz-UZ")}`;

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
