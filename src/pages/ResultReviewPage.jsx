import { useState, useEffect } from "react";
import { Eye, Search, CheckCircle, XCircle, MinusCircle, Clock, AlertTriangle, Camera, FileText, BarChart3, X, ChevronLeft, ChevronRight, RefreshCw, Users } from "lucide-react";
import { getAllResults, getResultDetail, updateReviewStatus } from "../api/testSystemApi";
import { useAppContext } from "../context/AppContext";
import React from "react";

export default function ResultReviewPage() {
    const [results, setResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingResults, setFetchingResults] = useState(true);
    const [reviewStatus, setReviewStatus] = useState("");
    const [adminRemark, setAdminRemark] = useState("");
    const [activeTab, setActiveTab] = useState("summary");
    const [snapshotIndex, setSnapshotIndex] = useState(0);

    const { user } = useAppContext();
    const instituteId = user?.instituteId || user?._id;

    useEffect(() => {
        if (instituteId) {
            fetchResults();
        }
    }, [instituteId]);

    const fetchResults = async () => {
        setFetchingResults(true);
        try {
            const response = await getAllResults(instituteId);
            setResults(response.data || []);
        } catch (error) {
            console.error("Error fetching results:", error);
            alert("Error fetching results: " + error.message);
        } finally {
            setFetchingResults(false);
        }
    };

    const handleViewDetail = async (result) => {
        setLoading(true);
        try {
            const response = await getResultDetail(result.id);
            setDetailData(response.data);
            setSelectedResult(result);
            setReviewStatus(response.data.review?.status || "under-review");
            setAdminRemark(response.data.review?.adminRemark || "");
            setActiveTab("summary");
            setSnapshotIndex(0);
        } catch (error) {
            alert("Error fetching result detail: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateReview = async () => {
        if (!selectedResult) return;
        try {
            await updateReviewStatus(selectedResult.id, {
                status: reviewStatus,
                adminRemark,
                reviewedBy: user?._id,
            });
            alert("Review status updated");
            setSelectedResult(null);
            fetchResults();
        } catch (error) {
            alert("Error updating review: " + error.message);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            "under-review": "bg-yellow-100 text-yellow-800",
            "valid": "bg-green-100 text-green-800",
            "disqualified": "bg-red-100 text-red-800",
            "published": "bg-indigo-100 text-indigo-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getAnswerStatus = (q) => {
        if (q.selectedOption === null) return "unattempted";
        if (!q.isEvaluatable) return "non-evaluatable";
        return q.isCorrect ? "correct" : "wrong";
    };

    const getImageUrl = (url) => {
        if (!url) return "";
        if (url.startsWith("http") || url.startsWith("https")) return url;
        return `http://localhost:5000${url}`;
    };

    const formatDuration = (startTime, endTime) => {
        if (!startTime || !endTime) return "-";
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end - start;
        const mins = Math.floor(diffMs / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Result Review & Approval</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {results.length} submitted results
                    </p>
                </div>
                <button
                    onClick={fetchResults}
                    disabled={fetchingResults}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    <RefreshCw size={18} className={fetchingResults ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Test</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Answered</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time Taken</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Submit Type</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Violations</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {fetchingResults ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12">
                                        <RefreshCw size={24} className="animate-spin mx-auto text-blue-600 mb-2" />
                                        <p className="text-gray-500">Loading results...</p>
                                    </td>
                                </tr>
                            ) : results.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12">
                                        <Users size={48} className="mx-auto text-gray-300 mb-3" />
                                        <p className="text-gray-500 font-medium">No submitted results found</p>
                                        <p className="text-gray-400 text-sm">Results will appear here once students submit their tests</p>
                                    </td>
                                </tr>
                            ) : (
                                results.map((result) => (
                                    <tr key={result.id} className="hover:bg-gray-50 transition">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900">{result.student?.name || "N/A"}</p>
                                                <p className="text-xs text-gray-500 font-mono">{result.student?.userId || "N/A"}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-gray-800">{result.test?.title || "N/A"}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700">{result.answeredCount || 0}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-600">{formatDuration(result.startTime, result.endTime)}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${result.submitType === "manual" ? "bg-green-100 text-green-700" :
                                                result.submitType === "auto-time" ? "bg-orange-100 text-orange-700" :
                                                    result.submitType === "auto-violation" ? "bg-red-100 text-red-700" :
                                                        "bg-gray-100 text-gray-700"
                                                }`}>
                                                {result.submitType || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-medium ${(result.violationCount || 0) > 0 ? "text-red-600" : "text-gray-500"
                                                }`}>
                                                {result.violationCount || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(result.reviewStatus)}`}>
                                                {result.reviewStatus || "under-review"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => handleViewDetail(result)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedResult && detailData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <div>
                                <h2 className="text-xl font-bold">{detailData.examSummary.testTitle}</h2>
                                <p className="text-blue-100 text-sm">{detailData.examSummary.studentName} ({detailData.examSummary.userId})</p>
                            </div>
                            <button onClick={() => setSelectedResult(null)} className="text-white hover:bg-white/20 p-2 rounded-lg transition">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b bg-gray-50">
                            {[
                                { id: "summary", label: "Summary", icon: BarChart3 },
                                { id: "questions", label: "Questions", icon: FileText },
                                { id: "violations", label: `Violations (${detailData.violations.length})`, icon: AlertTriangle },
                                { id: "snapshots", label: `Snapshots (${detailData.snapshots.length})`, icon: Camera },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition border-b-2 ${activeTab === tab.id
                                        ? "border-blue-600 text-blue-600 bg-white"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Summary Tab */}
                            {activeTab === "summary" && (
                                <div className="space-y-6">
                                    {/* Performance Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                                            <p className="text-3xl font-bold">{detailData.performanceSummary.score}</p>
                                            <p className="text-blue-100 text-sm">Score</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                                            <p className="text-3xl font-bold">{detailData.performanceSummary.correct}</p>
                                            <p className="text-green-100 text-sm">Correct</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
                                            <p className="text-3xl font-bold">{detailData.performanceSummary.wrong}</p>
                                            <p className="text-red-100 text-sm">Wrong</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl p-4 text-white">
                                            <p className="text-3xl font-bold">{detailData.performanceSummary.unattempted}</p>
                                            <p className="text-gray-200 text-sm">Unattempted</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                                            <p className="text-3xl font-bold">
                                                {Math.round((detailData.performanceSummary.correct / detailData.performanceSummary.totalQuestions) * 100)}%
                                            </p>
                                            <p className="text-purple-100 text-sm">Percentage</p>
                                        </div>
                                    </div>

                                    {/* Exam Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-gray-800 mb-3">Exam Details</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Duration</span>
                                                    <span className="font-medium">{detailData.examSummary.duration} minutes</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Submit Type</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${detailData.examSummary.submitType === "manual"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-orange-100 text-orange-700"
                                                        }`}>
                                                        {detailData.examSummary.submitType}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Start Time</span>
                                                    <span className="font-medium">{new Date(detailData.examSummary.startTime).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">End Time</span>
                                                    <span className="font-medium">{new Date(detailData.examSummary.endTime).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Review */}
                                        <div className="bg-gray-50 rounded-xl p-4">
                                            <h3 className="font-semibold text-gray-800 mb-3">Admin Review</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                                                    <select
                                                        value={reviewStatus}
                                                        onChange={(e) => setReviewStatus(e.target.value)}
                                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                                    >
                                                        <option value="under-review">Under Review</option>
                                                        <option value="valid">Valid / Approved</option>
                                                        <option value="disqualified">Disqualified</option>
                                                        <option value="published">Published (Email results)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">Admin Remark</label>
                                                    <textarea
                                                        value={adminRemark}
                                                        onChange={(e) => setAdminRemark(e.target.value)}
                                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                                        rows="2"
                                                        placeholder="Add internal notes..."
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleUpdateReview}
                                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition"
                                                >
                                                    Update Review
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Questions Tab */}
                            {activeTab === "questions" && (
                                <div className="space-y-4">
                                    {/* Quick Stats */}
                                    <div className="flex gap-4 text-sm mb-4">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle size={16} className="text-green-600" />
                                            <span>Correct: {detailData.performanceSummary.correct}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <XCircle size={16} className="text-red-600" />
                                            <span>Wrong: {detailData.performanceSummary.wrong}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MinusCircle size={16} className="text-gray-400" />
                                            <span>Unattempted: {detailData.performanceSummary.unattempted}</span>
                                        </div>
                                    </div>

                                    {/* Question Cards */}
                                    {detailData.questionWiseBreakdown.map((q, idx) => {
                                        const status = getAnswerStatus(q);
                                        return (
                                            <div
                                                key={idx}
                                                className={`border rounded-xl p-4 ${status === "correct" ? "border-green-200 bg-green-50/50" :
                                                    status === "wrong" ? "border-red-200 bg-red-50/50" :
                                                        "border-gray-200 bg-gray-50/50"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-gray-200 text-gray-700 text-sm font-bold px-2.5 py-1 rounded">
                                                            Q{q.sr}
                                                        </span>
                                                        {status === "correct" && <CheckCircle size={20} className="text-green-600" />}
                                                        {status === "wrong" && <XCircle size={20} className="text-red-600" />}
                                                        {status === "unattempted" && <MinusCircle size={20} className="text-gray-400" />}
                                                        {status === "non-evaluatable" && (
                                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Non-evaluatable</span>
                                                        )}
                                                    </div>
                                                    {q.timeSpent > 0 && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {Math.round(q.timeSpent)}s
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-gray-800 font-medium mb-4">{q.question}</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {["A", "B", "C", "D"].map((opt) => {
                                                        const isCorrectAnswer = q.correctAnswer === opt;
                                                        const isSelected = q.selectedOption === opt;

                                                        let bgClass = "bg-white border-gray-200";
                                                        if (isCorrectAnswer) {
                                                            bgClass = "bg-green-100 border-green-400";
                                                        }
                                                        if (isSelected && !isCorrectAnswer) {
                                                            bgClass = "bg-red-100 border-red-400";
                                                        }

                                                        return (
                                                            <div
                                                                key={opt}
                                                                className={`flex items-center gap-2 p-2.5 rounded-lg border ${bgClass}`}
                                                            >
                                                                <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isCorrectAnswer ? "bg-green-600 text-white" :
                                                                    isSelected ? "bg-red-600 text-white" :
                                                                        "bg-gray-200 text-gray-600"
                                                                    }`}>
                                                                    {opt}
                                                                </span>
                                                                <span className="text-sm text-gray-700 flex-1">{q[`option${opt}`]}</span>
                                                                {isCorrectAnswer && (
                                                                    <CheckCircle size={16} className="text-green-600" />
                                                                )}
                                                                {isSelected && !isCorrectAnswer && (
                                                                    <XCircle size={16} className="text-red-600" />
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Violations Tab */}
                            {activeTab === "violations" && (
                                <div>
                                    {detailData.violations.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
                                            <p className="text-lg font-medium">No violations recorded</p>
                                            <p className="text-sm">The student completed the test without any violations</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {detailData.violations.map((violation, idx) => (
                                                <div key={idx} className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                        <AlertTriangle size={20} className="text-red-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-red-800">{violation.type.replace(/_/g, " ")}</p>
                                                        <p className="text-sm text-red-600">
                                                            {new Date(violation.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">
                                                        #{idx + 1}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Snapshots Tab */}
                            {activeTab === "snapshots" && (
                                <div>
                                    {detailData.snapshots.length === 0 ? (
                                        <div className="text-center py-12 text-gray-500">
                                            <Camera size={48} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-lg font-medium">No snapshots captured</p>
                                            <p className="text-sm">Webcam snapshots were not recorded for this test</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Main Snapshot Viewer */}
                                            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                                                <img
                                                    src={getImageUrl(detailData.snapshots[snapshotIndex]?.imageUrl)}
                                                    alt={`Snapshot ${snapshotIndex + 1}`}
                                                    className="w-full h-full object-contain"
                                                />
                                                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                                                    {snapshotIndex + 1} / {detailData.snapshots.length} • {new Date(detailData.snapshots[snapshotIndex]?.timestamp).toLocaleTimeString()}
                                                </div>

                                                {/* Navigation */}
                                                {snapshotIndex > 0 && (
                                                    <button
                                                        onClick={() => setSnapshotIndex(prev => prev - 1)}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white transition"
                                                    >
                                                        <ChevronLeft size={24} />
                                                    </button>
                                                )}
                                                {snapshotIndex < detailData.snapshots.length - 1 && (
                                                    <button
                                                        onClick={() => setSnapshotIndex(prev => prev + 1)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white transition"
                                                    >
                                                        <ChevronRight size={24} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Thumbnails */}
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {detailData.snapshots.map((snapshot, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSnapshotIndex(idx)}
                                                        className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${snapshotIndex === idx ? "border-blue-600" : "border-transparent hover:border-gray-300"
                                                            }`}
                                                    >
                                                        <img
                                                            src={getImageUrl(snapshot.imageUrl)}
                                                            alt={`Thumb ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
