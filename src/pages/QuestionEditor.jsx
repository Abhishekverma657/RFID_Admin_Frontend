import React, { useState, useEffect } from "react";
import { Save, X, Image as ImageIcon, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { updateQuestion, createQuestion, uploadImage } from "../api/testSystemApi";

export default function QuestionEditor({ question, onSave, onCancel, metadata }) {
    const [formData, setFormData] = useState({
        question: "",
        questionImage: "",
        level: "Medium",
        correctOptionIndex: null,
        options: [
            { text: "", image: null, id: "0" },
            { text: "", image: null, id: "1" },
            { text: "", image: null, id: "2" },
            { text: "", image: null, id: "3" },
        ]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (question && question._id) {
            // Map incoming question data to form state (Editing Mode)
            let initialOptions = [];

            if (question.options && question.options.length > 0) {
                initialOptions = question.options.map(opt => ({
                    text: opt.text || "",
                    image: opt.image || null,
                    id: opt.id || Math.random().toString(36).substr(2, 9)
                }));
            } else {
                initialOptions = [
                    { text: question.optionA || "", image: null, id: "0" },
                    { text: question.optionB || "", image: null, id: "1" },
                    { text: question.optionC || "", image: null, id: "2" },
                    { text: question.optionD || "", image: null, id: "3" },
                ];
            }

            let correctIdx = question.correctOptionIndex;
            if (correctIdx === undefined || correctIdx === null) {
                const mapping = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
                if (question.correctAnswer && mapping.hasOwnProperty(question.correctAnswer)) {
                    correctIdx = mapping[question.correctAnswer];
                }
            }

            setFormData({
                question: question.question || "",
                questionImage: question.questionImage || "",
                level: question.level || "Medium",
                correctOptionIndex: correctIdx,
                options: initialOptions
            });
        }
    }, [question]);

    const handleOptionChange = (idx, field, value) => {
        const newOptions = [...formData.options];
        newOptions[idx][field] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const addOption = () => {
        setFormData({
            ...formData,
            options: [
                ...formData.options,
                { text: "", image: null, id: Math.random().toString(36).substr(2, 9) }
            ]
        });
    };

    const removeOption = (idx) => {
        const newOptions = formData.options.filter((_, i) => i !== idx);
        let newCorrectIdx = formData.correctOptionIndex;
        if (newCorrectIdx === idx) newCorrectIdx = null;
        else if (newCorrectIdx > idx) newCorrectIdx--;

        setFormData({ ...formData, options: newOptions, correctOptionIndex: newCorrectIdx });
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");
        try {
            if (!formData.question.trim()) throw new Error("Question text is required");
            if (formData.options.length < 2) throw new Error("At least 2 options are required");
            if (formData.correctOptionIndex === null) throw new Error("Please select a correct answer");

            if (question && question._id) {
                await updateQuestion(question._id, formData);
            } else {
                // Creation mode needs metadata (instituteId, paperId, class, set)
                await createQuestion({ ...formData, ...metadata });
            }
            onSave();
        } catch (err) {
            setError(err.message || "Failed to save question");
        } finally {
            setLoading(false);
        }
    };

    // Handle image upload to server
    const handleImageUpload = async (e, target) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true); // Show loading while uploading
        try {
            const response = await uploadImage(file);
            const imageUrl = response.imageUrl;

            if (target === "question") {
                setFormData({ ...formData, questionImage: imageUrl });
            } else if (typeof target === "number") {
                handleOptionChange(target, "image", imageUrl);
            }
        } catch (err) {
            setError("Failed to upload image: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white border rounded-lg shadow-sm p-4">
            <h3 className="text-lg font-bold mb-4">{question && question._id ? "Edit Question" : "Add New Question"}</h3>

            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

            <div className="space-y-4">
                {/* Question Text & Image */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea
                        value={formData.question}
                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                        className="w-full border rounded p-2"
                        rows={3}
                    />
                    <div className="mt-2">
                        {formData.questionImage && (
                            <div className="mb-2 relative w-32 h-32">
                                <img src={formData.questionImage} alt="Question" className="w-full h-full object-cover rounded" />
                                <button
                                    onClick={() => setFormData({ ...formData, questionImage: "" })}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}
                        <label className="cursor-pointer flex items-center gap-2 text-blue-600 text-sm hover:underline">
                            <ImageIcon size={16} />
                            {formData.questionImage ? "Change Image" : "Add Image"}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "question")} />
                        </label>
                    </div>
                </div>

                {/* Level */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                    <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="border rounded p-2 w-full max-w-xs"
                    >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                    </select>
                </div>

                {/* Options */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                    <div className="space-y-3">
                        {formData.options.map((opt, idx) => (
                            <div key={idx} className="flex items-start gap-3 border p-3 rounded bg-gray-50">
                                <input
                                    type="radio"
                                    name="correctOption"
                                    checked={formData.correctOptionIndex === idx}
                                    onChange={() => setFormData({ ...formData, correctOptionIndex: idx })}
                                    className="mt-3"
                                />
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(idx, "text", e.target.value)}
                                        placeholder={`Option ${idx + 1}`}
                                        className="w-full border rounded p-2 text-sm"
                                    />
                                    <div className="flex items-center gap-2">
                                        {opt.image && (
                                            <div className="relative w-16 h-16">
                                                <img src={opt.image} alt="Option" className="w-full h-full object-cover rounded" />
                                                <button
                                                    onClick={() => handleOptionChange(idx, "image", null)}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        )}
                                        <label className="cursor-pointer text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1">
                                            <ImageIcon size={12} />
                                            {opt.image ? "Change Image" : "Add Image"}
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, idx)} />
                                        </label>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeOption(idx)}
                                    className="text-red-400 hover:text-red-600 mt-2"
                                    title="Remove this option"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addOption}
                        className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                        <Plus size={16} />
                        Add Option
                    </button>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                    >
                        <Save size={18} />
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
