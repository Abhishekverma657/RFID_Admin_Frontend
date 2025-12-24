import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { startTest, saveAnswer, submitTest, logViolation, uploadSnapshot } from "../../api/testSystemApi";
import { Clock, Send, AlertTriangle, Monitor, Shield, ShieldAlert, Wifi, WifiOff, Camera, Maximize, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
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
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Hidden canvas for snapshot capture */}
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <h1 className="font-bold text-gray-800 text-lg truncate max-w-xs md:max-w-md">
                        {testData?.title}
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Socket Status Indicator */}
                    <div className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - lg text - sm font - medium ${socketConnected
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        } `}>
                        <div className={`w - 2 h - 2 rounded - full ${socketConnected ? "bg-blue-500 animate-pulse" : "bg-red-500"} `}></div>
                        <Wifi size={16} />
                        <span className="hidden sm:inline">{socketConnected ? "Proctoring Active" : "Proctoring Offline"}</span>
                    </div>

                    {/* Camera Status Indicator */}
                    <div className={`flex items - center gap - 2 px - 3 py - 1.5 rounded - lg text - sm font - medium ${cameraActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        } `}>
                        {cameraActive ? (
                            <>
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <Camera size={16} />
                                <span className="hidden sm:inline">Camera On</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={16} />
                                <span className="hidden sm:inline">Camera Off</span>
                            </>
                        )}
                    </div>

                    {/* Timer */}
                    <div className={`flex items - center gap - 2 font - mono text - xl font - bold px - 4 py - 1.5 rounded - lg ${remainingTime < 300 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-800'} `}>
                        <Clock size={20} />
                        {formatTime(remainingTime)}
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <Maximize size={24} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Question Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col max-w-5xl mx-auto w-full">
                    {/* Progress Bar Removed as per request */}

                    {/* Question Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex-1 flex flex-col">
                        <div className="mb-6">
                            <span className="text-sm font-semibold text-blue-600 mb-2 block">
                                Question {currentQuestionIndex + 1}
                            </span>
                            <h2 className="text-xl md:text-2xl font-medium text-gray-900 leading-relaxed mb-4">
                                {currentQ.question}
                            </h2>
                            {currentQ.questionImage && (
                                <div className="mb-4">
                                    <img
                                        src={currentQ.questionImage}
                                        alt="Question Illustration"
                                        className="max-h-64 rounded-lg border border-gray-200 object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 flex-1">
                            {/* Check if we have new options array or legacy fields */}
                            {(currentQ.options && currentQ.options.length > 0
                                ? currentQ.options.map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) }))
                                : ['A', 'B', 'C', 'D'].map(label => ({ label, text: currentQ[`option${label} `], image: null }))
                            ).map((opt, idx) => (
                                <label
                                    key={idx}
                                    className={`
                                        flex items - start p - 4 rounded - xl border - 2 cursor - pointer transition - all gap - 4
                                        ${answers[currentQ.id] === opt.label
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }
`}
                                >
                                    <div className="flex items-center h-full pt-1">
                                        <input
                                            type="radio"
                                            name={`q - ${currentQ.id} `}
                                            value={opt.label}
                                            checked={answers[currentQ.id] === opt.label}
                                            onChange={() => handleAnswerSelect(opt.label)}
                                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 mt-0.5"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-400 w-6">{opt.label}.</span>
                                            <span className="text-gray-700 font-medium">{opt.text}</span>
                                        </div>
                                        {opt.image && (
                                            <img
                                                src={opt.image}
                                                alt={`Option ${opt.label} `}
                                                className="mt-2 max-h-32 rounded border border-gray-200"
                                            />
                                        )}
                                    </div>
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
                                onClick={handleManualSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-md transition transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={20} /> Submit Test
                                    </>
                                )}
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
                    fixed inset - y - 0 right - 0 w - 72 bg - white border - l border - gray - 200 shadow - xl transform transition - transform duration - 300 z - 20
md:relative md: transform - none md: shadow - none md: w - 80
                    ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
`}>
                    <div className="h-full flex flex-col p-4">
                        <div className="flex justify-between items-center mb-4 md:hidden">
                            <h3 className="font-bold text-gray-800">Question Palette</h3>
                            <button onClick={() => setSidebarOpen(false)}><Menu size={20} /></button>
                        </div>

                        {/* Webcam Preview */}
                        <div className="mb-4 rounded-xl overflow-hidden bg-gray-900 relative">
                            {cameraActive ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full aspect-video object-cover transform scale-x-[-1]"
                                />
                            ) : (
                                <div className="w-full aspect-video flex items-center justify-center">
                                    <div className="text-center text-white">
                                        <VideoOff size={32} className="mx-auto mb-2 text-red-400" />
                                        <p className="text-xs">Camera Unavailable</p>
                                        <button
                                            onClick={initWebcam}
                                            className="mt-2 text-xs bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                </div>
                            )}
                            {cameraActive && (
                                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                    REC
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-1">
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
                                        <div key={level} className="mb-4">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
                                                {level} Section
                                            </h4>
                                            <div className="grid grid-cols-4 gap-2">
                                                {grouped[level].map((q) => {
                                                    const idx = q.originalIdx; // Use original index for logic
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
aspect - square rounded - lg font - semibold text - sm flex items - center justify - center transition
                                                                ${isCurrent ? 'ring-2 ring-blue-600 ring-offset-2' : ''}
                                                                ${isAnswered
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
