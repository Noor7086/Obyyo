import axios, { AxiosInstance, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // Use environment variable for API URL, fallback to relative path for same-domain setup
    // For production with backend on different server, set VITE_API_BASE_URL
    const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api';

    // Log API URL for debugging (only in development)
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
      console.log('🔗 API Base URL:', apiBaseURL);
      console.log('🔗 Environment:', import.meta.env.MODE);
    }

    this.api = axios.create({
      baseURL: apiBaseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          // Only log in debug mode
          if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
            console.log('🔐 Auth token added to request:', token.substring(0, 20) + '...');
          }
        }



        // Only log requests in debug mode
        if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
          console.log('📤 Request:', {
            method: config.method?.toUpperCase(),
            url: config.url || '',
            baseURL: config.baseURL || '',
            fullURL: (config.baseURL || '') + (config.url || ''),
            hasToken: !!token
          });
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response;

          switch (status) {
            case 401:
              // Unauthorized - only redirect if not already on login page
              // Don't clear token or redirect during login attempt
              if (window.location.pathname !== '/login' && !error.config?.url?.includes('/auth/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }
              // Don't show toast for login attempts - let the component handle error display
              if (data.message && !error.config?.url?.includes('/auth/login')) {
                toast.error(data.message);
              }
              break;
            case 403:
              // Don't show generic toast - let the component handle specific error messages
              // The component will show the actual error message from the backend
              break;
            case 400:
              // Bad request - don't show toast for admin predictions endpoint (validation errors)
              // Let the component handle field-specific error display
              const url400 = error.config?.url || '';
              if (!url400.includes('/admin/predictions')) {
                // For other endpoints, let components handle it or show toast if needed
              }
              break;
            case 404:
              // Don't show toast for endpoints that are expected to potentially return 404 for new users
              // These endpoints are handled gracefully by components using Promise.allSettled
              const url = error.config?.url || '';
              const suppress404Endpoints = [
                '/wallet/stats',
                '/predictions/my-purchases',
                '/wallet',
                '/wallet/transactions'
              ];

              const shouldSuppress = suppress404Endpoints.some(endpoint => url.includes(endpoint));

              if (!shouldSuppress) {
                toast.error('Resource not found.');
              }
              break;
            case 422:
              // Validation errors - don't show toast for admin predictions endpoint
              // Let the component handle field-specific error display
              const requestUrl = error.config?.url || '';
              if (!requestUrl.includes('/admin/predictions')) {
                if (data.errors && Array.isArray(data.errors)) {
                  data.errors.forEach((error: any) => {
                    toast.error(error.message || 'Validation error');
                  });
                } else {
                  toast.error(data.message || 'Validation failed');
                }
              }
              break;
            case 429:
              toast.error('Too many requests. Please try again later.');
              break;
            case 500:
              toast.error('Server error. Please try again later.');
              break;
            default:
              toast.error(data.message || 'An error occurred');
          }
        } else if (error.request) {
          // Network error - backend not reachable
          console.error('❌ Network Error - Backend not reachable:', {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            fullURL: error.config?.baseURL + error.config?.url
          });
          toast.error('Cannot connect to server. Please check if backend is running.');
        } else {
          console.error('❌ Unexpected error:', error);
          toast.error('An unexpected error occurred');
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get<T>(url: string, params?: any): Promise<T> {
    try {
      // Only log in debug mode
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`📡 GET Request: ${this.api.defaults.baseURL}${url}`, params ? { params } : '');
      }
      const response = await this.api.get(url, { params });
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`✅ GET Response: ${url}`, response.data);
      }
      return response.data;
    } catch (error: any) {
      // Always log errors
      console.error(`❌ GET Error: ${url}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    try {
      // Only log in debug mode
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`📡 POST Request: ${this.api.defaults.baseURL}${url}`, data ? { data: { ...data, password: data.password ? '***' : undefined } } : '');
      }
      const response = await this.api.post(url, data);
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`✅ POST Response: ${url}`, response.data);
      }
      return response.data;
    } catch (error: any) {
      // Always log errors
      console.error(`❌ POST Error: ${url}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        responseText: error.response?.data
      });
      throw error;
    }
  }

  async put<T>(url: string, data?: any): Promise<T> {
    try {
      // Only log in debug mode
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`📡 PUT Request: ${this.api.defaults.baseURL}${url}`, data ? { data: { ...data, password: data.password || data.currentPassword ? '***' : undefined, newPassword: data.newPassword ? '***' : undefined } } : '');
      }
      const response = await this.api.put(url, data);
      if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`✅ PUT Response: ${url}`, response.data);
      }
      return response.data;
    } catch (error: any) {
      // Always log errors
      console.error(`❌ PUT Error: ${url}`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw error;
    }
  }

  async delete<T>(url: string): Promise<T> {
    const response = await this.api.delete(url);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch(url, data);
    return response.data;
  }

  // File upload method
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
}

export const apiService = new ApiService();

