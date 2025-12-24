import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Clock, AlertCircle, Link as LinkIcon, FileQuestion, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { createTest, getTests, updateTest, deleteTest, getQuestionPapers } from "../api/testSystemApi";
import { useAppContext } from "../context/AppContext";
import React from "react";

const toLocalISO = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatISO = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().replace('T', ' ').slice(0, 16);
};

export default function TestManagementPage() {
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTestId, setCurrentTestId] = useState(null);
    const [questionPapers, setQuestionPapers] = useState([]);

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
        selectedPaperId: "", // New field for question paper selection

        // Rules - mapped to proctoringConfig
        tabSwitchLimit: 3,
        violationLimit: 5,
        fullScreenEnforced: true,
        webcamRequired: true,
        deviceRestriction: "any",
        startTime: "",
        endTime: "",
    });

    useEffect(() => {
        if (instituteId) {
            fetchTests();
            fetchQuestionPapers();
        }
    }, [instituteId]);

    useEffect(() => {
        if (formData.startTime && formData.endTime) {
            const start = new Date(formData.startTime);
            const end = new Date(formData.endTime);
            if (end > start) {
                const diffInMins = Math.floor((end - start) / (1000 * 60));
                setFormData(prev => ({ ...prev, duration: diffInMins }));
            }
        }
    }, [formData.startTime, formData.endTime]);

    const fetchTests = async () => {
        try {
            const response = await getTests(instituteId);
            setTests(response.data);
        } catch (error) {
            toast.error("Error fetching tests: " + error.message);
        }
    };

    const fetchQuestionPapers = async () => {
        try {
            const response = await getQuestionPapers(instituteId);
            setQuestionPapers(response.data || []);
        } catch (error) {
            console.error("Error fetching question papers:", error);
        }
    };

    const handlePaperSelect = (paperId) => {
        const selectedPaper = questionPapers.find(p => p._id === paperId);
        if (selectedPaper) {
            setFormData({
                ...formData,
                selectedPaperId: paperId,
                targetClass: selectedPaper.class,
                targetPaperSet: selectedPaper.set,
            });
        } else {
            setFormData({
                ...formData,
                selectedPaperId: "",
                targetClass: "",
                targetPaperSet: "A",
            });
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
                questionPaperId: formData.selectedPaperId || null,
                proctoringConfig: {
                    tabSwitchLimit: Number(formData.tabSwitchLimit),
                    violationLimit: Number(formData.violationLimit),
                    fullScreenEnforced: formData.fullScreenEnforced,
                    webcamRequired: formData.webcamRequired,
                    deviceRestriction: formData.deviceRestriction,
                },
                startTime: formData.startTime ? new Date(formData.startTime).toISOString() : null,
                endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
            };

            if (isEditing) {
                await updateTest(currentTestId, payload);
                toast.success("Test updated successfully!");
            } else {
                await createTest(payload);
                toast.success("Test created successfully!");
            }

            fetchTests();
            handleCloseModal();
        } catch (error) {
            toast.error("Error saving test: " + error.message);
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
            selectedPaperId: test.questionPaperId || "",

            tabSwitchLimit: config.tabSwitchLimit || 3,
            violationLimit: config.violationLimit || 5,
            fullScreenEnforced: config.fullScreenEnforced ?? true,
            webcamRequired: config.webcamRequired ?? true,
            deviceRestriction: config.deviceRestriction || "any",
            startTime: test.startTime ? toLocalISO(test.startTime) : "",
            endTime: test.endTime ? toLocalISO(test.endTime) : "",
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this test?")) {
            try {
                await deleteTest(id);
                fetchTests();
                toast.success("Test deleted successfully!");
            } catch (error) {
                toast.error("Error deleting test: " + error.message);
            }
        }
    };

    const handleCopyLink = (testId) => {
        const link = `${window.location.origin}/test/${testId}`;
        navigator.clipboard.writeText(link);
        toast.success("Test link copied to clipboard!");
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
            selectedPaperId: "",
            tabSwitchLimit: 3,
            violationLimit: 5,
            fullScreenEnforced: true,
            webcamRequired: true,
            deviceRestriction: "any",
            startTime: "",
            endTime: "",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                        {test.startTime && test.endTime && (
                            <div className="mb-4 space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Timing (ISO)</p>
                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                    <div className="flex-1">
                                        <span className="font-bold text-blue-600">S:</span> {formatISO(test.startTime)}
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-bold text-indigo-600">E:</span> {formatISO(test.endTime)}
                                    </div>
                                </div>
                            </div>
                        )}

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
                        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                                {isEditing ? "Edit Test" : "Create New Test"}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
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
                                {/* Question Paper Selection */}
                                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BookOpen size={18} className="text-blue-600" />
                                        <label className="text-sm font-semibold text-blue-900">Select Question Paper <span className="text-red-500">*</span></label>
                                    </div>
                                    <select
                                        required
                                        value={formData.selectedPaperId}
                                        onChange={(e) => handlePaperSelect(e.target.value)}
                                        className="w-full border border-blue-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
                                    >
                                        <option value="">-- Select a Question Paper --</option>
                                        {questionPapers.map((paper) => (
                                            <option key={paper._id} value={paper._id}>
                                                {paper.title} | Class: {paper.class} | Set: {paper.set} ({paper.questionCount || 0} Qs)
                                            </option>
                                        ))}
                                    </select>
                                    {questionPapers.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                            <AlertCircle size={14} />
                                            No question papers found. Please import questions first.
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Class</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.targetClass}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                                            placeholder="Auto-filled from paper"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Paper Set</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.targetPaperSet ? `Set ${formData.targetPaperSet}` : ""}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                                            placeholder="Auto-filled from paper"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            <Clock size={16} className="text-gray-400" />
                                            Duration (mins)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                                readOnly={!!(formData.startTime && formData.endTime)}
                                                className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 ${formData.startTime && formData.endTime ? 'bg-gray-50 text-blue-600 font-semibold cursor-not-allowed' : 'bg-white'}`}
                                                placeholder="Set times to auto-calculate"
                                            />
                                            {formData.startTime && formData.endTime && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold uppercase">Auto</span>
                                                </div>
                                            )}
                                        </div>
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
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                                        <Clock size={80} />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            Start Date & Time
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none bg-white shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            End Date & Time
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none bg-white shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-[11px] text-gray-500 flex items-center gap-1.5 bg-white/50 p-2 rounded-lg border border-dashed border-gray-300">
                                        <AlertCircle size={14} className="text-blue-500" />
                                        Duration will be automatically updated based on selected times.
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
