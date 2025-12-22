import React from "react";
import SlotDropdown from "./SlotDropdown";
import { hasConflict } from "../utils/conflictUtils";
import { useAppContext } from "../context/AppContext";
// import logo from "../assets/unacademy-logo.png"; // Removed as file is missing

export default function RosterTable({ roster, rosters, onEdit, teachers = [], subjects = [], onSave, isDraft, readOnly = false }) {
  const { user } = useAppContext();
  const instituteName = user?.name || ""
  console.log("instituteName", instituteName);
  console.log("user", user);

  // Use roster's specific slots, or fallback to default if missing (backward compatibility)
  const columns = roster.timeSlots || [
    { label: "10:10 - 11:00", key: "slot1" },
    { label: "11:00 - 11:50", key: "slot2" },
    { label: "11:50 - 12:40", key: "slot3" },
  ];

  // Logic to render rows.
  // ... (keeping existing logic, just simplifying for replace content block match)
  const scheduleRows = roster.schedule || roster.weekSchedule?.map(ws => {
    const row = { day: ws.day, date: ws.date, };
    if (ws.periods) {
      ws.periods.forEach((p, idx) => {
        const key = columns[idx]?.key || `slot_${idx}`;
        row[key] = p;
      });
    }
    return row;
  }) || [];

  return (
    <div className={`roster-paper bg-white mb-12 shadow-lg overflow-hidden border ${isDraft ? 'border-indigo-400 border-2' : 'border-gray-200'}`}>
      {isDraft && (
        <div className="bg-indigo-50 p-2 text-center border-b border-indigo-100 flex justify-between items-center px-6">
          <span className="text-indigo-700 font-semibold text-sm">Draft Mode - Unsaved Changes</span>
          <button
            onClick={onSave}
            className="bg-indigo-600 text-white px-4 py-1 rounded shadow hover:bg-indigo-700 text-sm font-bold"
          >
            Save Roster to DB
          </button>
        </div>
      )}

      {/* Header Section matching Image */}
      <div className="bg-blue-50/50 p-6 flex flex-col items-center justify-center border-b">
        {/* Institute Name from Context */}
        <h2 className="text-xl font-bold text-blue-600 mb-1">{instituteName}</h2>

        {roster.sessionTitle && (
          <h3 className="text-lg font-bold text-blue-500 uppercase tracking-wide text-center">
            {roster.sessionTitle}
          </h3>
        )}

        {roster.batchName && (
          <h3 className="text-lg font-bold text-blue-500 uppercase tracking-wide text-center mt-1">
            {roster.batchName}
          </h3>
        )}

        <div className="flex gap-4 mt-2 font-bold text-blue-500 text-sm md:text-base">
          {roster.roomNo && <span>Room No. - {roster.roomNo}</span>}
          {roster.floorNo && <span>Floor - {roster.floorNo}</span>}
        </div>
      </div>

      <table className="w-full border-collapse text-sm text-center">
        <thead>
          <tr className="bg-blue-100 text-blue-900">
            <th className="border border-blue-200 p-3 w-32">Date</th>
            <th className="border border-blue-200 p-3 w-24">Day</th>
            {columns.map((col, i) => (
              <th key={col.key || i} className="border border-blue-200 p-3">{col.label}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {scheduleRows.map((row, i) => {
            // Fake Date generation for visual demo if not present
            // In real app, row.date would be there. 
            // Generating based on today + i for now
            // const dateStr = new Date(Date.now() + i * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            const dateStr = row.date
              ? new Date(row.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
              : "—";

            return (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-200 p-2 text-xs text-gray-500">{dateStr}</td>
                <td className="border border-gray-200 p-2 font-medium">{row.day}</td>

                {columns.map((col, idx) => {
                  const key = col.key || `slot_${idx}`;
                  const cellData = row[key];
                  const teacherId = cellData?.teacherId?._id || cellData?.teacherId;

                  const conflict =
                    teacherId &&
                    hasConflict(rosters, roster, row.day, key, teacherId);

                  return (
                    <td key={key} className={`border border-gray-200 p-2 align-top ${conflict ? "bg-red-50" : ""}`}>
                      {/* View Mode */}
                      {readOnly ? (
                        <div className="flex flex-col gap-1 text-[11px]">
                          <div className="bg-blue-50 text-blue-800 px-1 py-0.5 rounded font-semibold">
                            {cellData?.subjectId?.name || cellData?.subjectName || "—"}
                          </div>
                          <div className="text-gray-600">
                            {cellData?.teacherId?.name || cellData?.teacherName || "—"}
                          </div>
                        </div>
                      ) : (
                        <>
                          <SlotDropdown
                            value={cellData}
                            teachers={teachers}
                            subjects={subjects}
                            onChange={(val) =>
                              onEdit(roster, row.day, key, val)
                            }
                          />
                          {conflict && (
                            <p className="text-[10px] text-red-600 mt-1 font-bold">
                              ⚠ Teacher conflict
                            </p>
                          )}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>


    </div>
  );
}
