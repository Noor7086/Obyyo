import { apiService } from './api';
import { User, LoginForm, RegisterForm, ProfileUpdateForm, PasswordChangeForm, ApiResponse } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  async login(credentials: LoginForm): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login with:', { email: credentials.email });
      const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      if (!response.success || !response.data) {
        console.error('❌ Login failed:', response.message);
        throw new Error(response.message || 'Login failed');
      }
      console.log('✅ Login successful');
      return response.data;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullError: error
      });
      
      // Extract the actual error message from the response
      let errorMessage = 'Login failed';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((err: any) => err.message || err.msg).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Create a new error with the proper message
      const loginError = new Error(errorMessage);
      (loginError as any).response = error.response;
      throw loginError;
    }
  }

  async register(userData: RegisterForm): Promise<AuthResponse> {
    const response = await apiService.post<ApiResponse<AuthResponse>>('/auth/register', userData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Registration failed');
    }
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<ApiResponse<{ user: User }>>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to get user data');
    }
    return response.data.user;
  }

  async updateProfile(data: ProfileUpdateForm): Promise<User> {
    const response = await apiService.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Profile update failed');
    }
    return response.data.user;
  }

  async changePassword(data: PasswordChangeForm): Promise<void> {
    try {
      const response = await apiService.put<ApiResponse>('/auth/change-password', data);
      if (!response.success) {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error: any) {
      console.error('AuthService changePassword error:', error);
      console.error('AuthService error response:', error.response);
      console.error('AuthService error data:', error.response?.data);
      console.error('AuthService error status:', error.response?.status);
      
      // Handle axios error response (when backend returns error status like 400, 401, etc.)
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        console.log('Error data structure:', errorData);
        
        // Handle validation errors (422 status) - array of errors
        if (errorData.errors && Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((err: any) => err.message || err.msg).join(', ');
          throw new Error(errorMessages);
        }
        
        // Handle standard error response with message field
        if (errorData.message) {
          console.log('Extracting error message:', errorData.message);
          throw new Error(errorData.message);
        }
        
        // If errorData is a string
        if (typeof errorData === 'string') {
          throw new Error(errorData);
        }
      }
      
      // If error already has a message, use it
      if (error.message) {
        throw new Error(error.message);
      }
      
      // Fallback
      throw new Error('Password change failed');
    }
  }

  async forgotPassword(phone: string, consentSMSVerification: boolean): Promise<void> {
    const response = await apiService.post<ApiResponse>('/auth/forgot-password', { 
      phone,
      consentSMSVerification 
    });
    if (!response.success) {
      throw new Error(response.message || 'Failed to send reset code');
    }
  }

  async verifyResetCode(phone: string, code: string): Promise<void> {
    const response = await apiService.post<ApiResponse>('/auth/verify-reset-code', { phone, code });
    if (!response.success) {
      throw new Error(response.message || 'Invalid or expired reset code');
    }
  }

  async resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
    const response = await apiService.post<ApiResponse>('/auth/reset-password', {
      phone,
      code,
      newPassword
    });
    if (!response.success) {
      throw new Error(response.message || 'Password reset failed');
    }
  }

  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  async updateUserWalletBalance(_userId: string, newBalance: number): Promise<User> {
    // Use the existing profile update endpoint to update wallet balance
    const response = await apiService.put<ApiResponse<{ user: User }>>('/auth/profile', {
      walletBalance: newBalance
    });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update wallet balance');
    }
    return response.data.user;
  }
}

export const authService = new AuthService();

