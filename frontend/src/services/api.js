import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getManagers: () => api.get('/auth/managers')
};

// Cycles
export const cyclesAPI = {
  getAll: (params) => api.get('/cycles', { params }),
  getOne: (id) => api.get(`/cycles/${id}`),
  create: (data) => api.post('/cycles', data),
  transition: (id) => api.patch(`/cycles/${id}/transition`)
};

// Goals
export const goalsAPI = {
  getAll: (params) => api.get('/goals', { params }),
  getOne: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`)
};

// Reviews
export const reviewsAPI = {
  getAll: (params) => api.get('/reviews', { params }),
  getOne: (id) => api.get(`/reviews/${id}`),
  submitSelfAssessment: (data) => api.post('/reviews/self-assessment', data),
  finalize: (data) => api.post('/reviews/finalize', data),
  getDirectReports: () => api.get('/reviews/direct-reports/list'),
  getStatsSummary: () => api.get('/reviews/stats/summary')
};

export default api;
