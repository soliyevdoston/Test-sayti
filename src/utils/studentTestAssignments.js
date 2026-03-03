const STORAGE_KEY = "admin_student_test_assignments_v1";

const asObject = (value) => (value && typeof value === "object" ? value : {});
const asUniqueArray = (value) => {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((item) => (item == null ? "" : String(item).trim())).filter(Boolean))
  );
};

export const getStudentAssignmentMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const source = asObject(parsed);

    const normalized = {};
    Object.entries(source).forEach(([studentId, testIds]) => {
      const key = String(studentId || "").trim();
      if (!key) return;
      normalized[key] = asUniqueArray(testIds);
    });
    return normalized;
  } catch {
    return {};
  }
};

export const saveStudentAssignmentMap = (map) => {
  const normalized = asObject(map);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export const getAssignedTestsByStudent = (studentId) => {
  const key = String(studentId || "").trim();
  if (!key) return [];
  const map = getStudentAssignmentMap();
  return asUniqueArray(map[key]);
};

export const assignTestToStudent = (studentId, testId) => {
  const sId = String(studentId || "").trim();
  const tId = String(testId || "").trim();
  if (!sId || !tId) return [];

  const map = getStudentAssignmentMap();
  const current = asUniqueArray(map[sId]);
  if (!current.includes(tId)) current.push(tId);
  map[sId] = current;
  saveStudentAssignmentMap(map);
  return current;
};

export const removeAssignedTestFromStudent = (studentId, testId) => {
  const sId = String(studentId || "").trim();
  const tId = String(testId || "").trim();
  if (!sId || !tId) return [];

  const map = getStudentAssignmentMap();
  const current = asUniqueArray(map[sId]).filter((id) => id !== tId);
  if (current.length) map[sId] = current;
  else delete map[sId];
  saveStudentAssignmentMap(map);
  return current;
};

export const getAssignedStudentsByTest = (testId) => {
  const tId = String(testId || "").trim();
  if (!tId) return [];

  const map = getStudentAssignmentMap();
  return Object.entries(map)
    .filter(([, tests]) => asUniqueArray(tests).includes(tId))
    .map(([studentId]) => studentId);
};
