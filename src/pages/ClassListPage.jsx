import React, { useEffect, useState, useMemo } from "react";
import { Search, Plus, Trash2, X, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { fetchClasses, addClass, deleteClass } from "../api/classApi";

export default function ClassListPage() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    // Add Modal
    const [addModal, setAddModal] = useState(false);
    const [newClass, setNewClass] = useState({ name: "", section: "" });
    const [saving, setSaving] = useState(false);

    // Delete Dialog
    const [deleteDialog, setDeleteDialog] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const res = await fetchClasses();
            setClasses(res.data || []);
        } catch (error) {
            console.error("Failed to fetch classes:", error);
            toast.error("Failed to fetch classes."); // Use toast for error
            setClasses([]);
        }
        setLoading(false);
    };

    // Search
    const filtered = useMemo(() => {
        if (!query) return classes;
        const q = query.toLowerCase();
        return classes.filter(
            (cls) =>
                cls.name.toLowerCase().includes(q) ||
                cls.section.toLowerCase().includes(q)
        );
    }, [classes, query]);

    // Add
    const handleAdd = async () => {
        if (!newClass.name || !newClass.section) {
            toast.error("Please fill all fields"); // Use toast for validation
            return;
        }
        setSaving(true);
        try {
            await addClass(newClass);
            setAddModal(false);
            setNewClass({ name: "", section: "" });
            loadClasses();
            toast.success("Class added successfully!"); // Use toast for success
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add class"); // Use toast for error
        }
        setSaving(false);
    };

    // Delete
    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteClass(deleteDialog._id);
            setDeleteDialog(null);
            loadClasses();
            toast.success("Class deleted successfully!"); // Use toast for success
        } catch (error) {
            toast.error("Failed to delete class"); // Use toast for error
        }
        setDeleting(false);
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BookOpen size={32} className="text-blue-600" />
                    Classes
                </h1>
                <button
                    onClick={() => setAddModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Add Class
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="flex items-center bg-gray-100 px-3 py-2 rounded-lg w-64">
                    <Search size={16} className="text-gray-500" />
                    <input
                        className="bg-transparent ml-2 w-full outline-none"
                        placeholder="Search classes..."
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
                            <th className="p-3 text-left">Class Name</th>
                            <th className="p-3 text-left">Section</th>
                            <th className="p-3 text-left">Created At</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="4" className="p-6 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-6 text-center text-gray-500">
                                    No classes found
                                </td>
                            </tr>
                        ) : (
                            filtered.map((cls) => (
                                <tr key={cls._id} className="border-b hover:bg-blue-50">
                                    <td className="p-3 font-semibold">{cls.name}</td>
                                    <td className="p-3">{cls.section}</td>
                                    <td className="p-3">
                                        {new Date(cls.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => setDeleteDialog(cls)}
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

                            <h2 className="text-xl font-bold mb-4">Add New Class</h2>

                            <input
                                value={newClass.name}
                                onChange={(e) =>
                                    setNewClass({ ...newClass, name: e.target.value })
                                }
                                placeholder="Class Name (e.g., 10)"
                                className="border rounded px-3 py-2 w-full mb-3"
                            />

                            <input
                                value={newClass.section}
                                onChange={(e) =>
                                    setNewClass({ ...newClass, section: e.target.value })
                                }
                                placeholder="Section (e.g., A)"
                                className="border rounded px-3 py-2 w-full mb-3"
                            />

                            <button
                                onClick={handleAdd}
                                disabled={saving}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                            >
                                {saving ? "Adding..." : "Add Class"}
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
                            <h3 className="text-lg font-semibold mb-2">Delete Class?</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Are you sure you want to delete class {deleteDialog.name}-
                                {deleteDialog.section}? This action cannot be undone.
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
