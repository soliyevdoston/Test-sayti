const NOTIFICATION_KEY = "platform_notifications_v1";
const MAX_NOTIFICATIONS = 400;
const NOTIFICATION_EVENT = "platform-notifications-updated";

const safeParse = (raw, fallback) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
};

const readRows = () => {
  const raw = localStorage.getItem(NOTIFICATION_KEY);
  const parsed = safeParse(raw || "[]", []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeRows = (rows = []) => {
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(Array.isArray(rows) ? rows.slice(0, MAX_NOTIFICATIONS) : []));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
  }
};

const toAudienceKey = (role = "", userId = "") => {
  const normalizedRole = String(role || "").trim().toLowerCase();
  if (!normalizedRole || normalizedRole === "all") return "all";
  const normalizedUserId = String(userId || "").trim();
  return normalizedUserId ? `${normalizedRole}:${normalizedUserId}` : normalizedRole;
};

const getCurrentAudienceKey = () => {
  const role = String(localStorage.getItem("userRole") || "guest").toLowerCase();
  const userId =
    (role === "teacher" && localStorage.getItem("teacherId")) ||
    (role === "student" && localStorage.getItem("studentId")) ||
    (role === "admin" && localStorage.getItem("schoolId")) ||
    "";
  return toAudienceKey(role, userId);
};

const buildNotificationId = () =>
  `NTF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const isVisibleForAudience = (row, audienceKey) => {
  const directAudience = String(row.audience || "all");
  if (directAudience === "all") return true;
  if (directAudience === audienceKey) return true;

  const roleOnly = audienceKey.split(":")[0];
  return directAudience === roleOnly;
};

export const subscribeNotifications = (listener) => {
  if (typeof window === "undefined" || typeof listener !== "function") return () => {};
  window.addEventListener(NOTIFICATION_EVENT, listener);
  return () => window.removeEventListener(NOTIFICATION_EVENT, listener);
};

export const pushNotification = ({
  title = "Yangi bildirishnoma",
  message = "",
  level = "info",
  targetRole = "all",
  targetId = "",
  link = "",
  meta = {},
} = {}) => {
  const rows = readRows();
  rows.unshift({
    id: buildNotificationId(),
    title: String(title || "Yangi bildirishnoma"),
    message: String(message || ""),
    level: String(level || "info"),
    audience: toAudienceKey(targetRole, targetId),
    link: String(link || ""),
    createdAt: new Date().toISOString(),
    readBy: [],
    meta: meta && typeof meta === "object" ? meta : {},
  });
  writeRows(rows);
};

export const getNotificationsForCurrentUser = ({ includeRead = true, limit = 20 } = {}) => {
  const audienceKey = getCurrentAudienceKey();
  const rows = readRows();
  const normalizedLimit = Math.max(Number(limit || 20), 1);
  return rows
    .filter((row) => isVisibleForAudience(row, audienceKey))
    .filter((row) => {
      if (includeRead) return true;
      return !Array.isArray(row.readBy) || !row.readBy.includes(audienceKey);
    })
    .slice(0, normalizedLimit);
};

export const getUnreadNotificationCount = () =>
  getNotificationsForCurrentUser({ includeRead: false, limit: MAX_NOTIFICATIONS }).length;

export const markNotificationAsRead = (notificationId) => {
  const id = String(notificationId || "").trim();
  if (!id) return;

  const audienceKey = getCurrentAudienceKey();
  const rows = readRows().map((row) => {
    if (String(row.id) !== id) return row;
    const readBy = Array.isArray(row.readBy) ? row.readBy : [];
    if (!readBy.includes(audienceKey)) {
      return {
        ...row,
        readBy: [...readBy, audienceKey],
      };
    }
    return row;
  });
  writeRows(rows);
};

export const markAllNotificationsAsRead = () => {
  const audienceKey = getCurrentAudienceKey();
  const rows = readRows().map((row) => {
    if (!isVisibleForAudience(row, audienceKey)) return row;
    const readBy = Array.isArray(row.readBy) ? row.readBy : [];
    if (readBy.includes(audienceKey)) return row;
    return {
      ...row,
      readBy: [...readBy, audienceKey],
    };
  });
  writeRows(rows);
};

export const clearNotifications = () => {
  writeRows([]);
};
