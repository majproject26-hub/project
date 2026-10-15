/**
 * SHEGU Lakehouse API Client
 * Seamlessly interfaces the React frontend with the FastAPI + DuckDB backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('lakehouse_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('lakehouse_token', token);
    } else {
      localStorage.removeItem('lakehouse_token');
    }
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    const token = this.token || localStorage.getItem('lakehouse_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const isFormData = options.body instanceof FormData;
    const headers = { ...this.getHeaders(isFormData), ...(options.headers || {}) };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
          // Token expired or invalid
          this.setToken(null);
          localStorage.removeItem('lakehouse_current_user');
        }
        const errorMsg = data?.detail || data?.error || (typeof data === 'string' ? data : 'API Request failed');
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.warn(`[Lakehouse API] ${options.method || 'GET'} ${endpoint} error:`, err.message);
      throw err;
    }
  }

  // --- Health Check ---
  async checkHealth() {
    return this.request('/api/health');
  }

  // --- Authentication ---
  async login(companyId, email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ companyId, email, password }),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async register(registrationData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  async registerCompany(companyData) {
    const res = await this.request('/api/auth/register-company', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
    if (res.token) this.setToken(res.token);
    return res;
  }

  async requestOtp(companyId, email) {
    return this.request('/api/auth/forgot-password/request-otp', {
      method: 'POST',
      body: JSON.stringify({ companyId, email }),
    });
  }

  async verifyOtp(companyId, email, otp) {
    return this.request('/api/auth/forgot-password/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ companyId, email, otp }),
    });
  }

  async resetPassword(companyId, email, newPassword, otp = null) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ companyId, email, newPassword, otp }),
    });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  async updateProfile(updates) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // --- Companies ---
  async getCompanies() {
    return this.request('/api/companies');
  }

  async getCurrentCompany() {
    return this.request('/api/companies/current');
  }

  async updateCompanySettings(settings) {
    return this.request('/api/companies/current/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // --- Users & RBAC ---
  async getUsers() {
    return this.request('/api/users');
  }

  async approveUser(userId) {
    return this.request(`/api/users/${userId}/approve`, { method: 'POST' });
  }

  async bulkApproveUsers(userIds) {
    return this.request('/api/users/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
  }

  async rejectUser(userId, reason) {
    return this.request(`/api/users/${userId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async changeUserRole(userId, role) {
    return this.request(`/api/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async toggleUserStatus(userId) {
    return this.request(`/api/users/${userId}/toggle-status`, { method: 'POST' });
  }

  async resetUserPassword(userId, newPassword) {
    return this.request(`/api/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  }

  // --- Datasets & Parquet ---
  async getDatasets() {
    return this.request('/api/datasets');
  }

  async getDataset(id) {
    return this.request(`/api/datasets/${id}`);
  }

  async uploadDataset(formData) {
    return this.request('/api/datasets/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async deleteDataset(id) {
    return this.request(`/api/datasets/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllDatasets() {
    return this.request('/api/datasets/all', {
      method: 'DELETE',
    });
  }

  async updateDatasetAccess(id, accessLevel) {
    return this.request(`/api/datasets/${id}/access`, {
      method: 'PUT',
      body: JSON.stringify({ accessLevel }),
    });
  }

  async updateBulkDatasetAccess(accessLevel) {
    return this.request('/api/datasets/bulk-access', {
      method: 'PUT',
      body: JSON.stringify({ accessLevel }),
    });
  }

  async updateDatasetMetadata(id, updates) {
    return this.request(`/api/datasets/${id}/metadata`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // --- SQL Studio (DuckDB) ---
  async runSql(sql, limit = 500) {
    return this.request('/api/sql/run', {
      method: 'POST',
      body: JSON.stringify({ sql, limit }),
    });
  }

  async getSavedQueries() {
    return this.request('/api/sql/saved');
  }

  async saveQuery(query) {
    return this.request('/api/sql/saved', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  async deleteSavedQuery(id) {
    return this.request(`/api/sql/saved/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Ask Your Data (AI) ---
  async askQuestion(question, datasetId = null) {
    return this.request('/api/ask', {
      method: 'POST',
      body: JSON.stringify({ question, datasetId }),
    });
  }

  // --- Visualizations & Charts ---
  async getCharts() {
    return this.request('/api/charts');
  }

  async createChart(chart) {
    return this.request('/api/charts', {
      method: 'POST',
      body: JSON.stringify(chart),
    });
  }

  async togglePinChart(id) {
    return this.request(`/api/charts/${id}/toggle-pin`, {
      method: 'POST',
    });
  }

  async deleteChart(id) {
    return this.request(`/api/charts/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Dashboards ---
  async getDashboards() {
    return this.request('/api/dashboards');
  }

  async createDashboard(dashboard) {
    return this.request('/api/dashboards', {
      method: 'POST',
      body: JSON.stringify(dashboard),
    });
  }

  async updateDashboard(id, updates) {
    return this.request(`/api/dashboards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteDashboard(id) {
    return this.request(`/api/dashboards/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Audit Logs ---
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/audit${query ? `?${query}` : ''}`);
  }

  async logEvent(event) {
    return this.request('/api/audit', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }
}

export const api = new ApiService();
