import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        if (this.socket && this.socket.connected) {
            return this.socket;
        }

        // Parse VITE_API_BASE_URL to get the root domain (remove /api if present)
        let baseUrl = SOCKET_URL;
        try {
            const url = new URL(SOCKET_URL);
            baseUrl = url.origin; // This extracts http://localhost:5000 or actual domain
        } catch (e) {
            console.error("Invalid SOCKET_URL:", SOCKET_URL);
        }

        console.log(`Socket connecting to: ${baseUrl}/proctoring`);

        this.socket = io(`${baseUrl}/proctoring`, {
            transports: ["websocket", "polling"], // Allow polling fallback for stability
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity, // Keep retrying until system is back online
            timeout: 20000,
        });

        this.socket.on("connect", () => {
            console.log("Socket.IO connected to proctoring namespace");
            this.isConnected = true;
        });

        this.socket.on("disconnect", (reason) => {
            console.log("Socket.IO disconnected:", reason);
            this.isConnected = false;
        });

        this.socket.on("connect_error", (error) => {
            console.error("Socket.IO connection error:", error.message);
            this.isConnected = false;
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // Admin joins monitoring room
    adminJoinMonitoring(instituteId) {
        if (this.socket) {
            this.socket.emit("admin-join-monitoring", { instituteId });
        }
    }

    // Listen for student joined events
    onStudentJoined(callback) {
        if (this.socket) {
            this.socket.on("student-joined", callback);
        }
    }

    // Listen for violation alerts
    onViolationAlert(callback) {
        if (this.socket) {
            this.socket.on("violation-alert", callback);
        }
    }

    // Listen for auto-submit alerts
    onAutoSubmitAlert(callback) {
        if (this.socket) {
            this.socket.on("auto-submit-alert", callback);
        }
    }

    // Listen for student disconnected
    onStudentDisconnected(callback) {
        if (this.socket) {
            this.socket.on("student-disconnected", callback);
        }
    }

    // Listen for student snapshots
    onStudentSnapshot(callback) {
        if (this.socket) {
            this.socket.on("student-snapshot", callback);
        }
    }

    // Student: Start test
    studentStartedTest(data) {
        if (this.socket) {
            this.socket.emit("student-started-test", data);
        }
    }

    // Student: Send violation
    sendViolation(data) {
        if (this.socket) {
            this.socket.emit("violation-detected", data);
        }
    }

    // Student: Notify auto-submit
    notifyAutoSubmit(data) {
        if (this.socket) {
            this.socket.emit("test-auto-submitted", data);
        }
    }

    // Request timer sync
    requestTimerSync(testResponseId, callback) {
        if (this.socket) {
            this.socket.emit("request-timer-sync", { testResponseId });
            this.socket.once("timer-sync-response", callback);
        }
    }

    // Admin: Terminate test
    emitTerminateTest(testResponseId, reason = "", adminName = "") {
        if (this.socket) {
            this.socket.emit("admin-terminate-test", { testResponseId, reason, adminName });
        }
    }

    // Admin: Send warning
    emitSendWarning(testResponseId, message) {
        if (this.socket) {
            this.socket.emit("admin-send-warning", { testResponseId, message });
        }
    }

    // Student: Handle termination
    onTerminateTest(callback) {
        if (this.socket) {
            this.socket.on("terminate-test", callback);
        }
    }

    // Student: Handle warning
    onWarningFromAdmin(callback) {
        if (this.socket) {
            this.socket.on("warning-from-admin", callback);
        }
    }

    // Remove event listener
    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export default new SocketService();
