// services/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// For React Native, you'll set this in your environment config
const API_BASE_URL = 'http://localhost:8000/api'; // Update with your actual API URL

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;
    this.initToken();
  }

  // Initialize token from AsyncStorage
  private async initToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  // -------- Token helpers --------
  async setToken(token: string | null) {
    this.token = token || null;
    try {
      if (token) {
        await AsyncStorage.setItem('auth_token', token);
      } else {
        await AsyncStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      try {
        this.token = await AsyncStorage.getItem('auth_token');
      } catch (error) {
        console.error('Failed to get token:', error);
      }
    }
    return this.token;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // -------- Headers --------
  async getHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = await this.getToken();
      if (token) {
        headers.Authorization = `Token ${token}`;
      }
    }
    
    return headers;
  }

  // -------- Single, consolidated request --------
  async request(endpoint: string, options: any = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const includeAuth = options.includeAuth !== false;

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: await this.getHeaders(includeAuth),
    };

    // Body handling
    if (options.body instanceof FormData) {
      delete (config.headers as any)['Content-Type'];
      config.body = options.body;
    } else if (options.body !== undefined) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Token expired/invalid
      if (response.status === 401 && await this.getToken()) {
        await this.setToken(null);
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
  async register(userData: any) {
    const data = await this.request('/auth/register/', {
      method: 'POST',
      body: userData,
      includeAuth: false,
    });
    if (data?.token) await this.setToken(data.token);
    return data;
  }

  async login(username: string, password: string) {
    const data = await this.request('/auth/login/', {
      method: 'POST',
      body: { username, password },
      includeAuth: false,
    });
    if (data?.token) await this.setToken(data.token);
    return data;
  }

  async logout() {
    try {
      if (await this.getToken()) {
        await this.request('/auth/logout/', { method: 'POST' });
      }
    } catch (e) {
      console.warn('Backend logout failed:', e);
    } finally {
      await this.setToken(null);
    }
  }

  async logoutSync() {
    await this.setToken(null);
  }

  async getProfile() {
    return this.request('/auth/me/');
  }

  async updateProfile(profileData: any) {
    return this.request('/profile/', { method: 'PATCH', body: profileData });
  }

  async changePassword(passwordData: any) {
    return this.request('/auth/change-password/', { method: 'POST', body: passwordData });
  }

  async resetPassword(email: string) {
    return this.request('/auth/password-reset/', {
      method: 'POST',
      body: { email },
      includeAuth: false,
    });
  }

  async confirmPasswordReset(token: string, password: string) {
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

  async updateNotificationPreferences(preferences: any) {
    return this.request('/profile/preferences/', { method: 'PATCH', body: preferences });
  }

  // -------- Users --------
  async getUsers(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users/${query ? `?${query}` : ''}`);
  }

  async getUserById(id: string | number) {
    return this.request(`/users/${id}/`);
  }

  async createUser(userData: any) {
    return this.request('/users/', { method: 'POST', body: userData });
  }

  async updateUser(id: string | number, userData: any) {
    return this.request(`/users/${id}/`, { method: 'PATCH', body: userData });
  }

  async deleteUser(id: string | number) {
    return this.request(`/users/${id}/`, { method: 'DELETE' });
  }

  // -------- Locations (Rwanda Administrative Boundaries) --------
  async getLocations(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/locations/${query ? `?${query}` : ''}`);
  }

  async getLocation(id: string | number) {
    return this.request(`/locations/${id}/`);
  }

  async createLocation(payload: any) {
    return this.request('/locations/', { method: 'POST', body: payload });
  }

  async updateLocation(id: string | number, payload: any) {
    return this.request(`/locations/${id}/`, { method: 'PATCH', body: payload });
  }

  async deleteLocation(id: string | number) {
    return this.request(`/locations/${id}/`, { method: 'DELETE' });
  }

  // -------- Disaster Types --------
  async getDisasterTypes(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/disaster-types/${query ? `?${query}` : ''}`);
  }

  async getDisasterType(id: string | number) {
    return this.request(`/disaster-types/${id}/`);
  }

  async createDisasterType(data: any) {
    return this.request('/disaster-types/', { method: 'POST', body: data });
  }

  async updateDisasterType(id: string | number, data: any) {
    return this.request(`/disaster-types/${id}/`, { method: 'PATCH', body: data });
  }

  async deleteDisasterType(id: string | number, options: { hard?: boolean } = {}) {
    const suffix = options.hard ? '?hard=true' : '';
    return this.request(`/disaster-types/${id}/${suffix}`, { method: 'DELETE' });
  }

  async activateDisasterType(id: string | number) {
    return this.request(`/disaster-types/${id}/activate/`, { method: 'POST' });
  }

  async deactivateDisasterType(id: string | number) {
    return this.request(`/disaster-types/${id}/deactivate/`, { method: 'POST' });
  }

  // -------- Alerts --------
  async getAlerts(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/alerts/${query ? `?${query}` : ''}`);
  }

  async getAlert(id: string | number) {
    return this.request(`/alerts/${id}/`);
  }

  async createAlert(alertData: any) {
    return this.request('/alerts/', { method: 'POST', body: alertData });
  }

  async updateAlert(id: string | number, alertData: any) {
    return this.request(`/alerts/${id}/`, { method: 'PATCH', body: alertData });
  }

  async deleteAlert(id: string | number) {
    return this.request(`/alerts/${id}/`, { method: 'DELETE' });
  }

  async getActiveAlerts() {
    return this.request('/alerts/active/');
  }

  async activateAlert(id: string | number, options: any = { async: true }) {
    return this.request(`/alerts/${id}/activate/`, { 
      method: 'POST', 
      body: options 
    });
  }

  async respondToAlert(id: string | number, responseData: any) {
    return this.request(`/alerts/${id}/respond/`, { method: 'POST', body: responseData });
  }

  async getNearbyAlerts(radius: number = 50) {
    const params = new URLSearchParams({ radius: radius.toString() }).toString();
    return this.request(`/alerts/nearby/?${params}`);
  }

  async getMyAlertResponses() {
    return this.request('/alerts/my-responses/');
  }

  async bulkSendAlert(alertData: any) {
    return this.request('/alerts/bulk-send/', { method: 'POST', body: alertData });
  }

  async getAlertDeliveryStatus(alertId: string | number) {
    return this.request(`/alerts/${alertId}/delivery_status/`);
  }

  async resendFailedNotifications(alertId: string | number, options: any = {}) {
    return this.request(`/alerts/${alertId}/resend_notifications/`, { 
      method: 'POST',
      body: options 
    });
  }

  async cancelAlert(alertId: string | number) {
    return this.request(`/alerts/${alertId}/cancel/`, { method: 'POST' });
  }

  async getPublicActiveAlerts() {
    return this.request('/public/active-alerts/', { includeAuth: false });
  }

  // -------- Incidents --------
  async getIncidents(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/incidents/${query ? `?${query}` : ''}`);
  }

  async getIncident(id: string | number) {
    return this.request(`/incidents/${id}/`);
  }

  async createIncident(incidentData: any) {
    const formData = new FormData();
    Object.keys(incidentData || {}).forEach((key) => {
      const val = incidentData[key];
      if (val !== null && val !== undefined) {
        if (key === 'images' || key === 'videos') {
          if (Array.isArray(val)) {
            val.forEach((file: any, index: number) => {
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

  async updateIncident(id: string | number, incidentData: any) {
    return this.request(`/incidents/${id}/`, { method: 'PATCH', body: incidentData });
  }

  async deleteIncident(id: string | number) {
    return this.request(`/incidents/${id}/`, { method: 'DELETE' });
  }

  async assignIncident(id: string | number, assignedToId: string | number) {
    return this.request(`/incidents/${id}/assign/`, {
      method: 'POST',
      body: { assigned_to: assignedToId },
    });
  }

  async verifyIncident(id: string | number) {
    return this.request(`/incidents/${id}/verify/`, { method: 'POST' });
  }

  async resolveIncident(id: string | number, resolutionNotes: string = '') {
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
  async getEmergencyContacts(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/emergency-contacts/${query ? `?${query}` : ''}`);
  }

  async getEmergencyContact(id: string | number) {
    return this.request(`/emergency-contacts/${id}/`);
  }

  async getEmergencyContactsByLocation(locationId: string | number) {
    return this.request(`/emergency-contacts/by_location/?location_id=${locationId}`);
  }

  async getNearbyEmergencyContacts(latitude: number, longitude: number) {
    const params = new URLSearchParams({ 
      latitude: latitude.toString(), 
      longitude: longitude.toString() 
    }).toString();
    return this.request(`/emergency-contacts/nearby/?${params}`);
  }

  async getPublicEmergencyContacts(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/public/emergency-contacts/${query ? `?${query}` : ''}`, {
      includeAuth: false,
    });
  }

  // -------- Safety Guides --------
  async getSafetyGuides(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/safety-guides/${query ? `?${query}` : ''}`);
  }

  async getSafetyGuide(id: string | number) {
    return this.request(`/safety-guides/${id}/`);
  }

  async getFeaturedSafetyGuides() {
    return this.request('/safety-guides/featured/');
  }

  async getSafetyGuidesByDisaster(disasterTypeId: string | number) {
    const params = new URLSearchParams({ disaster_types: disasterTypeId.toString() }).toString();
    return this.request(`/safety-guides/?${params}`);
  }

  async getPublicSafetyTips(params: any = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/public/safety-tips/${query ? `?${query}` : ''}`, {
      includeAuth: false,
    });
  }

  async createSafetyGuide(formData: any) {
    try {
      const isFormData = formData instanceof FormData;
      
      if (isFormData) {
        const headers = await this.getHeaders();
        delete headers['Content-Type'];
        
        const response = await fetch(`${this.baseUrl}/safety-guides/`, {
          method: 'POST',
          headers: headers,
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText || 'Failed to create safety guide' };
          }
          
          let message = 'Validation failed';
          if (errorData && typeof errorData === 'object') {
            const errors: string[] = [];
            Object.entries(errorData).forEach(([field, fieldErrors]) => {
              if (Array.isArray(fieldErrors)) {
                errors.push(`${field}: ${fieldErrors.join(', ')}`);
              } else {
                errors.push(`${field}: ${fieldErrors}`);
              }
            });
            if (errors.length > 0) {
              message = errors.join('; ');
            }
          }
          
          const error: any = new Error(message);
          error.response = { status: response.status, data: errorData };
          throw error;
        }
        
        return await response.json();
      } else {
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

  async updateSafetyGuide(id: string | number, formData: any) {
    try {
      const isFormData = formData instanceof FormData;
      
      if (isFormData) {
        const headers = await this.getHeaders();
        delete headers['Content-Type'];
        
        const response = await fetch(`${this.baseUrl}/safety-guides/${id}/`, {
          method: 'PATCH',
          headers: headers,
          body: formData
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { message: errorText || 'Failed to update safety guide' };
          }
          
          let message = 'Update failed';
          if (errorData && typeof errorData === 'object') {
            const errors: string[] = [];
            Object.entries(errorData).forEach(([field, fieldErrors]) => {
              if (Array.isArray(fieldErrors)) {
                errors.push(`${field}: ${fieldErrors.join(', ')}`);
              } else {
                errors.push(`${field}: ${fieldErrors}`);
              }
            });
            if (errors.length > 0) {
              message = errors.join('; ');
            }
          }
          
          const error: any = new Error(message);
          error.response = { status: response.status, data: errorData };
          throw error;
        }
        
        return await response.json();
      } else {
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

  async deleteSafetyGuide(id: string | number) {
    return this.request(`/safety-guides/${id}/`, { method: 'DELETE' });
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

  // -------- System Health --------
  async getSystemHealth() {
    return this.request('/system/health/');
  }

  async healthCheck(): Promise<boolean> {
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
}

// Singleton instance
const apiService = new ApiService();
export default apiService;
export { ApiError };