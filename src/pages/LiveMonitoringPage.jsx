import { useState, useEffect } from "react";
import { Bell, Users, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import socketService from "../utils/socketService";
import React from 'react'

export default function LiveMonitoringPage() {
    const [activeStudents, setActiveStudents] = useState([]);
    const [violations, setViolations] = useState([]);
    const [autoSubmits, setAutoSubmits] = useState([]);
    const [connected, setConnected] = useState(false);

    const instituteId = localStorage.getItem("instituteId");

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                    {new Date(student.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                        <button className="text-[10px] font-bold text-blue-600 hover:underline">VIEW LIVE DATA</button>
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
                                                            {new Date(violation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                                            Terminated @ {new Date(submit.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Simple CSS for scrollbar - assuming this is global or added to App.css
// .custom-scrollbar::-webkit-scrollbar { width: 4px; }
// .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
