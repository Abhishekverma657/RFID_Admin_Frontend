import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { login } from "../api/auth"; // Import the login API function
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const navigate = useNavigate();
  const { setUser, setToken } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();

    // SIMPLE VALIDATION
    if (!email.includes("@")) {
      triggerError("Please enter a valid email.");
      return;
    }
    if (password.length < 5) {
      triggerError("Password must be at least 5 characters.");
      return;
    }

    try {
      const roleType = role === "super" ? "SUPER_ADMIN" : "ADMIN";
      const res = await login({ email, password, roleType });
      const { token, user } = res;
      setToken(token);
      setUser(user);
      // Save token and user info in localStorage
      localStorage.setItem("authToken", token);
      if (role === "admin") navigate("/admin/dashboard");
      else navigate("/super-admin/dashboard");
    } catch (err) {
      triggerError("Login failed. Please check your credentials.");
      return;
    }
  };

  const triggerError = (msg) => {
    setError(msg);
    toast.error(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };
  // api call for login can be added here

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#f4f6fa] px-4">
      <div
        className={`
          w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-8
          transition-all duration-300
          ${shake ? "animate-shake" : ""}
        `}
      >
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Admin Login
        </h1>

        {/* Role Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
          <button
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 rounded-lg font-medium transition
              ${role === "admin" ? "bg-blue-600 text-white shadow-md" : "text-gray-600"}
            `}
          >
            Institute Admin
          </button>

          <button
            onClick={() => setRole("super")}
            className={`flex-1 py-2 rounded-lg font-medium transition
              ${role === "super" ? "bg-blue-600 text-white shadow-md" : "text-gray-600"}
            `}
          >
            Super Admin
          </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="flex items-center gap-2 bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* EMAIL FIELD */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={18} />

            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                peer w-full pl-10 pr-4 py-3 border rounded-xl outline-none text-gray-800
                bg-gray-50 focus:ring-2 focus:ring-blue-500 transition
              "
            />
            <label
              className="
                absolute left-10 top-3 text-gray-500 pointer-events-none transition-all duration-200
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600
                peer-valid:-top-2 peer-valid:text-xs
              "
            >
              Email
            </label>
          </div>

          {/* PASSWORD FIELD */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />

            <input
              type={showPass ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                peer w-full pl-10 pr-12 py-3 border rounded-xl outline-none text-gray-800
                bg-gray-50 focus:ring-2 focus:ring-blue-500 transition
              "
            />

            {/* Eye Icon */}
            <div
              className="absolute right-3 top-3 cursor-pointer text-gray-600 hover:text-gray-800"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>

            <label
              className="
                absolute left-10 top-3 text-gray-500 pointer-events-none transition-all duration-200
                peer-focus:-top-2 peer-focus:text-xs peer-focus:text-blue-600
                peer-valid:-top-2 peer-valid:text-xs
              "
            >
              Password
            </label>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="
              w-full py-3 bg-blue-600 text-white rounded-xl font-semibold
              hover:bg-blue-700 transition shadow-md hover:scale-[1.01]
            "
          >
            Login
          </button>
        </form>
      </div>

      {/* SHAKE ANIMATION CSS */}
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
          100% { transform: translateX(0); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
