import React, { useState } from "react";
import {
  FaClipboardList,
  FaUsers,
  FaChartLine,
  FaSignOutAlt,
  FaTrash,
} from "react-icons/fa";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom"; // 🔥

export default function AdminDashboard() {
  const navigate = useNavigate(); // 🔥
  const [activeCard, setActiveCard] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [newTeacher, setNewTeacher] = useState({ username: "", password: "" });

  const cards = [
    { id: 1, title: "Testlar Boshqaruvi", icon: <FaClipboardList /> },
    { id: 2, title: "O‘qituvchilar", icon: <FaUsers /> },
    { id: 3, title: "Statistikalar", icon: <FaChartLine /> },
  ];

  // Actions
  const addTeacher = (e) => {
    e.preventDefault();
    if (!newTeacher.username || !newTeacher.password) {
      toast.error("Iltimos, username va password kiriting!");
      return;
    }
    setTeachers([...teachers, newTeacher]);
    setNewTeacher({ username: "", password: "" });
    toast.success("O‘qituvchi qo‘shildi!");
  };

  const removeTeacher = (index) => {
    setTeachers(teachers.filter((_, i) => i !== index));
    toast.error("O‘qituvchi o‘chirildi!");
  };

  const logout = () => {
    toast.success("Logout qilindi!");
    setTimeout(() => {
      navigate("/"); // delay bilan Home ga qaytadi
    }, 500); // 0.5 soniya kutadi
  };

  const testAction = () => {
    toast("Testlar bo‘limi ochildi!", { icon: "📋" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md py-4 px-6 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Admin Dashboard
        </h1>
        <button
          className="flex items-center space-x-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition"
          onClick={logout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </header>

      {/* Dashboard Cards */}
      <main className="container mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">
          Tezkor bo‘limlar
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                setActiveCard(card.id);
                if (card.id === 1) testAction();
                if (card.id === 2) toast("O‘qituvchilar bo‘limi ochildi!");
                if (card.id === 3) toast("Statistikalar bo‘limi ochildi!");
              }}
              className={`cursor-pointer rounded-xl shadow-lg p-8 text-white text-center transform transition duration-300 hover:scale-105 ${
                card.id === 1
                  ? "bg-blue-600 hover:bg-blue-700"
                  : card.id === 2
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              <div className="text-4xl mb-4">{card.icon}</div>
              <h3 className="text-2xl font-semibold">{card.title}</h3>
            </div>
          ))}
        </div>

        {/* Conditional Content */}
        <section className="mt-12 text-gray-700 dark:text-gray-300">
          {/* Testlar Boshqaruvi */}
          {activeCard === 1 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4">Testlar Boshqaruvi</h3>
              <p>
                Bu yerda testlarni qo‘shish, tahrirlash va o‘chirish mumkin.
              </p>
              <button
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={() => toast.success("Yangi test qo‘shildi!")}
              >
                Test qo‘shish
              </button>
            </div>
          )}

          {/* O‘qituvchilar */}
          {activeCard === 2 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4">O‘qituvchilar</h3>

              <form onSubmit={addTeacher} className="mb-6">
                <h4 className="text-lg font-semibold mb-2">
                  Yangi O‘qituvchi qo‘shish
                </h4>
                <input
                  type="text"
                  placeholder="Username"
                  value={newTeacher.username}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, username: e.target.value })
                  }
                  className="w-full p-3 mb-2 rounded border border-gray-300 dark:border-gray-600"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newTeacher.password}
                  onChange={(e) =>
                    setNewTeacher({ ...newTeacher, password: e.target.value })
                  }
                  className="w-full p-3 mb-2 rounded border border-gray-300 dark:border-gray-600"
                />
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                  Qo‘shish
                </button>
              </form>

              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded shadow">
                <h5 className="font-semibold mb-2">Ro‘yxat</h5>
                <ul className="list-disc ml-6">
                  {teachers.map((t, i) => (
                    <li key={i} className="flex justify-between items-center">
                      <span>
                        {t.username} / {t.password}
                      </span>
                      <button
                        onClick={() => removeTeacher(i)}
                        className="text-red-600 hover:text-red-800 ml-4"
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Statistikalar */}
          {activeCard === 3 && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-4">Statistikalar</h3>
              <p>
                Platforma statistikasi: testlar soni, o‘qituvchilar soni,
                faoliyat hisobotlari.
              </p>
              <button
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                onClick={() => toast("Statistika yangilandi!")}
              >
                Yangilash
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 mt-16 text-center">
        &copy; {new Date().getFullYear()} Online Test Platform. Barcha huquqlar
        himoyalangan.
      </footer>
    </div>
  );
}
