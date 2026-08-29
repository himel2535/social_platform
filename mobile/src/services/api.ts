import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/constants/config';
import { getToken } from '@/utils/storage';

export type ApiError = {
  message: string;
  status?: number;
  errors?: Record<string, string>;
};

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.requestTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

api.interceptors.request.use(async (requestConfig: InternalAxiosRequestConfig) => {
  const token = await getToken();
  if (token && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; errors?: Record<string, string> }>) => {
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'Network error',
      status: error.response?.status,
      errors: error.response?.data?.errors,
    };

    if (error.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }

    return Promise.reject(apiError);
  }
);

export default api;
