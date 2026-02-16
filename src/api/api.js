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
    // ===== ADMIN (Statik Login) =====
    if (role === "admin") {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem("userRole", "admin");
        return {
          role: "admin",
          message: "Admin tizimga kirdi",
        };
      }
      throw new Error("Admin logini yoki paroli xato!");
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

/* ===================== TEACHER API ===================== */

// Fayl yuklash (Multipart Form Data)
export const teacherUploadTest = (formData) =>
  api.post("/teacher/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      // Fayl yuklashda ham header qolishi kerak
      "ngrok-skip-browser-warning": "true",
    },
  });

export const getTeacherTests = (teacherId) =>
  api.get(`/teacher/tests/${teacherId}`);

export const startTestApi = (testId) => api.post(`/teacher/start/${testId}`);
export const stopTestApi = (testId) => api.post(`/teacher/stop/${testId}`);

export const deleteTestApi = (testId) =>
  api.delete(`/teacher/delete/${testId}`);

export const getResultsApi = (testId) => api.get(`/teacher/results/${testId}`);

export const getAnalysisApi = (resultId) =>
  api.get(`/teacher/analysis/${resultId}`);

// Subjects & Groups
export const getTeacherSubjects = (teacherId) => api.get(`/subjects/${teacherId}`);
export const addTeacherSubject = (data) => api.post("/add-subject", data);
export const deleteTeacherSubject = (id) => api.delete(`/delete-subject/${id}`);

export const getTeacherGroups = (teacherId) => api.get(`/groups/${teacherId}`);
export const addTeacherGroup = (data) => api.post("/add-group", data);
export const deleteTeacherGroup = (id) => api.delete(`/delete-group/${id}`);

// Advanced Student Management
export const getTeacherStudents = (teacherId) => api.get(`/students/${teacherId}`);
export const getGroupStudents = (groupId) => api.get(`/group/${groupId}/students`);
export const addStudentApi = (data) => api.post("/add-student", data);
export const deleteStudentApi = (id) => api.delete(`/delete-student/${id}`);

// Manual Test Creation
export const createManualTestApi = (data) => api.post("/teacher/create-manual-test", data);

// Chat System
export const getChatHistory = (teacherId, studentId) => 
  api.get(`/chat/history/${teacherId}/${studentId}`);
export const sendChatMessage = (data) => api.post("/chat/send", data);
 
 /* ===================== SUBSCRIPTION API ===================== */
 
 export const getSubscriptionPlans = () => api.get("/subscriptions/plans");
 
 export const createSubscription = (data) => api.post("/subscriptions/create", data);
 
 export const getSubscriptionStatus = (teacherId) => api.get(`/subscriptions/status/${teacherId}`);
 
 export const verifyPayment = (data) => api.post("/subscriptions/verify", data);
 
 /* ===================== STUDENT API ===================== */

export const submitTestApi = (data) => api.post("/student/submit", data);
export const studentIndividualLogin = (data) => api.post("/auth/student-login", data);

export default api;
