import { useState, useEffect } from "react";
import { Eye, Search } from "lucide-react";
import { getAllResults, getResultDetail, updateReviewStatus } from "../api/testSystemApi";
import React from "react";
export default function ResultReviewPage() {
    const [results, setResults] = useState([]);
    const [selectedResult, setSelectedResult] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reviewStatus, setReviewStatus] = useState("");
    const [adminRemark, setAdminRemark] = useState("");

    const instituteId = localStorage.getItem("instituteId");

    useEffect(() => {
        if (instituteId) {
            fetchResults();
        }
    }, [instituteId]);

    const fetchResults = async () => {
        try {
            const response = await getAllResults(instituteId);
            setResults(response.data);
        } catch (error) {
            alert("Error fetching results: " + error.message);
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
                reviewedBy: localStorage.getItem("userId"), // Assuming stored
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
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Result Review & Approval</h1>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submit Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {results.map((result) => (
                            <tr key={result.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{result.student.userId}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{result.student.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{result.test.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs ${result.submitType === "manual" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                                        {result.submitType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(result.reviewStatus)}`}>
                                        {result.reviewStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => handleViewDetail(result)}
                                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                        <Eye size={18} />
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedResult && detailData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-6xl m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">{detailData.examSummary.testTitle} - Result Review</h2>

                        {/* Exam Summary */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-600">Student: <span className="font-semibold">{detailData.examSummary.studentName}</span></p>
                                <p className="text-sm text-gray-600">User ID: <span className="font-mono font-semibold">{detailData.examSummary.userId}</span></p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Submit Type: <span className="font-semibold">{detailData.examSummary.submitType}</span></p>
                                <p className="text-sm text-gray-600">Duration: <span className="font-semibold">{detailData.examSummary.duration} min</span></p>
                            </div>
                        </div>

                        {/* Performance Summary */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold mb-2">Performance Summary</h3>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{detailData.performanceSummary.score}</p>
                                    <p className="text-sm text-gray-600">Score</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{detailData.performanceSummary.correct}</p>
                                    <p className="text-sm text-gray-600">Correct</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-red-600">{detailData.performanceSummary.wrong}</p>
                                    <p className="text-sm text-gray-600">Wrong</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-600">{detailData.performanceSummary.unattempted}</p>
                                    <p className="text-sm text-gray-600">Unattempted</p>
                                </div>
                            </div>
                        </div>

                        {/* Violations */}
                        {detailData.violations.length > 0 && (
                            <div className="bg-red-50 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-red-700 mb-2">Violations ({detailData.violations.length})</h3>
                                <div className="max-h-40 overflow-y-auto">
                                    {detailData.violations.map((violation, idx) => (
                                        <div key={idx} className="text-sm text-red-800 py-1">
                                            {new Date(violation.timestamp).toLocaleTimeString()} - <strong>{violation.type}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Webcam Snapshots */}
                        {detailData.snapshots.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2">Webcam Snapshots ({detailData.snapshots.length})</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {detailData.snapshots.slice(0, 8).map((snapshot, idx) => (
                                        <div key={idx} className="relative">
                                            <img
                                                src={`http://localhost:5000${snapshot.imageUrl}`}
                                                alt={`Snapshot ${idx + 1}`}
                                                className="w-full h-32 object-cover rounded"
                                            />
                                            <p className="text-xs text-gray-600 mt-1">
                                                {new Date(snapshot.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Review Status Update */}
                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-3">Admin Review</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Status</label>
                                    <select
                                        value={reviewStatus}
                                        onChange={(e) => setReviewStatus(e.target.value)}
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        <option value="under-review">Under Review</option>
                                        <option value="valid">Valid</option>
                                        <option value="disqualified">Disqualified</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Admin Remark (Internal)</label>
                                    <textarea
                                        value={adminRemark}
                                        onChange={(e) => setAdminRemark(e.target.value)}
                                        className="w-full border rounded px-3 py-2"
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-end">
                                <button
                                    onClick={() => setSelectedResult(null)}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleUpdateReview}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Update Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
