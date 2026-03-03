import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";

// Sahifalar
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import TeacherLogin from "./pages/TeacherLogin.jsx";
import TeacherRegister from "./pages/TeacherRegister.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import TeacherTests from "./pages/TeacherTests.jsx";
import TeacherSubscription from "./pages/TeacherSubscription.jsx";
import TeacherResults from "./pages/TeacherResults.jsx";
import TeacherGroups from "./pages/TeacherGroups.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentSubscription from "./pages/StudentSubscription.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Register from "./pages/Register.jsx";
import AvailableTests from "./pages/AvailableTests.jsx";
import CreateTest from "./pages/CreateTest.jsx";
import Guide from "./pages/Guide.jsx";
import TeacherChats from "./pages/TeacherChats.jsx";
import { getStoredRole, hasValidSessionForRole, isRoleAllowed } from "./utils/authSession";

const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  student: "/student/dashboard",
};

function ProtectedRoute({ children, allowedRoles }) {
  const role = getStoredRole();
  const validSession = hasValidSessionForRole(role);
  if (!isRoleAllowed(allowedRoles) || !validSession) {
    if (role && ROLE_HOME[role] && validSession) {
      return <Navigate to={ROLE_HOME[role]} replace />;
    }
    const primaryRole = String(allowedRoles?.[0] || "").toLowerCase();
    return <Navigate to={`/${primaryRole}/login`} replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  const role = getStoredRole();
  if (ROLE_HOME[role] && hasValidSessionForRole(role)) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }
  return children;
}

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
          <Route path="/admin/login" element={<PublicOnlyRoute><AdminLogin /></PublicOnlyRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard initialSection="overview" /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard initialSection="teachers" /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard initialSection="students" /></ProtectedRoute>} />
          <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard initialSection="billing" /></ProtectedRoute>} />
          <Route path="/admin/catalog" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard initialSection="catalog" /></ProtectedRoute>} />
          <Route path="/admin/access" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard initialSection="access" /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={["admin"]}><Profile /></ProtectedRoute>} />
          
          {/* Teacher Routes */}
          <Route path="/teacher/login" element={<PublicOnlyRoute><TeacherLogin /></PublicOnlyRoute>} />
          <Route path="/teacher/register" element={<PublicOnlyRoute><TeacherRegister /></PublicOnlyRoute>} />
          <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/tests" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherTests /></ProtectedRoute>} />
          <Route path="/teacher/subscription" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherSubscription /></ProtectedRoute>} />
          <Route path="/teacher/create-test" element={<ProtectedRoute allowedRoles={["teacher"]}><CreateTest /></ProtectedRoute>} />
          <Route path="/teacher/results" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherResults /></ProtectedRoute>} />
          <Route path="/teacher/groups" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherGroups /></ProtectedRoute>} />
          <Route path="/teacher/chats" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherChats /></ProtectedRoute>} />
          <Route path="/teacher/settings" element={<ProtectedRoute allowedRoles={["teacher"]}><Profile /></ProtectedRoute>} />
          
          {/* Student Routes */}
          <Route path="/student/login" element={<PublicOnlyRoute><StudentLogin /></PublicOnlyRoute>} />
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/tests" element={<ProtectedRoute allowedRoles={["student"]}><AvailableTests /></ProtectedRoute>} />
          <Route path="/student/subscription" element={<ProtectedRoute allowedRoles={["student"]}><StudentSubscription /></ProtectedRoute>} />
          <Route path="/student/settings" element={<ProtectedRoute allowedRoles={["student"]}><Profile /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <ThemeToggle />
      </Router>
    </ThemeProvider>
  );
}

export default App;
