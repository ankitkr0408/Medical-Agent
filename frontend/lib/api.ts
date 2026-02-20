import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
                const { state } = JSON.parse(authStorage);
                if (state?.token) {
                    config.headers.Authorization = `Bearer ${state.token}`;
                }
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('auth-storage');
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: async (data: { email: string; password: string; full_name: string }) => {
        const response = await apiClient.post('/api/auth/register', data);
        return response.data;
    },

    login: async (data: { email: string; password: string }) => {
        const response = await apiClient.post('/api/auth/login', data);
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await apiClient.get('/api/auth/me');
        return response.data;
    },

    logout: async () => {
        // Zustand store handle the state, we just call the API if needed
        // await apiClient.post('/api/auth/logout'); 
    },
};

// Analysis API
export const analysisAPI = {
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/analysis/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    analyzeImage: async (data: { filename: string; image_data: string; enable_xai?: boolean }) => {
        const response = await apiClient.post('/api/analysis/analyze', data);
        return response.data;
    },

    getHistory: async (limit = 10) => {
        const response = await apiClient.get(`/api/analysis/history?limit=${limit}`);
        return response.data;
    },

    getAnalysis: async (id: string) => {
        const response = await apiClient.get(`/api/analysis/${id}`);
        return response.data;
    },

    generateReport: async (id: string, includeReferences = true) => {
        const response = await apiClient.post(`/api/analysis/${id}/report`, {
            include_references: includeReferences,
        });
        return response.data;
    },
};

// Consultation API
export const consultationAPI = {
    createConsultation: async (data: { case_description: string; creator_name: string }) => {
        const response = await apiClient.post('/api/consultation/create', data);
        return response.data;
    },

    getRooms: async () => {
        const response = await apiClient.get('/api/consultation/rooms');
        return response.data;
    },

    getConsultation: async (id: string) => {
        const response = await apiClient.get(`/api/consultation/${id}`);
        return response.data;
    },

    sendMessage: async (id: string, data: { message: string; user_name: string }) => {
        const response = await apiClient.post(`/api/consultation/${id}/message`, data);
        return response.data;
    },

    startConsultation: async (id: string) => {
        const response = await apiClient.post(`/api/consultation/${id}/start`);
        return response.data;
    },

    autoCompleteConsultation: async (id: string) => {
        const response = await apiClient.post(`/api/consultation/${id}/auto-complete`);
        return response.data;
    },
};

// Q&A API
export const qaAPI = {
    createSession: async (data: { title: string; user_name: string }) => {
        // Backend expects room_name, frontend uses title
        const response = await apiClient.post('/api/qa/create', {
            room_name: data.title,
            creator_name: data.user_name
        });
        return response.data;
    },

    getHistory: async () => {
        const response = await apiClient.get('/api/qa/sessions');
        return { sessions: response.data }; // Match frontend expecting { sessions: [] }
    },

    askQuestion: async (sessionId: string, data: { question: string; user_name: string }) => {
        const response = await apiClient.post(`/api/qa/${sessionId}/question`, {
            question: data.question
        });
        return response.data;
    },

    getSession: async (sessionId: string) => {
        const response = await apiClient.get(`/api/qa/${sessionId}/history`);
        return response.data;
    },
};

// Reports API
export const reportsAPI = {
    listReports: async () => {
        const response = await apiClient.get('/api/reports/list');
        return response.data;
    },

    generateReport: async (analysisId: string, title?: string) => {
        // Calls the Analysis PDF report endpoint
        const response = await apiClient.post(`/api/analysis/${analysisId}/report`, {
            include_references: true,
        });
        return response.data;
    },

    getReport: async (reportId: string) => {
        const response = await apiClient.get(`/api/reports/${reportId}`);
        return response.data;
    },

    downloadReport: async (reportId: string, filename: string) => {
        const response = await apiClient.get(`/api/reports/${reportId}/download`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },
};

export default apiClient;
