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

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token');
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth && this.getToken()) {
      headers.Authorization = `Token ${this.getToken()}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      credentials: 'include', // Include credentials for CORS
      ...options,
    };

    // Handle FormData (for file uploads)
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData = null;
        let errorMessage = `HTTP ${response.status}`;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            errorMessage = errorData?.detail || errorData?.message || errorMessage;
            
            // Handle validation errors
            if (errorData?.errors || errorData?.non_field_errors) {
              const errors = errorData.errors || errorData.non_field_errors;
              if (Array.isArray(errors)) {
                errorMessage = errors.join(', ');
              } else if (typeof errors === 'object') {
                errorMessage = Object.values(errors).flat().join(', ');
              }
            }
          } else {
            errorMessage = await response.text() || errorMessage;
          }
        } catch (parseError) {
          console.warn('Failed to parse error response:', parseError);
        }
        
        throw new ApiError(errorMessage, response.status, errorData);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network errors, CORS errors, etc.
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new ApiError(
          'Unable to connect to the server. Please check your internet connection and try again.',
          0,
          null
        );
      }
      
      throw new ApiError('Network error', 0, null);
    }
  }

  // Auth methods
  async register(userData) {
    return this.request('/auth/register/', {
      method: 'POST',
      body: userData,
      includeAuth: false,
    });
  }

  async login(email, password) {
    return this.request('/auth/login/', {
      method: 'POST',
      body: { email, password },
      includeAuth: false,
    });
  }

  async getProfile() {
    return this.request('/auth/me/');
  }

  async updateProfile(profileData) {
    return this.request('/auth/me/', {
      method: 'PATCH',
      body: profileData,
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password/', {
      method: 'POST',
      body: passwordData,
    });
  }

  // GeoZone methods
  async getGeoZones(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/geozones/${query ? `?${query}` : ''}`);
  }

  async createGeoZone(zoneData) {
    return this.request('/geozones/', {
      method: 'POST',
      body: zoneData,
    });
  }

  async updateGeoZone(id, zoneData) {
    return this.request(`/geozones/${id}/`, {
      method: 'PATCH',
      body: zoneData,
    });
  }

  async deleteGeoZone(id) {
    return this.request(`/geozones/${id}/`, {
      method: 'DELETE',
    });
  }

  // Subscriber methods
  async getSubscribers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/subscribers/${query ? `?${query}` : ''}`);
  }

  async createSubscriber(subscriberData) {
    return this.request('/subscribers/', {
      method: 'POST',
      body: subscriberData,
    });
  }

  async updateSubscriber(id, subscriberData) {
    return this.request(`/subscribers/${id}/`, {
      method: 'PATCH',
      body: subscriberData,
    });
  }

  // Device methods
  async getDevices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/devices/${query ? `?${query}` : ''}`);
  }

  async registerDevice(deviceData) {
    return this.request('/devices/', {
      method: 'POST',
      body: deviceData,
    });
  }

  async updateDevice(id, deviceData) {
    return this.request(`/devices/${id}/`, {
      method: 'PATCH',
      body: deviceData,
    });
  }

  // Alert methods
  async getAlerts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/alerts/${query ? `?${query}` : ''}`);
  }

  async getAlert(id) {
    return this.request(`/alerts/${id}/`);
  }

  async createAlert(alertData) {
    return this.request('/alerts/', {
      method: 'POST',
      body: alertData,
    });
  }

  async updateAlert(id, alertData) {
    return this.request(`/alerts/${id}/`, {
      method: 'PATCH',
      body: alertData,
    });
  }

  async approveAlert(id) {
    return this.request(`/alerts/${id}/approve/`, {
      method: 'POST',
    });
  }

  async sendAlert(id) {
    return this.request(`/alerts/${id}/send_now/`, {
      method: 'POST',
    });
  }

  async cancelAlert(id) {
    return this.request(`/alerts/${id}/cancel/`, {
      method: 'POST',
    });
  }

  // Alert Delivery methods
  async getAlertDeliveries(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/alert-deliveries/${query ? `?${query}` : ''}`);
  }

  // Incident methods
  async getIncidents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/incidents/${query ? `?${query}` : ''}`);
  }

  async getIncident(id) {
    return this.request(`/incidents/${id}/`);
  }

  async createIncident(incidentData) {
    const formData = new FormData();
    
    Object.keys(incidentData).forEach(key => {
      if (incidentData[key] !== null && incidentData[key] !== undefined) {
        formData.append(key, incidentData[key]);
      }
    });

    return this.request('/incidents/', {
      method: 'POST',
      body: formData,
    });
  }

  async updateIncident(id, incidentData) {
    return this.request(`/incidents/${id}/`, {
      method: 'PATCH',
      body: incidentData,
    });
  }

  async triageIncident(id) {
    return this.request(`/incidents/${id}/triage/`, {
      method: 'POST',
    });
  }

  async resolveIncident(id) {
    return this.request(`/incidents/${id}/resolve/`, {
      method: 'POST',
    });
  }

  async rejectIncident(id) {
    return this.request(`/incidents/${id}/reject/`, {
      method: 'POST',
    });
  }

  // Safety Check-in methods
  async getCheckins(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/checkins/${query ? `?${query}` : ''}`);
  }

  async createCheckin(checkinData) {
    return this.request('/checkins/', {
      method: 'POST',
      body: checkinData,
    });
  }

  // Shelter methods
  async getShelters(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/shelters/${query ? `?${query}` : ''}`);
  }

  async createShelter(shelterData) {
    return this.request('/shelters/', {
      method: 'POST',
      body: shelterData,
    });
  }

  async updateShelter(id, shelterData) {
    return this.request(`/shelters/${id}/`, {
      method: 'PATCH',
      body: shelterData,
    });
  }

  async deleteShelter(id) {
    return this.request(`/shelters/${id}/`, {
      method: 'DELETE',
    });
  }

  // Message Template methods
  async getMessageTemplates(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/message-templates/${query ? `?${query}` : ''}`);
  }

  async createMessageTemplate(templateData) {
    return this.request('/message-templates/', {
      method: 'POST',
      body: templateData,
    });
  }

  async updateMessageTemplate(id, templateData) {
    return this.request(`/message-templates/${id}/`, {
      method: 'PATCH',
      body: templateData,
    });
  }

  async deleteMessageTemplate(id) {
    return this.request(`/message-templates/${id}/`, {
      method: 'DELETE',
    });
  }

  // Provider Integration methods
  async getProviderIntegrations() {
    return this.request('/provider-integrations/');
  }

  async createProviderIntegration(providerData) {
    return this.request('/provider-integrations/', {
      method: 'POST',
      body: providerData,
    });
  }

  async updateProviderIntegration(id, providerData) {
    return this.request(`/provider-integrations/${id}/`, {
      method: 'PATCH',
      body: providerData,
    });
  }

  // Audit Log methods
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs/${query ? `?${query}` : ''}`);
  }

  // Logout method - now calls backend to invalidate session
  async logout() {
    try {
      // Call backend logout endpoint if token exists
      if (this.getToken()) {
        await this.request('/auth/logout/', {
          method: 'POST',
        });
      }
    } catch (error) {
      // Even if backend logout fails, continue with client cleanup
      console.warn('Backend logout failed:', error);
    } finally {
      // Always clear client-side data
      this.setToken(null);
    }
  }

  // Synchronous logout for immediate cleanup
  logoutSync() {
    this.setToken(null);
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  // Add 401 handling to automatically logout on token expiry
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    // Handle FormData (for file uploads)
    if (config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    } else if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401 && this.getToken()) {
        this.setToken(null);
        // Redirect to login page
        window.location.href = '/login?message=Session expired. Please sign in again.';
        throw new ApiError('Session expired', 401);
      }
      
      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
        } catch {
          // Response might not be JSON
        }
        
        throw new ApiError(
          errorData?.detail || `HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, null);
    }
  }

  // Health check method
  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
export { ApiError };