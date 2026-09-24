import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, AUTH_TOKEN_STORAGE_KEY } from '@/constants/config';
import { ApiError, type ApiErrorBody } from '@/types/api';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data;
    throw new ApiError(body?.message ?? error.message ?? 'Unexpected network error', {
      code: body?.code,
      status: error.response?.status,
      fieldErrors: body?.fieldErrors,
    });
  },
);
