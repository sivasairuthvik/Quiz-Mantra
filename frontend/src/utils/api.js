import axios from 'axios';
import toast from 'react-hot-toast';
import { storage } from './helpers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Read token via storage to avoid JSON string quotes
    let token = storage.get('token');
    // Fallback: handle raw localStorage string
    if (!token) {
      const raw = localStorage.getItem('token');
      try { token = raw ? JSON.parse(raw) : null; } catch { token = raw; }
    }
    if (typeof token === 'string' && token.trim()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (response?.status === 403) {
      toast.error('Access denied. You do not have permission for this action.');
    } else if (response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (response?.data?.message) {
      toast.error(response.data.message);
    } else if (error.code === 'NETWORK_ERROR') {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
  deleteAccount: () => api.delete('/auth/account'),
  getAllUsers: (params) => api.get('/auth/users', { params }),
  changeUserRole: (userId, role) => api.put(`/auth/role/${userId}`, { role }),
};

// Quiz API calls
export const quizAPI = {
  getQuizzes: (params) => api.get('/api/quiz', { params }),
  getQuiz: (id) => api.get(`/api/quiz/${id}`),
  createQuiz: (data) => api.post('/api/quiz', data),
  updateQuiz: (id, data) => api.put(`/api/quiz/${id}`, data),
  deleteQuiz: (id) => api.delete(`/api/quiz/${id}`),
  uploadPDF: (formData) => api.post('/api/quiz/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  assignQuiz: (id, studentIds) => api.post(`/api/quiz/${id}/assign`, { studentIds }),
  startQuiz: (id) => api.post(`/api/quiz/${id}/start`),
  submitQuiz: (id, data) => api.post(`/api/quiz/${id}/submit`, data),
  generateAIFeedback: (submissionId) => api.post(`/api/quiz/submission/${submissionId}/feedback`),
};

// Submission API calls
export const submissionAPI = {
  getSubmissions: (params) => api.get('/api/submissions', { params }),
  getSubmission: (id) => api.get(`/api/submissions/${id}`),
  evaluateSubmission: (id, data) => api.put(`/api/submissions/${id}/evaluate`, data),
  requestRevaluation: (id, reason) => api.post(`/api/submissions/${id}/revaluation`, { reason }),
  handleRevaluation: (id, data) => api.put(`/api/submissions/${id}/revaluation`, data),
  getSubmissionStats: () => api.get('/api/submissions/stats'),
};

// Reports API calls
export const reportsAPI = {
  getStudentReport: (studentId, params) => api.get(`/api/reports/student/${studentId}`, { params }),
  getQuizReport: (quizId) => api.get(`/api/reports/quiz/${quizId}`),
  getTeacherReport: () => api.get('/api/reports/teacher'),
  getAdminReport: () => api.get('/api/reports/admin'),
};

// Practice API calls
export const practiceAPI = {
  generatePracticeQuiz: (data) => api.post('/api/practice', data),
  getPerformanceAnalysis: () => api.get('/api/practice/analysis'),
  getPracticeRecommendations: () => api.get('/api/practice/recommendations'),
};

// Messages API calls
export const messagesAPI = {
  getMessages: (params) => api.get('/api/messages', { params }),
  getMessage: (id) => api.get(`/api/messages/${id}`),
  sendMessage: (data) => api.post('/api/messages', data),
  getConversation: (userId, params) => api.get(`/api/messages/conversation/${userId}`, { params }),
  markAsRead: (id) => api.put(`/api/messages/${id}/read`),
  deleteMessage: (id) => api.delete(`/api/messages/${id}`),
  getMessageStats: () => api.get('/api/messages/stats'),
};

// Announcements API calls
export const announcementsAPI = {
  getAnnouncements: (params) => api.get('/api/announcements', { params }),
  getAnnouncement: (id) => api.get(`/api/announcements/${id}`),
  createAnnouncement: (data) => api.post('/api/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/api/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/api/announcements/${id}`),
  getAnnouncementStats: () => api.get('/api/announcements/admin/stats'),
};

// Competitions API calls
export const competitionsAPI = {
  getCompetitions: (params) => api.get('/api/competitions', { params }),
  getCompetition: (id) => api.get(`/api/competitions/${id}`),
  createCompetition: (data) => api.post('/api/competitions', data),
  updateCompetition: (id, data) => api.put(`/api/competitions/${id}`, data),
  deleteCompetition: (id) => api.delete(`/api/competitions/${id}`),
  registerForCompetition: (id) => api.post(`/api/competitions/${id}/register`),
  submitCompetitionEntry: (id, submissionId) => api.post(`/api/competitions/${id}/submit`, { submissionId }),
  getLeaderboard: (id) => api.get(`/api/competitions/${id}/leaderboard`),
  getCompetitionStats: () => api.get('/api/competitions/stats'),
};

// Public API calls
export const publicAPI = {
  contact: (payload) => api.post('/api/public/contact', payload),
};

export default api;