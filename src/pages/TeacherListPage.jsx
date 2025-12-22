// src/pages/TeacherListPage.jsx
import React, { useState, useMemo, useEffect } from "react";
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
  getTeachers,
  updateTeacher,
  deleteTeacher,
} from "../api/institute_admin/teacher_api";

export default function TeacherListPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [sortBy, setSortBy] = useState(null);
  const [page, setPage] = useState(1);
  const perPage = 12;

  // Edit
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await getTeachers();
      setTeachers(res.data || []);
    } catch {
      setTeachers([]);
    }
    setLoading(false);
  };

  const subjects = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          teachers
            .flatMap((t) => (Array.isArray(t.subjects) ? t.subjects : []))
            .filter(Boolean)
        )
      ),
    ],
    [teachers]
  );

  const filtered = useMemo(() => {
    let list = [...teachers];

    if (subjectFilter !== "All")
      list = list.filter((t) =>
        (Array.isArray(t.subjects) ? t.subjects : []).includes(subjectFilter)
      );

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.email || "").toLowerCase().includes(q)
      );
    }

    if (sortBy === "name")
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortBy === "subject")
      list.sort((a, b) =>
        (a.subjects?.[0] || "").localeCompare(b.subjects?.[0] || "")
      );

    return list;
  }, [teachers, query, subjectFilter, sortBy]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, "teachers_filtered.xlsx");
  };

  const handleEdit = (t) => {
    setEditData({
      ...t,
      subjects: Array.isArray(t.subjects) ? t.subjects.join(", ") : "",
    });
    setEditModal(true);
  };

  const handleEditSave = async () => {
    setSaving(true);
    await updateTeacher(editData._id, {
      name: editData.name,
      email: editData.email,
      phone: editData.phone,
      subjects: editData.subjects
        ? editData.subjects.split(",").map((s) => s.trim())
        : [],
    });
    setSaving(false);
    setEditModal(false);
    fetchTeachers();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteTeacher(deleteDialog._id);
    setDeleting(false);
    setDeleteDialog(null);
    fetchTeachers();
  };

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Teachers List</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center bg-gray-100 px-3 py-2 rounded w-64">
          <Search size={16} />
          <input
            className="bg-transparent ml-2 w-full outline-none"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
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
              <th className="p-3 cursor-pointer" onClick={() => setSortBy("name")}>
                Name <ArrowUpDown size={14} className="inline" />
              </th>
              <th className="p-3 cursor-pointer" onClick={() => setSortBy("subject")}>
                Subjects <ArrowUpDown size={14} className="inline" />
              </th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t) => (
              <tr key={t._id} className="border-b hover:bg-blue-50">
                <td className="p-3">{t.name}</td>
                <td className="p-3">{t.subjects?.join(", ")}</td>
                <td className="p-3">{t.email}</td>
                <td className="p-3">{t.phone}</td>
                <td className="p-3 flex gap-3">
                  <button
                    onClick={() => handleEdit(t)}
                    className="text-blue-600 flex gap-1"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteDialog(t)}
                    className="text-red-600 flex gap-1"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 w-full max-w-md relative"
            >
              <button
                onClick={() => setEditModal(false)}
                className="absolute top-3 right-3"
              >
                <X />
              </button>

              <h2 className="text-xl font-bold mb-4">Edit Teacher</h2>

              {["name", "email", "phone", "subjects"].map((f) => (
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
                {saving ? "Saving..." : "Save"}
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
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold mb-2">
                Delete Teacher?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteDialog(null)}
                  className="px-4 py-2 rounded bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded bg-red-600 text-white"
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
