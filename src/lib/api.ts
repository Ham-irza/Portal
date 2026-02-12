/**
 * API Service for Django REST Framework Backend
 * Handles all HTTP requests with JWT authentication
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// --- Commission Interfaces ---
export interface CommissionRule {
  id: number;
  tier: string;
  base_rate: number | string;
  bonus_rate: number | string;
  threshold: number | string;
}
export interface Commission {
  id: number;
  applicant: number;
  applicant_name: string;
  partner_name?: string; // Present in detail view
  amount: number | string;
  currency: string;
  status: 'pending' | 'processing' | 'paid';
  paid_at?: string | null;
  payout_reference?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface CommissionPayload {
  applicant: number;
  amount: number;
  currency?: string;
  // UPDATE THIS LINE TOO
  status?: 'pending' | 'processing' | 'paid';
  paid_at?: string | null;
  payout_reference?: string;
}

export interface CommissionFilter {
  applicant?: number;
  status?: 'pending' | 'paid';
}
// Token management
export const tokenService = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = tokenService.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          const newToken = tokenService.getAccessToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, { ...config, headers });
            if (!retryResponse.ok) {
              throw new Error(`API error: ${retryResponse.statusText}`);
            }
              const data = await retryResponse.json();
              return data as T;
          }
        }
        // If refresh failed, clear tokens and throw error
        tokenService.clearTokens();
        throw new Error('Session expired. Please login again.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || errorData.message || `API error: ${response.statusText}`);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/api/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        tokenService.setTokens(data.access, refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    company_name: string;
    contact_name: string;
    contact_phone?: string;
  }): Promise<{ detail: string }> {
    return this.request('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerApplicant(data: {
    email: string;
    password: string;
    full_name?: string;
  }): Promise<{ detail: string }> {
    return this.request('/api/auth/register/applicant/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string): Promise<{
    access: string;
    refresh: string;
  }> {
    const data = await this.request<{ access: string; refresh: string }>(
      '/api/auth/login/',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    tokenService.setTokens(data.access, data.refresh);
    return data;
  }

  async getMe(): Promise<{
    id: number;
    email: string;
    first_name?: string;  // Added
    is_active?: boolean;  // Added
    is_staff: boolean;
    is_superuser: boolean;
    partner?: {
      id: number;
      company_name: string;
      contact_name: string;
      status: string;
    };
  }> {
    return this.request('/api/auth/me/');
  }

  // Dashboard
  async getDashboardStats(partnerId?: number): Promise<{
    total_applicants: number;
    active_applicants: number;
    completed_applicants: number;
    rejected_applicants: number;
    pending_documents: number;
    paid_payments_count: number;
    unpaid_payments_count: number;
    total_revenue: number;
    total_commission_earned: number;
    commission_pending: number;
    commission_paid: number;
  }> {
    const url = partnerId
      ? `/api/dashboard/?partner_id=${partnerId}`
      : '/api/dashboard/';
    return this.request(url);
  }

  // Applicants
  async getApplicants(params?: {
    search?: string;
    status?: string;
    ordering?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.ordering) queryParams.append('ordering', params.ordering);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/applicants/?${queryString}` : '/api/applicants/';
    return this.request(url);
  }

  async getApplicant(id: number): Promise<any> {
    return this.request(`/api/applicants/${id}/`);
  }

  async createApplicant(data: any): Promise<any> {
    return this.request('/api/applicants/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplicant(id: number, data: any): Promise<any> {
    return this.request(`/api/applicants/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteApplicant(id: number): Promise<void> {
    return this.request(`/api/applicants/${id}/`, {
      method: 'DELETE',
    });
  }

  // Documents
  async getDocuments(applicantId?: number): Promise<any[]> {
    const url = applicantId
      ? `/api/documents/?applicant=${applicantId}`
      : '/api/documents/';
    const data = await this.request(url);
    return Array.isArray(data) ? data : ((data as any)?.results || []);
  }

  async getDocument(id: number): Promise<any> {
    return this.request(`/api/documents/${id}/`);
  }

  async uploadDocument(formData: FormData): Promise<any> {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${this.baseURL}/api/documents/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(errorData.detail || errorData.message || `API error: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadDocument(id: number): Promise<Blob> {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${this.baseURL}/api/documents/${id}/download/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    return response.blob();
  }

  async updateDocument(id: string, data: any): Promise<any> {
    return this.request(`/api/documents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request(`/api/documents/${id}/`, {
      method: 'DELETE',
    });
  }

  // Service Types / Document Requirements
  async getServiceTypes(): Promise<any[]> {
    const data = await this.request('/api/documents/service-types/');
    return Array.isArray(data) ? data : ((data as any)?.results || []);
  }

  async getDocumentRequirements(serviceKey?: string): Promise<any[]> {
    const url = serviceKey
      ? `/api/documents/document-requirements/?service__key=${serviceKey}`
      : '/api/documents/document-requirements/';
    const data = await this.request(url);
    return Array.isArray(data) ? data : ((data as any)?.results || []);
  }

  // Payments
  async getPayments(applicantId?: number): Promise<any[]> {
    const url = applicantId
      ? `/api/payments/?applicant=${applicantId}`
      : '/api/payments/';
    const data = await this.request(url);
    return Array.isArray(data) ? data : ((data as any)?.results || []);
  }

  async getPayment(id: number): Promise<any> {
    return this.request(`/api/payments/${id}/`);
  }

  async createPayment(data: any): Promise<any> {
    return this.request('/api/payments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayment(id: number, data: any): Promise<any> {
    return this.request(`/api/payments/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async downloadReceipt(id: number): Promise<Blob> {
    const token = tokenService.getAccessToken();
    const response = await fetch(`${this.baseURL}/api/payments/${id}/download-receipt/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download receipt');
    }

    return response.blob();
  }

  // Commissions
  async getCommissions(): Promise<any[]> {
    const data = await this.request('/api/commissions/');
    // Handle both direct array and paginated { results: [...] } responses
    return Array.isArray(data) ? data : ((data as any)?.results || []);
  }

  async getCommission(id: number): Promise<any> {
    return this.request(`/api/commissions/${id}/`);
  }

  // Support Tickets
  async getTickets(): Promise<any[]> {
    return this.request('/api/tickets/');
  }

  async getTicket(id: number): Promise<any> {
    return this.request(`/api/tickets/${id}/`);
  }

  async createTicket(data: {
    subject: string;
    initial_message: string;
  }): Promise<any> {
    return this.request('/api/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicket(id: number, data: { status?: string }): Promise<any> {
    return this.request(`/api/tickets/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async replyToTicket(id: number, body: string): Promise<any> {
    return this.request(`/api/tickets/${id}/reply/`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  }
  async getCommissionRules(): Promise<CommissionRule[]> {
    const data = await this.request('/api/commission-rules/');
    // Handle both direct array and paginated { results: [...] } responses
    return Array.isArray(data) ? data : ((data as any)?.results || []);
  }

  // Reports
  async getPartnerReport(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/reports/partner/?${queryString}` : '/api/reports/partner/';
    return this.request(url);
  }

  async exportPartnerReportCSV(params?: { start_date?: string; end_date?: string; }) : Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseURL}/api/reports/partner/export/csv/?${queryString}` : `${this.baseURL}/api/reports/partner/export/csv/`;
    const token = tokenService.getAccessToken();
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error('Failed to export partner report CSV');
    return response.blob();
  }

  async exportPartnerReportPDF(params?: { start_date?: string; end_date?: string; }) : Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseURL}/api/reports/partner/export/pdf/?${queryString}` : `${this.baseURL}/api/reports/partner/export/pdf/`;
    const token = tokenService.getAccessToken();
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error('Failed to export partner report PDF');
    return response.blob();
  }

  async getAdminReport(params?: {
    partner_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.partner_id) queryParams.append('partner_id', params.partner_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/reports/admin/?${queryString}` : '/api/reports/admin/';
    return this.request(url);
  }

  async exportAdminReportCSV(params?: { partner_id?: number; start_date?: string; end_date?: string; }) : Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.partner_id) queryParams.append('partner_id', params.partner_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    const queryString = queryParams.toString();
    const url = queryString ? `${this.baseURL}/api/reports/admin/export/csv/?${queryString}` : `${this.baseURL}/api/reports/admin/export/csv/`;
    const token = tokenService.getAccessToken();
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!response.ok) throw new Error('Failed to export admin report CSV');
    return response.blob();
  }

  // Admin endpoints - Partners
  async getPartners(): Promise<any[]> {
    return this.request('/api/auth/partners/');
  }

  async getPartner(id: number): Promise<any> {
    return this.request(`/api/auth/partners/${id}/`);
  }

  async updatePartner(id: number, data: any): Promise<any> {
    return this.request(`/api/auth/partners/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async approvePartner(id: number): Promise<any> {
    return this.request(`/api/auth/partners/${id}/approve/`, {
      method: 'POST',
    });
  }

  // Admin endpoints - Documents (all documents across all partners)
  async getAllAdminDocuments(params?: {
    applicant?: number;
    document_type?: string;
    status?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params?.applicant) queryParams.append('applicant', params.applicant.toString());
    if (params?.document_type) queryParams.append('document_type', params.document_type);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = queryString ? `/api/documents/?${queryString}` : '/api/documents/';
    const data = await this.request(url);
    return Array.isArray(data) ? data : ((data as any)?.results || []);
  }

  async verifyDocument(id: string, data: {
    status: 'approved' | 'rejected' | 'pending';
    notes: string;
  }): Promise<any> {
    return this.request(`/api/documents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  
  /**
   * Create a new commission manually.
   */
  async createCommission(data: CommissionPayload): Promise<Commission> {
    return this.request('/api/commissions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a commission (e.g., mark as paid, add reference).
   */
  async updateCommission(id: number, data: Partial<CommissionPayload>): Promise<Commission> {
    return this.request(`/api/commissions/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a commission record.
   */
  async deleteCommission(id: number): Promise<void> {
    return this.request(`/api/commissions/${id}/`, {
      method: 'DELETE',
    });
  }

  async createCommissionRule(data: any): Promise<any> {
    return this.request('/api/commission-rules/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCommissionRule(id: number, data: any): Promise<any> {
    return this.request(`/api/commission-rules/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCommissionRule(id: number): Promise<void> {
    return this.request(`/api/commission-rules/${id}/`, {
      method: 'DELETE',
    });
  }
}



export const api = new ApiClient(API_BASE_URL);

