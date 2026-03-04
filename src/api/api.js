import axios from "axios";
import { logUserActivity } from "../utils/activityLog";
import { getTeacherApiAccessState } from "../utils/teacherAccessTools";
import { getDeviceFingerprint } from "../utils/billingTools";

const normalizeBaseUrl = (value) => String(value || "").trim().replace(/\/+$/, "");
const FALLBACK_BASE_URL = "https://online-test-backend-2.onrender.com";
const DEVICE_FINGERPRINT_HEADER = "x-device-fingerprint";

export const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) || FALLBACK_BASE_URL;
const API_URL = `${BASE_URL}/api`;
export const buildChatRoomId = (teacherId = "", studentId = "") =>
  `chat_${String(teacherId || "").trim()}_${String(studentId || "").trim()}`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // ⚠️ Ngrok uchun bo‘lgan qator endi kerak emas
    // "ngrok-skip-browser-warning": "true",
  },
});

const shouldTrackApiActivity = (method = "", url = "") => {
  const normalizedMethod = String(method || "").toLowerCase();
  const normalizedUrl = String(url || "").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(normalizedMethod)) return true;
  return normalizedUrl.includes("/login");
};

const buildTeacherPlanError = (message) => {
  const error = new Error(message || "Bu amal faqat Pro tarifda ishlaydi.");
  error.name = "TeacherPlanAccessError";
  error.code = "TEACHER_PLAN_BLOCKED";
  error.isAccessDenied = true;
  return error;
};

const resolveCurrentSessionPayload = () => {
  const role = String(localStorage.getItem("userRole") || "").toLowerCase();
  if (!role) return null;

  if (role === "admin") {
    const accountId = String(localStorage.getItem("schoolId") || "").trim();
    if (!accountId) return null;
    return { role, accountId };
  }

  if (role === "teacher") {
    const accountId = String(localStorage.getItem("teacherId") || "").trim();
    if (!accountId) return null;
    return { role, accountId };
  }

  if (role === "student") {
    const accountId = String(localStorage.getItem("studentId") || "").trim();
    if (!accountId) return null;
    return { role, accountId };
  }

  return null;
};

const wait = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryUploadRequest = (error) => {
  const status = Number(error?.response?.status || 0);
  if (!status) return true; // network/cors/timeout
  if (status >= 500) return true;
  return false;
};

const postMultipartWithRetry = async (url, formData, retries = 1) => {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !shouldRetryUploadRequest(error)) {
        throw error;
      }
      await wait(550);
    }
  }
  throw lastError || new Error("Upload xatoligi");
};

api.interceptors.request.use(
  (config) => {
    const next = config;
    next.metadata = { startedAt: Date.now() };

    try {
      const fingerprint = String(getDeviceFingerprint() || "").trim();
      if (fingerprint) {
        next.headers = {
          ...(next.headers || {}),
          [DEVICE_FINGERPRINT_HEADER]: fingerprint,
        };
      }
    } catch {
      // no-op: fingerprint ixtiyoriy fallback
    }

    const role = String(localStorage.getItem("userRole") || "").toLowerCase();
    if (role === "teacher") {
      const teacherId = localStorage.getItem("teacherId");
      const accessState = getTeacherApiAccessState(teacherId, next?.method, next?.url);
      if (!accessState.allowed) {
        logUserActivity({
          action: `PLAN_BLOCK ${String(accessState.method || "").toUpperCase()} ${accessState.path || ""}`,
          area: "subscription",
          status: "failed",
          message: accessState.reason,
          targetRole: "teacher",
          targetId: String(teacherId || ""),
          meta: {
            path: accessState.path,
            method: accessState.method,
          },
        });
        return Promise.reject(buildTeacherPlanError(accessState.reason));
      }
    }

    return next;
  },
  (error) => Promise.reject(error)
);

