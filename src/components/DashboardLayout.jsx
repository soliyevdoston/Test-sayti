import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  ClipboardList,
  CreditCard,
  BarChart3,
  MessageSquare,
  Home,
  User,
  BookMarked,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import { clearUserSession } from "../utils/authSession";
import { logUserActivity } from "../utils/activityLog";
import { isTeacherProActive } from "../utils/teacherAccessTools";
import logo from "../assets/logo.svg";
import SiteFooter from "./SiteFooter";

const ItemButton = ({ icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
      active
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/60 shadow-md shadow-blue-600/20"
        : "text-secondary border-transparent hover:text-primary hover:bg-accent hover:border-primary"
    }`}
  >
    {React.createElement(icon, { size: 18 })}
    <span className="min-w-0 truncate">{label}</span>
    {active && <span className="ml-auto inline-block w-1.5 h-1.5 rounded-full bg-white/90" />}
  </button>
);

export default function DashboardLayout({
  children,
  role = "student",
  userName = "Foydalanuvchi",
  showBottomNav = true,
  showFooter = true,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const teacherId = localStorage.getItem("teacherId");
  const teacherProActive = role === "teacher" ? isTeacherProActive(teacherId) : false;
  const profilePath = role === "teacher" && !teacherProActive ? "/teacher/subscription" : `/${role}/settings`;
  const teacherBottomNavPath = teacherProActive ? "/teacher/results" : "/teacher/subscription";
  const teacherBottomNavLabel = teacherProActive ? "Natija" : "Obuna";

  const menus = useMemo(
    () => ({
      admin: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
        { icon: Users, label: "O'qituvchilar", path: "/admin/teachers" },
        { icon: GraduationCap, label: "O'quvchilar", path: "/admin/students" },
        { icon: CreditCard, label: "To'lovlar", path: "/admin/billing" },
        { icon: BookOpen, label: "Katalog", path: "/admin/catalog" },
        { icon: ShieldCheck, label: "Kirish nazorati", path: "/admin/access" },
        { icon: Settings, label: "Sozlamalar", path: "/admin/settings" },
      ],
      teacher: [
        { icon: LayoutDashboard, label: "Asosiy", path: "/teacher/dashboard" },
        { icon: ClipboardList, label: "Testlar", path: "/teacher/tests" },
        ...(teacherProActive
          ? [
              { icon: Users, label: "Guruhlar", path: "/teacher/groups" },
              { icon: MessageSquare, label: "Chatlar", path: "/teacher/chats" },
              { icon: BarChart3, label: "Natijalar", path: "/teacher/results" },
            ]
          : []),
        { icon: CreditCard, label: "Obuna", path: "/teacher/subscription" },
        { icon: BookOpen, label: "Qo'llanma", path: "/guide" },
        ...(teacherProActive ? [{ icon: Settings, label: "Sozlamalar", path: "/teacher/settings" }] : []),
      ],
      student: [
        { icon: LayoutDashboard, label: "Asosiy", path: "/student/dashboard" },
        { icon: FileText, label: "Testlar", path: "/student/tests" },
        { icon: CreditCard, label: "Obuna", path: "/student/subscription" },
        { icon: BookMarked, label: "Qo'llanma", path: "/guide" },
        { icon: Settings, label: "Sozlamalar", path: "/student/settings" },
      ],
    }),
    [teacherProActive]
  );

  const currentMenu = menus[role] || menus.student;

  const titleByRole = {
    admin: "Admin kabineti",
    teacher: "O'qituvchi kabineti",
    student: "O'quvchi kabineti",
  };

  const logout = () => {
    logUserActivity({
      action: "logout",
      area: "auth",
      status: "success",
      message: "Foydalanuvchi tizimdan chiqdi",
    });
    clearUserSession();
    navigate("/");
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className={`h-full flex flex-col ${mobile ? "p-4" : "p-5"}`}>
      <button
        type="button"
        onClick={() => {
          navigate("/");
          setMobileOpen(false);
        }}
        className="flex items-center gap-3 px-2.5 py-2.5 mb-4 rounded-xl border border-primary bg-accent/45 hover:bg-accent transition-colors"
      >
        <img src={logo} alt="OsonTestOl logo" className="w-9 h-9 rounded-lg" />
        <div className="text-left">
          <p className="text-xs uppercase tracking-[0.22em] text-muted font-bold">testonlinee.uz</p>
          <p className="text-base font-extrabold text-primary">OsonTestOl</p>
        </div>
      </button>

      <nav className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5">
        {currentMenu.map((item) => (
          <ItemButton
            key={`${item.label}-${item.path}`}
            {...item}
            active={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          />
        ))}
      </nav>

      <div className="mt-4 border-t border-primary pt-4 space-y-2">
        <button
          type="button"
          onClick={() => {
            navigate(profilePath);
            setMobileOpen(false);
          }}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-accent text-primary hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors"
        >
          <User size={18} />
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold truncate">{userName}</p>
            <p className="text-[11px] uppercase tracking-widest text-muted">{role}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm font-semibold"
        >
          <LogOut size={18} />
          <span>Chiqish</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary text-primary lg:flex">
      <aside className="hidden lg:block w-72 shrink-0 h-screen sticky top-0 border-r border-primary bg-secondary/95 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-primary bg-secondary/95 backdrop-blur-xl shadow-sm">
          <div className="h-[4.25rem] px-4 md:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden w-9 h-9 rounded-lg border border-primary bg-secondary flex items-center justify-center"
                onClick={() => setMobileOpen(true)}
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted font-bold">OsonTestOl</p>
                <h1 className="text-sm md:text-base font-extrabold">{titleByRole[role] || "Kabinet"}</h1>
              </div>
            </div>

            <button type="button" onClick={() => navigate("/")} className="btn-secondary">
              <Home size={14} /> Asosiy
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-6 py-6 pb-24 lg:pb-8">{children}</main>
        {showFooter && (
          <SiteFooter
            compact
            className={`mt-auto ${showBottomNav && role !== "admin" ? "pb-16 lg:pb-0" : ""}`}
          />
        )}
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/45 cursor-clickable" onClick={() => setMobileOpen(false)}>
          <aside
            className="w-72 max-w-[90vw] h-full bg-secondary/95 backdrop-blur-sm border-r border-primary"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-end p-3">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-8 h-8 rounded-md border border-primary flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {showBottomNav && role !== "admin" && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-primary bg-secondary/95 backdrop-blur-sm safe-area-bottom">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex flex-col items-center justify-center py-1 text-[10px] font-semibold text-muted"
            >
              <Home size={18} />
              Asosiy
            </button>

            <button
              type="button"
              onClick={() => navigate(role === "teacher" ? "/teacher/tests" : "/student/tests")}
              className="flex flex-col items-center justify-center py-1 text-[10px] font-semibold text-muted"
            >
              <ClipboardList size={18} />
              Testlar
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex flex-col items-center justify-center py-1 text-[10px] font-semibold text-primary"
            >
              <Menu size={18} />
              Menyu
            </button>

            <button
              type="button"
              onClick={() => navigate(role === "teacher" ? teacherBottomNavPath : "/student/dashboard")}
              className="flex flex-col items-center justify-center py-1 text-[10px] font-semibold text-muted"
            >
              <BarChart3 size={18} />
              {role === "teacher" ? teacherBottomNavLabel : "Natija"}
            </button>

            <button
              type="button"
              onClick={() => navigate(profilePath)}
              className="flex flex-col items-center justify-center py-1 text-[10px] font-semibold text-muted"
            >
              <User size={18} />
              Profil
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
