import {match} from 'ts-pattern';

function getApiUrl(): string {
  const envApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  const nodeEnv = import.meta.env.NODE_ENV as string;

  // First check if environment variable is set (highest priority)
  if (envApiUrl) {
    return envApiUrl;
  }

  console.log(`NODE_ENV: ${nodeEnv} | VITE_API_URL ${envApiUrl}`);

  // Use pattern matching for environment scenarios
  return match(nodeEnv)
    .with('development', () => 'http://localhost:3001/api')
    .with('production', () => 'https://stashl-api.fly.dev/api')
    .otherwise(() => {
      throw new Error(
        `API_URL must be configured via VITE_API_URL environment variable for environment: ${nodeEnv}`,
      );
    });
}

export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = getApiUrl();
    // Load auth token from cookies if available
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find((cookie) => cookie.trim().startsWith('auth-token='));
      if (authCookie) {
        this.authToken = authCookie.split('=')[1];
      }
    }
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'An error occurred',
      }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {method: 'GET'});
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {method: 'DELETE'});
  }
}

export const apiClient = new ApiClient();
