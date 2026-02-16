import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  User,
  CreditCard,
  Briefcase,
  BookOpen,
  ClipboardList,
  ShoppingBag,
  Zap,
  BarChart3
} from "lucide-react";
import logo from "../assets/logo.svg";

const SidebarItem = ({ icon: Icon, label, path, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
      active
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
        : "text-muted hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600"
    }`}
  >
    <Icon size={20} className={`${active ? "scale-110" : "group-hover:scale-110"} transition-transform`} />
    <span className="font-bold text-sm tracking-tight">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto animate-pulse" />}
  </button>
);

export default function DashboardLayout({ children, role = "student", userName = "Foydalanuvchi" }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = {
    admin: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
      { icon: Users, label: "O'qituvchilar", path: "/admin/dashboard" },
      { icon: Settings, label: "Sozlamalar", path: "/admin/settings" },
    ],
    teacher: [
      { icon: LayoutDashboard, label: "Asosiy Panel", path: "/teacher/dashboard" },
      { icon: BookOpen, label: "Fanlar", path: "/teacher/subjects" },
      { icon: ClipboardList, label: "Testlar", path: "/teacher/tests" },
      { icon: Users, label: "Guruhlar", path: "/teacher/groups" },
      { icon: BarChart3, label: "Natijalar", path: "/teacher/results" },
      { icon: CreditCard, label: "To'lovlar", path: "/teacher/payments" },
      { icon: ShoppingBag, label: "Do'kon", path: "/teacher/shop" },
      { icon: Zap, label: "Resurslar", path: "/teacher/resources" },
      { icon: Settings, label: "Sozlamalar", path: "/teacher/settings" },
    ],
    student: [
      { icon: LayoutDashboard, label: "Asosiy", path: "/student/dashboard" },
      { icon: FileText, label: "Testlar", path: "/student/tests" },
      { icon: Settings, label: "Sozlamalar", path: "/student/settings" },
    ],
  };

  const currentItems = menuItems[role] || menuItems.student;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-primary flex overflow-hidden font-['Outfit']">
      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex flex-col w-72 h-screen glass border-r border-primary p-6 transition-all duration-500 sticky top-0`}>
        <div className="flex items-center gap-3 mb-12 px-2 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
            T
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase text-primary">
            OsonTest<span className="text-indigo-600">Ol</span>
          </span>
        </div>

        <nav className="flex-grow space-y-2">
          {currentItems.map((item) => (
            <SidebarItem
              key={item.label}
              {...item}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 rounded-3xl bg-secondary border border-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <User size={20} />
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-xs font-black truncate text-primary">{userName}</p>
              <p className="text-[10px] text-muted font-bold uppercase tracking-widest">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors font-bold text-sm"
          >
            <LogOut size={20} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-40 glass border-b border-primary p-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-secondary text-primary"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden md:flex items-center gap-2 bg-secondary/80 border border-primary px-4 py-2 rounded-2xl w-64 lg:w-96 focus-within:border-indigo-500/50 transition-all">
              <Search size={18} className="text-muted" />
              <input
                type="text"
                placeholder="Qidiruv..."
                className="bg-transparent border-none outline-none text-sm w-full text-primary placeholder:text-muted/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-sm font-black text-primary truncate max-w-[120px]">{userName}</span>
              <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">{role}</span>
            </div>
            <button className="p-2.5 rounded-xl bg-secondary text-primary hover:bg-indigo-500/10 hover:text-indigo-500 transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-primary"></span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 border-2 border-white/20 shadow-lg cursor-pointer" onClick={() => navigate(`/${role}/settings`)}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-white">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 flex-grow relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        >
          <aside 
            className="w-72 h-full bg-primary glass border-r border-primary p-6 animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Same sidebar content for mobile */}
            <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={() => {navigate("/"); setIsSidebarOpen(false);}}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/20 group-hover:rotate-12 transition-transform">
                T
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase text-primary">
                OsonTest<span className="text-indigo-600">Ol</span>
              </span>
            </div>
            <nav className="flex-grow space-y-2 mb-8">
              {currentItems.map((item) => (
                <SidebarItem
                  key={item.label}
                  {...item}
                  active={location.pathname === item.path}
                  onClick={() => {navigate(item.path); setIsSidebarOpen(false);}}
                />
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-500/10 transition-colors font-bold text-sm"
            >
              <LogOut size={20} />
              <span>Chiqish</span>
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
