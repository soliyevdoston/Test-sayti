import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginUser } from "../api/api";

export default function LoginTemplate({ role, loginPath }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (role === "Student" && !fullName.trim()) {
      return toast.warning("Iltimos, ism va familiyangizni kiriting!");
    }

    setLoading(true);
    try {
      const data = await loginUser(
        role.toLowerCase(),
        username,
        password,
        fullName
      );

      toast.success(data.message);

      if (role === "Student") {
        navigate(loginPath, { state: { testData: data } });
      } else {
        navigate(loginPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login xato!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black text-white overflow-hidden px-6">
      {/* Glow background */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl" />

      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="
          relative z-10 w-full max-w-md
          backdrop-blur-xl bg-white/5
          border border-white/10
          rounded-2xl p-10
          shadow-2xl
        "
      >
        {/* Title */}
        <h2 className="text-3xl font-extrabold text-center mb-2">
          {role === "Student" ? "Testga Kirish" : `${role} Login`}
        </h2>

        <p className="text-center text-gray-400 text-sm mb-8">
          Online Test Platform
        </p>

        {/* Student Full Name */}
        {role === "Student" && (
          <div className="mb-5">
            <label className="block text-sm text-gray-300 mb-1">
              Ism va Familiya
            </label>
            <input
              type="text"
              placeholder="Ali Valiyev"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="
                w-full p-3 rounded-lg
                bg-black/40 border border-white/10
                focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400
                outline-none transition
              "
            />
          </div>
        )}

        {/* Username */}
        <div className="mb-5">
          <label className="block text-sm text-gray-300 mb-1">
            {role === "Student" ? "Test Logini" : "Username"}
          </label>
          <input
            type="text"
            placeholder={
              role === "Student" ? "O‘qituvchi bergan login" : "Username"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="
              w-full p-3 rounded-lg
              bg-black/40 border border-white/10
              focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400
              outline-none transition
            "
          />
        </div>

        {/* Password */}
        <div className="mb-8">
          <label className="block text-sm text-gray-300 mb-1">
            {role === "Student" ? "Test Paroli" : "Parol"}
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full p-3 rounded-lg
              bg-black/40 border border-white/10
              focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400
              outline-none transition
            "
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className={`
            w-full py-3 rounded-xl font-semibold
            transition transform
            ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-105"
            }
          `}
        >
          {loading ? "Kirilmoqda..." : "Kirish"}
        </button>
      </form>
    </div>
  );
}