export const releaseDeviceSession = async (payload = null) => {
  const resolvedPayload = payload && payload.role ? payload : resolveCurrentSessionPayload();
  if (!resolvedPayload?.role || !resolvedPayload?.accountId) return false;

  try {
    await api.post("/auth/logout", {
      role: String(resolvedPayload.role || "").toLowerCase(),
      accountId: String(resolvedPayload.accountId || "").trim(),
    });
    return true;
  } catch {
    return false;
  }
};

api.interceptors.response.use(
  (response) => {
    const method = response?.config?.method || "";
    const url = response?.config?.url || "";
    if (shouldTrackApiActivity(method, url)) {
      const duration = Date.now() - Number(response?.config?.metadata?.startedAt || Date.now());
      logUserActivity({
        action: `${String(method).toUpperCase()} ${url}`,
        area: "api",
        status: "success",
        message: "API amal bajarildi",
        meta: {
          statusCode: response?.status,
          durationMs: duration,
        },
      });
    }
    return response;
  },
  (error) => {
    const method = error?.config?.method || "";
    const url = error?.config?.url || "";
    if (shouldTrackApiActivity(method, url)) {
      const duration = Date.now() - Number(error?.config?.metadata?.startedAt || Date.now());
      logUserActivity({
        action: `${String(method).toUpperCase()} ${url}`,
        area: "api",
        status: "failed",
        message: error?.response?.data?.msg || error?.message || "API xato",
        meta: {
          statusCode: error?.response?.status || 0,
          durationMs: duration,
        },
      });
    }
    return Promise.reject(error);
  }
);

/* ===================== LOGIN ===================== */

export const loginUser = async (
  role,
  username,
  password,
  fullName = "",
  studentId = "",
) => {
  // ===== ADMIN (School) =====
  if (role === "admin") {
    const res = await api.post("/school/login", {
      name: username,
      adminPassword: password,
    });

    localStorage.setItem("schoolId", res.data.schoolId);
    localStorage.setItem("schoolName", res.data.name);
    localStorage.setItem("userRole", "admin");

    return {
      ...res.data,
      role: "admin",
      message: "Admin tizimga kirdi",
    };
  }

  // ===== TEACHER (O'qituvchi) =====
  if (role === "teacher") {
    const res = await api.post("/auth/teacher-login", {
      username,
      password,
    });

    localStorage.setItem("teacherId", res.data.teacherId);
    localStorage.setItem("teacherName", res.data.fullName);
    localStorage.setItem("fullName", res.data.fullName);
    localStorage.setItem("userRole", "teacher");

    return {
      ...res.data,
      role: "teacher",
      message: "Xush kelibsiz, ustoz!",
    };
  }

  // ===== STUDENT (O'quvchi) =====
  if (role === "student") {
    const res = await api.post("/student/login", {
      login: username,
      password,
      studentName: fullName,
      studentId,
    });

    const resolvedStudentName = res.data.studentName || fullName || "";
    localStorage.setItem("studentTestId", res.data.testId);
    localStorage.setItem("studentName", resolvedStudentName);
    localStorage.setItem("fullName", resolvedStudentName);
    localStorage.setItem("userRole", "student");

    return {
      ...res.data,
      role: "student",
      message: "Testga muvaffaqiyatli kirdingiz!",
    };
  }

  throw new Error("Role noto‘g‘ri tanlandi!");
};

/* ===================== ADMIN API ===================== */

export const createTeacher = (data) => api.post("/admin/create-teacher", data);
export const getTeachers = () => api.get("/admin/teachers");
export const deleteTeacher = (teacherId) =>
  api.delete(`/admin/delete-teacher/${teacherId}`);
export const updateTeacher = (id, data) =>
  api.put(`/admin/update-teacher/${id}`, data);
export const updateAdminApi = (id, data) =>
  api.put(`/school/update/${id}`, data);
export const checkLoginAvailabilityApi = (principal) =>
  api.get("/auth/login-availability", {
    params: {
      principal: String(principal || "").trim().toLowerCase(),
    },
  });

/* ===================== TEACHER API ===================== */

