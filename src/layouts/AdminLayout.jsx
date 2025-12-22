import { Link, Outlet, useNavigate } from "react-router-dom";
import { Menu, X, Home, Upload, Users, Calendar, LogOut, BookOpen, FileText, GraduationCap, FileSpreadsheet, Monitor, CheckSquare } from "lucide-react";
import { useState } from "react";
import React from "react";
export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-screen z-30
          bg-gradient-to-br from-blue-600 to-indigo-600
          text-white shadow-xl
          transition-all duration-300
          flex flex-col
          ${open ? "w-64" : "w-20"}
        `}
      >
        {/* Header with expand/collapse button */}
        <div
          className={`flex items-center px-5 py-5 border-b border-white/20 relative transition-all duration-200 ${open ? "justify-between" : "justify-center"
            }`}
        >
          <h1
            className={`text-xl font-semibold transition-all duration-200 ${open ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
          >
            Admin Panel
          </h1>
          <button
            onClick={() => setOpen(!open)}
            className="z-10 bg-white/10 hover:bg-white/20 rounded-full p-1 transition"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-3 flex-1 overflow-y-auto">
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Home size={22} />
            {open && "Dashboard"}
          </Link>
          <Link
            to="/admin/import-students"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Upload size={22} />
            {open && "Import Students"}
          </Link>
          <Link
            to="/admin/import-teachers"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Users size={22} />
            {open && "Import Teachers"}
          </Link>
          <Link
            to="/admin/students"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Users size={22} />
            {open && "Students List"}
          </Link>
          <Link
            to="/admin/teachers"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Users size={22} />
            {open && "Teachers List"}
          </Link>
          <Link
            to="/admin/roster"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Calendar size={22} />
            {open && "Class Roster"}
          </Link>
          <Link
            to="/admin/classes"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <BookOpen size={22} />
            {open && "Classes"}
          </Link>
          <Link
            to="/admin/subjects"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <FileText size={22} />
            {open && "Subjects"}
          </Link>

          {/* Test System Section */}
          {open && <div className="text-xs text-white/60 font-semibold mt-4 mb-2 px-3">TEST SYSTEM</div>}
          <Link
            to="/admin/test-students"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <GraduationCap size={22} />
            {open && "Test Students"}
          </Link>
          <Link
            to="/admin/tests"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <FileText size={22} />
            {open && "Tests"}
          </Link>
          <Link
            to="/admin/questions-import"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <FileSpreadsheet size={22} />
            {open && "Import Questions"}
          </Link>
          <Link
            to="/admin/live-monitoring"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <Monitor size={22} />
            {open && "Live Monitoring"}
          </Link>
          <Link
            to="/admin/results-review"
            className="flex items-center gap-4 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            <CheckSquare size={22} />
            {open && "Results Review"}
          </Link>
        </nav>

        {/* Logout button at bottom */}
        <div className="p-4 mt-auto">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-4 w-full p-3 rounded-lg bg-white/10 hover:bg-white/20 transition text-left"
          >
            <LogOut size={22} />
            {open && "Logout"}
          </button>
        </div>
      </div>

      {/* Main Page */}
      <div className={`flex-1 p-6 transition-all ${open ? "ml-64" : "ml-20"}`}>
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
