import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { requestOTP, verifyOTP } from "../../api/testSystemApi";
import { Lock, User, ArrowRight, ShieldCheck, Clock, AlertTriangle, Camera, CheckCircle, XCircle, Video } from "lucide-react";
import toast from "react-hot-toast";

const formatISO = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().replace('T', ' ').slice(0, 16);
};

export default function TestAccessPage() {
    const { testId } = useParams();
    const navigate = useNavigate();


    const [searchParams] = useSearchParams();
    const userIdFromUrl = searchParams.get("userId");

    const [step, setStep] = useState(1); // 1: Login, 2: OTP, 3: Instructions, 4: Permission Check
    const [userId, setUserId] = useState(userIdFromUrl || "");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [studentInfo, setStudentInfo] = useState(null);
    const [testInfo, setTestInfo] = useState(null);
    const [timeLeftToStart, setTimeLeftToStart] = useState(null); // seconds

    // Webcam permission state
    const [cameraPermission, setCameraPermission] = useState("pending"); // pending, granted, denied, checking
    const [cameraStream, setCameraStream] = useState(null);
    const [cameraError, setCameraError] = useState(""); // Specific error message for camera issues
    const videoRef = useRef(null);

    // Check if already logged in or has pre-filled ID
    useEffect(() => {
        const token = localStorage.getItem("testToken");
        const storedTestId = localStorage.getItem("currentTestId");

        if (token && storedTestId === testId) {
            setStep(3);
            try {
                const storedStudent = JSON.parse(localStorage.getItem("testStudentInfo"));
                if (storedStudent) setStudentInfo(storedStudent);
                const storedTest = JSON.parse(localStorage.getItem("testInfo"));
                if (storedTest) setTestInfo(storedTest);
            } catch (e) { }
        }

        // Pre-fill userId from URL if available
        const urlUserId = searchParams.get("userId");
        if (urlUserId) {
            setUserId(urlUserId);
        }
    }, [testId, searchParams]);

    // Cleanup camera stream on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [cameraStream]);

    // Countdown Timer Logic
    useEffect(() => {
        if (step !== 3 || !testInfo?.startTime) return;

        const calculateTimeLeft = () => {
            const offset = parseInt(localStorage.getItem("serverTimeOffset") || "0");
            const now = new Date(new Date().getTime() + offset);
            const start = new Date(testInfo.startTime);
            const diff = Math.floor((start - now) / 1000);
            return diff > 0 ? diff : 0;
        };

        const initialDiff = calculateTimeLeft();
        setTimeLeftToStart(initialDiff);

        if (initialDiff <= 0) return;

        const timer = setInterval(() => {
            const diff = calculateTimeLeft();
            setTimeLeftToStart(diff);
            if (diff <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [step, testInfo]);

    // Set video source when stream is available
    useEffect(() => {
        if (videoRef.current && cameraStream) {
            videoRef.current.srcObject = cameraStream;
        }
    }, [cameraStream]);

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await requestOTP(userId, testId);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP. Check your ID.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await verifyOTP(userId, otp);
            const { token, testStudent, test, serverTime } = response.data;

            // Calculate Skew
            if (serverTime) {
                const offset = new Date(serverTime).getTime() - Date.now();
                localStorage.setItem("serverTimeOffset", offset.toString());
            }

            // Save session 
            localStorage.setItem("testToken", token);
            localStorage.setItem("testStudentInfo", JSON.stringify(testStudent));
            localStorage.setItem("testInfo", JSON.stringify(test));
            localStorage.setItem("currentTestId", testId);

            setStudentInfo(testStudent);
            setTestInfo(test);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToPermissions = () => {
        setStep(4);
        requestCameraPermission();
    };

    const requestCameraPermission = async () => {
        setCameraPermission("checking");
        setCameraError(""); // Clear previous camera errors

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("MediaDevices API not found. This might be due to a non-secure context (HTTP) or unsupported browser.");
            setCameraPermission("denied");
            const msg = "Camera API is not accessible. Please ensure you are using HTTPS or localhost, and that your browser supports camera access.";
            setCameraError(msg);
            toast.error(msg);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 640, height: 480 },
                audio: false // Can enable if audio monitoring is needed
            });

            setCameraStream(stream);
            setCameraPermission("granted");
        } catch (err) {
            console.error("Camera permission error:", err);
            setCameraPermission("denied");

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                const msg = "Camera access denied. Please allow camera permissions in your browser settings to continue.";
                setCameraError(msg);
                toast.error(msg);
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                const msg = "No camera found. A working camera is required for this test.";
                setCameraError(msg);
                toast.error(msg);
            } else {
                const msg = "Failed to access camera: " + err.message;
                setCameraError(msg);
                toast.error(msg);
            }
        }
    };

    const handleRetryCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        requestCameraPermission();
    };

    const handleStartTest = () => {
        // Stop the camera stream before navigating (will be re-initialized in test window)
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        navigate(`/exam/${testId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white">Online Examination</h1>
                    <p className="text-blue-100 text-sm mt-1">Secure Assessment Platform</p>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <form onSubmit={handleRequestOTP} className="space-y-6">
                            <div className="text-center mb-8">
                                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <User className="text-blue-600" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Student Login</h2>
                                <p className="text-gray-500 text-sm">Enter your Student Authorization ID</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                                <input
                                    type="text"
                                    required
                                    value={userId}
                                    onChange={(e) => setUserId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="e.g. STU-123456"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading ? "Sending..." : "Proceed"} <ArrowRight size={18} />
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="text-center mb-8">
                                <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                                    <Lock className="text-indigo-600" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Verify Identity</h2>
                                <p className="text-gray-500 text-sm">Enter the OTP sent to your registered email</p>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">One-Time Password</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                                    placeholder="• • • • • •"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition shadow-md disabled:opacity-70"
                            >
                                {loading ? "Verifying..." : "Verify & Continue"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-gray-500 text-sm hover:text-gray-700"
                            >
                                Back to Login
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                                    <ShieldCheck className="text-green-600" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Instructions</h2>
                                <p className="text-gray-500 text-sm">Please read carefully before starting</p>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm text-gray-700">
                                <div className="flex items-start gap-3">
                                    <Clock className="text-blue-500 mt-0.5 shrink-0" size={16} />
                                    <span>This is a timed test. The timer will start immediately upon clicking Start.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-orange-500 mt-0.5 shrink-0" size={16} />
                                    <span>Do not switch tabs or exit fullscreen. Violations are monitored and may lead to disqualification.</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Camera className="text-purple-500 mt-0.5 shrink-0" size={16} />
                                    <span>Your webcam will be enabled throughout the test. Ensure good lighting.</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="font-medium text-gray-900 mb-1">Welcome, {studentInfo?.name}</p>
                                <p className="text-xs text-gray-500 mb-4">ID: {studentInfo?.userId}</p>

                                {timeLeftToStart > 0 ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center mb-4">
                                        <p className="text-amber-800 font-semibold mb-2 flex items-center justify-center gap-2">
                                            <Clock size={20} className="animate-pulse" />
                                            Test Starts In
                                        </p>
                                        <div className="text-3xl font-bold text-amber-900 font-mono tracking-wider">
                                            {(() => {
                                                const h = Math.floor(timeLeftToStart / 3600);
                                                const m = Math.floor((timeLeftToStart % 3600) / 60);
                                                const s = timeLeftToStart % 60;
                                                return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                                            })()}
                                        </div>
                                        <p className="text-xs text-amber-600 mt-2">
                                            Starts at: {formatISO(testInfo.startTime).slice(11, 16)}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleProceedToPermissions}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Camera size={20} />
                                        Setup Camera & Start
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="text-center mb-4">
                                <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                    <Video className="text-purple-600" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">Camera Setup</h2>
                                <p className="text-gray-500 text-sm">Allow camera access to proceed</p>
                            </div>

                            {/* Camera Preview */}
                            <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                                {cameraPermission === "checking" && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                    </div>
                                )}

                                {cameraPermission === "granted" && (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover transform scale-x-[-1]"
                                    />
                                )}

                                {cameraPermission === "denied" && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                        <XCircle size={48} className="text-red-400 mb-3" />
                                        <p className="text-center text-sm">Camera access denied</p>
                                    </div>
                                )}

                                {/* Status indicator */}
                                {cameraPermission === "granted" && (
                                    <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                        Camera Active
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                        <div>
                                            <p className="font-medium">Permission Required</p>
                                            <p className="text-xs mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Permission Status */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Camera size={20} className="text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">Camera Access</span>
                                    </div>
                                    {cameraPermission === "granted" && (
                                        <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                                            <CheckCircle size={16} /> Granted
                                        </span>
                                    )}
                                    {cameraPermission === "denied" && (
                                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                                            <XCircle size={16} /> Denied
                                        </span>
                                    )}
                                    {cameraPermission === "checking" && (
                                        <span className="text-gray-500 text-sm">Checking...</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            {cameraPermission === "denied" && (
                                <button
                                    onClick={handleRetryCamera}
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 rounded-lg transition"
                                >
                                    Retry Camera Access
                                </button>
                            )}

                            <button
                                onClick={handleStartTest}
                                disabled={cameraPermission !== "granted"}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-lg transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Start Test Now
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(3)}
                                className="w-full text-gray-500 text-sm hover:text-gray-700"
                            >
                                Back to Instructions
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <p className="mt-8 text-gray-400 text-xs">
                &copy; {new Date().getFullYear()} Online Examination System. All rights reserved.
            </p>
        </div>
    );
}
