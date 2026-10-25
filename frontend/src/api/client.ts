const API_BASE = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_BASE}/api`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = sessionStorage.getItem('gymtracker_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
    // If token expired or unauthorized, trigger session clean
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      sessionStorage.removeItem('gymtracker_token');
      sessionStorage.removeItem('gymtracker_user');
      window.dispatchEvent(new Event('gymtracker_auth_logout'));
    }
    throw new ApiError(response.status, errorMessage);
  }

  return data as T;
}
