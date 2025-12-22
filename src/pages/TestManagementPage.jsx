import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Clock, AlertCircle, Link as LinkIcon, FileQuestion } from "lucide-react";
import { createTest, getTests, updateTest, deleteTest } from "../api/testSystemApi";
import { useAppContext } from "../context/AppContext";
import React from "react";
export default function TestManagementPage() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTestId, setCurrentTestId] = useState(null);

    const { user } = useAppContext();
    const instituteId = user?.instituteId || user?._id;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        duration: 60,
        totalMarks: 100,
        passingMarks: 33,
        targetClass: "",
        targetPaperSet: "A",

        // Rules - mapped to proctoringConfig
        tabSwitchLimit: 3,
        violationLimit: 5,
        fullScreenEnforced: true,
        webcamRequired: true,
        deviceRestriction: "any",
    });

    useEffect(() => {
        if (instituteId) {
            fetchTests();
        }
    }, [instituteId]);

    const fetchTests = async () => {
        try {
            const response = await getTests(instituteId);
            setTests(response.data);
        } catch (error) {
            alert("Error fetching tests: " + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                instituteId,
                title: formData.title,
                description: formData.description,
                duration: Number(formData.duration),
                totalMarks: Number(formData.totalMarks),
                passingMarks: Number(formData.passingMarks),
                targetClass: formData.targetClass,
                targetPaperSet: formData.targetPaperSet,
                proctoringConfig: {
                    tabSwitchLimit: Number(formData.tabSwitchLimit),
                    violationLimit: Number(formData.violationLimit),
                    fullScreenEnforced: formData.fullScreenEnforced,
                    webcamRequired: formData.webcamRequired,
                    deviceRestriction: formData.deviceRestriction,
                }
            };

            if (isEditing) {
                await updateTest(currentTestId, payload);
            } else {
                await createTest(payload);
            }

            fetchTests();
            handleCloseModal();
        } catch (error) {
            alert("Error saving test: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (test) => {
        setIsEditing(true);
        setCurrentTestId(test._id);
        const config = test.proctoringConfig || {};
        setFormData({
            title: test.title,
            description: test.description || "",
            duration: test.duration,
            totalMarks: test.totalMarks,
            passingMarks: test.passingMarks,
            targetClass: test.targetClass || "",
            targetPaperSet: test.targetPaperSet || "A",

            tabSwitchLimit: config.tabSwitchLimit || 3,
            violationLimit: config.violationLimit || 5,
            fullScreenEnforced: config.fullScreenEnforced ?? true,
            webcamRequired: config.webcamRequired ?? true,
            deviceRestriction: config.deviceRestriction || "any",
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this test?")) {
            try {
                await deleteTest(id);
                fetchTests();
            } catch (error) {
                alert("Error deleting test: " + error.message);
            }
        }
    };

    const handleCopyLink = (testId) => {
        const link = `${window.location.origin}/test/${testId}`;
        navigator.clipboard.writeText(link);
        alert("Test link copied to clipboard!");
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setCurrentTestId(null);
        setFormData({
            title: "",
            description: "",
            duration: 60,
            totalMarks: 100,
            passingMarks: 33,
            targetClass: "",
            targetPaperSet: "A",
            tabSwitchLimit: 3,
            violationLimit: 5,
            fullScreenEnforced: true,
            webcamRequired: true,
            deviceRestriction: "any",
        });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Test Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
                >
                    <Plus size={20} />
                    Create Test
                </button>
            </div>

            {/* Test List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => (
                    <div key={test._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{test.title}</h3>
                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{test.description || "No description"}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCopyLink(test._id)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                    title="Copy Test Link"
                                >
                                    <LinkIcon size={18} />
                                </button>
                                <button
                                    onClick={() => handleEdit(test)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="Edit Test"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(test._id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    title="Delete Test"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                                {test.targetClass || "N/A"} - Set {test.targetPaperSet || "A"}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                <Clock size={14} />
                                {test.duration} mins
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                <span className="font-semibold">{test.totalMarks}</span> Marks
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                            <FileQuestion size={16} className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">
                                {test.questionCount || 0} Questions Linked
                            </span>
                        </div>

                        <div className="border-t border-gray-100 pt-4 mt-auto">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Proctoring Rules</h4>
                            <div className="flex flex-wrap gap-2 text-xs">
                                {test.proctoringConfig?.webcamRequired && (
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100">
                                        Webcam
                                    </span>
                                )}
                                {test.proctoringConfig?.fullScreenEnforced && (
                                    <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded border border-orange-100">
                                        Fullscreen
                                    </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">
                                    Max {test.proctoringConfig?.tabSwitchLimit} switches
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {tests.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No tests created yet</h3>
                    <p className="text-gray-500 mt-1">Create your first test to get started</p>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-2xl font-bold text-gray-800">
                                {isEditing ? "Edit Test" : "Create New Test"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Basic Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Title <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Mathematics Mid-Term"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows="3"
                                            placeholder="Instructions for students..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Class <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.targetClass}
                                            onChange={(e) => setFormData({ ...formData, targetClass: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. 10th"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Paper Set <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            value={formData.targetPaperSet}
                                            onChange={(e) => setFormData({ ...formData, targetPaperSet: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="A">Set A</option>
                                            <option value="B">Set B</option>
                                            <option value="C">Set C</option>
                                            <option value="D">Set D</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (mins) <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.totalMarks}
                                            onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Passing Marks</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.passingMarks}
                                            onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Proctoring Rules */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider border-b pb-2">Proctoring & Security</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tab Switch Limit</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.tabSwitchLimit}
                                            onChange={(e) => setFormData({ ...formData, tabSwitchLimit: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Test auto-submits if exceeded</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Violations</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.violationLimit}
                                            onChange={(e) => setFormData({ ...formData, violationLimit: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Warning threshold before action</p>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.webcamRequired}
                                            onChange={(e) => setFormData({ ...formData, webcamRequired: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="block font-medium text-gray-700">Require Webcam</span>
                                            <span className="text-xs text-gray-500">Student must have camera enabled</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.fullScreenEnforced}
                                            onChange={(e) => setFormData({ ...formData, fullScreenEnforced: e.target.checked })}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="block font-medium text-gray-700">Enforce Fullscreen</span>
                                            <span className="text-xs text-gray-500">Test terminates if fullscreen exited</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? "Saving..." : "Save Test"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
