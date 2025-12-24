import { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Trash2, List, MoveUp, MoveDown, Edit, Save, Plus, ImageIcon } from "lucide-react";
import { importQuestions, getQuestions, getQuestionPapers, deleteQuestionPaper, reorderQuestions, deleteQuestion } from "../api/testSystemApi";
import { useAppContext } from "../context/AppContext";
import QuestionEditor from "./QuestionEditor";
import React from "react";

export default function QuestionImportPage() {
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState(null);
    const [importedQuestions, setImportedQuestions] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [questionPapers, setQuestionPapers] = useState([]);
    const [paperDetails, setPaperDetails] = useState({
        title: "",
        className: "",
        paperSet: ""
    });
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [selectedPaperId, setSelectedPaperId] = useState(null);

    const previewRef = useRef(null);

    const { user } = useAppContext();
    const instituteId = user?.instituteId || user?._id;

    useEffect(() => {
        if (instituteId) {
            fetchQuestionPapers();
        }
    }, [instituteId]);

    // Scroll to preview when it opens
    useEffect(() => {
        if (showPreview && previewRef.current) {
            previewRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [showPreview]);

    const fetchQuestionPapers = async () => {
        try {
            const response = await getQuestionPapers(instituteId);
            setQuestionPapers(response.data);
        } catch (error) {
            console.error("Error fetching question papers:", error);
        }
    };

    const handleDeletePaper = async (id) => {
        if (confirm("Are you sure you want to delete this key set? All questions in it will be deleted.")) {
            try {
                await deleteQuestionPaper(id);
                fetchQuestionPapers();
                if (showPreview) setShowPreview(false);
            } catch (error) {
                alert("Error deleting paper: " + error.message);
            }
        }
    };

    // Generate and download sample Excel
    const downloadSampleExcel = () => {
        const sampleData = [
            ["question", "optionA", "optionB", "optionC", "optionD", "correctAnswer", "level"],
            ["What is the capital of India?", "Mumbai", "Delhi", "Kolkata", "Chennai", "B", "Easy"],
            ["Which is the largest planet?", "Earth", "Mars", "Jupiter", "Saturn", "C", "Medium"],
            ["Who wrote Romeo and Juliet?", "Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain", "B", "Medium"],
            ["What is 2 + 2?", "3", "4", "5", "6", "B", "Easy"],
        ];

        const csvContent = sampleData.map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "sample-questions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
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
        if (!paperDetails.title || !paperDetails.className || !paperDetails.paperSet) {
            alert("Please fill in Paper Title, Class, and Set.");
            return;
        }

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append("instituteId", instituteId);
            formData.append("file", file);
            formData.append("paperTitle", paperDetails.title);
            formData.append("className", paperDetails.className);
            formData.append("paperSet", paperDetails.paperSet);

            const response = await importQuestions(formData);
            setResults(response.data);
            setFile(null);

            fetchQuestionPapers();

            if (response.data.imported > 0) {
                setSelectedPaperId(response.data.questionPaperId);
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
            // We can now filter by the exact details we just imported
            const response = await getQuestions(instituteId, paperDetails.className, paperDetails.paperSet);
            // Sort by SR just in case API didn't
            const sorted = response.data.sort((a, b) => a.sr - b.sr);
            setImportedQuestions(sorted);
            setShowPreview(true);
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (confirm("Are you sure you want to delete this question?")) {
            try {
                await deleteQuestion(id);
                fetchImportedQuestions();
            } catch (error) {
                alert("Error deleting question: " + error.message);
            }
        }
    };

    const handleReorder = async (currentIndex, direction) => {
        // Feature removed as per user request
        console.log("Reordering is disabled");
    };

    const handleEditSave = () => {
        setEditingQuestionId(null);
        setIsAddingQuestion(false);
        fetchImportedQuestions(); // Refresh data
        fetchQuestionPapers(); // Refresh papers count
    };

    // Function to load existing questions when clicking on a paper in the list
    const loadPaperQuestions = async (paper) => {
        setPaperDetails({
            title: paper.title,
            className: paper.class,
            paperSet: paper.set
        });
        setSelectedPaperId(paper._id);
        setResults(null);
        try {
            // We need getQuestions to support getting by exact paper details
            // The current API supports getting by class and set.
            const response = await getQuestions(instituteId, paper.class, paper.set);
            setImportedQuestions(response.data.sort((a, b) => a.sr - b.sr));
            setShowPreview(true);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Import & Manage Questions</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Import Form */}
                <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="font-semibold text-blue-900">1. Setup Paper & Import</h2>
                            <button
                                onClick={downloadSampleExcel}
                                className="flex items-center gap-2 bg-white text-blue-700 px-3 py-1 rounded border border-blue-200 hover:bg-blue-100 text-xs font-medium"
                            >
                                <FileSpreadsheet size={14} />
                                Sample CSV
                            </button>
                        </div>
                        <p className="text-sm text-blue-800 mb-2">
                            Prepare your CSV without "Sr No". You can now add images and edit questions after import.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Title</label>
                                <input
                                    type="text"
                                    value={paperDetails.title}
                                    onChange={(e) => setPaperDetails({ ...paperDetails, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="e.g. Science Test 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <input
                                    type="text"
                                    value={paperDetails.className}
                                    onChange={(e) => setPaperDetails({ ...paperDetails, className: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="e.g. 10th"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Set</label>
                                <select
                                    value={paperDetails.paperSet}
                                    onChange={(e) => setPaperDetails({ ...paperDetails, paperSet: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                >
                                    <option value="">Select</option>
                                    <option value="A">Set A</option>
                                    <option value="B">Set B</option>
                                    <option value="C">Set C</option>
                                    <option value="D">Set D</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept=".csv,.xlsx"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <button
                                onClick={handleImport}
                                disabled={importing || !file}
                                className="bg-blue-600 text-white px-6 py-2 roundedHover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {importing ? "..." : "Import"}
                            </button>
                        </div>

                        {results && (
                            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                                <span className="text-green-600 font-bold">{results.imported} imported</span>,
                                <span className="text-red-600 font-bold ml-2">{results.failed} failed</span>.
                            </div>
                        )}
                    </div>

                    {/* Existing Papers List */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-bold mb-4">Recent Question Papers</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {questionPapers.map(paper => (
                                <div key={paper._id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => loadPaperQuestions(paper)}>
                                    <div>
                                        <div className="font-medium text-gray-900">{paper.title}</div>
                                        <div className="text-xs text-gray-500">{paper.class} • Set {paper.set} • {paper.questionCount} Qs</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeletePaper(paper._id); }}
                                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {questionPapers.length === 0 && <p className="text-gray-400 text-sm">No papers found.</p>}
                        </div>
                    </div>
                </div>

                {/* Right Column / Full Width when Preview: Questions List */}
                {showPreview && (
                    <div ref={previewRef} className="lg:col-span-2 bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Questions Editor</h2>
                                <p className="text-gray-500">
                                    {paperDetails.className} - Set {paperDetails.paperSet} ({importedQuestions.length} Questions)
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsAddingQuestion(true)}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
                                >
                                    <Plus size={18} /> Add Question
                                </button>
                                <button onClick={() => setShowPreview(false)} className="text-gray-500 hover:text-gray-700 px-3 py-1">Close</button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {isAddingQuestion && (
                                <div className="mb-6">
                                    <QuestionEditor
                                        onSave={handleEditSave}
                                        onCancel={() => setIsAddingQuestion(false)}
                                        metadata={{
                                            instituteId,
                                            questionPaperId: selectedPaperId,
                                            class: paperDetails.className,
                                            set: paperDetails.paperSet
                                        }}
                                    />
                                </div>
                            )}

                            {importedQuestions.map((q, index) => (
                                <div key={q._id} className={`border rounded-lg p-4 transition ${editingQuestionId === q._id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:border-blue-300'}`}>
                                    {editingQuestionId === q._id ? (
                                        <QuestionEditor
                                            question={q}
                                            onSave={handleEditSave}
                                            onCancel={() => setEditingQuestionId(null)}
                                        />
                                    ) : (
                                        <div className="flex gap-4">
                                            {/* SR Indicator */}
                                            <div className="flex flex-col items-center justify-center min-w-[32px] gap-1 text-gray-400">
                                                <span className="font-mono text-sm font-bold text-gray-600 bg-gray-100 w-8 h-8 flex items-center justify-center rounded-full">
                                                    {index + 1}
                                                </span>
                                            </div>

                                            {/* Preview Content */}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded border ${q.level === "Hard" ? "bg-red-100 text-red-700 border-red-200" :
                                                                q.level === "Easy" ? "bg-green-100 text-green-700 border-green-200" :
                                                                    "bg-yellow-100 text-yellow-700 border-yellow-200"
                                                                }`}>
                                                                {q.level || "Medium"}
                                                            </span>
                                                        </div>
                                                        <p className="font-medium text-gray-900">{q.question}</p>
                                                        {q.questionImage && (
                                                            <img src={q.questionImage} alt="Q" className="mt-2 h-20 object-contain border rounded" />
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingQuestionId(q._id)}
                                                        className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded flex items-center gap-1 text-sm font-medium transition"
                                                    >
                                                        <Edit size={16} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuestion(q._id)}
                                                        className="text-red-500 hover:bg-red-50 p-1.5 rounded transition ml-1"
                                                        title="Delete Question"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                {/* Options Preview */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 pl-4 border-l-2 border-gray-100">
                                                    {(q.options && q.options.length > 0 ? q.options : [
                                                        { text: q.optionA, id: '0' },
                                                        { text: q.optionB, id: '1' },
                                                        { text: q.optionC, id: '2' },
                                                        { text: q.optionD, id: '3' },
                                                    ]).map((opt, i) => {
                                                        const isCorrect =
                                                            q.correctOptionIndex === i ||
                                                            (q.correctAnswer && (
                                                                (q.correctAnswer === 'A' && i === 0) ||
                                                                (q.correctAnswer === 'B' && i === 1) ||
                                                                (q.correctAnswer === 'C' && i === 2) ||
                                                                (q.correctAnswer === 'D' && i === 3)
                                                            ));

                                                        return (
                                                            <div key={i} className={`text-sm flex items-center gap-2 ${isCorrect ? "text-green-700 font-semibold" : "text-gray-600"}`}>
                                                                <span className="w-5 h-5 flex items-center justify-center rounded-full border text-xs">
                                                                    {String.fromCharCode(65 + i)}
                                                                </span>
                                                                <span>{opt.text}</span>
                                                                {opt.image && <ImageIcon size={12} className="text-gray-400" />}
                                                                {isCorrect && <CheckCircle size={14} />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
