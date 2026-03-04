import { getOwnerAdminConfig, listSubAdmins } from "./adminAccessTools";
import { getOauthUsers } from "./billingTools";

const PERSONAL_STUDENT_AUTH_KEY = "student_personal_auth_v1";

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const normalizeRole = (value = "") => String(value || "").trim().toLowerCase();
const LOGIN_CONFLICT_PATTERN = /(already|exists|duplicate|taken|band|mavjud|allaqachon|registered|ro'yxatdan o'tgan)/i;

export const normalizeLoginPrincipal = (value = "") =>
  String(value || "").trim().toLowerCase();

const readPersonalStudents = () => {
  const parsed = safeParse(localStorage.getItem(PERSONAL_STUDENT_AUTH_KEY) || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const appendPrincipal = (map, principal, meta = {}) => {
  const normalized = normalizeLoginPrincipal(principal);
  if (!normalized || map.has(normalized)) return;
  map.set(normalized, {
    role: normalizeRole(meta.role),
    source: String(meta.source || "local").trim() || "local",
  });
};

export const collectKnownPrincipalMap = ({
  teacherRows = [],
  studentRows = [],
  extraLogins = [],
} = {}) => {
  const map = new Map();

  const owner = getOwnerAdminConfig();
  if (owner?.login) {
    appendPrincipal(map, owner.login, { role: "admin", source: "owner_admin" });
  }

  listSubAdmins().forEach((item) => {
    appendPrincipal(map, item?.login, { role: "admin", source: "sub_admin" });
  });

  readPersonalStudents().forEach((item) => {
    appendPrincipal(map, item?.email, { role: "student", source: "personal_student" });
  });

  getOauthUsers().forEach((item) => {
    appendPrincipal(map, item?.email, {
      role: normalizeRole(item?.role),
      source: "oauth_user",
    });
  });

  teacherRows.forEach((teacher) => {
    appendPrincipal(map, teacher?.username || teacher?.email, { role: "teacher", source: "teacher_list" });
  });

  studentRows.forEach((student) => {
    appendPrincipal(map, student?.username || student?.email, { role: "student", source: "student_list" });
  });

  extraLogins.forEach((login) => {
    appendPrincipal(map, login, { role: "", source: "extra" });
  });

  return map;
};

export const checkLoginAvailability = (login, options = {}) => {
  const normalized = normalizeLoginPrincipal(login);
  if (!normalized) {
    return {
      ok: false,
      reason: "Login kiriting.",
      normalized,
      hit: null,
    };
  }

  const ignoreCandidates = Array.isArray(options.ignoreLogins)
    ? options.ignoreLogins
    : [options.ignoreLogin];
  const ignored = new Set(ignoreCandidates.map((item) => normalizeLoginPrincipal(item)).filter(Boolean));
  if (ignored.has(normalized)) {
    return {
      ok: true,
      reason: "",
      normalized,
      hit: null,
    };
  }

  const principalMap = collectKnownPrincipalMap(options);
  const hit = principalMap.get(normalized);
  if (hit) {
    return {
      ok: false,
      reason: options.takenMessage || "Bu login band. Boshqa login kiriting.",
      normalized,
      hit,
    };
  }

  return {
    ok: true,
    reason: "",
    normalized,
    hit: null,
  };
};

export const isLoginConflictMessage = (message = "") =>
  LOGIN_CONFLICT_PATTERN.test(String(message || ""));
