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
// User Management methods
async getUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return this.request(`/users/${query ? `?${query}` : ''}`);
}

async createUser(userData) {
  return this.request('/users/', {
    method: 'POST',
    body: userData,
  });
}

async updateUser(id, userData) {
  return this.request(`/users/${id}/`, {
    method: 'PATCH',
    body: userData,
  });
}

async deleteUser(id) {
  return this.request(`/users/${id}/`, {
    method: 'DELETE',
  });
}

async getUserById(id) {
  return this.request(`/users/${id}/`);
}

// Role Management specific methods
async getRoleStatistics() {
  return this.request('/users/role_statistics/');
}

async bulkRoleChange(userIds, targetRole) {
  return this.request('/users/bulk_role_change/', {
    method: 'POST',
    body: {
      user_ids: userIds,
      target_role: targetRole
    }
  });
}

async bulkApproveUsers(userIds) {
  return this.request('/users/bulk_approve/', {
    method: 'POST',
    body: {
      user_ids: userIds
    }
  });
}

async bulkActivateUsers(userIds, isActive = true) {
  return this.request('/users/bulk_activate/', {
    method: 'POST',
    body: {
      user_ids: userIds,
      is_active: isActive
    }
  });
}

async resetUserPassword(userId) {
  return this.request(`/users/${userId}/reset_password/`, {
    method: 'POST'
  });
}

// Individual user status methods
async approveUser(userId) {
  return this.updateUser(userId, { is_approved: true });
}

async activateUser(userId) {
  return this.updateUser(userId, { is_active: true });
}

async deactivateUser(userId) {
  return this.updateUser(userId, { is_active: false });
}

async changeUserRole(userId, newRole) {
  return this.updateUser(userId, { role: newRole });
}

// Validation methods for role management
validateRoleChange(currentUserRole, targetUserRole, newRole) {
  // Only admins can change roles
  if (currentUserRole !== 'admin') {
    throw new Error('Only administrators can change user roles');
  }
  
  // Valid roles check
  const validRoles = ['admin', 'operator', 'citizen'];
  if (!validRoles.includes(newRole)) {
    throw new Error('Invalid role specified');
  }
  
  return true;
}

validateBulkOperation(currentUserRole, operation, userIds) {
  if (currentUserRole !== 'admin') {
    throw new Error('Only administrators can perform bulk operations');
  }
  
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('No users selected for bulk operation');
  }
  
  const validOperations = ['role_change', 'approve', 'activate', 'deactivate'];
  if (!validOperations.includes(operation)) {
    throw new Error('Invalid bulk operation');
  }
  
  return true;
}

// Helper method to check if user can perform action
canUserPerformAction(currentUser, targetUser, action) {
  // Self-check
  if (currentUser.id === targetUser.id) {
    const allowedSelfActions = ['view', 'update_profile'];
    return allowedSelfActions.includes(action);
  }
  
  // Role-based permissions
  switch (currentUser.role) {
    case 'admin':
      // Admins can perform all actions on all users
      return true;
    
    case 'operator':
      // Operators can only view users, no modifications
      return action === 'view';
    
    case 'citizen':
      // Citizens can only view/update their own profile
      return currentUser.id === targetUser.id && ['view', 'update_profile'].includes(action);
    
    default:
      return false;
  }
}

// Export user data
async exportUsers(format = 'csv', filters = {}) {
  const params = new URLSearchParams({
    ...filters,
    export_format: format
  }).toString();
  
  try {
    const response = await fetch(`${API_BASE_URL}/users/export/?${params}`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }
    
    // Return blob for file download
    return await response.blob();
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
}

// Audit trail methods
async getUserAuditLog(userId, params = {}) {
  const query = new URLSearchParams({
    entity: 'User',
    entity_id: userId,
    ...params
  }).toString();
  
  return this.request(`/audit-logs/?${query}`);
}

async getSystemAuditLog(params = {}) {
  const query = new URLSearchParams(params).toString();
  return this.request(`/audit-logs/?${query}`);
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