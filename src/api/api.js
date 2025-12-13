import axios from "axios";

// Backend manzili
const API_URL = "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_URL,
});

// Yagona Login funksiyasi (Rolega qarab ishlaydi)
export const loginUser = async (role, username, password, fullName = "") => {
  // 1. ADMIN (Backendda admin yo'q, shunchaki qattiq kodlaymiz)
  if (role === "admin") {
    if (username === "admin" && password === "admin123") {
      return { message: "Admin tizimga kirdi", role: "admin" };
    } else {
      throw new Error("Admin logini yoki paroli xato!");
    }
  }

  // 2. TEACHER (O'qituvchi)
  if (role === "teacher") {
    const res = await api.post("/auth/teacher-login", { username, password });
    // ID va Ismni saqlab qo'yamiz
    localStorage.setItem("teacherId", res.data.teacherId);
    localStorage.setItem("teacherName", res.data.fullName);
    return { ...res.data, message: "Xush kelibsiz, Ustoz!" };
  }

  // 3. STUDENT (O'quvchi)
  if (role === "student") {
    // O'quvchi uchun username bu -> testLogin, password -> testPassword
    const res = await api.post("/student/login", {
      login: username,
      password: password,
      studentName: fullName, // <--- Qo'shimcha ism
    });

    // Test ma'lumotlarini saqlaymiz
    localStorage.setItem("studentTestId", res.data.testId);
    localStorage.setItem("studentName", res.data.studentName);

    return { ...res.data, message: "Testga muvaffaqiyatli kirdingiz!" };
  }
};

// ... Qolgan API funksiyalar (Test yuklash, Natijalar va h.k.)
// Bularni keyinroq kerak bo'lganda qo'shamiz yoki oldingi variantdan qolsin.
export const teacherUploadTest = (formData) =>
  api.post("/teacher/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const getTeacherTests = () => api.get("/teacher/tests");
export const startTestApi = (testId) => api.post(`/teacher/start/${testId}`);
export const deleteTestApi = (testId) =>
  api.delete(`/teacher/delete/${testId}`);
export const submitTestApi = (data) => api.post("/student/submit", data);
export const getResultsApi = (testId) => api.get(`/teacher/results/${testId}`);
export const getAnalysisApi = (resultId) =>
  api.get(`/teacher/analysis/${resultId}`);

export default api;
