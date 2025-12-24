import { useState, useEffect } from "react";
import { Bell, Users, AlertTriangle, Activity, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import socketService from "../utils/socketService";
import React from 'react';
import { useAppContext } from "../context/AppContext";

const formatISO = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().replace('T', ' ').slice(0, 16);
};

const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(11, 19);
};

export default function LiveMonitoringPage() {
    const [activeStudents, setActiveStudents] = useState([]);
    const [violations, setViolations] = useState([]);
    const [autoSubmits, setAutoSubmits] = useState([]);
    const [connected, setConnected] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentSnapshots, setStudentSnapshots] = useState({}); // { testResponseId: [urls] }

    const { user } = useAppContext();
    const instituteId = user?.instituteId || user?._id;

    useEffect(() => {
        if (!instituteId) return;

        // Connect to Socket.IO
        const socket = socketService.connect();

        const handleConnect = () => {
            setConnected(true);
            socketService.adminJoinMonitoring(instituteId);
        };

        const handleDisconnect = () => {
            setConnected(false);
        };

        if (socket.connected) {
            handleConnect();
        }

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleDisconnect);

        // Listen for student joined events
        socketService.onStudentJoined((data) => {
            setActiveStudents((prev) => {
                // Check if student already in list
                const exists = prev.find(s => s.testResponseId === data.testResponseId);
                if (exists) return prev;
                return [{ ...data, violationCount: 0 }, ...prev];
            });
        });

        // Listen for violation alerts
        socketService.onViolationAlert((data) => {
            setViolations((prev) => [data, ...prev].slice(0, 50)); // Keep last 50

            // Increment violation count for the specific student
            setActiveStudents((prev) =>
                prev.map((s) =>
                    s.testResponseId === data.testResponseId
                        ? { ...s, violationCount: (s.violationCount || 0) + 1 }
                        : s
                )
            );
        });

        // Listen for auto-submit alerts
        socketService.onAutoSubmitAlert((data) => {
            setAutoSubmits((prev) => [data, ...prev].slice(0, 20)); // Keep last 20
            // Remove from active students
            setActiveStudents((prev) =>
                prev.filter(s => s.testResponseId !== data.testResponseId)
            );
        });

        // Listen for student disconnected
        socketService.onStudentDisconnected((data) => {
            setActiveStudents((prev) =>
                prev.filter(s => s.testResponseId !== data.testResponseId)
            );
        });

        // Listen for live snapshots
        socketService.onStudentSnapshot((data) => {
            setStudentSnapshots((prev) => {
                const existing = prev[data.testResponseId] || [];
                return {
                    ...prev,
                    [data.testResponseId]: [data.imageUrl, ...existing].slice(0, 10) // Keep last 10
                };
            });
        });

        return () => {
            socketService.off("student-joined");
            socketService.off("violation-alert");
            socketService.off("auto-submit-alert");
            socketService.off("student-disconnected");
            socketService.disconnect();
            setConnected(false);
        };
    }, [instituteId]);

    const getViolationColor = (type) => {
        const colors = {
            TAB_SWITCH: "text-amber-600 bg-amber-50 border-amber-200",
            CAMERA_OFF: "text-red-600 bg-red-50 border-red-200",
            AUDIO_NOISE: "text-orange-600 bg-orange-50 border-orange-200",
            FULLSCREEN_EXIT: "text-red-600 bg-red-50 border-red-200",
            WINDOW_BLUR: "text-amber-600 bg-amber-50 border-amber-200",
        };
        return colors[type] || "text-gray-600 bg-gray-50 border-gray-200";
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Proctoring Dashboard</h1>
                    <p className="text-gray-500 mt-1">Real-time exam surveillance and proctoring</p>
                </div>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-full border transition-all ${connected ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
                    <span className="text-sm font-bold uppercase tracking-wider">
                        {connected ? "Live System Online" : "System Offline"}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-5 hover:shadow-md transition">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Users size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-gray-900">{activeStudents.length}</p>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Currently Testing</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-5 hover:shadow-md transition">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <AlertTriangle size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-gray-900">{violations.length}</p>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Alerts Detected</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex items-center gap-5 hover:shadow-md transition">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                        <Bell size={28} />
                    </div>
                    <div>
                        <p className="text-3xl font-extrabold text-gray-900">{autoSubmits.length}</p>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Auto-Terminated</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Active Students - Taking more space now */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Activity size={20} className="text-blue-600" />
                            Active Student Feed
                        </h2>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-lg font-bold">REAL-TIME</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {activeStudents.length === 0 ? (
                            <div className="md:col-span-2 bg-white rounded-2xl border border-dashed border-gray-300 py-16 text-center">
                                <Users size={48} className="mx-auto text-gray-200 mb-4" />
                                <p className="text-gray-400 font-medium">No students are currently taking a test</p>
                            </div>
                        ) : (
                            activeStudents.map((student) => (
                                <div key={student.testResponseId} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:border-blue-300 transition-all group relative overflow-hidden">
                                    {/* Background Accent */}
                                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110 ${student.violationCount > 2 ? 'bg-red-500' : 'bg-blue-500'}`}></div>

                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                                                <h3 className="font-bold text-gray-900 truncate">
                                                    {student.studentName || student.userId}
                                                </h3>
                                            </div>
                                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-tight truncate">
                                                {student.testTitle || 'Assigned Test'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatTime(student.timestamp)}
                                                </div>
                                                <div className="text-[11px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                                    ID: {student.userId}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right ml-4">
                                            <div className={`inline-flex flex-col items-center justify-center min-w-[60px] p-2 rounded-xl border transition-colors ${student.violationCount > 0 ? (student.violationCount > 3 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-amber-50 border-amber-100 text-amber-600') : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                <span className="text-xl font-black leading-none">{student.violationCount || 0}</span>
                                                <span className="text-[9px] font-bold uppercase mt-1">Alerts</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress indicator or simple status line */}
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">CONNECTED</span>
                                        <button
                                            onClick={() => setSelectedStudent(student)}
                                            className="text-[10px] font-bold text-blue-600 hover:underline"
                                        >
                                            VIEW LIVE DATA
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Violation Alerts Sidebar */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <Bell size={20} className="text-amber-500" />
                            Recent Alerts
                        </h2>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                        <div className="p-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {violations.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <CheckCircle size={24} className="text-green-500" />
                                    </div>
                                    <p className="text-gray-400 text-sm font-medium">No violations detected</p>
                                    <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest font-bold">Status: All Clear</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {violations.map((violation, idx) => {
                                        const colorClass = getViolationColor(violation.violationType);
                                        return (
                                            <div key={idx} className={`p-3 rounded-xl border-l-4 transition hover:bg-gray-50 flex items-start gap-3 shadow-sm ${colorClass.split(' ')[2]}`}>
                                                <div className={`mt-1 p-1.5 rounded-lg ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}>
                                                    <AlertTriangle size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className="font-bold text-gray-900 text-xs truncate">{violation.userId}</p>
                                                        <span className="text-[10px] text-gray-400 font-medium">
                                                            {formatTime(violation.timestamp)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[10px] font-black uppercase mt-0.5 tracking-tight ${colorClass.split(' ')[0]}`}>
                                                        {violation.violationType.replace(/_/g, ' ')}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Auto-Submit Section */}
                    {autoSubmits.length > 0 && (
                        <div className="bg-red-600 rounded-2xl p-4 text-white shadow-lg shadow-red-200 animate-pulse-subtle">
                            <div className="flex items-center gap-2 mb-3">
                                <Bell size={18} />
                                <h3 className="font-black text-xs uppercase tracking-widest">Immediate Attention</h3>
                            </div>
                            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                                {autoSubmits.map((submit, idx) => (
                                    <div key={idx} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
                                        <p className="text-[11px] font-black">{submit.userId}</p>
                                        <p className="text-[10px] text-red-100 mt-1 line-clamp-1 opacity-90">{submit.reason}</p>
                                        <p className="text-[9px] mt-2 font-bold text-white/50 uppercase tracking-tighter">
                                            Terminated @ {formatTime(submit.timestamp)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Live Student Detail Modal */}
            {selectedStudent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    Live Session: {selectedStudent.studentName || selectedStudent.userId}
                                </h2>
                                <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-widest">{selectedStudent.testTitle}</p>
                            </div>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:shadow-md transition-all"
                            >
                                <CheckCircle className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Left Column: Latest Feed */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">Live Webcam Feed</h3>
                                    <div className="aspect-video bg-gray-900 rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white">
                                        {studentSnapshots[selectedStudent.testResponseId] ? (
                                            <img
                                                src={studentSnapshots[selectedStudent.testResponseId][0]}
                                                alt="Live Student"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
                                                <Activity size={48} className="animate-pulse mb-4" />
                                                <p className="font-bold">Waiting for next snapshot...</p>
                                                <p className="text-[10px] mt-2 uppercase tracking-tight">Auto-updates every 45s</p>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                            LIVE PROCTORING
                                        </div>
                                    </div>

                                    {/* Snapshot Reel */}
                                    <div className="mt-6">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Previous Captures</h3>
                                        <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                                            {(studentSnapshots[selectedStudent.testResponseId] || []).slice(1).map((url, i) => (
                                                <div key={i} className="w-32 aspect-video flex-shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                                    <img src={url} alt="Snap" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all pointer-events-none" />
                                                </div>
                                            ))}
                                            {!(studentSnapshots[selectedStudent.testResponseId]?.length > 1) && (
                                                <div className="text-[10px] text-gray-400 font-bold italic py-4">Higher snapshot history will appear here...</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Integrity Data */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Execution Integrity</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                                                <p className="text-xl font-black text-green-600">ACTIVE</p>
                                            </div>
                                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Violations</p>
                                                <p className={`text-xl font-black ${selectedStudent.violationCount > 3 ? 'text-red-600' : 'text-amber-500'}`}>
                                                    {selectedStudent.violationCount || 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-tighter">Event Logs (Last 10)</h4>
                                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {violations
                                                    .filter(v => v.testResponseId === selectedStudent.testResponseId)
                                                    .map((v, i) => {
                                                        const color = getViolationColor(v.violationType);
                                                        return (
                                                            <div key={i} className={`p-4 rounded-2xl border-l-4 flex items-center justify-between shadow-sm bg-white ${color.split(' ')[2]}`}>
                                                                <div>
                                                                    <p className={`text-[10px] font-black uppercase ${color.split(' ')[0]}`}>{v.violationType.replace(/_/g, ' ')}</p>
                                                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">{formatTime(v.timestamp)}</p>
                                                                </div>
                                                                <AlertTriangle size={16} className={color.split(' ')[0]} />
                                                            </div>
                                                        );
                                                    })}
                                                {violations.filter(v => v.testResponseId === selectedStudent.testResponseId).length === 0 && (
                                                    <div className="bg-green-50/50 rounded-2xl p-8 text-center border border-dashed border-green-100">
                                                        <CheckCircle size={32} className="mx-auto text-green-300 mb-2" />
                                                        <p className="text-xs font-bold text-green-600">No violations recorded yet</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                if (confirm(`Are you sure you want to terminate ${selectedStudent.studentName}'s test?`)) {
                                                    const adminName = user?.name || user?.email || "Admin";
                                                    socketService.emitTerminateTest(selectedStudent.testResponseId, "Policy Violation (Admin Action)", adminName);
                                                    toast.success("Termination command sent.");
                                                }
                                            }}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 transition-all active:scale-95"
                                        >
                                            Terminate Attempt
                                        </button>
                                        <button
                                            onClick={() => {
                                                const msg = prompt("Enter warning message:", "Please maintain exam integrity.");
                                                if (msg) {
                                                    socketService.emitSendWarning(selectedStudent.testResponseId, msg);
                                                }
                                            }}
                                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-100 transition-all active:scale-95"
                                        >
                                            Send Warning
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple CSS for scrollbar - assuming this is global or added to App.css
// .custom-scrollbar::-webkit-scrollbar { width: 4px; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
