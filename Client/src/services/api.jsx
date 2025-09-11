// services/api.jsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  // -------- Token helpers --------
  setToken(token) {
    this.token = token || null;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // -------- Headers --------
  getHeaders(includeAuth = true) {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (includeAuth && token) headers.Authorization = `Token ${token}`;
    return headers;
  }

  // -------- Single, consolidated request --------
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const includeAuth = options.includeAuth !== false;

    const config = {
      method: options.method || 'GET',
      headers: this.getHeaders(includeAuth),
      // Include credentials only if you actually rely on cookies (safe to omit for DRF token auth)
      // credentials: 'include',
    };

    // Body handling
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type']; // Let browser set boundary
      config.body = options.body;
    } else if (options.body !== undefined) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Token expired/invalid
      if (response.status === 401 && this.getToken()) {
        this.setToken(null);
        // optional redirect; keep if desired:
        // window.location.href = '/login?message=Session expired. Please sign in again.';
        throw new ApiError('Unauthorized', 401, null);
      }

      // 204 No Content
      if (response.status === 204) return null;

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      if (!response.ok) {
        let errorData = null;
        let message = `HTTP ${response.status}`;
        try {
          if (isJson) {
            errorData = await response.json();
            // Prefer DRF-style fields
            message =
              errorData?.detail ||
              errorData?.message ||
              (typeof errorData === 'object'
                ? Object.values(errorData).flat().join(', ')
                : message);
          } else {
            message = (await response.text()) || message;
          }
        } catch {
          // ignore parse errors
        }
        throw new ApiError(message, response.status, errorData);
      }

      return isJson ? await response.json() : await response.text();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('Network error', 0, null);
    }
  }

  // -------- Auth --------
  async register(userData) {
    const data = await this.request('/auth/register/', {
      method: 'POST',
      body: userData,
      includeAuth: false,
    });
    // If backend returns token on register, store it
    if (data?.token) this.setToken(data.token);
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: { email, password },
      includeAuth: false,
    });
    if (data?.token) this.setToken(data.token);
    return data;
  }

  async logout() {
    try {
      if (this.getToken()) {
        await this.request('/auth/logout/', { method: 'POST' });
      }
    } catch (e) {
      console.warn('Backend logout failed:', e);
    } finally {
      this.setToken(null);
    }
  }

  logoutSync() {
    this.setToken(null);
  }

  async getProfile() {
    return this.request('/auth/me/');
  }

  async updateProfile(profileData) {
    return this.request('/auth/me/', { method: 'PATCH', body: profileData });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password/', { method: 'POST', body: passwordData });
  }

  // -------- Users --------
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/${query ? `?${query}` : ''}`);
  }

  async getUserById(id) {
    return this.request(`/users/${id}/`);
  }

  async createUser(userData) {
    return this.request('/users/', { method: 'POST', body: userData });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}/`, { method: 'PATCH', body: userData });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}/`, { method: 'DELETE' });
  }

  async approveUser(userId) {
    return this.request(`/users/${userId}/approve/`, { method: 'POST' });
  }

  async deactivateUser(userId) {
    return this.request(`/users/${userId}/deactivate/`, { method: 'POST' });
  }

  async activateUser(userId) {
    return this.updateUser(userId, { is_active: true });
  }

  async changeUserRole(userId, newRole) {
    return this.request(`/users/${userId}/set_role/`, {
      method: 'POST',
      body: { role: newRole },
    });
  }

  async setUserPassword(userId, newPassword) {
    return this.request(`/users/${userId}/set_password/`, {
      method: 'POST',
      body: { new_password: newPassword },
    });
  }

  async bulkApproveUsers(userIds = []) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('No users selected for bulk approve');
    }
    return Promise.all(userIds.map((id) => this.approveUser(id)));
  }

  async bulkActivateUsers(userIds = [], isActive = true) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('No users selected for bulk activate/deactivate');
    }
    return Promise.all(userIds.map((id) => this.updateUser(id, { is_active: isActive })));
  }

  async bulkRoleChange(userIds = [], targetRole) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('No users selected for bulk role change');
    }
    if (!['admin', 'operator', 'citizen'].includes(targetRole)) {
      throw new Error('Invalid role specified');
    }
    return Promise.all(userIds.map((id) => this.changeUserRole(id, targetRole)));
  }

  validateRoleChange(_currentUserRole, _targetUserRole, newRole) {
    const validRoles = ['admin', 'operator', 'citizen'];
    if (!validRoles.includes(newRole)) throw new Error('Invalid role specified');
    return true;
  }

  validateBulkOperation(_currentUserRole, operation, userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('No users selected for bulk operation');
    }
    const validOperations = ['role_change', 'approve', 'activate', 'deactivate'];
    if (!validOperations.includes(operation)) throw new Error('Invalid bulk operation');
    return true;
  }

  canUserPerformAction() {
    // any authenticated user can act (as per your policy)
    return this.isAuthenticated();
  }

  async exportUsers(format = 'csv', filters = {}) {
    const params = new URLSearchParams({ ...filters, export_format: format }).toString();
    const res = await fetch(`${API_BASE_URL}/users/export/?${params}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
    return await res.blob();
  }

  async getUserAuditLog(userId, params = {}) {
    const query = new URLSearchParams({ entity: 'User', entity_id: userId, ...params }).toString();
    return this.request(`/audit-logs/?${query}`);
  }

  async getSystemAuditLog(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs/?${query}`);
  }

  // -------- GeoZones --------
  async getGeoZones(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/geozones/${query ? `?${query}` : ''}`);
  }

  async createGeoZone(zoneData) {
    return this.request('/geozones/', { method: 'POST', body: zoneData });
  }

  async updateGeoZone(id, zoneData) {
    return this.request(`/geozones/${id}/`, { method: 'PATCH', body: zoneData });
  }

  async deleteGeoZone(id) {
    return this.request(`/geozones/${id}/`, { method: 'DELETE' });
  }

  // -------- Subscribers --------
  async getSubscribers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/subscribers/${query ? `?${query}` : ''}`);
  }

  async createSubscriber(subscriberData) {
    return this.request('/subscribers/', { method: 'POST', body: subscriberData });
  }

  async updateSubscriber(id, subscriberData) {
    return this.request(`/subscribers/${id}/`, { method: 'PATCH', body: subscriberData });
  }

  // -------- Devices --------
  async getDevices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/devices/${query ? `?${query}` : ''}`);
  }

  async registerDevice(deviceData) {
    return this.request('/devices/', { method: 'POST', body: deviceData });
  }

  async updateDevice(id, deviceData) {
    return this.request(`/devices/${id}/`, { method: 'PATCH', body: deviceData });
  }

  // -------- Alerts --------
  async getAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/alerts/${query ? `?${query}` : ''}`);
  }

  async getAlert(id) {
    return this.request(`/alerts/${id}/`);
  }

  async createAlert(alertData) {
    return this.request('/alerts/', { method: 'POST', body: alertData });
  }

  async updateAlert(id, alertData) {
    return this.request(`/alerts/${id}/`, { method: 'PATCH', body: alertData });
  }

  async approveAlert(id) {
    return this.request(`/alerts/${id}/approve/`, { method: 'POST' });
  }

  async sendAlert(id) {
    return this.request(`/alerts/${id}/send_now/`, { method: 'POST' });
  }

  async cancelAlert(id) {
    return this.request(`/alerts/${id}/cancel/`, { method: 'POST' });
  }

  // -------- Alert Deliveries --------
  async getAlertDeliveries(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/alert-deliveries/${query ? `?${query}` : ''}`);
  }

  // -------- Incidents --------
  async getIncidents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/incidents/${query ? `?${query}` : ''}`);
  }

  async getIncident(id) {
    return this.request(`/incidents/${id}/`);
  }

  async createIncident(incidentData) {
    const formData = new FormData();
    Object.keys(incidentData || {}).forEach((key) => {
      const val = incidentData[key];
      if (val !== null && val !== undefined) formData.append(key, val);
    });
    return this.request('/incidents/', { method: 'POST', body: formData });
  }

  async updateIncident(id, incidentData) {
    return this.request(`/incidents/${id}/`, { method: 'PATCH', body: incidentData });
  }

  async triageIncident(id) {
    return this.request(`/incidents/${id}/triage/`, { method: 'POST' });
  }

  async resolveIncident(id) {
    return this.request(`/incidents/${id}/resolve/`, { method: 'POST' });
  }

  async rejectIncident(id) {
    return this.request(`/incidents/${id}/reject/`, { method: 'POST' });
  }

  // -------- Check-ins --------
  async getCheckins(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/checkins/${query ? `?${query}` : ''}`);
  }

  async createCheckin(checkinData) {
    return this.request('/checkins/', { method: 'POST', body: checkinData });
  }

  // -------- Shelters --------
  async getShelters(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/shelters/${query ? `?${query}` : ''}`);
  }

  async createShelter(shelterData) {
    return this.request('/shelters/', { method: 'POST', body: shelterData });
  }

  async updateShelter(id, shelterData) {
    return this.request(`/shelters/${id}/`, { method: 'PATCH', body: shelterData });
  }

  async deleteShelter(id) {
    return this.request(`/shelters/${id}/`, { method: 'DELETE' });
  }

  // -------- Message Templates --------
  async getMessageTemplates(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/message-templates/${query ? `?${query}` : ''}`);
  }

  async createMessageTemplate(templateData) {
    return this.request('/message-templates/', { method: 'POST', body: templateData });
  }

  async updateMessageTemplate(id, templateData) {
    return this.request(`/message-templates/${id}/`, { method: 'PATCH', body: templateData });
  }

  async deleteMessageTemplate(id) {
    return this.request(`/message-templates/${id}/`, { method: 'DELETE' });
  }

  // -------- Provider Integrations --------
  async getProviderIntegrations() {
    return this.request('/provider-integrations/');
  }

  async createProviderIntegration(providerData) {
    return this.request('/provider-integrations/', { method: 'POST', body: providerData });
  }

  async updateProviderIntegration(id, providerData) {
    return this.request(`/provider-integrations/${id}/`, { method: 'PATCH', body: providerData });
  }

  // -------- Audit Logs --------
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs/${query ? `?${query}` : ''}`);
  }

  // -------- Health --------
  async healthCheck() {
    try {
      const res = await fetch(`${API_BASE_URL}/health/`, { method: 'GET', headers: { Accept: 'application/json' } });
      return res.ok;
    } catch (e) {
      console.error('Health check failed:', e);
      return false;
    }
  }
}

// singleton
const apiService = new ApiService();
export default apiService;
export { ApiError };
