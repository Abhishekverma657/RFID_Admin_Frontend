import { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2, CheckCircle } from "lucide-react";
import {
    createTestStudent,
    getTestStudents,
    deleteTestStudent,
    assignTestToStudent,
    getTests,
} from "../api/testSystemApi";
import React from "react";

import { useAppContext } from "../context/AppContext";

export default function TestStudentPage() {
    const [students, setStudents] = useState([]);
    const [tests, setTests] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(false);

    const { user } = useAppContext();
    const instituteId = user?.instituteId || user?._id;

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        testId: "",
        className: "",
        paperSet: "A",
    });

    const [assignData, setAssignData] = useState({
        testId: "",
        className: "",
        paperSet: "A",
    });

    useEffect(() => {
        if (instituteId) {
            fetchStudents();
            fetchTests();
        }
    }, [instituteId]);

    const fetchStudents = async () => {
        try {
            const response = await getTestStudents(instituteId);
            setStudents(response.data);
        } catch (error) {
            alert("Error fetching students: " + error.message);
        }
    };

    const fetchTests = async () => {
        try {
            const response = await getTests(instituteId);
            setTests(response.data);
        } catch (error) {
            console.error("Error fetching tests:", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await createTestStudent({
                ...formData,
                instituteId,
            });
            setShowCreateModal(false);
            setFormData({
                name: "",
                email: "",
                testId: "",
                className: "",
                paperSet: "A"
            });
            fetchStudents();
        } catch (error) {
            alert("Error creating student: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this student?")) {
            try {
                await deleteTestStudent(id);
                fetchStudents();
            } catch (error) {
                alert("Error deleting student: " + error.message);
            }
        }
    };

    const handleAssign = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await assignTestToStudent(selectedStudent._id, assignData);
            setShowAssignModal(false);
            setSelectedStudent(null);
            setAssignData({ testId: "", className: "", paperSet: "A" });
            fetchStudents();
        } catch (error) {
            alert("Error assigning test: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Test Students</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
                >
                    <Plus size={20} />
                    Create Student
                </button>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Test</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Set</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                    No students found. Create one to get started.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student._id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                            {student.userId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{student.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                        {student.assignedTest ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {student.assignedTest.title}
                                            </span>
                                        ) : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{student.assignedClass || "-"}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.assignedPaperSet ? (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${student.assignedPaperSet === 'A' ? 'bg-purple-100 text-purple-800' :
                                                student.assignedPaperSet === 'B' ? 'bg-indigo-100 text-indigo-800' :
                                                    student.assignedPaperSet === 'C' ? 'bg-pink-100 text-pink-800' :
                                                        'bg-orange-100 text-orange-800'
                                                }`}>
                                                Set {student.assignedPaperSet}
                                            </span>
                                        ) : "-"}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    setAssignData({
                                                        testId: student.assignedTest?._id || "",
                                                        className: student.assignedClass || "",
                                                        paperSet: student.assignedPaperSet || "A",
                                                    });
                                                    setShowAssignModal(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 transition"
                                                title="Edit Assignment"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(student._id)}
                                                className="text-red-500 hover:text-red-700 transition"
                                                title="Delete Student"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl transform transition-all">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-800">Add New Student</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Personal Info</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Exam Assignment</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Assign Test</label>
                                        <select
                                            value={formData.testId}
                                            onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        >
                                            <option value="">Select a test (Optional)</option>
                                            {tests.map((test) => (
                                                <option key={test._id} value={test._id}>
                                                    {test.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                                            <input
                                                type="text"
                                                value={formData.className}
                                                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                                placeholder="e.g. 10th"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paper Set</label>
                                            <select
                                                value={formData.paperSet}
                                                onChange={(e) => setFormData({ ...formData, paperSet: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            >
                                                <option value="A">Set A</option>
                                                <option value="B">Set B</option>
                                                <option value="C">Set C</option>
                                                <option value="D">Set D</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 justify-end pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Student"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal - Kept for editing assignments via table action */}
            {showAssignModal && selectedStudent && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">Edit Assignment</h2>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAssign} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Test</label>
                                <select
                                    required
                                    value={assignData.testId}
                                    onChange={(e) => setAssignData({ ...assignData, testId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                >
                                    <option value="">Select test</option>
                                    {tests.map((test) => (
                                        <option key={test._id} value={test._id}>
                                            {test.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                                <input
                                    type="text"
                                    required
                                    value={assignData.className}
                                    onChange={(e) => setAssignData({ ...assignData, className: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Paper Set</label>
                                <select
                                    required
                                    value={assignData.paperSet}
                                    onChange={(e) => setAssignData({ ...assignData, paperSet: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                >
                                    <option value="A">Set A</option>
                                    <option value="B">Set B</option>
                                    <option value="C">Set C</option>
                                    <option value="D">Set D</option>
                                </select>
                            </div>
                            <div className="mt-6 flex gap-2 justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
