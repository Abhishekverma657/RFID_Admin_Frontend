import { useState, useRef, useEffect, useContext } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { importQuestions, getQuestions } from "../api/testSystemApi";
import { useAppContext } from "../context/AppContext";
import React from "react";

export default function QuestionImportPage() {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);
    const [importedQuestions, setImportedQuestions] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [paperDetails, setPaperDetails] = useState({
        title: "",
        className: "",
        paperSet: ""
    });
    const previewRef = useRef(null);

    const { user } = useAppContext();
    const instituteId = user?.instituteId || user?._id;

    // Scroll to preview when it opens
    useEffect(() => {
        if (showPreview && previewRef.current) {
            previewRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [showPreview]);

    // Generate and download sample Excel
    const downloadSampleExcel = () => {
        // Create sample data as CSV (Excel will open it correctly)
        const sampleData = [
            ["class", "set", "sr", "question", "optionA", "optionB", "optionC", "optionD", "correctAnswer"],
            ["10th", "A", "1", "What is the capital of India?", "Mumbai", "Delhi", "Kolkata", "Chennai", "B"],
            ["10th", "A", "2", "Which is the largest planet?", "Earth", "Mars", "Jupiter", "Saturn", "C"],
            ["10th", "B", "1", "Who wrote Romeo and Juliet?", "Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain", "B"],
            ["10th", "B", "2", "What is 2 + 2?", "3", "4", "5", "6", "B"],
            ["12th", "A", "1", "Leave correctAnswer blank for non-evaluatable questions", "Option 1", "Option 2", "Option 3", "Option 4", ""],
        ];

        // Convert to CSV
        const csvContent = sampleData.map(row => row.join(",")).join("\n");

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "sample-questions.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validate file type - accept Excel and CSV
            const validTypes = [
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "text/csv"
            ];
            if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
                alert("Please select a valid Excel file (.xls, .xlsx) or CSV file (.csv)");
                return;
            }
            setFile(selectedFile);
            setResults(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }
        if (!instituteId) {
            alert("Institute ID not found. Please log in again.");
            return;
        }

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("instituteId", instituteId);
            formData.append("file", file);
            if (paperDetails.title) formData.append("paperTitle", paperDetails.title);
            if (paperDetails.className) formData.append("className", paperDetails.className);
            if (paperDetails.paperSet) formData.append("paperSet", paperDetails.paperSet);

            const response = await importQuestions(formData);
            setResults(response.data);
            setFile(null);

            // Fetch imported questions for preview
            if (response.data.imported > 0) {
                await fetchImportedQuestions();
            }
        } catch (error) {
            alert("Error importing questions: " + (error.response?.data?.message || error.message));
        } finally {
            setImporting(false);
        }
    };

    const fetchImportedQuestions = async () => {
        try {
            const response = await getQuestions(instituteId);
            setImportedQuestions(response.data);
            setShowPreview(true);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Import Questions from Excel/CSV</h1>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="font-semibold text-blue-900">Excel Format Requirements:</h2>
                    <button
                        onClick={downloadSampleExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
                    >
                        <FileSpreadsheet size={16} />
                        Download Sample
                    </button>
                </div>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    <li><strong>Required columns:</strong> class, set, sr, question, optionA, optionB, optionC, optionD</li>
                    <li><strong>Optional column:</strong> correctAnswer (A/B/C/D) - leave blank for non-evaluatable questions</li>
                    <li><strong>Set values:</strong> Must be A, B, C, or D</li>
                    <li><strong>Serial number (sr):</strong> Must be unique within class + set combination</li>
                </ul>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Paper Title (Recommended)</label>
                        <input
                            type="text"
                            value={paperDetails.title}
                            onChange={(e) => setPaperDetails({ ...paperDetails, title: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="e.g. Maths Unit Test 1"
                        />
                        <p className="text-xs text-gray-500 mt-1">If provided, questions will be grouped under this name.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
                        <input
                            type="text"
                            value={paperDetails.className}
                            onChange={(e) => setPaperDetails({ ...paperDetails, className: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            placeholder="e.g. 10th"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Set</label>
                        <select
                            value={paperDetails.paperSet}
                            onChange={(e) => setPaperDetails({ ...paperDetails, paperSet: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        >
                            <option value="">Select Set (Optional)</option>
                            <option value="A">Set A</option>
                            <option value="B">Set B</option>
                            <option value="C">Set C</option>
                            <option value="D">Set D</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <FileSpreadsheet size={48} className="text-gray-400 mb-4" />
                    <input
                        type="file"
                        accept=".xls,.xlsx,.csv"
                        onChange={handleFileChange}
                        className="hidden"
                        id="excel-upload"
                    />
                    <label
                        htmlFor="excel-upload"
                        className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition mb-2"
                    >
                        Select Excel or CSV File
                    </label>
                    {file && (
                        <p className="text-sm text-gray-600 mt-2">
                            Selected: <span className="font-medium">{file.name}</span>
                        </p>
                    )}
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleImport}
                        disabled={importing || !file}
                        className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium text-lg"
                    >
                        <Upload size={20} />
                        {importing ? "Importing..." : "Import Questions"}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {results && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Import Results</h2>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle size={24} />
                                <div>
                                    <p className="text-2xl font-bold">{results.imported}</p>
                                    <p className="text-sm">Successfully Imported</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertCircle size={24} />
                                <div>
                                    <p className="text-2xl font-bold">{results.failed}</p>
                                    <p className="text-sm">Failed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Success Details */}
                    {results.successDetails.length > 0 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-green-700 mb-2">Successfully Imported:</h3>
                            <div className="max-h-40 overflow-y-auto bg-green-50 rounded p-3">
                                {results.successDetails.map((item, idx) => (
                                    <div key={idx} className="text-sm text-green-800">
                                        Row {item.row}: Class {item.class}, Set {item.set}, SR {item.sr}
                                        {!item.isEvaluatable && <span className="text-orange-600 ml-2">(Non-evaluatable)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error Details */}
                    {results.errorDetails.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-red-700 mb-2">Errors:</h3>
                            <div className="max-h-40 overflow-y-auto bg-red-50 rounded p-3">
                                {results.errorDetails.map((item, idx) => (
                                    <div key={idx} className="text-sm text-red-800">
                                        Row {item.row}: {item.error}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Questions Preview */}
            {showPreview && importedQuestions.length > 0 && (
                <div ref={previewRef} className="bg-white rounded-lg shadow p-6 mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Imported Questions ({importedQuestions.length})</h2>
                        <button
                            onClick={() => setShowPreview(false)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                        >
                            Hide Preview
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Set</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SR</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Options</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Answer</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {importedQuestions.map((q, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm">{q.class}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                {q.set}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-mono">{q.sr}</td>
                                        <td className="px-4 py-3 text-sm max-w-md">{q.question}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="space-y-1">
                                                <div>A) {q.optionA}</div>
                                                <div>B) {q.optionB}</div>
                                                <div>C) {q.optionC}</div>
                                                <div>D) {q.optionD}</div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {q.correctAnswer ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-semibold">
                                                    {q.correctAnswer}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                                                    Not Set
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
