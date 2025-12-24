// src/layouts/SuperAdminLayout.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Building2, ListChecks, LogOut } from "lucide-react";
import React from "react";

export default function SuperAdminLayout({ children }) {
  const [open, setOpen] = useState(window.innerWidth > 1024);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 h-screen z-50
          bg-gradient-to-br from-white via-[#e6f7ff] to-[#d2f7e6]
          shadow-xl border-r border-gray-200
          transition-all duration-300 ease-in-out
          flex flex-col
          ${mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 uppercase"}
          ${open ? "lg:w-72" : "lg:w-20"}
        `}
      >
        {/* Header */}
        <div className={`flex items-center px-5 py-5 border-b border-gray-200 relative transition-all duration-200 ${open ? "justify-between" : "justify-center"}`}>
          <h1
            className={`text-xl font-bold text-gray-700 tracking-wide transition-all 
              ${open ? "opacity-100" : "opacity-0 invisible pointer-events-none"}
            `}
          >
            Super Admin
          </h1>
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(false);
              } else {
                setOpen(!open);
              }
            }}
            className="text-gray-700 hover:text-black transition p-1 rounded-full hover:bg-gray-100"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Menu */}
        <nav className="p-4 space-y-3 flex-1 overflow-y-auto">
          <Link
            to="/super-admin/dashboard"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                      ${open ? "bg-white shadow-sm hover:shadow-md hover:bg-blue-50 text-gray-700" : "justify-center text-gray-600 hover:bg-blue-100"}`}
          >
            <Building2 size={22} className="shrink-0" />
            {open && <span className="font-semibold">Create Institute</span>}
          </Link>

          <Link
            to="/super-admin/dashboard/list"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                      ${open ? "bg-white shadow-sm hover:shadow-md hover:bg-blue-50 text-gray-700" : "justify-center text-gray-600 hover:bg-blue-100"}`}
          >
            <ListChecks size={22} className="shrink-0" />
            {open && <span className="font-semibold">Institute List</span>}
          </Link>
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 mt-auto border-t border-gray-100">
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-4 w-full px-4 py-3 rounded-xl transition-all text-gray-700
                      ${open ? "bg-white hover:bg-red-50 hover:text-red-600" : "justify-center hover:bg-red-100 hover:text-red-700 text-left"}`}
          >
            <LogOut size={22} className="shrink-0" />
            {open && <span className="font-semibold">Logout</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className={`
          flex-1 transition-all duration-300 min-h-screen
          ${open ? "lg:ml-72" : "lg:ml-20"}
          ml-0
        `}
      >
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-20">
          <h1 className="text-xl font-bold text-gray-700">Super Admin</h1>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 text-gray-600 lg:hidden hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 md:p-6 lg:p-10">
          <div className="bg-white shadow-xl rounded-3xl p-4 md:p-8 lg:p-10 border border-gray-100 border-t-4 border-t-blue-500">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
