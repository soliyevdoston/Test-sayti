import axios from "axios";

// ⚠️ DIQQAT: Ngrok har safar o'chib yonganda bu havola o'zgaradi.
// Uni terminaldan olib, shu yerga yangilang!
const API_URL = "https://kayleigh-phototropic-cristine.ngrok-free.dev/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    // ⚠️ Bu qator Ngrok ogohlantirish oynasini o'tkazib yuborish uchun shart:
    "ngrok-skip-browser-warning": "true",
  },
});

/* ===================== LOGIN ===================== */

export const loginUser = async (role, username, password, fullName = "") => {
  try {
    // ===== ADMIN (Statik Login) =====
    if (role === "admin") {
      if (username === "admin" && password === "admin123") {
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

export const deleteTestApi = (testId) =>
  api.delete(`/teacher/delete/${testId}`);

export const getResultsApi = (testId) => api.get(`/teacher/results/${testId}`);

export const getAnalysisApi = (resultId) =>
  api.get(`/teacher/analysis/${resultId}`);

/* ===================== STUDENT API ===================== */

export const submitTestApi = (data) => api.post("/student/submit", data);

export default api;
