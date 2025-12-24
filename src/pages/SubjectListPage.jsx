import React, { useEffect, useState, useMemo } from "react";
import { Search, Plus, Trash2, X, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { fetchSubjects, addSubject, deleteSubject } from "../api/subjectApi";

export default function SubjectListPage() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    // Add Modal
    const [addModal, setAddModal] = useState(false);
    const [newSubject, setNewSubject] = useState({ name: "" });
    const [saving, setSaving] = useState(false);

    // Delete Dialog
    const [deleteDialog, setDeleteDialog] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        setLoading(true);
        try {
            const res = await fetchSubjects();
            setSubjects(res.data || []);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
            toast.error("Failed to load subjects.");
            setSubjects([]);
        }
        setLoading(false);
    };

    // Search
    const filtered = useMemo(() => {
        if (!query) return subjects;
        const q = query.toLowerCase();
        return subjects.filter((sub) => sub.name.toLowerCase().includes(q));
    }, [subjects, query]);

    // Add
    const handleAdd = async () => {
        if (!newSubject.name) {
            toast.error("Please enter subject name");
            return;
        }
        setSaving(true);
        try {
            await addSubject(newSubject);
            setAddModal(false);
            setNewSubject({ name: "" });
            loadSubjects();
            toast.success("Subject added successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add subject");
        }
        setSaving(false);
    };

    // Delete
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteSubject(deleteDialog._id);
            setDeleteDialog(null);
            loadSubjects();
            toast.success("Subject deleted successfully!");
        } catch (error) {
            toast.error("Failed to delete subject");
        }
        setDeleting(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <FileText size={32} className="text-purple-600" />
                    Subjects
                </h1>
                <button
                    onClick={() => setAddModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition"
                >
                    <Plus size={18} /> Add Subject
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg w-64">
                    <Search size={16} className="text-gray-500" />
                    <input
                        className="bg-transparent ml-2 w-full outline-none"
                        placeholder="Search subjects..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-3 text-left">Subject Name</th>
                            <th className="p-3 text-left">Created At</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="3" className="p-6 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="p-6 text-center text-gray-500">
                                    No subjects found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((sub) => (
                                <tr key={sub._id} className="border-b hover:bg-purple-50">
                                    <td className="p-3 font-semibold">{sub.name}</td>
                                    <td className="p-3">
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => setDeleteDialog(sub)}
                                            className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                                        >
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            <AnimatePresence>
                {addModal && (
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
                                onClick={() => setAddModal(false)}
                                className="absolute top-3 right-3"
                            >
                                <X />
                            </button>

                            <h2 className="text-xl font-bold mb-4">Add New Subject</h2>

                            <input
                                value={newSubject.name}
                                onChange={(e) =>
                                    setNewSubject({ ...newSubject, name: e.target.value })
                                }
                                placeholder="Subject Name (e.g., Mathematics)"
                                className="border rounded px-3 py-2 w-full mb-3"
                            />

                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
                            >
                                {saving ? "Adding..." : "Add Subject"}
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
                            <h3 className="text-lg font-semibold mb-2">Delete Subject?</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to delete subject "{deleteDialog.name}"?
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setDeleteDialog(null)}
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
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
