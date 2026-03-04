const PROMO_USAGE_KEY = "marketing_promo_usage_v1";

export const PROMO_RULES = Object.freeze([
  {
    code: "PROSTART10",
    title: "Teacher/Student Start",
    discountPercent: 10,
    allowedUserTypes: ["teacher", "student"],
    allowedPlanIds: ["teacher_monthly", "student_monthly", "student_pack_20", "student_pack_50"],
    active: true,
  },
  {
    code: "ABITUR20",
    title: "Abituriyent chegirma",
    discountPercent: 20,
    allowedUserTypes: ["student"],
    allowedPlanIds: ["student_monthly", "student_pack_20", "student_pack_50"],
    active: true,
  },
  {
    code: "TEACHER15",
    title: "Teacher Pro kampaniya",
    discountPercent: 15,
    allowedUserTypes: ["teacher"],
    allowedPlanIds: ["teacher_monthly"],
    active: true,
  },
]);

const REFERRAL_PATTERN = /^(REF|AFF)-[A-Z0-9]{4,20}$/;

const readUsageMap = () => {
  try {
    const raw = localStorage.getItem(PROMO_USAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeUsageMap = (map) => {
  localStorage.setItem(PROMO_USAGE_KEY, JSON.stringify(map || {}));
};

export const normalizeMarketingCode = (value = "") =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

export const validatePromoCode = (promoCode = "", { userType = "", planId = "" } = {}) => {
  const normalizedCode = normalizeMarketingCode(promoCode);
  if (!normalizedCode) {
    return {
      valid: false,
      code: "",
      discountPercent: 0,
      reason: "",
      title: "",
    };
  }

  const promo = PROMO_RULES.find((item) => item.code === normalizedCode);
  if (!promo || !promo.active) {
    return {
      valid: false,
      code: normalizedCode,
      discountPercent: 0,
      reason: "Promo kod topilmadi yoki nofaol.",
      title: "",
    };
  }

  const normalizedRole = String(userType || "").trim().toLowerCase();
  if (Array.isArray(promo.allowedUserTypes) && promo.allowedUserTypes.length) {
    if (!promo.allowedUserTypes.includes(normalizedRole)) {
      return {
        valid: false,
        code: normalizedCode,
        discountPercent: 0,
        reason: "Bu promo kod ushbu rol uchun ishlamaydi.",
        title: promo.title,
      };
    }
  }

  if (Array.isArray(promo.allowedPlanIds) && promo.allowedPlanIds.length) {
    if (!promo.allowedPlanIds.includes(String(planId || ""))) {
      return {
        valid: false,
        code: normalizedCode,
        discountPercent: 0,
        reason: "Bu promo kod tanlangan tarif uchun ishlamaydi.",
        title: promo.title,
      };
    }
  }

  return {
    valid: true,
    code: normalizedCode,
    discountPercent: Number(promo.discountPercent || 0),
    reason: "",
    title: promo.title,
  };
};

export const validateReferralCode = (referralCode = "") => {
  const normalized = normalizeMarketingCode(referralCode);
  if (!normalized) {
    return {
      valid: false,
      code: "",
      discountPercent: 0,
      reason: "",
    };
  }

  if (!REFERRAL_PATTERN.test(normalized)) {
    return {
      valid: false,
      code: normalized,
      discountPercent: 0,
      reason: "Referral kod formati noto'g'ri (masalan: REF-ABITUR25).",
    };
  }

  return {
    valid: true,
    code: normalized,
    discountPercent: 5,
    reason: "",
  };
};

const toAmount = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
};

const toDiscountAmount = (amount, percent) => {
  const safeAmount = toAmount(amount);
  const safePercent = Math.max(Number(percent || 0), 0);
  return Math.round((safeAmount * safePercent) / 100);
};

export const resolvePaymentPricing = ({
  baseAmount,
  userType,
  planId,
  promoCode = "",
  referralCode = "",
}) => {
  const base = toAmount(baseAmount);
  const promo = validatePromoCode(promoCode, { userType, planId });
  const referral = validateReferralCode(referralCode);

  const promoPercent = promo.valid ? promo.discountPercent : 0;
  const referralPercent = referral.valid ? referral.discountPercent : 0;
  const combinedPercent = Math.min(promoPercent + referralPercent, 30);

  const discountAmount = toDiscountAmount(base, combinedPercent);
  const finalAmount = Math.max(base - discountAmount, 0);

  return {
    baseAmount: base,
    finalAmount,
    discountAmount,
    discountPercent: combinedPercent,
    promo: {
      ...promo,
      code: promo.valid ? promo.code : normalizeMarketingCode(promoCode),
    },
    referral: {
      ...referral,
      code: referral.valid ? referral.code : normalizeMarketingCode(referralCode),
    },
  };
};

export const trackMarketingUsage = ({
  requestId,
  userType,
  userId,
  planId,
  promoCode,
  referralCode,
  discountPercent = 0,
  discountAmount = 0,
} = {}) => {
  const normalizedPromo = normalizeMarketingCode(promoCode);
  const normalizedReferral = normalizeMarketingCode(referralCode);
  if (!normalizedPromo && !normalizedReferral) return;

  const map = readUsageMap();
  const key = requestId || `${Date.now()}`;
  map[key] = {
    requestId: String(requestId || ""),
    userType: String(userType || ""),
    userId: String(userId || ""),
    planId: String(planId || ""),
    promoCode: normalizedPromo,
    referralCode: normalizedReferral,
    discountPercent: Number(discountPercent || 0),
    discountAmount: toAmount(discountAmount),
    createdAt: new Date().toISOString(),
  };
  writeUsageMap(map);
};

export const getMarketingUsageRows = () =>
  Object.values(readUsageMap()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

export const getMarketingUsageSummary = () => {
  const rows = getMarketingUsageRows();
  return rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc.totalDiscountAmount += Number(row.discountAmount || 0);
      if (row.promoCode) acc.promoCount += 1;
      if (row.referralCode) acc.referralCount += 1;
      return acc;
    },
    {
      total: 0,
      promoCount: 0,
      referralCount: 0,
      totalDiscountAmount: 0,
    }
  );
};
