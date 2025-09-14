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
    if (data?.token) this.setToken(data.token);
    return data;
  }

  async login(username, password) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: { username, password },
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
    return this.request('/profile/', { method: 'PATCH', body: profileData });
  }

  async changePassword(passwordData) {
    return this.request('/auth/change-password/', { method: 'POST', body: passwordData });
  }

  async resetPassword(email) {
    return this.request('/auth/password-reset/', {
      method: 'POST',
      body: { email },
      includeAuth: false,
    });
  }

  async confirmPasswordReset(token, password) {
    return this.request('/auth/password-reset-confirm/', {
      method: 'POST',
      body: { token, password },
      includeAuth: false,
    });
  }

  // -------- User Profile & Preferences --------
  async getNotificationPreferences() {
    return this.request('/profile/preferences/');
  }

  async updateNotificationPreferences(preferences) {
    return this.request('/profile/preferences/', { method: 'PATCH', body: preferences });
  }

  // async updateLocation(latitude, longitude, district_id) {
  //   return this.request('/profile/location/', {
  //     method: 'POST',
  //     body: { latitude, longitude, district_id },
  //   });
  // }

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

    // -------- Locations (Rwanda Administrative Boundaries) --------
  async getLocations(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/locations/${query ? `?${query}` : ''}`);
  }

  async getLocation(id) {
    return this.request(`/locations/${id}/`);
  }

  // ✅ ADD THESE:
  async createLocation(payload) {
    // payload example:
    // { name, name_rw, name_fr, location_type, parent, center_lat, center_lng, population, is_active }
    return this.request('/locations/', { method: 'POST', body: payload });
  }

  async updateLocation(id, payload) {
    // Partial update by default
    return this.request(`/locations/${id}/`, { method: 'PATCH', body: payload });
  }

  async deleteLocation(id) {
    return this.request(`/locations/${id}/`, { method: 'DELETE' });
  }


 // -------- Disaster Types --------
async getDisasterTypes(params = {}) {
  const query = new URLSearchParams(params).toString();
  return this.request(`/disaster-types/${query ? `?${query}` : ''}`);
}

async getDisasterType(id) {
  return this.request(`/disaster-types/${id}/`);
}

async createDisasterType(data) {
  return this.request('/disaster-types/', { method: 'POST', body: data });
}

async updateDisasterType(id, data) {
  return this.request(`/disaster-types/${id}/`, { method: 'PATCH', body: data });
}

async deleteDisasterType(id, { hard = false } = {}) {
  const suffix = hard ? '?hard=true' : '';
  return this.request(`/disaster-types/${id}/${suffix}`, { method: 'DELETE' });
}

async activateDisasterType(id) {
  return this.request(`/disaster-types/${id}/activate/`, { method: 'POST' });
}

async deactivateDisasterType(id) {
  return this.request(`/disaster-types/${id}/deactivate/`, { method: 'POST' });
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

  async deleteAlert(id) {
    return this.request(`/alerts/${id}/`, { method: 'DELETE' });
  }

  async getActiveAlerts() {
    return this.request('/alerts/active/');
  }

  async activateAlert(id) {
    return this.request(`/alerts/${id}/activate/`, { method: 'POST' });
  }

  async respondToAlert(id, responseData) {
    return this.request(`/alerts/${id}/respond/`, { method: 'POST', body: responseData });
  }

  async getNearbyAlerts(radius = 50) {
    const params = new URLSearchParams({ radius }).toString();
    return this.request(`/alerts/nearby/?${params}`);
  }

  async getMyAlertResponses() {
    return this.request('/alerts/my-responses/');
  }

  async bulkSendAlert(alertData) {
    return this.request('/alerts/bulk-send/', { method: 'POST', body: alertData });
  }

  async getAlertDeliveryStatus(alertId) {
    return this.request(`/alerts/${alertId}/delivery-status/`);
  }

  async getPublicActiveAlerts() {
    return this.request('/public/active-alerts/', { includeAuth: false });
  }

  // Get all alert deliveries with filtering
async getAlertDeliveries(params = {}) {
  const query = new URLSearchParams(params).toString();
  return this.request(`/alert-deliveries/${query ? `?${query}` : ''}`);
}

// Get specific alert delivery by ID
async getAlertDelivery(id) {
  return this.request(`/alert-deliveries/${id}/`);
}

// Get delivery statistics (from the backend statistics action)
async getDeliveryStatistics(params = {}) {
  const query = new URLSearchParams(params).toString();
  return this.request(`/alert-deliveries/statistics/${query ? `?${query}` : ''}`);
}

// Mark a delivery as read
async markDeliveryAsRead(deliveryId) {
  return this.request(`/alert-deliveries/${deliveryId}/mark_as_read/`, { 
    method: 'POST' 
  });
}

// Get deliveries for a specific alert
async getAlertDeliveriesForAlert(alertId, params = {}) {
  const allParams = { ...params, alert: alertId };
  const query = new URLSearchParams(allParams).toString();
  return this.request(`/alert-deliveries/${query ? `?${query}` : ''}`);
}

// Get deliveries for current user
async getMyDeliveries(params = {}) {
  const query = new URLSearchParams(params).toString();
  return this.request(`/alert-deliveries/${query ? `?${query}` : ''}`);
}

// Get failed deliveries (useful for admin debugging)
async getFailedDeliveries(params = {}) {
  const allParams = { ...params, status: 'failed' };
  const query = new URLSearchParams(allParams).toString();
  return this.request(`/alert-deliveries/${query ? `?${query}` : ''}`);
}

// Get deliveries by method (sms, push, email)
async getDeliveriesByMethod(method, params = {}) {
  const allParams = { ...params, delivery_method: method };
  const query = new URLSearchParams(allParams).toString();
  return this.request(`/alert-deliveries/${query ? `?${query}` : ''}`);
}

// Bulk mark deliveries as read (useful for clearing notifications)
async bulkMarkDeliveriesAsRead(deliveryIds) {
  return this.request('/alert-deliveries/bulk-mark-read/', {
    method: 'POST',
    body: { delivery_ids: deliveryIds }
  });
}

// Get delivery metrics for dashboard
async getDeliveryMetrics(timeframe = '24h') {
  return this.request(`/alert-deliveries/metrics/?timeframe=${timeframe}`);
}

// -------- Enhanced Alert Methods (based on backend analysis) --------

// Get alert delivery status with enhanced details
async getAlertDeliveryStatus(alertId) {
  return this.request(`/alerts/${alertId}/delivery_status/`);
}

// Resend failed notifications for an alert
async resendFailedNotifications(alertId, options = {}) {
  return this.request(`/alerts/${alertId}/resend_notifications/`, { 
    method: 'POST',
    body: options 
  });
}

// Cancel an active alert
async cancelAlert(alertId) {
  return this.request(`/alerts/${alertId}/cancel/`, { method: 'POST' });
}

// Activate alert with options (async/sync)
async activateAlert(id, options = { async: true }) {
  return this.request(`/alerts/${id}/activate/`, { 
    method: 'POST', 
    body: options 
  });
}

// -------- Utility Methods for Better UX --------

// Get real-time delivery progress for an alert
async getDeliveryProgress(alertId) {
  const status = await this.getAlertDeliveryStatus(alertId);
  const totalTargeted = status.total_target_users || 0;
  
  if (totalTargeted === 0) {
    return { progress: 0, status: 'no_targets' };
  }

  let totalProcessed = 0;
  let totalSuccessful = 0;
  
  Object.values(status.stats_by_method || {}).forEach(method => {
    totalProcessed += method.sent + method.delivered + method.failed;
    totalSuccessful += method.sent + method.delivered;
  });

  return {
    progress: Math.round((totalProcessed / totalTargeted) * 100),
    successRate: totalProcessed > 0 ? Math.round((totalSuccessful / totalProcessed) * 100) : 0,
    totalTargeted,
    totalProcessed,
    totalSuccessful,
    status: totalProcessed >= totalTargeted ? 'complete' : 'in_progress'
  };
}

// Check if user has unread alert deliveries
async hasUnreadDeliveries() {
  try {
    const deliveries = await this.getMyDeliveries({ 
      status: 'delivered,sent',
      page_size: 1 
    });
    return deliveries.count > 0;
  } catch (error) {
    console.error('Error checking unread deliveries:', error);
    return false;
  }
}

// Get delivery summary for admin dashboard
async getDeliverySummary(timeframe = '24h') {
  try {
    const [statistics, metrics] = await Promise.all([
      this.getDeliveryStatistics({ 
        start_date: this.getTimeframeStartDate(timeframe) 
      }),
      this.getDeliveryMetrics(timeframe)
    ]);
    
    return {
      ...statistics,
      ...metrics,
      timeframe
    };
  } catch (error) {
    console.error('Error getting delivery summary:', error);
    throw error;
  }
}

// Helper method to calculate start date for timeframe
getTimeframeStartDate(timeframe) {
  const now = new Date();
  switch (timeframe) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
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
      if (val !== null && val !== undefined) {
        if (key === 'images' || key === 'videos') {
          // Handle file arrays
          if (Array.isArray(val)) {
            val.forEach((file, index) => {
              formData.append(`${key}[${index}]`, file);
            });
          }
        } else {
          formData.append(key, val);
        }
      }
    });
    return this.request('/incidents/', { method: 'POST', body: formData });
  }

  async updateIncident(id, incidentData) {
    return this.request(`/incidents/${id}/`, { method: 'PATCH', body: incidentData });
  }

  async deleteIncident(id) {
    return this.request(`/incidents/${id}/`, { method: 'DELETE' });
  }

  async assignIncident(id, assignedToId) {
    return this.request(`/incidents/${id}/assign/`, {
      method: 'POST',
      body: { assigned_to: assignedToId },
    });
  }

  async verifyIncident(id) {
    return this.request(`/incidents/${id}/verify/`, { method: 'POST' });
  }

  async resolveIncident(id, resolutionNotes = '') {
    return this.request(`/incidents/${id}/resolve/`, {
      method: 'POST',
      body: { resolution_notes: resolutionNotes },
    });
  }

  async getMyIncidentReports() {
    return this.request('/incidents/my-reports/');
  }

  async getAssignedIncidents() {
    return this.request('/incidents/assigned-to-me/');
  }

  async getPriorityIncidents() {
    return this.request('/incidents/priority/');
  }

  // -------- Emergency Contacts --------
  async getEmergencyContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/emergency-contacts/${query ? `?${query}` : ''}`);
  }

  async getEmergencyContact(id) {
    return this.request(`/emergency-contacts/${id}/`);
  }

  async getEmergencyContactsByLocation(locationId) {
    return this.request(`/emergency-contacts/by_location/?location_id=${locationId}`);
  }

  async getNearbyEmergencyContacts(latitude, longitude) {
    const params = new URLSearchParams({ latitude, longitude }).toString();
    return this.request(`/emergency-contacts/nearby/?${params}`);
  }

  async getPublicEmergencyContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/public/emergency-contacts/${query ? `?${query}` : ''}`, {
      includeAuth: false,
    });
  }

  // -------- Safety Guides --------
  async getSafetyGuides(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/safety-guides/${query ? `?${query}` : ''}`);
  }

  async getSafetyGuide(id) {
    return this.request(`/safety-guides/${id}/`);
  }

  async getFeaturedSafetyGuides() {
    return this.request('/safety-guides/featured/');
  }

  async getSafetyGuidesByDisaster(disasterTypeId) {
    const params = new URLSearchParams({ disaster_type: disasterTypeId }).toString();
    return this.request(`/safety-guides/by-disaster/?${params}`);
  }

  async getPublicSafetyTips(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/public/safety-tips/${query ? `?${query}` : ''}`, {
      includeAuth: false,
    });
  }

  // -------- Notification Templates --------
  async getNotificationTemplates(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/notification-templates/${query ? `?${query}` : ''}`);
  }

  async getNotificationTemplate(id) {
    return this.request(`/notification-templates/${id}/`);
  }

  async createNotificationTemplate(templateData) {
    return this.request('/notification-templates/', { method: 'POST', body: templateData });
  }

  async updateNotificationTemplate(id, templateData) {
    return this.request(`/notification-templates/${id}/`, { method: 'PATCH', body: templateData });
  }

  async deleteNotificationTemplate(id) {
    return this.request(`/notification-templates/${id}/`, { method: 'DELETE' });
  }

  // -------- Dashboard --------
  async getDashboard() {
    return this.request('/dashboard/');
  }

  async getDashboardStats() {
    return this.request('/dashboard/stats/');
  }

  async getRecentAlerts() {
    return this.request('/dashboard/recent-alerts/');
  }

  async getRecentIncidents() {
    return this.request('/dashboard/recent-incidents/');
  }

  // -------- Notifications --------
  async sendTestNotification(recipientId, message) {
    return this.request('/notifications/send-test/', {
      method: 'POST',
      body: { recipient_id: recipientId, message },
    });
  }

  // -------- System & Monitoring --------
  async getSystemHealth() {
    return this.request('/system/health/');
  }

  async getSystemMetrics() {
    return this.request('/system/metrics/');
  }

  async healthCheck() {
    try {
      const res = await fetch(`${API_BASE_URL}/system/health/`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      return res.ok;
    } catch (e) {
      console.error('Health check failed:', e);
      return false;
    }
  }

  // -------- File Uploads --------
  async uploadIncidentMedia(file, incidentId = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (incidentId) formData.append('incident_id', incidentId);

    return this.request('/upload/incident-media/', { method: 'POST', body: formData });
  }

  async uploadSafetyGuideMedia(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/upload/safety-guide-media/', { method: 'POST', body: formData });
  }

  // -------- Mobile App Support --------
  async getMobileAppConfig() {
    return this.request('/mobile/app-config/', { includeAuth: false });
  }

  async checkForceUpdate(version, platform = 'android') {
    const params = new URLSearchParams({ version, platform }).toString();
    return this.request(`/mobile/force-update-check/?${params}`, { includeAuth: false });
  }

  // -------- Utility Methods --------
  validateRoleChange(currentUserRole, targetUserRole, newRole) {
    const validRoles = ['admin', 'operator', 'authority', 'citizen'];
    if (!validRoles.includes(newRole)) throw new Error('Invalid role specified');
    return true;
  }

  validateBulkOperation(currentUserRole, operation, userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new Error('No users selected for bulk operation');
    }
    const validOperations = ['role_change', 'approve', 'activate', 'deactivate'];
    if (!validOperations.includes(operation)) throw new Error('Invalid bulk operation');
    return true;
  }

  canUserPerformAction() {
    return this.isAuthenticated();
  }

  // -------- Export Functions --------
  async exportUsers(format = 'csv', filters = {}) {
    const params = new URLSearchParams({ ...filters, export_format: format }).toString();
    const res = await fetch(`${API_BASE_URL}/users/export/?${params}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
    return await res.blob();
  }

  async exportAlerts(format = 'csv', filters = {}) {
    const params = new URLSearchParams({ ...filters, export_format: format }).toString();
    const res = await fetch(`${API_BASE_URL}/alerts/export/?${params}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
    return await res.blob();
  }

  async exportIncidents(format = 'csv', filters = {}) {
    const params = new URLSearchParams({ ...filters, export_format: format }).toString();
    const res = await fetch(`${API_BASE_URL}/incidents/export/?${params}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
    return await res.blob();
  }

  // -------- Legacy Compatibility (for gradual migration) --------
  async getGeoZones(params = {}) {
    // Map to new locations endpoint
    return this.getLocations(params);
  }

  async getSubscribers(params = {}) {
    // Map to users with citizen type
    return this.getUsers({ ...params, user_type: 'citizen' });
  }

  async getDevices(params = {}) {
    // Devices are now handled through user device tokens
    console.warn('getDevices is deprecated. Use user notification preferences instead.');
    return { results: [] };
  }

  async getCheckins(params = {}) {
    // Map to alert responses
    return this.getAlertResponses(params);
  }

  async getShelters(params = {}) {
    // Map to emergency contacts
    return this.getEmergencyContacts({ ...params, contact_type: 'shelter' });
  }

  async getMessageTemplates(params = {}) {
    // Map to notification templates
    return this.getNotificationTemplates(params);
  }

  async getProviderIntegrations() {
    // Provider integrations are now handled through system configuration
    console.warn('getProviderIntegrations is deprecated. Use system configuration instead.');
    return { results: [] };
  }

  async getAuditLogs(params = {}) {
    // Audit logs can be implemented later if needed
    console.warn('getAuditLogs is not yet implemented in the new system.');
    return { results: [] };
  }
}

// singleton
const apiService = new ApiService();
export default apiService;
export { ApiError };