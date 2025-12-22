import { useState, useEffect } from "react";
import { Bell, Users, AlertTriangle, Activity } from "lucide-react";
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
        setConnected(true);

        // Join admin monitoring room
        socketService.adminJoinMonitoring(instituteId);

        // Listen for student joined events
        socketService.onStudentJoined((data) => {
            setActiveStudents((prev) => {
                // Check if student already in list
                const exists = prev.find(s => s.testResponseId === data.testResponseId);
                if (exists) return prev;
                return [...prev, data];
            });
        });

        // Listen for violation alerts
        socketService.onViolationAlert((data) => {
            setViolations((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
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
            TAB_SWITCH: "text-yellow-600",
            CAMERA_OFF: "text-red-600",
            AUDIO_NOISE: "text-orange-600",
            FULLSCREEN_EXIT: "text-yellow-600",
            WINDOW_BLUR: "text-yellow-600",
        };
        return colors[type] || "text-gray-600";
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Live Monitoring Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Activity size={20} className={connected ? "text-green-600" : "text-red-600"} />
                    <span className={`text-sm font-medium ${connected ? "text-green-600" : "text-red-600"}`}>
                        {connected ? "Connected" : "Disconnected"}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Users size={32} className="text-blue-600" />
                        <div>
                            <p className="text-2xl font-bold text-blue-600">{activeStudents.length}</p>
                            <p className="text-sm text-gray-600">Active Students</p>
                        </div>
                    </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={32} className="text-yellow-600" />
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{violations.length}</p>
                            <p className="text-sm text-gray-600">Total Violations</p>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Bell size={32} className="text-red-600" />
                        <div>
                            <p className="text-2xl font-bold text-red-600">{autoSubmits.length}</p>
                            <p className="text-sm text-gray-600">Auto-Submits</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Active Students */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-gray-800">Active Students</h2>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                        {activeStudents.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No active students</p>
                        ) : (
                            <div className="space-y-2">
                                {activeStudents.map((student) => (
                                    <div key={student.testResponseId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <div>
                                            <p className="font-medium">{student.userId}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(student.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Violation Alerts */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-gray-800">Recent Violations</h2>
                    </div>
                    <div className="p-4 max-h-96 overflow-y-auto">
                        {violations.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No violations detected</p>
                        ) : (
                            <div className="space-y-2">
                                {violations.map((violation, idx) => (
                                    <div key={idx} className="flex justify-between items-start p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                                        <div>
                                            <p className="font-medium">{violation.userId}</p>
                                            <p className={`text-sm font-semibold ${getViolationColor(violation.violationType)}`}>
                                                {violation.violationType}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(violation.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Auto-Submit Alerts */}
            {autoSubmits.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-gray-800">Auto-Submit Alerts</h2>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                            {autoSubmits.map((submit, idx) => (
                                <div key={idx} className="flex justify-between items-start p-3 bg-red-50 rounded border-l-4 border-red-500">
                                    <div>
                                        <p className="font-medium">{submit.userId}</p>
                                        <p className="text-sm text-red-700">{submit.reason}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(submit.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Auto-Submitted</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
