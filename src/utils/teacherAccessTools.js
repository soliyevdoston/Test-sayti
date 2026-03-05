import { getTeacherSubscription } from "./subscriptionTools";

const FREE_PLAN_ID = "free";
const DISABLE_PLAN_LIMITS = ["1", "true", "yes", "on"].includes(
  String(import.meta.env.VITE_DISABLE_PLAN_LIMITS || "").trim().toLowerCase()
);
const FREE_ALLOWED_PATHS = new Set([
  "/teacher/dashboard",
  "/teacher/tests",
  "/teacher/create-test",
  "/teacher/subscription",
  "/guide",
]);

const PRO_ONLY_TEACHER_PATHS = new Set([
  "/teacher/groups",
  "/teacher/results",
  "/teacher/chats",
  "/teacher/settings",
]);

export const TEACHER_FEATURES = Object.freeze({
  DASHBOARD: "dashboard",
  BASIC_TESTS: "basic_tests",
  SUBSCRIPTION: "subscription",
  GUIDE: "guide",
  BLOCK_EXAM: "block_exam",
  PREVIEW: "preview",
  TEMPLATES: "templates",
  EXPORT: "export",
  GROUPS: "groups",
  RESULTS: "results",
  CHATS: "chats",
  SETTINGS: "settings",
  ADVANCED_ACCESS: "advanced_access",
});

const FREE_ALLOWED_FEATURES = new Set([
  TEACHER_FEATURES.DASHBOARD,
  TEACHER_FEATURES.BASIC_TESTS,
  TEACHER_FEATURES.SUBSCRIPTION,
  TEACHER_FEATURES.GUIDE,
]);

const PRO_ONLY_API_RULES = [
  {
    pathPrefix: "/teacher/parse-preview",
    reason: "Preview funksiyasi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/upload-preview",
    reason: "Preview funksiyasi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/duplicate-test",
    reason: "Nusxalash funksiyasi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/update-test-access",
    reason: "Kengaytirilgan kirish nazorati faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/groups",
    reason: "Guruhlar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/group/",
    reason: "Guruhlar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/add-group",
    reason: "Guruhlar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/delete-group",
    reason: "Guruhlar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/add-student",
    reason: "O'quvchi boshqaruvi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/delete-student",
    reason: "O'quvchi boshqaruvi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/results",
    reason: "Natijalar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/analysis",
    reason: "Natijalar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/retake-requests",
    reason: "Natijalar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/handle-retake",
    reason: "Natijalar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/subjects",
    reason: "Fanlar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/add-subject",
    reason: "Fanlar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/teacher/delete-subject",
    reason: "Fanlar bo'limi faqat Pro tarifda ishlaydi.",
  },
  {
    pathPrefix: "/chat/",
    reason: "Chat bo'limi faqat Pro tarifda ishlaydi.",
  },
];

const normalizePath = (pathname = "") => {
  const value = String(pathname || "").split("?")[0].split("#")[0].trim();
  if (!value) return "/";
  const withSlash = value.startsWith("/") ? value : `/${value}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
};

const normalizeMethod = (method = "get") => String(method || "get").trim().toLowerCase();

const normalizeApiPath = (requestUrl = "") => {
  const raw = String(requestUrl || "").trim();
  if (!raw) return "/";
  const withoutQuery = raw.split("?")[0];
  if (withoutQuery.startsWith("http://") || withoutQuery.startsWith("https://")) {
    try {
      return normalizePath(new URL(withoutQuery).pathname);
    } catch {
      return normalizePath(withoutQuery);
    }
  }
  return normalizePath(withoutQuery);
};

export const getTeacherPlanId = (teacherId) =>
  String(getTeacherSubscription(teacherId)?.planId || FREE_PLAN_ID);

export const isTeacherFreePlan = (teacherId) => getTeacherPlanId(teacherId) === FREE_PLAN_ID;

export const isTeacherProActive = (teacherId) => DISABLE_PLAN_LIMITS || !isTeacherFreePlan(teacherId);

export const canTeacherUseFeature = (teacherId, feature) => {
  if (isTeacherProActive(teacherId)) return true;
  return FREE_ALLOWED_FEATURES.has(String(feature || "").trim().toLowerCase());
};

export const canUseTeacherProFeature = (teacherId, feature = TEACHER_FEATURES.BLOCK_EXAM) =>
  canTeacherUseFeature(teacherId, feature);

export const isTeacherPathProOnly = (pathname) =>
  PRO_ONLY_TEACHER_PATHS.has(normalizePath(pathname));

export const isTeacherPathAllowedForPlan = (teacherId, pathname) =>
  isTeacherProActive(teacherId) || FREE_ALLOWED_PATHS.has(normalizePath(pathname));

export const getTeacherApiAccessState = (teacherId, method, requestUrl) => {
  const normalizedPath = normalizeApiPath(requestUrl);
  const normalizedMethod = normalizeMethod(method);
  if (!teacherId || isTeacherProActive(teacherId)) {
    return {
      allowed: true,
      path: normalizedPath,
      method: normalizedMethod,
      reason: "",
    };
  }

  const blockedRule = PRO_ONLY_API_RULES.find((rule) => {
    const pathMatched = normalizedPath.startsWith(rule.pathPrefix);
    const methodMatched =
      !Array.isArray(rule.methods) || !rule.methods.length || rule.methods.includes(normalizedMethod);
    return pathMatched && methodMatched;
  });

  if (!blockedRule) {
    return {
      allowed: true,
      path: normalizedPath,
      method: normalizedMethod,
      reason: "",
    };
  }

  return {
    allowed: false,
    path: normalizedPath,
    method: normalizedMethod,
    reason: blockedRule.reason || "Bu amal faqat Pro tarifda ishlaydi.",
  };
};
