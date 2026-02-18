import axios from "axios";

// ⚠️ DIQQAT: Ngrok har safar o'chib yonganda bu havola o'zgaradi.
// Uni terminaldan olib, shu yerga yangilang!
export const BASE_URL = "https://online-test-backend-2.onrender.com";
const API_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // ⚠️ Ngrok uchun bo‘lgan qator endi kerak emas
    // "ngrok-skip-browser-warning": "true",
  },
});

/* ===================== LOGIN ===================== */

export const loginUser = async (role, username, password, fullName = "", studentId = "") => {
  try {
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
        studentId
      });

      localStorage.setItem("studentTestId", res.data.testId);
      localStorage.setItem("studentName", res.data.studentName);
      localStorage.setItem("userRole", "student");

      return {
        ...res.data,
        role: "student",
        message: "Testga muvaffaqiyatli kirdingiz!",
      };
    }

    throw new Error("Role noto‘g‘ri tanlandi!");
  } catch (err) {
    throw err;
  }
};

/* ===================== ADMIN API ===================== */

export const createTeacher = (data) => api.post("/admin/create-teacher", data);
export const getTeachers = () => api.get("/admin/teachers");
export const deleteTeacher = (teacherId) =>
  api.delete(`/admin/delete-teacher/${teacherId}`);
export const updateTeacher = (id, data) => api.put(`/admin/update-teacher/${id}`, data);
export const updateAdminApi = (id, data) => api.put(`/school/update/${id}`, data);

/* ===================== TEACHER API ===================== */

// Fayl yuklash (Multipart Form Data)
export const teacherUploadTest = (formData) =>
  api.post("/teacher/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const parseTextApi = (data) => api.post("/teacher/parse-text", data);
export const parsePreviewApi = (data) => api.post("/teacher/parse-preview", data);
export const uploadPreviewApi = (formData) =>
  api.post("/teacher/upload-preview", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const getTeacherTests = (teacherId) =>
  api.get(`/teacher/tests/${teacherId}`);

export const getTeacherStats = (teacherId) => api.get(`/teacher/stats/${teacherId}`);

export const startTestApi = (id) => api.post(`/teacher/start/${id}`);
export const stopTestApi = (id) => api.post(`/teacher/stop/${id}`);
export const updateTestAccess = (id, data) => api.patch(`/teacher/update-test-access/${id}`, data);
export const deleteTestApi = (id) =>
  api.delete(`/teacher/delete/${id}`);

export const getResultsApi = (testId) => api.get(`/teacher/results/${testId}`);

export const getAnalysisApi = (resultId) =>
  api.get(`/teacher/analysis/${resultId}`);

// Subjects & Groups
export const getTeacherSubjects = (teacherId) => api.get(`/teacher/subjects/${teacherId}`);
export const addTeacherSubject = (data) => api.post("/teacher/add-subject", data);
export const deleteTeacherSubject = (id) => api.delete(`/teacher/delete-subject/${id}`);

export const getTeacherGroups = (teacherId) => api.get(`/teacher/groups/${teacherId}`);
export const addTeacherGroup = (data) => api.post("/teacher/add-group", data);
export const deleteTeacherGroup = (id) => api.delete(`/teacher/delete-group/${id}`);

// Advanced Student Management
export const getTeacherStudents = (teacherId) => api.get(`/teacher/students/${teacherId}`);
export const getGroupStudents = (groupId) => api.get(`/teacher/group/${groupId}/students`);

// ✅ O'QUVCHI NATIJALARI VA QAYTA YECHISH
export const getMyResults = (studentId) => api.get(`/student/my-results/${studentId}`);
export const requestRetake = (data) => api.post("/student/request-retake", data);

// ✅ O'QITUVCHI: QAYTA YECHISH SO'ROVLARI
export const getRetakeRequests = (teacherId) => api.get(`/teacher/retake-requests/${teacherId}`);
export const handleRetakeRequest = (data) => api.post("/teacher/handle-retake", data);

export const addStudentApi = (data) => api.post("/teacher/add-student", data);
export const deleteStudentApi = (id) => api.delete(`/teacher/delete-student/${id}`);

export const duplicateTestApi = (id) => api.post(`/teacher/duplicate-test/${id}`);
export const updateTestApi = (id, data) => api.put(`/teacher/update-test/${id}`, data);

// Manual Test Creation
export const createManualTestApi = (data) => api.post("/teacher/create-manual-test", data);

// Chat
export const getChatHistoryApi = (teacherId, studentId) => api.get(`/chat/history/${teacherId}/${studentId}`);
export const getChatListApi = (teacherId) => api.get(`/chat/list/${teacherId}`);
export const sendMessageApi = (data) => api.post("/chat/send", data);
 
/* ===================== STUDENT API ===================== */

const handleApiError = (err) => {
  throw err;
};

export const submitTestApi = async (data) => {
  try { return await api.post("/student/submit", data); }
  catch (err) { handleApiError(err); }
};

export const studentIndividualLogin = async (data) => {
  try { return await api.post("/auth/student-login", data); }
  catch (err) { handleApiError(err); }
};

export const getAvailableTests = async (teacherId, studentGroupId) => {
  try { 
    const url = studentGroupId 
      ? `/student/available-tests/${teacherId}?studentGroupId=${studentGroupId}`
      : `/student/available-tests/${teacherId}`;
    return await api.get(url); 
  }
  catch (err) { handleApiError(err); }
};

export default api;
