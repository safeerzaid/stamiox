const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiService {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('stamiox_auth_token');
  }

  static setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('stamiox_auth_token', token);
    }
  }

  static removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stamiox_auth_token');
    }
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Request failed with status ${res.status}`);
      }

      return data as T;
    } catch (err: any) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  }

  // --- Auth ---
  static async register(data: { email: string; password: string; name: string; company?: string }) {
    return this.request<{ success: boolean; token: string; user: any; subscription: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async login(data: { email: string; password: string }) {
    return this.request<{ success: boolean; token: string; user: any; subscription: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async demoLogin() {
    return this.request<{ success: boolean; token: string; user: any; subscription: any }>('/auth/demo-login', {
      method: 'POST',
    });
  }

  static async getMe() {
    return this.request<{ success: boolean; user: any; subscription: any }>('/auth/me');
  }

  // --- Subscriptions ---
  static async getPlans() {
    return this.request<{ success: boolean; plans: any[] }>('/subscriptions/plans');
  }

  static async getSubscriptionStatus() {
    return this.request<{ success: boolean; subscription: any }>('/subscriptions/status');
  }

  static async upgradeSubscription(planId: string) {
    return this.request<{ success: boolean; message: string; subscription: any }>('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
  }

  static async cancelSubscription() {
    return this.request<{ success: boolean; message: string; subscription: any }>('/subscriptions/cancel', {
      method: 'POST',
    });
  }

  // --- Templates ---
  static async getTemplates(params?: { category?: string; shape?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.shape) query.set('shape', params.shape);
    if (params?.search) query.set('search', params.search);

    return this.request<{ success: boolean; templates: any[] }>(`/templates?${query.toString()}`);
  }

  static async getTemplateById(id: string) {
    return this.request<{ success: boolean; template: any }>(`/templates/${id}`);
  }

  // --- Projects ---
  static async getProjects() {
    return this.request<{ success: boolean; projects: any[] }>('/projects');
  }

  static async getProjectById(id: string) {
    return this.request<{ success: boolean; project: any }>(`/projects/${id}`);
  }

  static async createProject(data: any) {
    return this.request<{ success: boolean; message: string; project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateProject(id: string, data: any) {
    return this.request<{ success: boolean; message: string; project: any }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteProject(id: string) {
    return this.request<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  static async duplicateProject(id: string) {
    return this.request<{ success: boolean; message: string; project: any }>(`/projects/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // --- Cliparts ---
  static async getCliparts(category?: string) {
    const query = category ? `?category=${category}` : '';
    return this.request<{ success: boolean; cliparts: any[] }>(`/cliparts${query}`);
  }
}
