const STORAGE_KEY = "student_personal_auth_v1";

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readRows = () => {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY) || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeRows = (rows) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(rows) ? rows : []));
};

const normalizeEmail = (email = "") => String(email || "").trim().toLowerCase();

const buildStudentId = () =>
  `PS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const registerPersonalStudent = ({
  fullName = "",
  email = "",
  password = "",
  phone = "",
}) => {
  const normalizedEmail = normalizeEmail(email);
  const safePassword = String(password || "");
  if (!normalizedEmail || !safePassword || !String(fullName || "").trim()) {
    throw new Error("Ro'yxatdan o'tish uchun ma'lumotlar to'liq emas.");
  }

  const rows = readRows();
  const exists = rows.some((row) => normalizeEmail(row?.email) === normalizedEmail);
  if (exists) {
    throw new Error("Bu email allaqachon ro'yxatdan o'tgan.");
  }

  const record = {
    id: buildStudentId(),
    fullName: String(fullName || "").trim(),
    email: normalizedEmail,
    password: safePassword,
    phone: String(phone || "").trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rows.unshift(record);
  writeRows(rows);
  return record;
};

export const loginPersonalStudentLocally = (email = "", password = "") => {
  const normalizedEmail = normalizeEmail(email);
  const safePassword = String(password || "");
  if (!normalizedEmail || !safePassword) return null;

  const rows = readRows();
  const found = rows.find(
    (row) => normalizeEmail(row?.email) === normalizedEmail && String(row?.password || "") === safePassword
  );

  if (!found) return null;

  return {
    _id: String(found.id || ""),
    fullName: String(found.fullName || "O'quvchi"),
    email: normalizedEmail,
    teacherId: "",
    groupId: "",
  };
};

export const hasPersonalStudentByEmail = (email = "") => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;
  const rows = readRows();
  return rows.some((row) => normalizeEmail(row?.email) === normalizedEmail);
};
