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

export const loginUser = async (role, username, password, fullName = "") => {
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
    throw new Error(
      err?.response?.data?.msg || err?.response?.data?.error || err.message
    );
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

export const startTestApi = (testId) => api.post(`/teacher/start/${testId}`);
export const stopTestApi = (testId) => api.post(`/teacher/stop/${testId}`);

export const deleteTestApi = (testId) =>
  api.delete(`/teacher/delete/${testId}`);

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
export const addStudentApi = (data) => api.post("/teacher/add-student", data);
export const deleteStudentApi = (id) => api.delete(`/teacher/delete-student/${id}`);

// Manual Test Creation
export const createManualTestApi = (data) => api.post("/teacher/create-manual-test", data);

// Chat System
export const getChatHistory = (teacherId, studentId) => 
  api.get(`/chat/history/${teacherId}/${studentId}`);
export const sendChatMessage = (data) => api.post("/chat/send", data);
 
 /* ===================== STUDENT API ===================== */

export const submitTestApi = (data) => api.post("/student/submit", data);
export const studentIndividualLogin = (data) => api.post("/auth/student-login", data);
export const getAvailableTests = (teacherId) => api.get(`/student/available-tests/${teacherId}`);

export default api;
