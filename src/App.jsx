import { Routes, Route } from "react-router-dom";
import TestAccessPage from "./pages/student/TestAccessPage";
import TestWindowPage from "./pages/student/TestWindowPage";
import { Toaster } from "react-hot-toast";

import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import InstituteList from "./pages/InstituteList";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ImportStudents from "./pages/ImportStudents";
import ImportTeachers from "./pages/ImportTeachers";
import React from "react";
import StudentListPage from "./pages/StudentListPage";
import TeacherListPage from "./pages/TeacherListPage";
import RosterPage from "./pages/RosterPage";
import StudentAttendancePage from "./components/StudentAttendancePage";
import AdminLayout from "./layouts/AdminLayout";
import ClassListPage from "./pages/ClassListPage";
import SubjectListPage from "./pages/SubjectListPage";
import TestStudentPage from "./pages/TestStudentPage";
import QuestionImportPage from "./pages/QuestionImportPage";
import LiveMonitoringPage from "./pages/LiveMonitoringPage";
import ResultReviewPage from "./pages/ResultReviewPage";
import TestManagementPage from "./pages/TestManagementPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* Login */}
        <Route path="/" element={<AdminLogin />} />

        {/* Student Test Routes (Public/Protected by OTP) */}
        <Route path="/test/:testId" element={<TestAccessPage />} />
        <Route path="/exam/:testId" element={<TestWindowPage />} />

        {/* Super Admin */}
        <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/dashboard/list" element={<InstituteList />} />

        {/* Admin */}
        {/* Admin layout wrapper */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/import-students" element={<ImportStudents />} />
          <Route path="/admin/import-teachers" element={<ImportTeachers />} />
          <Route path="/admin/students" element={<StudentListPage />} />
          <Route path="/admin/teachers" element={<TeacherListPage />} />
          <Route path="/admin/roster" element={<RosterPage />} />
          <Route path="/admin/classes" element={<ClassListPage />} />
          <Route path="/admin/subjects" element={<SubjectListPage />} />
          <Route path="/admin/attendance/student/:studentId"
            element={<StudentAttendancePage />}
          />
          {/* Test System Routes */}
          <Route path="/admin/test-students" element={<TestStudentPage />} />
          <Route path="/admin/tests" element={<TestManagementPage />} />
          <Route path="/admin/questions-import" element={<QuestionImportPage />} />
          <Route path="/admin/live-monitoring" element={<LiveMonitoringPage />} />
          <Route path="/admin/results-review" element={<ResultReviewPage />} />
          <Route path="/admin/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </>
  );
}
