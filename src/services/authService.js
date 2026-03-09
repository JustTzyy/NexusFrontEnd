import apiClient from './api';

export const authService = {
  register: (email, password, confirmPassword) => apiClient.post('/auth/register', { email, password, confirmPassword }),
  login: (email, password, rememberMe = false) => apiClient.post('/auth/login', { email, password, rememberMe }),
  googleLogin: (credential) => apiClient.post('/auth/google-login', { credential }),
  googleLoginWithToken: (accessToken) => apiClient.post('/auth/google-login', { accessToken }),
  getMe: () => apiClient.get('/auth/me'),
  changePassword: (currentPassword, newPassword, confirmPassword) =>
    apiClient.post('/auth/change-password', { currentPassword, newPassword, confirmPassword }),
  deactivateAccount: () => apiClient.post('/auth/deactivate'),
  logout: () => apiClient.post('/auth/logout'),

  // Email availability check
  checkEmail: (email) => apiClient.get('/auth/check-email', { params: { email } }),

  // OTP verification
  sendOtp: (email) => apiClient.post('/auth/send-otp', { email }),
  verifyOtp: (email, code) => apiClient.post('/auth/verify-otp', { email, code }),

  // Password reset
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => apiClient.post('/auth/reset-password', { token, newPassword }),
  validateResetToken: (token) => apiClient.get(`/auth/validate-reset-token/${token}`),
};
