import {apiClient} from '../api-client';
import {createServerFn} from '@tanstack/react-start';
import {confirmPasswordReset} from './password-reset-service';

export interface User {
  id: string;
  email: string;
  name: string;
  emailIntegrationEnabled: boolean;
  emailFilter: string | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
}

export const login = createServerFn({
  method: 'POST',
})
  .inputValidator((data: LoginInput) => data)
  .handler(async function ({data}) {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response;
  });

export const register = createServerFn({
  method: 'POST',
})
  .inputValidator((data: RegisterInput) => data)
  .handler(async function ({data}) {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response;
  });

export function setAuthToken(token: string) {
  document.cookie = `auth-token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; secure; samesite=strict`;
  apiClient.setAuthToken(token);
}

export function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth-token='));
  return authCookie ? authCookie.split('=')[1] : null;
}

export function clearAuthToken() {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  apiClient.setAuthToken(null);
}

export function isAuthenticated(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  const token = getAuthToken();
  const authenticated = token !== null && token !== '' && token !== 'undefined';

  // Ensure API client has the token set for subsequent requests
  if (authenticated && token) {
    apiClient.setAuthToken(token);
  }

  return authenticated;
}

function onLoad() {
  // Initialize auth on module load
  if (typeof document !== 'undefined') {
    const token = getAuthToken();
    if (token && token !== '' && token !== 'undefined') {
      apiClient.setAuthToken(token);
    }
  }
}

onLoad();

// Additional auth utility functions for compatibility
export function requireAuth() {
  return isAuthenticated();
}

export async function resetPassword(token: string, newPassword: string) {
  return confirmPasswordReset({data: {token, newPassword}});
}