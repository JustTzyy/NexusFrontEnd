import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7083/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based auth if needed
});

// Request interceptor - Add JWT token to headers
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Return the data directly from ApiResponse<T>
    if (response.data && response.data.success) {
      return response.data; // Returns { success, data, message }
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      // Handle 401 Unauthorized - Token expired
      // Skip redirect for login endpoints (let the component show the error)
      const isLoginRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/google-login');
      if (status === 401 && !isLoginRequest) {
        // Clear token and redirect to login
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        window.location.href = '/login';
      } else if (status === 403) {
        toast.error("You don't have permission to perform this action.");
      }

      // Return structured error
      return Promise.reject({
        message: data.message || 'An error occurred',
        errors: data.errors || [],
        status,
      });
    }

    // Network error
    return Promise.reject({
      message: 'Network error. Please check your connection.',
      errors: [],
    });
  }
);

export default apiClient;
