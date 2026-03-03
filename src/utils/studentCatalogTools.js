const STORAGE_KEY = "student_personal_catalog_v1";

export const DEFAULT_STUDENT_DIRECTIONS = [
  "Matematika",
  "Fizika",
  "Kimyo",
  "Biologiya",
  "Ona tili",
  "Tarix",
  "Ingliz tili",
  "Informatika",
];

const safeJsonParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readList = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse(raw || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const saveList = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.isArray(list) ? list : []));
};

const normalizeText = (value, fallback = "") => String(value || fallback).trim();

const normalizeDirection = (value) => normalizeText(value, "Umumiy");

const buildCatalogId = (teacherId, testId) =>
  `${normalizeText(teacherId).toLowerCase()}::${normalizeText(testId).toLowerCase()}`;

const normalizeEntry = (entry = {}) => {
  const teacherId = normalizeText(entry.teacherId);
  const testId = normalizeText(entry.testId);
  const catalogId = normalizeText(entry.catalogId) || buildCatalogId(teacherId, testId);

  return {
    catalogId,
    teacherId,
    teacherName: normalizeText(entry.teacherName, "-"),
    testId,
    title: normalizeText(entry.title, "Nomsiz test"),
    description: normalizeText(entry.description),
    duration: Number(entry.duration || 30),
    testLogin: normalizeText(entry.testLogin),
    isStarted: Boolean(entry.isStarted),
    direction: normalizeDirection(entry.direction),
    active: entry.active !== false,
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
};

export const getStudentCatalogTests = () =>
  readList()
    .map((entry) => normalizeEntry(entry))
    .filter((entry) => entry.catalogId && entry.teacherId && entry.testId)
    .sort((a, b) => {
      const dirCompare = a.direction.localeCompare(b.direction, "uz");
      if (dirCompare !== 0) return dirCompare;
      return a.title.localeCompare(b.title, "uz");
    });

export const getStudentCatalogDirections = (source = null) => {
  const list = Array.isArray(source) ? source : getStudentCatalogTests();
  const set = new Set(
    list
      .map((item) => normalizeDirection(item.direction))
      .filter(Boolean)
  );
  return Array.from(set).sort((a, b) => a.localeCompare(b, "uz"));
};

export const upsertStudentCatalogTest = (payload) => {
  const entry = normalizeEntry(payload);
  if (!entry.catalogId || !entry.teacherId || !entry.testId || !entry.testLogin) {
    throw new Error("Test ma'lumotlari to'liq emas");
  }

  const current = getStudentCatalogTests();
  const next = current.filter((item) => item.catalogId !== entry.catalogId);
  next.unshift({
    ...entry,
    updatedAt: new Date().toISOString(),
  });
  saveList(next);
  return entry.catalogId;
};

export const setStudentCatalogTestActive = (catalogId, active) => {
  const id = normalizeText(catalogId);
  if (!id) return;
  const current = getStudentCatalogTests();
  const next = current.map((item) =>
    item.catalogId === id
      ? {
          ...item,
          active: Boolean(active),
          updatedAt: new Date().toISOString(),
        }
      : item
  );
  saveList(next);
};

export const removeStudentCatalogTest = (catalogId) => {
  const id = normalizeText(catalogId);
  if (!id) return;
  const current = getStudentCatalogTests();
  const next = current.filter((item) => item.catalogId !== id);
  saveList(next);
};

export const getActiveStudentCatalogTests = () =>
  getStudentCatalogTests().filter((item) => item.active);
