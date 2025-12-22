// // src/pages/StudentListPage.jsx
// import React, { useState, useMemo } from "react";
// import AdminLayout from "../layouts/AdminLayout";
// import { Search, ArrowUpDown, FileSpreadsheet } from "lucide-react";
// import * as XLSX from "xlsx";

// export default function StudentListPage() {
//   // Dummy data
//   const students = Array.from({ length: 90 }).map((_, i) => {
//     const cls = 9 + (i % 4);
//     const section = ["A", "B", "C", "D"][i % 4];
//     const present = Math.random() > 0.2;
//     return {
//       id: i + 1,
//       name: `Student ${i + 1}`,
//       roll: `${100 + i}`,
//       class: cls,
//       section,
//       email: `student${i + 1}@school.com`,
//       phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
//       present,
//     };
//   });

//   // Filters
//   const [query, setQuery] = useState("");
//   const [classFilter, setClassFilter] = useState("All");
//   const [sectionFilter, setSectionFilter] = useState("All");
//   const [attendanceFilter, setAttendanceFilter] = useState("All");

//   // Sorting
//   const [sortBy, setSortBy] = useState(null);

//   // Pagination
//   const [page, setPage] = useState(1);
//   const perPage = 15;

//   const classes = ["All", ...new Set(students.map((s) => s.class))];
//   const sections = ["All", ...new Set(students.map((s) => s.section))];

//   const filtered = useMemo(() => {
//     let list = [...students];

//     // Filters
//     if (classFilter !== "All") list = list.filter((s) => `${s.class}` === `${classFilter}`);
//     if (sectionFilter !== "All") list = list.filter((s) => s.section === sectionFilter);
//     if (attendanceFilter !== "All")
//       list = list.filter((s) => (attendanceFilter === "Present" ? s.present : !s.present));

//     if (query) {
//       const q = query.toLowerCase();
//       list = list.filter(
//         (s) =>
//           s.name.toLowerCase().includes(q) ||
//           s.roll.includes(q) ||
//           s.email.toLowerCase().includes(q)
//       );
//     }

//     // Sorting
//     if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
//     if (sortBy === "roll") list.sort((a, b) => a.roll - b.roll);
//     if (sortBy === "class") list.sort((a, b) => a.class - b.class);

//     return list;
//   }, [students, query, classFilter, sectionFilter, attendanceFilter, sortBy]);

//   // Paginated data
//   const paginated = filtered.slice((page - 1) * perPage, page * perPage);

//   // Export to Excel
//   const exportExcel = () => {
//     const ws = XLSX.utils.json_to_sheet(filtered);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Students");
//     XLSX.writeFile(wb, "students_filtered.xlsx");
//   };

//   return (
//     <AdminLayout>
//       <h1 className="text-3xl font-bold mb-6 text-gray-800">Students List</h1>

//       {/* Filters */}
//       <div className="flex flex-wrap gap-4 mb-6 items-center">
//         <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full md:w-64">
//           <Search size={16} className="text-gray-500 mr-2" />
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Search name, roll, email..."
//             className="bg-transparent outline-none w-full text-sm"
//           />
//         </div>

//         <select className="border rounded-lg px-3 py-2" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
//           {classes.map((cls) => <option key={cls}>{cls}</option>)}
//         </select>

//         <select className="border rounded-lg px-3 py-2" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
//           {sections.map((sec) => <option key={sec}>{sec}</option>)}
//         </select>

//         <select className="border rounded-lg px-3 py-2" value={attendanceFilter} onChange={(e) => setAttendanceFilter(e.target.value)}>
//           <option>All</option>
//           <option>Present</option>
//           <option>Absent</option>
//         </select>

//         <button
//           onClick={exportExcel}
//           className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
//         >
//           <FileSpreadsheet size={18} /> Export
//         </button>
//       </div>

//       {/* Table */}
//       <div className="border rounded-xl overflow-hidden shadow-lg bg-white">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-100 border-b">
//             <tr>
//               <th className="p-3 text-left cursor-pointer" onClick={() => setSortBy("roll")}>
//                 Roll <ArrowUpDown size={14} className="inline" />
//               </th>
//               <th className="p-3 text-left cursor-pointer" onClick={() => setSortBy("name")}>
//                 Name <ArrowUpDown size={14} className="inline" />
//               </th>
//               <th className="p-3 text-left cursor-pointer" onClick={() => setSortBy("class")}>
//                 Class <ArrowUpDown size={14} className="inline" />
//               </th>
//               <th className="p-3 text-left">Section</th>
//               <th className="p-3 text-left">Email</th>
//               <th className="p-3 text-left">Phone</th>
//               <th className="p-3 text-left">Status</th>
//             </tr>
//           </thead>

//           <tbody>
//             {paginated.map((st) => (
//               <tr
//                 key={st.id}
//                 className="border-b hover:bg-blue-50 transition cursor-pointer"
//                 onClick={() => window.location.href = `/admin/student/${st.id}`}
//               >
//                 <td className="p-3">{st.roll}</td>
//                 <td className="p-3">{st.name}</td>
//                 <td className="p-3">{st.class}</td>
//                 <td className="p-3">{st.section}</td>
//                 <td className="p-3">{st.email}</td>
//                 <td className="p-3">{st.phone}</td>
//                 <td className="p-3">
//                   {st.present ? (
//                     <span className="text-green-600 font-semibold">Present</span>
//                   ) : (
//                     <span className="text-red-600 font-semibold">Absent</span>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {filtered.length === 0 && (
//           <div className="p-6 text-center text-gray-500">No students found</div>
//         )}
//       </div>

