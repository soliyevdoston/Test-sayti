import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Sahifalar
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import TeacherLogin from "./pages/TeacherLogin.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import Home from "./pages/Home.jsx"; // <--- Home sahifangiz turibdi

function App() {
  return (
    <BrowserRouter>
      {/* 
        Dashboardlarda biz 'react-toastify' ishlatdik, shuning uchun 
        bu yerda ham Toaster o'rniga ToastContainer qo'yamiz.
      */}
      <ToastContainer position="top-right" autoClose={3000} />

      <Routes>
        {/* Asosiy sahifa (Home) */}
        <Route path="/" element={<Home />} />

        {/* --- ADMIN --- */}
        {/* Eslatma: 'admin-login' emas, 'admin/login' qildik (standart bo'yicha) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* --- TEACHER --- */}
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

        {/* --- STUDENT --- */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
