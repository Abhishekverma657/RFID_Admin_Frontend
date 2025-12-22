// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { Users, BookOpen, UserCheck, CalendarCheck } from "lucide-react";
import { getInstituteStats } from "../api/institute_admin/stats_api";
import { useAppContext } from "../context/AppContext";
import AttendanceTable from "../components/AttendanceTable";

export default function AdminDashboard() {
  const { user } = useAppContext();
  const [totals, setTotals] = useState({
    students: 0,
    teachers: 0,
    presentToday: 0,
    avgAttendance: 0,
  });
  const [adminInfo, setAdminInfo] = useState({});
  const [instituteInfo, setInstituteInfo] = useState({});

  useEffect(() => {
    async function fetchStats() {
      if (!user?.instituteId) return;
      const stats = await getInstituteStats(user.instituteId);
      setTotals({
        students: stats.studentCount,
        teachers: stats.teacherCount,
        presentToday: stats.presentToday,
        avgAttendance: stats.avgAttendance || 0, // If you add this in backend
      });
      setAdminInfo(stats.admin);
      setInstituteInfo(stats.institute);
    }
    fetchStats();
  }, [user]);

  return (
    <>
      {/* Heading */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {instituteInfo.name} ({instituteInfo.code}) - {instituteInfo.address}
          </p>
          <p className="text-gray-500 mt-1">
            Admin: {adminInfo.name} ({adminInfo.email})
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
         
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-xl">
              <Users size={26} />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-800">{totals.students}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </div>
         
        
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 text-white rounded-xl">
              <BookOpen size={26} />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-800">{totals.teachers}</div>
              <div className="text-sm text-gray-600">Total Teachers</div>
            </div>
          </div>
         

        
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600 text-white rounded-xl">
              <UserCheck size={26} />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-800">{totals.presentToday}</div>
              <div className="text-sm text-gray-600">Present Today</div>
            </div>
          </div>
        

        
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500 text-white rounded-xl">
              <CalendarCheck size={26} />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-gray-800">{totals.avgAttendance}%</div>
              <div className="text-sm text-gray-600">Avg Attendance</div>
            </div>
          </div>
      
      </div>
      {/* Attendance Table */}
      <div className="mt-8">
        <AttendanceTable />
      </div>


      
    </>
  );
}
