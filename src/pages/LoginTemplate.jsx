import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // O'zgartirildi
import { loginUser } from "../api/api";

export default function LoginTemplate({ role, loginPath }) {
  const navigate = useNavigate();

  // Login ma'lumotlari
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // <--- O'quvchi uchun yangi state
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Agar o'quvchi bo'lsa va ism yozmagan bo'lsa
    if (role === "Student" && !fullName.trim()) {
      return toast.warning("Iltimos, ism va familiyangizni kiriting!");
    }

    setLoading(true);
    try {
      // API ga so'rov (fullName faqat Student uchun kerak)
      const data = await loginUser(
        role.toLowerCase(),
        username,
        password,
        fullName
      );

      toast.success(data.message);

      // Agar o'quvchi bo'lsa, test ma'lumotlarini state orqali yuboramiz
      if (role === "Student") {
        navigate(loginPath, { state: { testData: data } });
      } else {
        navigate(loginPath);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || err.message || "Login xato!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <form
        onSubmit={handleLogin}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md transition-transform transform hover:scale-105"
      >
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white text-center">
          {role === "Student" ? "Testga Kirish" : `${role} Login`}
        </h2>

        {/* Faqat O'quvchi uchun Ism Familiya inputi */}
        {role === "Student" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ism Familiya
            </label>
            <input
              type="text"
              placeholder="Masalan: Ali Valiyev"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {role === "Student" ? "Test Logini" : "Username"}
          </label>
          <input
            type="text"
            placeholder={
              role === "Student" ? "O'qituvchi bergan login" : "Username"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {role === "Student" ? "Test Paroli" : "Parol"}
          </label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full text-white font-semibold py-3 rounded-lg transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
