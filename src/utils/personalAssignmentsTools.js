const STORAGE_KEY = "student_personal_assignments_v1";

const safeJsonParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readMap = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse(raw || "{}", {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const writeMap = (map) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map && typeof map === "object" ? map : {}));
};

const normalize = (value) => String(value || "").trim();

export const getPersonalAssignmentsMap = () => readMap();

export const getAssignedCatalogIds = (studentId) => {
  const sid = normalize(studentId);
  if (!sid) return [];
  const map = readMap();
  const list = map[sid];
  return Array.isArray(list) ? list.filter(Boolean).map((item) => normalize(item)) : [];
};

export const setAssignedCatalogIds = (studentId, catalogIds = []) => {
  const sid = normalize(studentId);
  if (!sid) return;
  const map = readMap();
  map[sid] = Array.from(new Set((Array.isArray(catalogIds) ? catalogIds : []).map((item) => normalize(item)).filter(Boolean)));
  writeMap(map);
};

export const removeAssignedCatalogId = (studentId, catalogId) => {
  const sid = normalize(studentId);
  const cid = normalize(catalogId);
  if (!sid || !cid) return;
  const current = getAssignedCatalogIds(sid);
  setAssignedCatalogIds(sid, current.filter((item) => item !== cid));
};