//       {/* Pagination */}
//       <div className="flex justify-between items-center mt-4">
//         <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-gray-200 rounded-lg">
//           Prev
//         </button>

//         <div className="text-sm text-gray-600">
//           Page {page} of {Math.ceil(filtered.length / perPage)}
//         </div>

//         <button disabled={page >= filtered.length / perPage} onClick={() => setPage(page + 1)} className="px-4 py-2 bg-gray-200 rounded-lg">
//           Next
//         </button>
//       </div>
//     </AdminLayout>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import {
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  getStudents,
  updateStudent,
  deleteStudent,
} from "../api/institute_admin/students_api";

export default function StudentListPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Sorting
  const [sortBy, setSortBy] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Edit / Delete
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudents();
      setStudents(res.data || []);
    } catch {
      setStudents([]);
    }
    setLoading(false);
  };

  // Dropdown values
  const classes = useMemo(
    () => ["All", ...new Set(students.map((s) => s.className))],
    [students]
  );

  const sections = useMemo(
    () => ["All", ...new Set(students.map((s) => s.section))],
    [students]
  );

  // Filter + Search + Sort
  const filtered = useMemo(() => {
    let list = [...students];

    if (classFilter !== "All")
      list = list.filter((s) => s.className === classFilter);

    if (sectionFilter !== "All")
      list = list.filter((s) => s.section === sectionFilter);

    if (statusFilter !== "All")
      list = list.filter((s) =>
        statusFilter === "Active" ? s.isActive : !s.isActive
      );

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.rollNo.includes(q) ||
          s.email.toLowerCase().includes(q)
      );
    }

    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "roll") list.sort((a, b) => a.rollNo - b.rollNo);
    if (sortBy === "class")
      list.sort((a, b) => a.className.localeCompare(b.className));

    return list;
  }, [students, query, classFilter, sectionFilter, statusFilter, sortBy]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Export
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students_filtered.xlsx");
  };

  // Edit
  const handleEdit = (st) => {
    setEditData({ ...st });
    setEditModal(true);
  };

  const handleEditSave = async () => {
    setSaving(true);
    await updateStudent(editData._id, {
      rollNo: editData.rollNo,
      name: editData.name,
      className: editData.className,
      section: editData.section,
      email: editData.email,
      phone: editData.phone,
      rfidCardId: editData.rfidCardId,
      isActive: editData.isActive,
    });
    setSaving(false);
    setEditModal(false);
    fetchStudents();
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    await deleteStudent(deleteDialog._id);
    setDeleting(false);
    setDeleteDialog(null);
    fetchStudents();
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Students List</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center bg-gray-100 px-3 py-2 rounded w-64">
          <Search size={16} />
          <input
            className="bg-transparent ml-2 w-full outline-none"
            placeholder="Search name, roll, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {classes.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {sections.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option>All</option>
          <option>Active</option>
          <option>Inactive</option>
        </select>

        <button
          onClick={exportExcel}
          className="bg-green-600 text-white px-4 py-2 rounded flex gap-2"
        >
          <FileSpreadsheet size={18} /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th onClick={() => setSortBy("roll")} className="p-3 cursor-pointer">
                Roll <ArrowUpDown size={14} className="inline" />
              </th>
              <th onClick={() => setSortBy("name")} className="p-3 cursor-pointer">
                Name <ArrowUpDown size={14} className="inline" />
              </th>
              <th onClick={() => setSortBy("class")} className="p-3 cursor-pointer">
                Class <ArrowUpDown size={14} className="inline" />
              </th>
              <th className="p-3">Section</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((st) => (
              <tr key={st._id} className="border-b hover:bg-blue-50">
                <td className="p-3">{st.rollNo}</td>
                <td className="p-3">{st.name}</td>
                <td className="p-3">{st.className}</td>
                <td className="p-3">{st.section}</td>
                <td className="p-3">{st.email}</td>
                <td className="p-3">{st.phone}</td>
                <td className="p-3">
                  {st.isActive ? (
                    <span className="text-green-600 font-semibold">Active</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Inactive</span>
                  )}
                </td>
                <td className="p-3 flex gap-3">
                  <button
                    onClick={() => handleEdit(st)}
                    className="text-blue-600 flex gap-1"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteDialog(st)}
                    className="text-red-600 flex gap-1"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No students found
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page} of {Math.ceil(filtered.length / perPage)}
        </div>
        <button
          disabled={page >= filtered.length / perPage}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Next
        </button>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setEditModal(false)}
                className="absolute top-3 right-3"
              >
                <X />
              </button>

              <h2 className="text-xl font-bold mb-4">Edit Student</h2>

              {[
                "rollNo",
                "name",
                "className",
                "section",
                "email",
                "phone",
                "rfidCardId",
              ].map((f) => (
                <input
                  key={f}
                  value={editData[f] || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, [f]: e.target.value })
                  }
                  placeholder={f}
                  className="border rounded px-3 py-2 w-full mb-3"
                />
              ))}

              <button
                onClick={handleEditSave}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 rounded"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Dialog */}
      <AnimatePresence>
        {deleteDialog && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold mb-2">
                Delete Student?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteDialog(null)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
