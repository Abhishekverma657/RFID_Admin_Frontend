import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { requestOTP, verifyOTP } from "../../api/testSystemApi";
import { Lock, User, ArrowRight, ShieldCheck, Clock, AlertTriangle } from "lucide-react";

export default function TestAccessPage() {
    const { testId } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Login, 2: OTP, 3: Instructions
    const [userId, setUserId] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [studentInfo, setStudentInfo] = useState(null);

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem("testToken");
        const storedTestId = localStorage.getItem("currentTestId");

        if (token && storedTestId === testId) {
            // Validate token or just redirect? 
            // Better to let them see instructions again or auto-redirect if test started?
            // For now, let's just move to instructions if token exists
            setStep(3);
            try {
                const storedStudent = JSON.parse(localStorage.getItem("testStudentInfo"));
                if (storedStudent) setStudentInfo(storedStudent);
            } catch (e) { }
        }
    }, [testId]);

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
            const { token, testStudent } = response.data;

            // Save session 
            localStorage.setItem("testToken", token);
            localStorage.setItem("testStudentInfo", JSON.stringify(testStudent));
            localStorage.setItem("currentTestId", testId);

            setStudentInfo(testStudent);
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = () => {
        // Request fullscreen?
        // Navigate to exam window
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
                                    <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center mt-0.5 shrink-0">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    </div>
                                    <span>Ensure your webcam is enabled and you are in a well-lit environment.</span>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <p className="font-medium text-gray-900 mb-1">Welcome, {studentInfo?.name}</p>
                                <p className="text-xs text-gray-500 mb-4">ID: {studentInfo?.userId}</p>

                                <button
                                    onClick={handleStartTest}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition shadow-lg transform active:scale-95 animate-pulse"
                                >
                                    Start Test Now
                                </button>
                            </div>
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
