import axios, { AxiosError } from 'axios';
import { getStoredToken } from '../auth/session';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12_000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps every payload as { success, message, data }. Unwrap it here,
    // once, so every API module can read fields directly off response.data.
    const body = response.data;
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      response.data = body.data;
    }
    return response;
  },
  (error: AxiosError<{ message?: string; error?: string }>) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (window.location.pathname !== '/auth/login') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth/login';
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'GidiRide could not complete that request.';
    return Promise.reject(Object.assign(error, { friendlyMessage: message }));
  }
);

export function shouldUseMockFallback(_error: unknown) {
  // REDESIGN: We are now exclusively using the real Spring Boot backend.
  return false;
}

export function getFriendlyError(error: unknown) {
  if (typeof error === 'object' && error && 'friendlyMessage' in error) {
    return String((error as { friendlyMessage: string }).friendlyMessage);
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
