// src/components/LowAttendanceAlerts.jsx
import React from "react";
import { AlertTriangle, Bell } from "lucide-react";

export default function LowAttendanceAlerts({ items = [], threshold = 75 }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Low Attendance Alerts</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Bell size={16} /> {items.length}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-gray-500 text-sm">No alerts — all classes are healthy.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const low = it.percent < threshold;
            return (
              <div
                key={it.className}
                className={`flex items-center justify-between p-3 rounded-lg border ${low ? "border-red-100 bg-red-50" : "border-gray-100 bg-gray-50"}`}
              >
                <div>
                  <div className="font-medium text-gray-800">{it.className}</div>
                  <div className="text-sm text-gray-600">Attendance: <span className="font-semibold">{it.percent}%</span></div>
                </div>

                <div className="flex items-center gap-3">
                  {low ? (
                    <button className="px-3 py-1 rounded-md bg-red-500 text-white text-sm shadow">Notify</button>
                  ) : (
                    <button className="px-3 py-1 rounded-md bg-green-100 text-green-700 text-sm">OK</button>
                  )}
                  <button className="text-sm text-gray-500">Details</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
