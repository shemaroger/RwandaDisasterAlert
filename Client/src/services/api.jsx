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

  async createLocation(payload) {
    return this.request('/locations/', { method: 'POST', body: payload });
  }

  async updateLocation(id, payload) {
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

  async activateAlert(id, options = { async: true }) {
    return this.request(`/alerts/${id}/activate/`, { 
      method: 'POST', 
      body: options 
    });
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
    return this.request(`/alerts/${alertId}/delivery_status/`);
  }

  async resendFailedNotifications(alertId, options = {}) {
    return this.request(`/alerts/${alertId}/resend_notifications/`, { 
      method: 'POST',
      body: options 
    });
  }

  async cancelAlert(alertId) {
    return this.request(`/alerts/${alertId}/cancel/`, { method: 'POST' });
  }

  async getPublicActiveAlerts() {
    return this.request('/public/active-alerts/', { includeAuth: false });
  }

  // -------- Alert Deliveries (Updated to use existing endpoints) --------
  
  // Use the delivery reports endpoint that exists in your backend
  async getAlertDeliveries(params = {}) {
    try {
      // Use the existing delivery reports endpoint
      const deliveryReports = await this.request('/notifications/delivery-reports/');
      
      // Transform the response to match expected format
      if (Array.isArray(deliveryReports)) {
        return {
          results: deliveryReports,
          count: deliveryReports.length,
          next: null,
          previous: null
        };
      }
      return deliveryReports;
    } catch (error) {
      console.warn('Delivery reports endpoint not available, returning empty data');
      return {
        results: [],
        count: 0,
        next: null,
        previous: null
      };
    }
  }

  // Get delivery statistics from multiple sources
  async getDeliveryStatistics(params = {}) {
    try {
      // Try to get statistics from various alert delivery statuses
      const alerts = await this.getAlerts({ status: 'active', page_size: 10 });
      
      // Aggregate statistics from recent alerts
      let totalDeliveries = 0;
      let totalSuccessful = 0;
      let byMethod = { sms: 0, push: 0, email: 0 };
      let byStatus = { pending: 0, sent: 0, delivered: 0, failed: 0, read: 0 };

      if (alerts.results) {
        for (const alert of alerts.results) {
          try {
            const deliveryStatus = await this.getAlertDeliveryStatus(alert.id);
            if (deliveryStatus.stats_by_method) {
              Object.entries(deliveryStatus.stats_by_method).forEach(([method, stats]) => {
                totalDeliveries += stats.total || 0;
                totalSuccessful += (stats.sent || 0) + (stats.delivered || 0);
                byMethod[method] = (byMethod[method] || 0) + (stats.total || 0);
                
                Object.entries(stats).forEach(([status, count]) => {
                  if (byStatus.hasOwnProperty(status)) {
                    byStatus[status] += count || 0;
                  }
                });
              });
            }
          } catch (error) {
            // Skip alerts that don't have delivery status
            console.warn(`Could not get delivery status for alert ${alert.id}`);
          }
        }
      }

      const successRate = totalDeliveries > 0 ? ((totalSuccessful / totalDeliveries) * 100).toFixed(1) : 0;

      return {
        total_deliveries: totalDeliveries,
        success_rate: parseFloat(successRate),
        by_method: byMethod,
        by_status: byStatus
      };
    } catch (error) {
      console.warn('Could not calculate delivery statistics, returning defaults');
      return {
        total_deliveries: 0,
        success_rate: 0,
        by_method: { sms: 0, push: 0, email: 0 },
        by_status: { pending: 0, sent: 0, delivered: 0, failed: 0, read: 0 }
      };
    }
  }

  // These methods are not available in the current backend, so we'll provide fallbacks
  async getAlertDelivery(id) {
    throw new ApiError('Alert delivery detail endpoint not implemented', 404);
  }

  async markDeliveryAsRead(deliveryId) {
    throw new ApiError('Mark delivery as read endpoint not implemented', 404);
  }

  async getAlertDeliveriesForAlert(alertId, params = {}) {
    // Use the alert delivery status endpoint instead
    try {
      const status = await this.getAlertDeliveryStatus(alertId);
      return {
        results: status.recent_deliveries || [],
        count: status.total_target_users || 0
      };
    } catch (error) {
      return { results: [], count: 0 };
    }
  }

  async getMyDeliveries(params = {}) {
    // This would need to be implemented in the backend
    return { results: [], count: 0 };
  }

  async getFailedDeliveries(params = {}) {
    try {
      const deliveries = await this.getAlertDeliveries(params);
      const failed = deliveries.results.filter(d => d.status === 'failed');
      return {
        results: failed,
        count: failed.length
      };
    } catch (error) {
      return { results: [], count: 0 };
    }
  }

  async getDeliveriesByMethod(method, params = {}) {
    try {
      const deliveries = await this.getAlertDeliveries(params);
      const filtered = deliveries.results.filter(d => d.delivery_method === method);
      return {
        results: filtered,
        count: filtered.length
      };
    } catch (error) {
      return { results: [], count: 0 };
    }
  }

  async bulkMarkDeliveriesAsRead(deliveryIds) {
    throw new ApiError('Bulk mark deliveries as read endpoint not implemented', 404);
  }

  async getDeliveryMetrics(timeframe = '24h') {
    // Return basic metrics for now
    return {
      timeframe,
      total_sent: 0,
      total_delivered: 0,
      total_failed: 0,
      success_rate: 0
    };
  }

  // -------- Utility Methods for Better UX --------
  async getDeliveryProgress(alertId) {
    try {
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
    } catch (error) {
      return { progress: 0, status: 'error' };
    }
  }

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

//   // -------- Safety Guides --------
//   async getSafetyGuides(params = {}) {
//     const query = new URLSearchParams(params).toString();
//     return this.request(`/safety-guides/${query ? `?${query}` : ''}`);
//   }

//   async getSafetyGuide(id) {
//     return this.request(`/safety-guides/${id}/`);
//   }

//   async getFeaturedSafetyGuides() {
//     return this.request('/safety-guides/featured/');
//   }

//   async getSafetyGuidesByDisaster(disasterTypeId) {
//     const params = new URLSearchParams({ disaster_type: disasterTypeId }).toString();
//     return this.request(`/safety-guides/by-disaster/?${params}`);
//   }

//   async getPublicSafetyTips(params = {}) {
//     const query = new URLSearchParams(params).toString();
//     return this.request(`/public/safety-tips/${query ? `?${query}` : ''}`, {
//       includeAuth: false,
//     });
//   }
// // Add to your API service
// async createSafetyGuide(guideData) {
//   return this.request('/safety-guides/', { method: 'POST', body: guideData });
// }

// async updateSafetyGuide(id, guideData) {
//   return this.request(`/safety-guides/${id}/`, { method: 'PATCH', body: guideData });
// }

// async deleteSafetyGuide(id) {
//   return this.request(`/safety-guides/${id}/`, { method: 'DELETE' });
// }

// async exportSafetyGuides(format = 'csv', filters = {}) {
//   const params = new URLSearchParams({ ...filters, export_format: format }).toString();
//   const res = await fetch(`${API_BASE_URL}/safety-guides/export/?${params}`, {
//     headers: this.getHeaders(),
//   });
//   if (!res.ok) throw new Error(`Export failed: ${res.statusText}`);
//   return await res.blob();
// }
// Add these methods to your existing ApiService class in api.jsx
// Replace the commented-out safety guides section with these complete methods:

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

// IMPORTANT: Replace your existing createSafetyGuide and updateSafetyGuide methods with these:
async createSafetyGuide(formData) {
  try {
    console.log('Creating safety guide...');
    
    // Check if it's FormData or regular object
    const isFormData = formData instanceof FormData;
    
    if (isFormData) {
      // For FormData uploads, use fetch directly without Content-Type header
      const headers = this.getHeaders();
      delete headers['Content-Type']; // Let browser set multipart/form-data
      
      const response = await fetch(`${API_BASE_URL}/safety-guides/`, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        // Create proper error message from Django validation errors
        let message = 'Validation failed';
        if (errorData && typeof errorData === 'object') {
          const errors = [];
          Object.entries(errorData).forEach(([field, fieldErrors]) => {
            if (Array.isArray(fieldErrors)) {
              errors.push(`${field}: ${fieldErrors.join(', ')}`);
            } else {
              errors.push(`${field}: ${fieldErrors}`);
            }
          });
          message = errors.join('; ');
        }
        
        throw new ApiError(message, response.status, errorData);
      }
      
      return await response.json();
    } else {
      // For regular JSON data
      return this.request('/safety-guides/', {
        method: 'POST',
        body: formData
      });
    }
  } catch (error) {
    console.error('Create safety guide error:', error);
    throw error;
  }
}

async updateSafetyGuide(id, formData) {
  try {
    console.log(`Updating safety guide ${id}...`);
    
    // Check if it's FormData or regular object
    const isFormData = formData instanceof FormData;
    
    if (isFormData) {
      // For FormData uploads, use fetch directly
      const headers = this.getHeaders();
      delete headers['Content-Type'];
      
      const response = await fetch(`${API_BASE_URL}/safety-guides/${id}/`, {
        method: 'PATCH',
        headers: headers,
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        
        let message = 'Update failed';
        if (errorData && typeof errorData === 'object') {
          const errors = [];
          Object.entries(errorData).forEach(([field, fieldErrors]) => {
            if (Array.isArray(fieldErrors)) {
              errors.push(`${field}: ${fieldErrors.join(', ')}`);
            } else {
              errors.push(`${field}: ${fieldErrors}`);
            }
          });
          message = errors.join('; ');
        }
        
        throw new ApiError(message, response.status, errorData);
      }
      
      return await response.json();
    } else {
      // For regular JSON updates
      return this.request(`/safety-guides/${id}/`, { 
        method: 'PATCH', 
        body: formData 
      });
    }
  } catch (error) {
    console.error('Update safety guide error:', error);
    throw error;
  }
}

async deleteSafetyGuide(id) {
  return this.request(`/safety-guides/${id}/`, { method: 'DELETE' });
}

// Safety Guide Statistics
async getSafetyGuideStats() {
  try {
    return await this.request('/safety-guides/stats/');
  } catch (error) {
    console.warn('Stats endpoint not available, generating fallback stats:', error.message);
    
    // If stats endpoint doesn't exist, generate stats from the main safety guides endpoint
    try {
      const response = await this.request('/safety-guides/?page_size=1000'); // Get all guides
      const guides = response.results || [];
      
      const stats = {
        total: response.count || guides.length,
        published: guides.filter(g => g.is_published).length,
        featured: guides.filter(g => g.is_featured).length,
        drafts: guides.filter(g => !g.is_published).length,
        by_category: guides.reduce((acc, guide) => {
          acc[guide.category] = (acc[guide.category] || 0) + 1;
          return acc;
        }, {}),
        by_audience: guides.reduce((acc, guide) => {
          acc[guide.target_audience] = (acc[guide.target_audience] || 0) + 1;
          return acc;
        }, {}),
        recent: guides.filter(g => {
          const createdDate = new Date(g.created_at);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return createdDate >= thirtyDaysAgo;
        }).length
      };
      
      return stats;
    } catch (fallbackError) {
      console.error('Failed to generate fallback stats:', fallbackError);
      // Return empty stats if everything fails
      return {
        total: 0,
        published: 0,
        featured: 0,
        drafts: 0,
        by_category: {},
        by_audience: {},
        recent: 0
      };
    }
  }
}

// Bulk Operations
async bulkUpdateSafetyGuides(ids, updateData) {
  try {
    return await this.request('/safety-guides/bulk_update/', {
      method: 'POST',
      body: {
        guide_ids: ids,
        update_data: updateData
      }
    });
  } catch (error) {
    console.error('Bulk update safety guides error:', error);
    // Fallback to individual updates
    const results = [];
    const errors = [];
    
    for (const id of ids) {
      try {
        await this.updateSafetyGuide(id, updateData);
        results.push({ id, success: true });
      } catch (err) {
        errors.push({ id, success: false, error: err.message });
      }
    }
    
    return {
      successful: results,
      failed: errors,
      totalProcessed: ids.length,
      successCount: results.length,
      failureCount: errors.length
    };
  }
}

async bulkDeleteSafetyGuides(ids) {
  try {
    const results = [];
    const errors = [];
    
    for (const id of ids) {
      try {
        await this.deleteSafetyGuide(id);
        results.push({ id, success: true });
      } catch (error) {
        errors.push({ id, success: false, error: error.message });
      }
    }
    
    return {
      successful: results,
      failed: errors,
      totalProcessed: ids.length,
      successCount: results.length,
      failureCount: errors.length
    };
  } catch (error) {
    console.error('Bulk delete safety guides error:', error);
    throw error;
  }
}

// Duplicate Safety Guide
async duplicateSafetyGuide(id) {
  try {
    console.log(`Duplicating safety guide ${id}...`);
    
    try {
      // Try the dedicated duplicate endpoint first
      return await this.request(`/safety-guides/${id}/duplicate/`, { method: 'POST' });
    } catch (duplicateError) {
      // Fallback to manual duplication
      console.log('Duplicate endpoint not available, creating manual copy...');
      
      const original = await this.getSafetyGuide(id);
      
      // Create a copy with modified title and reset certain fields
      const duplicateData = {
        title: `${original.title} (Copy)`,
        title_rw: original.title_rw ? `${original.title_rw} (Copy)` : '',
        title_fr: original.title_fr ? `${original.title_fr} (Copy)` : '',
        content: original.content,
        content_rw: original.content_rw || '',
        content_fr: original.content_fr || '',
        category: original.category,
        target_audience: original.target_audience,
        featured_image: original.featured_image || '',
        attachments: original.attachments || null,
        disaster_types: original.disaster_types || [],
        is_featured: false, // New copies shouldn't be featured by default
        is_published: false, // New copies should be drafts by default
        display_order: (original.display_order || 0) + 1
      };
      
      return await this.createSafetyGuide(duplicateData);
    }
  } catch (error) {
    console.error('Duplicate safety guide error:', error);
    throw error;
  }
}

// Export Safety Guides
async exportSafetyGuides(format = 'json', filters = {}) {
  try {
    const params = new URLSearchParams({ 
      ...filters, 
      export_format: format 
    }).toString();
    
    return await this.request(`/safety-guides/export/?${params}`);
  } catch (error) {
    console.error('Export safety guides error:', error);
    throw error;
  }
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

  async getDeliveryReports() {
    return this.request('/notifications/delivery-reports/');
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
    return this.getLocations(params);
  }

  async getSubscribers(params = {}) {
    return this.getUsers({ ...params, user_type: 'citizen' });
  }

  async getDevices(params = {}) {
    console.warn('getDevices is deprecated. Use user notification preferences instead.');
    return { results: [] };
  }

  async getCheckins(params = {}) {
    return this.getAlertResponses(params);
  }

  async getShelters(params = {}) {
    return this.getEmergencyContacts({ ...params, contact_type: 'shelter' });
  }

  async getMessageTemplates(params = {}) {
    return this.getNotificationTemplates(params);
  }

  async getProviderIntegrations() {
    console.warn('getProviderIntegrations is deprecated. Use system configuration instead.');
    return { results: [] };
  }

  async getAuditLogs(params = {}) {
    console.warn('getAuditLogs is not yet implemented in the new system.');
    return { results: [] };
  }
}

// singleton
const apiService = new ApiService();
export default apiService;
export { ApiError };