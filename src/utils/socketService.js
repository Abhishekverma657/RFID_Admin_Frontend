import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

class SocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
    }

    connect() {
        if (this.socket && this.isConnected) {
            return this.socket;
        }

        this.socket = io(`${SOCKET_URL}/proctoring`, {
            transports: ["websocket"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => {
            console.log("Socket.IO connected");
            this.isConnected = true;
        });

        this.socket.on("disconnect", () => {
            console.log("Socket.IO disconnected");
            this.isConnected = false;
        });

        this.socket.on("connect_error", (error) => {
            console.error("Socket.IO connection error:", error);
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

    // Remove event listener
    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export default new SocketService();