// Fayl yuklash (Multipart Form Data)
export const teacherUploadTest = (formData) => postMultipartWithRetry("/teacher/upload", formData, 1);

export const parseTextApi = (data) => api.post("/teacher/parse-text", data);
export const parsePreviewApi = (data) =>
  api.post("/teacher/parse-preview", data);
export const uploadPreviewApi = (formData) => postMultipartWithRetry("/teacher/upload-preview", formData, 1);

export const getTeacherTests = (teacherId) =>
  api.get(`/teacher/tests/${teacherId}`);

export const getTeacherStats = (teacherId) =>
  api.get(`/teacher/stats/${teacherId}`);

export const startTestApi = (id) => api.post(`/teacher/start/${id}`);
export const stopTestApi = (id) => api.post(`/teacher/stop/${id}`);
export const updateTestAccess = (id, data) =>
  api.patch(`/teacher/update-test-access/${id}`, data);
export const deleteTestApi = (id) => api.delete(`/teacher/delete/${id}`);

export const getResultsApi = (testId) => api.get(`/teacher/results/${testId}`);

export const getAnalysisApi = (resultId) =>
  api.get(`/teacher/analysis/${resultId}`);

// Subjects & Groups
export const getTeacherSubjects = (teacherId) =>
  api.get(`/teacher/subjects/${teacherId}`);
export const addTeacherSubject = (data) =>
  api.post("/teacher/add-subject", data);
export const deleteTeacherSubject = (id) =>
  api.delete(`/teacher/delete-subject/${id}`);

export const getTeacherGroups = (teacherId) =>
  api.get(`/teacher/groups/${teacherId}`);
export const addTeacherGroup = (data) => api.post("/teacher/add-group", data);
export const deleteTeacherGroup = (id) =>
  api.delete(`/teacher/delete-group/${id}`);

// Advanced Student Management
export const getTeacherStudents = (teacherId) =>
  api.get(`/teacher/students/${teacherId}`);
export const getGroupStudents = (groupId) =>
  api.get(`/teacher/group/${groupId}/students`);

// ✅ O'QUVCHI NATIJALARI VA QAYTA YECHISH
export const getMyResults = (studentId) =>
  api.get(`/student/my-results/${studentId}`);
export const requestRetake = (data) =>
  api.post("/student/request-retake", data);

// ✅ O'QITUVCHI: QAYTA YECHISH SO'ROVLARI
export const getRetakeRequests = (teacherId) =>
  api.get(`/teacher/retake-requests/${teacherId}`);
export const handleRetakeRequest = (data) =>
  api.post("/teacher/handle-retake", data);

export const addStudentApi = (data) => api.post("/teacher/add-student", data);
export const deleteStudentApi = (id) =>
  api.delete(`/teacher/delete-student/${id}`);

export const duplicateTestApi = (id) =>
  api.post(`/teacher/duplicate-test/${id}`);
export const updateTestApi = (id, data) =>
  api.put(`/teacher/update-test/${id}`, data);

// Manual Test Creation
export const createManualTestApi = (data) =>
  api.post("/teacher/create-manual-test", data);

// Chat
export const getChatHistoryApi = (teacherId, studentId) =>
  api.get(`/chat/history/${teacherId}/${studentId}`);
export const getChatListApi = (teacherId) => api.get(`/chat/list/${teacherId}`);
export const sendMessageApi = (data) => api.post("/chat/send", data);

/* ===================== STUDENT API ===================== */

export const submitTestApi = (data) => api.post("/student/submit", data);

export const studentIndividualLogin = (data) => api.post("/auth/student-login", data);
export const registerPersonalStudentApi = (data) => api.post("/auth/personal-student-register", data);

export const getAvailableTests = (teacherId, studentGroupId) => {
  const url = studentGroupId
    ? `/student/available-tests/${teacherId}?studentGroupId=${studentGroupId}`
    : `/student/available-tests/${teacherId}`;
  return api.get(url);
};

export default api;
