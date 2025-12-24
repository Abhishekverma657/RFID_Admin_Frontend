import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startTest, saveAnswer, submitTest, logViolation, uploadSnapshot } from "../../api/testSystemApi";
import { Clock, AlertTriangle, Monitor, Wifi, WifiOff, Camera, Maximize, CheckCircle, ChevronLeft, ChevronRight, Menu, VideoOff, Send, XCircle, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import socketService from "../../utils/socketService";

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
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [finalSubmitType, setFinalSubmitType] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [testResponseId, setTestResponseId] = useState(null);
    const [testStudentId, setTestStudentId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);

    // Webcam States
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);

    // Refs for intervals and detection
    const timerRef = useRef(null);
    const snapshotIntervalRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Initialize webcam
    const initWebcam = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 320, height: 240 },
                audio: false
            });

            setCameraStream(stream);
            setCameraActive(true);
            setCameraError(false);

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError(true);
            setCameraActive(false);
            // Log as violation
            if (testResponseId) {
                handleViolation("CAMERA_OFF");
            }
        }
    }, [testResponseId]);

    // Capture and upload snapshot
    const captureSnapshot = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !testResponseId || !cameraActive) return;

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");

            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL("image/jpeg", 0.7);

            await uploadSnapshot({
                testResponseId,
                imageData
            });

            console.log("Snapshot captured and uploaded");
        } catch (err) {
            console.error("Snapshot upload failed:", err);
        }
    }, [testResponseId, cameraActive]);

    // Initial Load
    useEffect(() => {
        const initTest = async () => {
            try {
                const response = await startTest();
                if (response.success) {
                    const { test, questions, testResponse, savedAnswers } = response.data;
                    setTestData(test);
                    setQuestions(questions);
                    setTestResponseId(testResponse.id);
                    setTestStudentId(testResponse.testStudentId);

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

                    // Connect to Socket and notify Admin
                    const socket = socketService.connect();

                    const handleSocketConnect = () => {
                        setSocketConnected(true);
                        socketService.studentStartedTest({
                            testStudentId: testResponse.testStudentId,
                            testId: testResponse.testId,
                            testResponseId: testResponse._id || testResponse.id,
                            userId: testResponse.userId
                        });
                    };

                    const handleSocketDisconnect = () => {
                        setSocketConnected(false);
                    };

                    if (socket.connected) {
                        handleSocketConnect();
                    }

                    socket.on("connect", handleSocketConnect);
                    socket.on("disconnect", handleSocketDisconnect);
                    socket.on("connect_error", handleSocketDisconnect);

                    // Handle Admin Actions
                    socketService.onTerminateTest((data) => {
                        console.log("Test terminated by admin:", data.reason);
                        // Stop camera
                        if (cameraStream) {
                            cameraStream.getTracks().forEach(track => track.stop());
                        }
                        setFinalSubmitType("auto-violation"); // Treat as violation for UI
                        setIsSubmitted(true);
                        localStorage.removeItem("testToken");
                        toast.error(`Crucial: Your test has been terminated by the administrator.\nReason: ${data.reason} `, { duration: 10000 });
                    });

                    socketService.onWarningFromAdmin((data) => {
                        toast.warn(`⚠️ WARNING FROM ADMINISTRATOR: \n\n${data.message} \n\nPlease follow the guidelines to avoid termination.`, { duration: 8000 });
                    });

                    setLoading(false);
                }
            } catch (err) {
                setError(err.response?.data?.message || "Failed to start test");
                setLoading(false);
            }
        };

        const token = localStorage.getItem("testToken");
        if (!token) {
            navigate(`/ test / ${testId} `);
            return;
        }

        initTest();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (snapshotIntervalRef.current) clearInterval(snapshotIntervalRef.current);
        };
    }, [testId, navigate]);

    // Initialize webcam after test loads
    useEffect(() => {
        if (!loading && testResponseId) {
            initWebcam();
        }

        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [loading, testResponseId]);

    // Set up video ref when stream changes
    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    // Periodic snapshot capture (every 45 seconds) + Camera Status Watcher
    useEffect(() => {
        if (!loading && cameraActive && testResponseId) {
            // Capture initial snapshot
            setTimeout(() => captureSnapshot(), 3000);

            // Set up interval for periodic snapshots and camera health check
            snapshotIntervalRef.current = setInterval(() => {
                // Check if camera is still actually active
                if (cameraStream) {
                    const videoTrack = cameraStream.getVideoTracks()[0];
                    if (!videoTrack || !videoTrack.enabled || videoTrack.readyState === 'ended') {
                        console.error("Camera track lost or disabled!");
                        handleViolation("CAMERA_OFF");
                        return;
                    }
                }
                captureSnapshot();
            }, 45000); // Every 45 seconds
        }

        return () => {
            if (snapshotIntervalRef.current) {
                clearInterval(snapshotIntervalRef.current);
            }
        };
    }, [loading, cameraActive, testResponseId, captureSnapshot]);

    // Timer
    useEffect(() => {
        if (!loading && remainingTime > 0) {
            timerRef.current = setInterval(() => {
                setRemainingTime(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmitTest("auto-time");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [loading, remainingTime]);

    // Full Screen & Tab Switch Monitoring Removed based on user request ("test wali screen ko esc mode se mtn full screen hta do")
    // Only keeping Tab Switch Violation Monitoring for basic integrity
    useEffect(() => {
        if (loading || isSubmitted) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                handleViolation("TAB_SWITCH");
            }
        };

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "Are you sure you want to leave the test? This may submit your attempt.";
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [loading, testResponseId, isSubmitted]);

    const handleViolation = async (type) => {
        try {
            const res = await logViolation({
                testResponseId,
                violationType: type,
                metadata: { timestamp: new Date() }
            });

            if (res.data?.autoSubmitted) {
                // Notify via Socket
                socketService.notifyAutoSubmit({
                    testStudentId,
                    testResponseId,
                    reason: `${type} violation(Fatal)`
                });

                // Stop camera
                if (cameraStream) {
                    cameraStream.getTracks().forEach(track => track.stop());
                }
                setFinalSubmitType("auto-violation");
                setIsSubmitted(true);
                localStorage.removeItem("testToken");
                toast.error(`Crucial: Your test has been auto - submitted due to a ${type} violation.`, { duration: 10000 });
            } else {
                // Notify violation via socket
                socketService.sendViolation({
                    testStudentId,
                    testResponseId,
                    violationType: type,
                    metadata: { timestamp: new Date() }
                });

                if (res.data?.warning) {
                    // Show warning
                    toast.warn(`${res.data.warning.message} \nPlease avoid this action to prevent auto - submission.`, { duration: 8000 });
                }
                console.warn("Violation logged:", type);
            }
        } catch (e) {
            console.error("Failed to log violation", e);
            toast.error("Failed to log violation.");
        }
    };

    const handleClearAnswer = async () => {
        const currentQ = questions[currentQuestionIndex];
        const prevAnswer = answers[currentQ.id];
        if (!prevAnswer) return;

        setAnswers(prev => {
            const newAnswers = { ...prev };
            delete newAnswers[currentQ.id];
            return newAnswers;
        });

        toast.success("Selection cleared");
    };

    const handleAnswerSelect = async (option) => {
        const currentQ = questions[currentQuestionIndex];
        setAnswers(prev => ({ ...prev, [currentQ.id]: option }));

        try {
            await saveAnswer({
                testResponseId,
                questionId: currentQ.id,
                selectedOption: option,
                timeSpent: 0
            });
        } catch (e) {
            console.error("Failed to save answer", e);
            toast.error("Failed to save answer.");
        }
    };

    const handleSubmitTest = async (type = "manual") => {
        setIsSubmitting(true);

        // Capture final snapshot before submitting
        if (cameraActive) {
            await captureSnapshot();
        }

        try {
            await submitTest({
                testResponseId,
                submitType: type
            });

            // Stop camera
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }

            localStorage.removeItem("testToken");
            setFinalSubmitType(type);
            setIsSubmitted(true);
            toast.success("Test submitted successfully!");
        } catch (e) {
            toast.error("Submission failed: " + e.message);
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

    if (isSubmitted) {
        const handleClose = () => {
            try {
                window.close();
            } catch (e) {
                console.log("Could not close window via script");
            }
            // Fallback content if script cannot close
            document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;'><h1>You can now close this tab.</h1></div>";
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-lg w-full">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
                    <p className="text-gray-600 mb-6">Your test has been submitted successfully.</p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-8 text-left">
                        <p className="text-sm text-gray-500 mb-1">Submission Type</p>
                        <p className="font-mono font-medium text-gray-800">
                            {finalSubmitType === "manual" ? "Manually Submitted" :
                                finalSubmitType === "auto-time" ? "Auto-Submitted (Time Up)" :
                                    finalSubmitType === "auto-violation" ? "Auto-Submitted (Violation)" : "Submitted"}
                        </p>
                    </div>

                    <button
                        onClick={handleClose}
                        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-[1.02] shadow-lg"
                    >
                        Close Window
                    </button>
                </div>
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
                    <button onClick={() => navigate(`/ test / ${testId} `)} className="mt-4 text-blue-600 hover:underline">
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
        return `${m}:${s.toString().padStart(2, '0')} `;
    };

    const handleManualSubmit = () => {
        if (window.confirm("Are you sure you want to submit your test?")) {
            handleSubmitTest("manual");
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
            <style>
                {`
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin-slow {
                        animation: spin-slow 8s linear infinite;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #E5E7EB;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #D1D5DB;
                    }
                    .option-glow {
                        box-shadow: 0 0 20px -5px rgba(37, 99, 235, 0.15);
                    }
                `}
            </style>
            {/* Hidden canvas for snapshot capture */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-2.5 rounded-2xl shadow-sm shadow-blue-200">
                        <Monitor className="text-white" size={22} />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900 text-lg leading-tight">
                            {testData?.title}
                        </h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em] mt-0.5">
                            {testData?.className} • Set {testData?.paperSet || 'A'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Indicators */}
                    <div className="hidden lg:flex items-center bg-gray-50 p-1 rounded-2xl border border-gray-100">
                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${socketConnected
                            ? "bg-white text-blue-700 shadow-sm shadow-blue-100"
                            : "bg-red-50 text-red-700"
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-blue-500 animate-pulse" : "bg-red-500"}`}></div>
                            <span>{socketConnected ? "Proctoring Active" : "Connection Lost"}</span>
                        </div>

                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${cameraActive
                            ? "bg-white text-green-700 shadow-sm shadow-green-100"
                            : "bg-red-50 text-red-700"
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cameraActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                            <span>{cameraActive ? "Camera Live" : "Camera Error"}</span>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-2 font-mono text-xl font-black px-6 py-2.5 rounded-2xl shadow-sm transition-all border-2 ${remainingTime < 300
                        ? 'bg-red-50 text-red-600 border-red-100 animate-pulse'
                        : 'bg-white text-gray-900 border-gray-900'
                        }`}>
                        <Clock size={20} className={remainingTime < 300 ? "animate-spin-slow" : ""} />
                        {formatTime(remainingTime)}
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-2xl border border-gray-200 transition-colors"
                    >
                        <Menu size={22} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Question Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center">
                    <div className="max-w-4xl w-full">
                        {/* Question Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-10 transition-all">
                            <div className="mb-10">
                                <div className="flex justify-between items-start gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest rounded-full">
                                            Question {currentQuestionIndex + 1}
                                        </span>
                                        <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-full ${currentQ.level === 'Hard' ? 'bg-red-50 text-red-600' : currentQ.level === 'Easy' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                            {currentQ.level || 'Medium'}
                                        </span>
                                    </div>

                                    {answers[currentQ.id] && (
                                        <button
                                            onClick={handleClearAnswer}
                                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all group"
                                        >
                                            <RotateCcw size={14} className="group-hover:rotate-[-45deg] transition-transform" />
                                            Clear Selection
                                        </button>
                                    )}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-[1.4]">
                                    {currentQ.question}
                                </h2>
                                {currentQ.questionImage && (
                                    <div className="mt-8 rounded-3xl overflow-hidden border border-gray-100 bg-gray-50 flex justify-center p-4">
                                        <img
                                            src={currentQ.questionImage}
                                            alt="Question Illustration"
                                            className="max-h-80 object-contain drop-shadow-md"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                {/* Check if we have new options array or legacy fields */}
                                {(currentQ.options && currentQ.options.length > 0
                                    ? currentQ.options.map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) }))
                                    : ['A', 'B', 'C', 'D'].map(label => ({ label, text: currentQ[`option${label} `], image: null }))
                                ).map((opt, idx) => (
                                    <label
                                        key={idx}
                                        className={`
                                            group flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 relative overflow-hidden w-full
                                            ${answers[currentQ.id] === opt.label
                                                ? 'border-blue-600 bg-blue-50/50 ring-4 ring-blue-50 option-glow'
                                                : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50/80'
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${currentQ.id}`}
                                            value={opt.label}
                                            checked={answers[currentQ.id] === opt.label}
                                            onChange={() => handleAnswerSelect(opt.label)}
                                            className="hidden"
                                        />
                                        <div className="flex items-center gap-4 w-full">
                                            <div className={`
                                                w-10 h-10 min-w-10 rounded-xl flex items-center justify-center font-black text-md transition-all
                                                ${answers[currentQ.id] === opt.label
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                    : 'bg-white border-2 border-gray-100 text-gray-400 group-hover:border-blue-200 group-hover:text-blue-400'
                                                }
                                            `}>
                                                {opt.label}
                                            </div>

                                            <div className="flex-1">
                                                <p className={`text-lg transition-colors ${answers[currentQ.id] === opt.label ? 'text-blue-900 font-bold' : 'text-gray-700 font-medium'}`}>
                                                    {opt.text}
                                                </p>
                                                {opt.image && (
                                                    <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100 bg-white p-2 w-fit">
                                                        <img
                                                            src={opt.image}
                                                            alt={`Option ${opt.label}`}
                                                            className="max-h-48 object-contain"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Selection Checkmark */}
                                            {answers[currentQ.id] === opt.label && (
                                                <div className="text-blue-600 animate-in fade-in zoom-in duration-300">
                                                    <CheckCircle size={24} fill="currentColor" className="text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between mt-10 w-full">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold border-2 border-transparent text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={22} /> Previous
                            </button>

                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Finalizing...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} /> Finish Attempt
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    className="flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all transform hover:-translate-y-1 active:translate-y-0"
                                >
                                    Save & Next <ChevronRight size={22} />
                                </button>
                            )}
                        </div>
                    </div>
                </main>

                {/* Sidebar (Question Palette) */}
                <aside className={`
                    fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-100 shadow-2xl transform transition-transform duration-500 z-20
                    lg:relative lg:transform-none lg:shadow-none
                    ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                `}>
                    <div className="h-full flex flex-col p-6">
                        <div className="flex justify-between items-center mb-6 lg:hidden">
                            <div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Palette</h3>
                                <p className="text-[10px] text-blue-600 font-bold mt-1">
                                    {Object.keys(answers).length} / {questions.length} Answered
                                </p>
                            </div>
                            <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <Menu size={20} />
                            </button>
                        </div>

                        {/* Progress Stats for Desktop */}
                        <div className="hidden lg:block mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Progress</h3>
                                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                    {Math.round((Object.keys(answers).length / questions.length) * 100)}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-500"
                                    style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Webcam Preview */}
                        <div className="mb-6 rounded-[2rem] overflow-hidden bg-gray-900 relative shadow-inner group border-4 border-white shadow-xl">
                            {cameraActive ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full aspect-square object-cover transform scale-x-[-1] transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full aspect-square flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <VideoOff size={40} className="mx-auto mb-3 text-red-200" />
                                        <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">Feed Offline</p>
                                        <button
                                            onClick={initWebcam}
                                            className="mt-4 text-[10px] font-bold bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-black transition-all shadow-lg shadow-blue-100"
                                        >
                                            Restart Camera
                                        </button>
                                    </div>
                                </div>
                            )}
                            {cameraActive && (
                                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    LIVE FEED
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Group questions by Level for display */}
                            {(() => {
                                const levels = ["Easy", "Medium", "Hard"];
                                const grouped = { Easy: [], Medium: [], Hard: [] };

                                // Group while preserving original index
                                questions.forEach((q, originalIdx) => {
                                    const lvl = q.level || "Medium";
                                    if (!grouped[lvl]) grouped[lvl] = [];
                                    grouped[lvl].push({ ...q, originalIdx });
                                });

                                return levels.map(level => {
                                    if (!grouped[level] || grouped[level].length === 0) return null;

                                    return (
                                        <div key={level} className="mb-8">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${level === 'Hard' ? 'bg-red-400' : level === 'Easy' ? 'bg-green-400' : 'bg-orange-400'}`}></span>
                                                {level} Section
                                            </h4>
                                            <div className="grid grid-cols-4 gap-4 px-2">
                                                {grouped[level].map((q) => {
                                                    const idx = q.originalIdx;
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
                                                                aspect-square rounded-2xl font-black text-xs flex items-center justify-center transition-all duration-300 transform active:scale-95
                                                                ${isCurrent ? 'ring-4 ring-blue-600 ring-offset-2' : ''}
                                                                ${isAnswered
                                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                                                                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 border border-gray-100'
                                                                }
                                                            `}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2.5 p-3 bg-blue-50/50 rounded-2xl">
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Answered</span>
                            </div>
                            <div className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-2xl">
                                <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
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
