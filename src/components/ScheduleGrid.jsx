import React, { useState } from "react";

export default function ScheduleGrid({
  days,
  periods,
  teachers,
  schedule,
  onAssign,
  onClear,
}) {
  const [edit, setEdit] = useState(null);
  const [teacher, setTeacher] = useState("");
  const [subject, setSubject] = useState("");

  const save = () => {
    if (!teacher) return;
    onAssign(edit.day, edit.pi, teacher, subject);
    setEdit(null);
    setTeacher("");
    setSubject("");
  };

  return (
    <div className="bg-white shadow rounded p-4">
      <table className="min-w-full border">
        <thead>
          <tr>
            <th>Period</th>
            {days.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {periods.map((p, pi) => (
            <tr key={pi}>
              <td>{p}</td>
              {days.map((d) => (
                <td
                  key={d}
                  className="border p-2 cursor-pointer"
                  onClick={() => setEdit({ day: d, pi })}
                >
                  {schedule[d]?.[pi]?.subject || "Assign"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {edit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <select
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className="border w-full mb-3"
            >
              <option value="">Teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="border w-full mb-3"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setEdit(null)}>Cancel</button>
              <button onClick={save} className="bg-blue-600 text-white px-3">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
