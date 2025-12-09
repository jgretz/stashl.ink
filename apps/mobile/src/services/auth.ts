import * as SecureStore from 'expo-secure-store';
import {apiClient} from './api-client';

const AUTH_TOKEN_KEY = 'stashl_auth_token';
const USER_KEY = 'stashl_user';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
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

export interface AuthResponse {
  token: string;
  user: User;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', input);

  // Store token and user in SecureStore
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

  return response;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', input);

  // Store token and user in SecureStore
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

  return response;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function getUser(): Promise<User | null> {
  const userJson = await SecureStore.getItemAsync(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

// Password Reset Functions
export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetConfirmInput {
  token: string;
  newPassword: string;
}

export async function requestPasswordReset(input: PasswordResetRequestInput): Promise<{message: string}> {
  return apiClient.post('/auth/reset-password/request', input);
}

export async function validateResetToken(token: string): Promise<{message: string; userId: string}> {
  return apiClient.post('/auth/reset-password/validate', {token});
}

export async function confirmPasswordReset(input: PasswordResetConfirmInput): Promise<{message: string}> {
  return apiClient.post('/auth/reset-password/confirm', input);
}