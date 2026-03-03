const ACTIVITY_LOGS_KEY = "activity_logs_v1";
const MAX_ACTIVITY_ROWS = 3000;

const safeJsonParse = (value, fallback) => {
  try {
    const parsed = JSON.parse(value);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readLogs = () => {
  const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
  const parsed = safeJsonParse(raw || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeLogs = (rows) => {
  const safeRows = Array.isArray(rows) ? rows.slice(0, MAX_ACTIVITY_ROWS) : [];
  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(safeRows));
};

const resolveActor = () => {
  const role = String(localStorage.getItem("userRole") || "guest").toLowerCase();
  const actorId =
    (role === "teacher" && localStorage.getItem("teacherId")) ||
    (role === "student" && localStorage.getItem("studentId")) ||
    (role === "admin" && localStorage.getItem("schoolId")) ||
    "";
  const actorName =
    localStorage.getItem("fullName") ||
    localStorage.getItem("teacherName") ||
    localStorage.getItem("studentName") ||
    localStorage.getItem("schoolName") ||
    "Guest";

  return {
    actorRole: role,
    actorId: String(actorId || ""),
    actorName: String(actorName || "Guest"),
  };
};

const buildLogId = () =>
  `ACT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const logUserActivity = ({
  action = "unknown",
  area = "general",
  status = "success",
  message = "",
  actorRole = "",
  actorId = "",
  actorName = "",
  targetRole = "",
  targetId = "",
  meta = {},
} = {}) => {
  try {
    const actor = resolveActor();
    const logs = readLogs();
    logs.unshift({
      id: buildLogId(),
      action: String(action || "unknown"),
      area: String(area || "general"),
      status: String(status || "success"),
      message: String(message || ""),
      actorRole: String(actorRole || actor.actorRole || "guest"),
      actorId: String(actorId || actor.actorId || ""),
      actorName: String(actorName || actor.actorName || "Guest"),
      targetRole: String(targetRole || ""),
      targetId: String(targetId || ""),
      meta: meta && typeof meta === "object" ? meta : {},
      createdAt: new Date().toISOString(),
    });
    writeLogs(logs);
  } catch {
    // no-op
  }
};

export const getActivityLogs = () => readLogs();

export const clearActivityLogs = () => {
  writeLogs([]);
};

export const getActivityStats = (rows = null) => {
  const logs = Array.isArray(rows) ? rows : getActivityLogs();
  return logs.reduce(
    (acc, log) => {
      const role = String(log.actorRole || "unknown").toLowerCase();
      const area = String(log.area || "general").toLowerCase();
      const status = String(log.status || "success").toLowerCase();

      acc.total += 1;
      acc.byRole[role] = (acc.byRole[role] || 0) + 1;
      acc.byArea[area] = (acc.byArea[area] || 0) + 1;
      acc.byStatus[status] = (acc.byStatus[status] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      byRole: {},
      byArea: {},
      byStatus: {},
    }
  );
};

