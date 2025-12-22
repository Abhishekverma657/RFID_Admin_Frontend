import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentAttendance } from "../api/institute_admin/attendence/all_attendence";

export default function StudentAttendancePage() {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // date filter
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getStudentAttendance(studentId);
        setData(res);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [studentId]);

  // 🔹 date range filter
  const filteredAttendance = useMemo(() => {
    if (!data?.attendance) return [];

    return data.attendance.filter((a) => {
      if (fromDate && a.date < fromDate) return false;
      if (toDate && a.date > toDate) return false;
      return true;
    });
  }, [data, fromDate, toDate]);

  /* =======================
     LOADER (modern spinner)
     ======================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-500">No data found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
         {/* 🔙 Back button */}
    <div className="flex items-center justify-between">
      <button
        onClick={() => navigate("/admin/dashboard")}
        className="flex items-center gap-2 text-sm font-medium
                   px-3 py-2 rounded-lg
                   bg-gray-100 text-gray-700
                   hover:bg-gray-200 transition"
      >
        ← Back to Dashboard
      </button>
    </div>
      {/* ================= STUDENT INFO CARD ================= */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              {data.name}
            </h2>
            <p className="text-sm text-gray-500">
              Roll No: {data.rollNo}
            </p>
          </div>

          <span className="px-3 py-1 text-xs rounded-full bg-blue-50 text-blue-700">
            Class {data.className} - {data.section}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div><b>Email:</b> {data.email}</div>
          <div><b>Phone:</b> {data.phone}</div>
          <div><b>RFID:</b> {data.rfidCardId || "-"}</div>
        </div>
      </div>

      {/* ================= ATTENDANCE SECTION ================= */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Attendance History
          </h3>

          {/* Date Filters */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="px-3 py-2 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead className="text-gray-500">
              <tr>
                <th className="text-left px-3">Date</th>
                <th>Status</th>
                <th>In Time</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.map((a) => (
                <tr
                  key={a._id}
                  className="bg-gray-50 hover:bg-gray-100 transition rounded-lg text-center"
                >
                  <td className="px-3 py-2 text-left font-medium">
                    {a.date}
                  </td>
                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          a.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                            : "bg-rose-100 text-rose-700 ring-1 ring-rose-300"
                        }
                      `}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>{a.firstInTime || "-"}</td>
                </tr>
              ))}

              {filteredAttendance.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-gray-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
