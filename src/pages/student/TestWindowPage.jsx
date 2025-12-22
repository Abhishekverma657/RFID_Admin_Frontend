import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startTest, saveAnswer, submitTest, logViolation, getTimeRemaining } from "../../api/testSystemApi";
import { Clock, AlertTriangle, Monitor, CheckCircle, ChevronLeft, ChevronRight, Save, Menu } from "lucide-react";

export default function TestWindowPage() {
    const { testId } = useParams();
    const navigate = useNavigate();

    // State 
    const [loading, setLoading] = useState(true);
    const [testData, setTestData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
    const [remainingTime, setRemainingTime] = useState(0); // seconds
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [testResponseId, setTestResponseId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Refs for intervals and detection
    const timerRef = useRef(null);
    const fullScreenRef = useRef(false);

    // Initial Load
    useEffect(() => {
        const initTest = async () => {
            try {
                // Request Fullscreen (Note: Needs user interaction usually, but here likely already active or requested)
                // We'll rely on the "Enter Fullscreen" overlay if not active

                const response = await startTest();
                if (response.success) {
                    const { test, questions, testResponse, savedAnswers } = response.data;
                    setTestData(test);
                    setQuestions(questions);
                    setTestResponseId(testResponse.id);

                    // Restore answers
                    const initialAnswers = {};
                    savedAnswers.forEach(ans => {
                        initialAnswers[ans.questionId] = ans.selectedOption;
                    });
                    setAnswers(initialAnswers);

                    // Calc remaining time
                    const elapsed = Math.floor((new Date() - new Date(testResponse.startTime)) / 1000);
                    const totalSeconds = test.duration * 60;
                    const left = Math.max(0, totalSeconds - elapsed);
                    setRemainingTime(left);

                    setLoading(false);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to start test");
                setLoading(false);
            }
        };

        const token = localStorage.getItem("testToken");
        if (!token) {
            navigate(`/test/${testId}`);
            return;
        }

        initTest();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [testId, navigate]);

    // Timer
    useEffect(() => {
        if (!loading && remainingTime > 0) {
            timerRef.current = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmitTest("timeout"); // Auto submit
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [loading, remainingTime]);

    // Violation Monitoring
    useEffect(() => {
        if (loading) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation("TAB_SWITCH");
            }
        };

        const handleBlur = () => {
            // handleViolation("WINDOW_BLUR"); // Can be too sensitive
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [loading, testResponseId]);

    const handleViolation = async (type) => {
        try {
            const res = await logViolation({
                testResponseId,
                violationType: type,
                metadata: { timestamp: new Date() }
            });

            if (res.data?.autoSubmitted) {
                alert(`Test Auto-Submitted due to violation: ${res.data.reason}`);
                navigate("/"); // Or result page
            } else {
                // Warning toast could be shown here
                console.warn("Violation logged:", type);
            }
        } catch (e) {
            console.error("Failed to log violation", e);
        }
    };

    const handleAnswerSelect = async (option) => {
        const currentQ = questions[currentQuestionIndex];
        setAnswers(prev => ({ ...prev, [currentQ.id]: option }));

        // Optimistic UI, but save in background
        try {
            await saveAnswer({
                testResponseId,
                questionId: currentQ.id,
                selectedOption: option,
                timeSpent: 0 // Ideally track per question
            });
        } catch (e) {
            console.error("Failed to save answer", e);
            // Optionally retry or warn
        }
    };

    const handleSubmitTest = async (type = "manual") => {
        setIsSubmitting(true);
        try {
            await submitTest({
                testResponseId,
                submitType: type
            });
            alert("Test Submitted Successfully!");
            localStorage.removeItem("testToken");
            navigate("/"); // Or a "Test Completed" page
        } catch (e) {
            alert("Submission failed: " + e.message);
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-6 rounded-xl shadow text-center">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
                    <p className="text-gray-600">{error}</p>
                    <button onClick={() => navigate(`/test/${testId}`)} className="mt-4 text-blue-600 hover:underline">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIndex];
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-gray-800 text-lg truncate max-w-xs md:max-w-md">
                        {testData?.title}
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-1.5 rounded-lg ${remainingTime < 300 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-800'}`}>
                        <Clock size={20} />
                        {formatTime(remainingTime)}
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Question Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-5xl mx-auto w-full">
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% Completed</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex-1 flex flex-col">
                        <div className="mb-6">
                            <span className="text-sm font-semibold text-blue-600 mb-2 block">
                                Question {currentQuestionIndex + 1}
                            </span>
                            <h2 className="text-xl md:text-2xl font-medium text-gray-900 leading-relaxed">
                                {currentQ.question}
                            </h2>
                        </div>

                        <div className="space-y-3 flex-1">
                            {['A', 'B', 'C', 'D'].map((opt) => (
                                <label
                                    key={opt}
                                    className={`
                                        flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all
                                        ${answers[currentQ.id] === opt
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                                    `}
                                >
                                    <input
                                        type="radio"
                                        name={`q-${currentQ.id}`}
                                        value={opt}
                                        checked={answers[currentQ.id] === opt}
                                        onChange={() => handleAnswerSelect(opt)}
                                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-4 text-gray-700 font-medium">
                                        <span className="inline-block w-6 font-bold text-gray-400">{opt}.</span>
                                        {currentQ[`option${opt}`]}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        >
                            <ChevronLeft size={20} /> Previous
                        </button>

                        {currentQuestionIndex === questions.length - 1 ? (
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to finish the test?")) {
                                        handleSubmitTest("manual");
                                    }
                                }}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition transform hover:-translate-y-0.5"
                            >
                                <CheckCircle size={20} /> Submit Test
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition transform hover:-translate-y-0.5"
                            >
                                Next <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </main>

                {/* Sidebar (Question Palette) */}
                <aside className={`
                    fixed inset-y-0 right-0 w-72 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 z-20
                    md:relative md:transform-none md:shadow-none md:w-80
                    ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                `}>
                    <div className="h-full flex flex-col p-4">
                        <div className="flex justify-between items-center mb-4 md:hidden">
                            <h3 className="font-bold text-gray-800">Question Palette</h3>
                            <button onClick={() => setSidebarOpen(false)}><Menu size={20} /></button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 overflow-y-auto content-start p-1">
                            {questions.map((q, idx) => {
                                const isAnswered = answers[q.id];
                                const isCurrent = currentQuestionIndex === idx;
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            setCurrentQuestionIndex(idx);
                                            setSidebarOpen(false);
                                        }}
                                        className={`
                                            aspect-square rounded-lg font-semibold text-sm flex items-center justify-center transition
                                            ${isCurrent ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
                                            ${isAnswered
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-auto pt-6 border-t space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 rounded bg-blue-600"></div> Answered
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200"></div> Not Answered
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-4 h-4 rounded border-2 border-blue-600"></div> Current
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
}
