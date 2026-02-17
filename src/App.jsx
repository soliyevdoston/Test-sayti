import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";

// Sahifalar
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import TeacherLogin from "./pages/TeacherLogin.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import TeacherTests from "./pages/TeacherTests.jsx";
import TeacherResults from "./pages/TeacherResults.jsx";
import TeacherSubjects from "./pages/TeacherSubjects.jsx";
import TeacherGroups from "./pages/TeacherGroups.jsx";
import TeacherShop from "./pages/TeacherShop.jsx";
import TeacherResources from "./pages/TeacherResources.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import AvailableTests from "./pages/AvailableTests.jsx";
import CreateTest from "./pages/CreateTest.jsx";
import Guide from "./pages/Guide.jsx";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/guide" element={<Guide />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<Profile />} />
          
          {/* Teacher Routes */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/tests" element={<TeacherTests />} />
          <Route path="/teacher/create-test" element={<CreateTest />} />
          <Route path="/teacher/results" element={<TeacherResults />} />
          <Route path="/teacher/subjects" element={<TeacherSubjects />} />
          <Route path="/teacher/groups" element={<TeacherGroups />} />
          <Route path="/teacher/shop" element={<TeacherShop />} />
          <Route path="/teacher/resources" element={<TeacherResources />} />
          <Route path="/teacher/settings" element={<Profile />} />
          
          {/* Student Routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/tests" element={<AvailableTests />} />
          <Route path="/student/settings" element={<Profile />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <ThemeToggle />
      </Router>
    </ThemeProvider>
  );
}

export default App;
