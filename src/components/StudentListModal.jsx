// src/components/StudentListModal.jsx
import React, { useMemo, useState } from "react";
import { X, Search } from "lucide-react";

export default function StudentListModal({ open, type, onClose, students = [] }) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  // unique classes for filter
  const classes = useMemo(() => {
    const s = Array.from(new Set(students.map((st) => st.class))).sort();
    return ["All", ...s];
  }, [students]);

  const filtered = useMemo(() => {
    return students
      .filter((st) => (classFilter === "All" ? true : `${st.class}` === `${classFilter}`))
      .filter((st) => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (
          st.name.toLowerCase().includes(q) ||
          (st.rollNumber && `${st.rollNumber}`.includes(q)) ||
          (st.email && st.email.toLowerCase().includes(q))
        );
      });
  }, [students, query, classFilter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold">List: {type === "students" ? "Students" : type}</h3>
            <div className="text-sm text-gray-500">{filtered.length} items</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-3 items-center">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full">
              <Search size={16} className="text-gray-500 mr-2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, roll, email..."
                className="bg-transparent outline-none w-full text-sm"
              />
            </div>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-96 overflow-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-3 text-left">Roll</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Class</th>
                  <th className="p-3 text-left">Section</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50 border-b">
                    <td className="p-3">{st.rollNumber}</td>
                    <td className="p-3">{st.name}</td>
                    <td className="p-3">{st.class}</td>
                    <td className="p-3">{st.section}</td>
                    <td className="p-3">
                      {st.present ? (
                        <span className="text-green-600 font-medium">Present</span>
                      ) : (
                        <span className="text-red-600 font-medium">Absent</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border">Close</button>
            <button className="px-4 py-2 rounded-lg bg-blue-600 text-white">Export CSV</button>
          </div>
        </div>
      </div>
    </div>
  );
}
