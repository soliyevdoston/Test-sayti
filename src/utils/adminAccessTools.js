import { logUserActivity } from "./activityLog";

const OWNER_ADMIN_KEY = "secure_owner_admin_v1";
const SUB_ADMIN_ACCOUNTS_KEY = "secure_sub_admin_accounts_v1";

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readObject = (key) => {
  const parsed = safeParse(localStorage.getItem(key) || "{}", {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const writeObject = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value || {}));
};

const readArray = (key) => {
  const parsed = safeParse(localStorage.getItem(key) || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
};

const normalizeLogin = (value = "") => String(value || "").trim().toLowerCase();

const hashSecret = (value = "") => {
  const source = String(value || "");
  let hash = 5381;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 33) ^ source.charCodeAt(i);
  }
  return `h_${(hash >>> 0).toString(16)}`;
};

const buildId = () =>
  `ADM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const getOwnerAdminConfig = () => {
  const owner = readObject(OWNER_ADMIN_KEY);
  if (!owner?.login || !owner?.passwordHash) return null;
  return owner;
};

export const isOwnerAdminConfigured = () => Boolean(getOwnerAdminConfig());

export const setupOwnerAdmin = ({
  login,
  password,
  fullName = "Owner Admin",
  schoolId = "",
  schoolName = "Admin",
} = {}) => {
  const normalizedLogin = normalizeLogin(login);
  if (!normalizedLogin || !String(password || "").trim()) {
    throw new Error("Owner admin login/paroli noto'g'ri");
  }

  const existingOwner = getOwnerAdminConfig();
  if (existingOwner) {
    return existingOwner;
  }

  const payload = {
    login: normalizedLogin,
    passwordHash: hashSecret(password),
    fullName: String(fullName || "Owner Admin").trim() || "Owner Admin",
    schoolId: String(schoolId || "").trim() || "local-owner-school",
    schoolName: String(schoolName || "Admin").trim() || "Admin",
    createdAt: new Date().toISOString(),
  };

  writeObject(OWNER_ADMIN_KEY, payload);
  logUserActivity({
    action: "owner_admin_initialized",
    area: "security",
    status: "success",
    message: "Owner admin tizimga biriktirildi",
    targetRole: "admin",
    targetId: payload.login,
  });

  return payload;
};

export const authenticateManagedAdmin = ({ login, password }) => {
  const normalizedLogin = normalizeLogin(login);
  const hashed = hashSecret(password);
  const owner = getOwnerAdminConfig();

  if (owner && owner.login === normalizedLogin && owner.passwordHash === hashed) {
    return {
      ok: true,
      accountType: "owner",
      login: owner.login,
      fullName: owner.fullName || "Owner Admin",
      schoolId: owner.schoolId || "local-owner-school",
      schoolName: owner.schoolName || "Admin",
    };
  }

  const subAdmins = readArray(SUB_ADMIN_ACCOUNTS_KEY);
  const found = subAdmins.find(
    (item) => normalizeLogin(item?.login) === normalizedLogin && String(item?.passwordHash || "") === hashed
  );

  if (!found) {
    return {
      ok: false,
      accountType: "",
      reason: "Admin login yoki parol xato",
    };
  }

  return {
    ok: true,
    accountType: "sub",
    login: normalizeLogin(found.login),
    fullName: found.fullName || "Sub Admin",
    schoolId: owner?.schoolId || "local-owner-school",
    schoolName: owner?.schoolName || "Admin",
  };
};

export const canCurrentAdminManageAdmins = () =>
  String(localStorage.getItem("adminPrincipalType") || "") === "owner";

export const getCurrentAdminPrincipal = () => ({
  type: String(localStorage.getItem("adminPrincipalType") || ""),
  login: normalizeLogin(localStorage.getItem("adminPrincipalLogin") || ""),
  fullName: String(localStorage.getItem("fullName") || localStorage.getItem("schoolName") || "Admin"),
});

export const listSubAdmins = () => {
  return readArray(SUB_ADMIN_ACCOUNTS_KEY)
    .map((item) => ({
      id: item.id,
      login: normalizeLogin(item.login),
      fullName: item.fullName || "Sub Admin",
      createdBy: normalizeLogin(item.createdBy || ""),
      createdAt: item.createdAt || "",
    }))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

export const createSubAdmin = ({ login, password, fullName = "" } = {}) => {
  if (!canCurrentAdminManageAdmins()) {
    throw new Error("Faqat owner admin yangi admin qo'sha oladi.");
  }

  const owner = getOwnerAdminConfig();
  if (!owner) {
    throw new Error("Owner admin sozlanmagan.");
  }

  const normalizedLogin = normalizeLogin(login);
  if (!normalizedLogin || !String(password || "").trim()) {
    throw new Error("Login va parol majburiy.");
  }

  if (normalizedLogin === normalizeLogin(owner.login)) {
    throw new Error("Bu login owner adminga tegishli.");
  }

  const current = readArray(SUB_ADMIN_ACCOUNTS_KEY);
  const exists = current.some((item) => normalizeLogin(item.login) === normalizedLogin);
  if (exists) {
    throw new Error("Bu login allaqachon mavjud.");
  }

  const actor = getCurrentAdminPrincipal();
  const next = [
    {
      id: buildId(),
      login: normalizedLogin,
      passwordHash: hashSecret(password),
      fullName: String(fullName || "Sub Admin").trim() || "Sub Admin",
      createdBy: actor.login || owner.login,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ];

  writeArray(SUB_ADMIN_ACCOUNTS_KEY, next);
  logUserActivity({
    action: "sub_admin_created",
    area: "security",
    status: "success",
    message: `Yangi sub admin qo'shildi: ${normalizedLogin}`,
    targetRole: "admin",
    targetId: normalizedLogin,
    meta: {
      createdBy: actor.login || owner.login,
    },
  });

  return next[0];
};

export const removeSubAdmin = (adminId = "") => {
  if (!canCurrentAdminManageAdmins()) {
    throw new Error("Faqat owner admin adminni o'chira oladi.");
  }

  const id = String(adminId || "").trim();
  if (!id) return false;

  const current = readArray(SUB_ADMIN_ACCOUNTS_KEY);
  const target = current.find((item) => String(item.id || "") === id);
  if (!target) return false;

  const next = current.filter((item) => String(item.id || "") !== id);
  writeArray(SUB_ADMIN_ACCOUNTS_KEY, next);
  logUserActivity({
    action: "sub_admin_removed",
    area: "security",
    status: "success",
    message: `Sub admin o'chirildi: ${normalizeLogin(target.login)}`,
    targetRole: "admin",
    targetId: normalizeLogin(target.login),
  });
  return true;
};
