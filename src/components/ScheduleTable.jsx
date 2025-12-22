import React from "react";

export default function ScheduleTable({ days, periods, teachers, schedule }) {
  const teacherName = (id) =>
    teachers.find((t) => t.id === id)?.name || "";

  return (
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
            {days.map((d) => {
              const c = schedule[d]?.[pi];
              return (
                <td key={d} className="border p-2">
                  {c ? (
                    <>
                      <div>{c.subject}</div>
                      <div className="text-sm text-gray-500">
                        {teacherName(c.teacherId)}
                      </div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
