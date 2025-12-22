// src/layouts/SuperAdminLayout.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Building2, ListChecks, LogOut } from "lucide-react";
import React from "react";

export default function SuperAdminLayout({ children }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* FIXED SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 h-screen z-30
          bg-gradient-to-br from-white via-[#e6f7ff] to-[#d2f7e6]
          shadow-xl border-r border-gray-200
          transition-all duration-300 ease-in-out
          flex flex-col
          ${open ? "w-72" : "w-20"}
        `}
      >

        {/* Header */}
        <div className={`flex items-center px-5 py-5 border-b border-gray-200 transition-all duration-200 ${open ? "justify-between" : "justify-center"}`}>
          <h1
            className={`text-xl font-bold text-gray-700 tracking-wide transition-all 
              ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
            `}
          >
            Super Admin
          </h1>
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-700 hover:text-black transition"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-3 flex-1">
          <Link
            to="/super-admin/dashboard"
            className="flex items-center gap-4 px-4 py-3 rounded-lg 
                     bg-white hover:bg-blue-100 text-gray-700
                     shadow-md transition-all hover:shadow-lg"
          >
            <Building2 size={22} />
            {open && <span className="font-medium">Create Institute</span>}
          </Link>

          <Link
            to="/super-admin/dashboard/list"
            className="flex items-center gap-4 px-4 py-3 rounded-lg 
                     bg-white hover:bg-blue-100 text-gray-700
                     shadow-md transition-all hover:shadow-lg"
          >
            <ListChecks size={22} />
            {open && <span className="font-medium">Institute List</span>}
          </Link>
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-4 w-full px-4 py-3 rounded-lg bg-white hover:bg-red-100 text-gray-700 transition text-left"
          >
            <LogOut size={22} />
            {open && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className={`
          flex-1 p-6 transition-all duration-300
          ${open ? "ml-72" : "ml-20"}
        `}
      >
        <div className="bg-white shadow-lg rounded-2xl p-6 border">
          {children}
        </div>
      </div>
    </div>
  );
}
