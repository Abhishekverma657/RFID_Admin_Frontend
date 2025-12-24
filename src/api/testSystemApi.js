import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: `${API_BASE_URL}/test-system`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests if exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("testToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ==================== Test Student APIs ====================

export const createTestStudent = async (data) => {
    const response = await api.post("/students", data);
    return response.data;
};

export const getTestStudents = async (instituteId) => {
    const response = await api.get(`/students?instituteId=${instituteId}`);
    return response.data;
};

export const updateTestStudent = async (id, data) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
};

export const deleteTestStudent = async (id) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
};

export const assignTestToStudent = async (id, data) => {
    const response = await api.post(`/students/${id}/assign`, data);
    return response.data;
};

// ==================== Test APIs ====================

export const createTest = async (data) => {
    const response = await api.post("/tests", data);
    return response.data;
};

export const getTests = async (instituteId) => {
    const response = await api.get(`/tests?instituteId=${instituteId}`);
    return response.data;
};

export const getTestById = async (id) => {
    const response = await api.get(`/tests/${id}`);
    return response.data;
};

export const updateTest = async (id, data) => {
    const response = await api.put(`/tests/${id}`, data);
    return response.data;
};

export const deleteTest = async (id) => {
    const response = await api.delete(`/tests/${id}`);
    return response.data;
};

export const getTestLink = async (id) => {
    const response = await api.get(`/tests/${id}/link`);
    return response.data;
};

// ==================== Question APIs ====================

export const importQuestions = async (formData) => {
    const response = await api.post("/questions/import", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data;
    return response.data;
};

export const getQuestionPapers = async (instituteId) => {
    const response = await api.get(`/questions/papers?instituteId=${instituteId}`);
    return response.data;
};

export const deleteQuestionPaper = async (id) => {
    const response = await api.delete(`/questions/papers/${id}`);
    return response.data;
};

export const getQuestions = async (instituteId, className = "", set = "") => {
    let url = `/questions?instituteId=${instituteId}`;
    if (className) url += `&class=${className}`;
    if (set) url += `&set=${set}`;
    const response = await api.get(url);
    return response.data;
};

export const createQuestion = async (data) => {
    const response = await api.post("/questions", data);
    return response.data;
};

export const deleteQuestion = async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
};

export const updateQuestion = async (id, data) => {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
};

export const reorderQuestions = async (questionIds) => {
    const response = await api.post("/questions/reorder", { questionIds });
    return response.data;
};

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post("/questions/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
};

// ==================== Student Auth APIs ====================

export const requestOTP = async (userId, testId) => {
    const response = await api.post("/auth/request-otp", { userId, testId });
    return response.data;
};

export const verifyOTP = async (userId, otp) => {
    const response = await api.post("/auth/verify-otp", { userId, otp });
    return response.data;
};

// ==================== Test Engine APIs ====================

export const startTest = async () => {
    const response = await api.get("/exam/start");
    return response.data;
};

export const saveAnswer = async (data) => {
    const response = await api.post("/exam/save-answer", data);
    return response.data;
};

export const submitTest = async (data) => {
    const response = await api.post("/exam/submit", data);
    return response.data;
};

export const getTimeRemaining = async (testResponseId) => {
    const response = await api.get(`/exam/time-remaining?testResponseId=${testResponseId}`);
    return response.data;
};

export const logViolation = async (data) => {
    const response = await api.post("/exam/violation", data);
    return response.data;
};

export const uploadSnapshot = async (data) => {
    const response = await api.post("/exam/snapshot", data);
    return response.data;
};

// ==================== Result APIs ====================

export const getAllResults = async (instituteId) => {
    const response = await api.get(`/results?instituteId=${instituteId}`);
    return response.data;
};

export const getResultDetail = async (id) => {
    const response = await api.get(`/results/${id}/detail`);
    return response.data;
};

export const updateReviewStatus = async (id, data) => {
    const response = await api.put(`/results/${id}/review`, data);
    return response.data;
};

export const getMyResult = async () => {
    const response = await api.get("/results/my-result");
    return response.data;
};
