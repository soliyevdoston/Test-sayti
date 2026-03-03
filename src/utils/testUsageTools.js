const STORAGE_KEY = "teacher_test_usage_v1";

const readUsageMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeUsageMap = (map) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
};

export const getTeacherTestUsage = (teacherId, baselineCurrentCount = 0) => {
  if (!teacherId) return Math.max(Number(baselineCurrentCount) || 0, 0);
  const safeBaseline = Math.max(Number(baselineCurrentCount) || 0, 0);

  const map = readUsageMap();
  const stored = Math.max(Number(map[teacherId]) || 0, 0);
  const resolved = Math.max(stored, safeBaseline);

  if (resolved !== stored) {
    map[teacherId] = resolved;
    writeUsageMap(map);
  }

  return resolved;
};

export const syncTeacherTestUsageWithCurrent = (teacherId, currentCount = 0) => {
  return getTeacherTestUsage(teacherId, currentCount);
};

export const incrementTeacherTestUsage = (teacherId, delta = 1, baselineCurrentCount = 0) => {
  if (!teacherId) return 0;
  const map = readUsageMap();
  const currentUsage = getTeacherTestUsage(teacherId, baselineCurrentCount);
  const increment = Math.max(Number(delta) || 0, 0);
  const nextUsage = currentUsage + increment;
  map[teacherId] = nextUsage;
  writeUsageMap(map);
  return nextUsage;
};
