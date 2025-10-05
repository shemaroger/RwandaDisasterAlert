// src/services/api.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as SecureStore from "expo-secure-store";

const DEFAULT_BASE = "http://192.168.8.107:8000/api"; // Your actual IP
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL as string) || DEFAULT_BASE;

// ==================== TYPES ====================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role?: "admin" | "operator" | "authority" | "citizen";
  is_active?: boolean;
  location?: number;
}

export interface Location {
  id: number;
  name: string;
  name_rw?: string;
  name_fr?: string;
  type: "province" | "district" | "sector" | "cell" | "village";
  parent?: number;
  latitude?: number;
  longitude?: number;
}

export interface DisasterType {
  id: number;
  name: string;
  name_rw?: string;
  name_fr?: string;
  description?: string;
  severity_levels?: string[];
  is_active?: boolean;
}

export interface Alert {
  id: number;
  title: string;
  message: string;
  disaster_type: number;
  severity: "low" | "medium" | "high" | "critical";
  status: "draft" | "active" | "expired" | "cancelled";
  affected_locations: number[];
  created_by?: number;
  created_at?: string;
  expires_at?: string;
}

export interface Incident {
  id: number;
  title: string;
  description: string;
  disaster_type: number;
  severity: "low" | "medium" | "high" | "critical";
  status: "reported" | "verified" | "in_progress" | "resolved";
  location: number;
  latitude?: number;
  longitude?: number;
  reported_by?: number;
  created_at?: string;
}

export interface EmergencyContact {
  id: number;
  name: string;
  phone_number: string;
  contact_type: string;
  location?: number;
  is_active?: boolean;
}

export interface SafetyGuide {
  id: number;
  title: string;
  title_rw?: string;
  title_fr?: string;
  content: string;
  content_rw?: string;
  content_fr?: string;
  category: string;
  target_audience: string;
  disaster_types?: number[];
  is_featured?: boolean;
  is_published?: boolean;
  attachment_count?: number;
  created_at?: string;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  content: string;
  template_type: string;
  variables?: Record<string, string>;
}

export interface ApiResponse<T> {
  results: T[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface PaginationParams {
  page?: number;
  page_size?: number;
  [key: string]: any;
}

// ==================== API ERROR ====================

export class ApiError extends Error {
  status: number;
  data: any | null;

  constructor(message: string, status: number, data: any = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// ==================== API SERVICE ====================

class ApiService {
  baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // -------- Token helpers (SecureStore) --------
  async setToken(token: string | null): Promise<void> {
    if (token) {
      await SecureStore.setItemAsync("auth_token", token);
    } else {
      await SecureStore.deleteItemAsync("auth_token");
    }
  }

  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync("auth_token");
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }

  // -------- Headers --------
  async getHeaders(includeAuth = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    
    if (includeAuth) {
      const token = await this.getToken();
      if (token) {
        // Preserve token prefix if already present
        headers.Authorization = token.startsWith("Bearer ") || token.startsWith("Token ")
          ? token
          : `Token ${token}`;
      }
    }
    return headers;
  }

  // -------- Helper: full URL --------
  url(endpoint: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}${endpoint}`;
  }

  // -------- Single, consolidated request --------
  async request<T = any>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      includeAuth?: boolean;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const url = this.url(endpoint);
    const includeAuth = options.includeAuth !== false;
    const method = options.method || "GET";
    const timeout = options.timeout || 15000; // 15 second default timeout

    const isFormData = options.body instanceof FormData;
    const headers = await this.getHeaders(includeAuth);

    if (isFormData) {
      delete headers["Content-Type"];
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (options.body !== undefined) {
      if (isFormData) {
        config.body = options.body;
      } else if (typeof options.body === "string") {
        config.body = options.body;
      } else {
        config.body = JSON.stringify(options.body);
      }
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      // Token expired/invalid
      if (response.status === 401 && (await this.getToken())) {
        await this.setToken(null);
        throw new ApiError("Unauthorized", 401, null);
      }

      if (response.status === 204) return null as T;

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      if (!response.ok) {
        let errorData: any = null;
        let message = `HTTP ${response.status}`;
        
        try {
          if (isJson) {
            errorData = await response.json();
            message = errorData?.detail ||
              errorData?.message ||
              (typeof errorData === "object"
                ? Object.values(errorData).flat().join(", ")
                : message);
          } else {
            message = (await response.text()) || message;
          }
        } catch {
          // ignore parse errors
        }
        
        throw new ApiError(message, response.status, errorData);
      }

      return isJson ? await response.json() : (await response.text() as any);
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      
      // Handle abort/timeout
      if (err.name === 'AbortError') {
        throw new ApiError("Request timeout - please check your connection", 408, null);
      }
      
      // Handle network errors
      throw new ApiError(err?.message || "Network error - please check your connection", 0, null);
    }
  }

  // ==================== AUTH ====================

  async register(userData: Partial<User> & { password: string }) {
    const data = await this.request("/auth/register/", {
      method: "POST",
      body: userData,
      includeAuth: false,
    });
    if (data?.token) await this.setToken(data.token);
    return data;
  }

  async login(username: string, password: string) {
    const data = await this.request("/auth/login/", {
      method: "POST",
      body: { username, password },
      includeAuth: false,
    });
    
    // Support multiple token formats
    if (data?.token) {
      await this.setToken(data.token);
    } else if (data?.access) {
      await this.setToken(`Bearer ${data.access}`);
    } else if (data?.key) {
      await this.setToken(`Token ${data.key}`);
    }
    
    return data;
  }

  async logout(): Promise<void> {
    try {
      if (await this.isAuthenticated()) {
        await this.request("/auth/logout/", { method: "POST" });
      }
    } catch (e) {
      console.warn("Backend logout failed:", e);
    } finally {
      await this.setToken(null);
    }
  }

  async logoutSync(): Promise<void> {
    return this.setToken(null);
  }

  async getProfile(): Promise<User> {
    return this.request<User>("/auth/me/");
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    return this.request<User>("/profile/", { method: "PATCH", body: profileData });
  }

  async changePassword(passwordData: { old_password: string; new_password: string }): Promise<void> {
    return this.request("/auth/change-password/", { method: "POST", body: passwordData });
  }

  async resetPassword(email: string): Promise<void> {
    return this.request("/auth/password-reset/", {
      method: "POST",
      body: { email },
      includeAuth: false,
    });
  }

  async confirmPasswordReset(token: string, password: string): Promise<void> {
    return this.request("/auth/password-reset-confirm/", {
      method: "POST",
      body: { token, password },
      includeAuth: false,
    });
  }

  async getNotificationPreferences() {
    return this.request("/profile/preferences/");
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request("/profile/preferences/", { method: "PATCH", body: preferences });
  }

  // ==================== USERS ====================

  async getUsers(params: PaginationParams = {}): Promise<ApiResponse<User>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<User>>(`/users/${query ? `?${query}` : ""}`);
  }

  async getUserById(id: number): Promise<User> {
    return this.request<User>(`/users/${id}/`);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.request<User>("/users/", { method: "POST", body: userData });
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}/`, { method: "PATCH", body: userData });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request(`/users/${id}/`, { method: "DELETE" });
  }

  // ==================== LOCATIONS ====================

  async getLocations(params: PaginationParams = {}): Promise<ApiResponse<Location>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<Location>>(`/locations/${query ? `?${query}` : ""}`);
  }

  async getLocation(id: number): Promise<Location> {
    return this.request<Location>(`/locations/${id}/`);
  }

  async createLocation(payload: Partial<Location>): Promise<Location> {
    return this.request<Location>("/locations/", { method: "POST", body: payload });
  }

  async updateLocation(id: number, payload: Partial<Location>): Promise<Location> {
    return this.request<Location>(`/locations/${id}/`, { method: "PATCH", body: payload });
  }

  async deleteLocation(id: number): Promise<void> {
    return this.request(`/locations/${id}/`, { method: "DELETE" });
  }

  // ==================== DISASTER TYPES ====================

  async getDisasterTypes(params: PaginationParams = {}): Promise<ApiResponse<DisasterType>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<DisasterType>>(`/disaster-types/${query ? `?${query}` : ""}`);
  }

  async getDisasterType(id: number): Promise<DisasterType> {
    return this.request<DisasterType>(`/disaster-types/${id}/`);
  }

  async createDisasterType(data: Partial<DisasterType>): Promise<DisasterType> {
    return this.request<DisasterType>("/disaster-types/", { method: "POST", body: data });
  }

  async updateDisasterType(id: number, data: Partial<DisasterType>): Promise<DisasterType> {
    return this.request<DisasterType>(`/disaster-types/${id}/`, { method: "PATCH", body: data });
  }

  async deleteDisasterType(id: number, options: { hard?: boolean } = {}): Promise<void> {
    const suffix = options.hard ? "?hard=true" : "";
    return this.request(`/disaster-types/${id}/${suffix}`, { method: "DELETE" });
  }

  async activateDisasterType(id: number): Promise<DisasterType> {
    return this.request<DisasterType>(`/disaster-types/${id}/activate/`, { method: "POST" });
  }

  async deactivateDisasterType(id: number): Promise<DisasterType> {
    return this.request<DisasterType>(`/disaster-types/${id}/deactivate/`, { method: "POST" });
  }

  // ==================== ALERTS ====================

  async getAlerts(params: PaginationParams = {}): Promise<ApiResponse<Alert>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<Alert>>(`/alerts/${query ? `?${query}` : ""}`);
  }

  async getAlert(id: string | number): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/`);
  }

  async createAlert(alertData: Partial<Alert>): Promise<Alert> {
    return this.request<Alert>("/alerts/", { method: "POST", body: alertData });
  }

  async updateAlert(id: number, alertData: Partial<Alert>): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/`, { method: "PATCH", body: alertData });
  }

  async deleteAlert(id: number): Promise<void> {
    return this.request(`/alerts/${id}/`, { method: "DELETE" });
  }

  async getActiveAlerts(): Promise<Alert[]> {
    return this.request<Alert[]>("/alerts/active/");
  }

  async activateAlert(id: number, options = { async: true }): Promise<Alert> {
    return this.request<Alert>(`/alerts/${id}/activate/`, {
      method: "POST",
      body: options,
    });
  }

  async respondToAlert(id: number, responseData: any): Promise<any> {
    return this.request(`/alerts/${id}/respond/`, { method: "POST", body: responseData });
  }

  async getNearbyAlerts(radius = 50): Promise<Alert[]> {
    const params = new URLSearchParams({ radius: radius.toString() }).toString();
    return this.request<Alert[]>(`/alerts/nearby/?${params}`);
  }

  async getMyAlertResponses(): Promise<any[]> {
    return this.request<any[]>("/alerts/my-responses/");
  }

  async bulkSendAlert(alertData: any): Promise<any> {
    return this.request("/alerts/bulk-send/", { method: "POST", body: alertData });
  }

  async getAlertDeliveryStatus(alertId: number): Promise<any> {
    return this.request(`/alerts/${alertId}/delivery_status/`);
  }

  async resendFailedNotifications(alertId: number, options = {}): Promise<any> {
    return this.request(`/alerts/${alertId}/resend_notifications/`, {
      method: "POST",
      body: options,
    });
  }

  async cancelAlert(alertId: number): Promise<void> {
    return this.request(`/alerts/${alertId}/cancel/`, { method: "POST" });
  }

  async getPublicActiveAlerts(): Promise<Alert[]> {
    return this.request<Alert[]>("/public/active-alerts/", { includeAuth: false });
  }

  // ==================== INCIDENTS ====================

  async getIncidents(params: PaginationParams = {}): Promise<ApiResponse<Incident>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<Incident>>(`/incidents/${query ? `?${query}` : ""}`);
  }

  async getIncident(id: number): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/`);
  }

  async createIncident(incidentData: Record<string, any>): Promise<Incident> {
    const formData = new FormData();

    Object.keys(incidentData || {}).forEach((key) => {
      const val = incidentData[key];
      if (val === undefined || val === null) return;

      if (key === "images" || key === "videos") {
        if (Array.isArray(val)) {
          val.forEach((file: any, idx: number) => {
            // RN file format: { uri, name, type }
            formData.append(`${key}[${idx}]`, {
              uri: file.uri,
              name: file.name || `file-${Date.now()}-${idx}`,
              type: file.type || "application/octet-stream",
            } as any);
          });
        }
      } else {
        formData.append(key, String(val));
      }
    });

    return this.request<Incident>("/incidents/", { method: "POST", body: formData });
  }

  async updateIncident(id: number, incidentData: Partial<Incident>): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/`, { method: "PATCH", body: incidentData });
  }

  async deleteIncident(id: number): Promise<void> {
    return this.request(`/incidents/${id}/`, { method: "DELETE" });
  }

  async assignIncident(id: number, assignedToId: number): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/assign/`, {
      method: "POST",
      body: { assigned_to: assignedToId },
    });
  }

  async verifyIncident(id: number): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/verify/`, { method: "POST" });
  }

  async resolveIncident(id: number, resolutionNotes = ""): Promise<Incident> {
    return this.request<Incident>(`/incidents/${id}/resolve/`, {
      method: "POST",
      body: { resolution_notes: resolutionNotes },
    });
  }

  async getMyIncidentReports(): Promise<Incident[]> {
    return this.request<Incident[]>("/incidents/my-reports/");
  }

  async getAssignedIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>("/incidents/assigned-to-me/");
  }

  async getPriorityIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>("/incidents/priority/");
  }

  // ==================== EMERGENCY CONTACTS ====================

  async getEmergencyContacts(params: PaginationParams = {}): Promise<ApiResponse<EmergencyContact>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<EmergencyContact>>(`/emergency-contacts/${query ? `?${query}` : ""}`);
  }

  async getEmergencyContact(id: number): Promise<EmergencyContact> {
    return this.request<EmergencyContact>(`/emergency-contacts/${id}/`);
  }

  async getEmergencyContactsByLocation(locationId: number): Promise<EmergencyContact[]> {
    return this.request<EmergencyContact[]>(`/emergency-contacts/by_location/?location_id=${locationId}`);
  }

  async getNearbyEmergencyContacts(latitude: number, longitude: number): Promise<EmergencyContact[]> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    }).toString();
    return this.request<EmergencyContact[]>(`/emergency-contacts/nearby/?${params}`);
  }

  async getPublicEmergencyContacts(params: PaginationParams = {}): Promise<ApiResponse<EmergencyContact>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<EmergencyContact>>(
      `/public/emergency-contacts/${query ? `?${query}` : ""}`,
      { includeAuth: false }
    );
  }

  // ==================== SAFETY GUIDES ====================

  async getSafetyGuides(params: PaginationParams = {}): Promise<ApiResponse<SafetyGuide>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<SafetyGuide>>(`/safety-guides/${query ? `?${query}` : ""}`);
  }

  async getSafetyGuide(id: number): Promise<SafetyGuide> {
    return this.request<SafetyGuide>(`/safety-guides/${id}/`);
  }

  async getFeaturedSafetyGuides(): Promise<SafetyGuide[]> {
    return this.request<SafetyGuide[]>("/safety-guides/featured/");
  }

  async getSafetyGuidesByDisaster(disasterTypeId: number): Promise<ApiResponse<SafetyGuide>> {
    const params = new URLSearchParams({ disaster_types: disasterTypeId.toString() }).toString();
    return this.request<ApiResponse<SafetyGuide>>(`/safety-guides/?${params}`);
  }

  async getPublicSafetyTips(params: PaginationParams = {}): Promise<any> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/public/safety-tips/${query ? `?${query}` : ""}`, {
      includeAuth: false,
    });
  }

  async createSafetyGuide(formData: FormData | Partial<SafetyGuide>): Promise<SafetyGuide> {
    const isFormData = formData instanceof FormData;

    if (isFormData) {
      const headers = await this.getHeaders();
      delete headers["Content-Type"];

      const response = await fetch(this.url("/safety-guides/"), {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Failed to create safety guide" };
        }

        throw new ApiError(
          this.formatValidationError(errorData),
          response.status,
          errorData
        );
      }

      return await response.json();
    } else {
      return this.request<SafetyGuide>("/safety-guides/", {
        method: "POST",
        body: formData,
      });
    }
  }

  async updateSafetyGuide(id: number, formData: FormData | Partial<SafetyGuide>): Promise<SafetyGuide> {
    const isFormData = formData instanceof FormData;

    if (isFormData) {
      const headers = await this.getHeaders();
      delete headers["Content-Type"];

      const response = await fetch(this.url(`/safety-guides/${id}/`), {
        method: "PATCH",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Failed to update safety guide" };
        }

        throw new ApiError(
          this.formatValidationError(errorData),
          response.status,
          errorData
        );
      }

      return await response.json();
    } else {
      return this.request<SafetyGuide>(`/safety-guides/${id}/`, {
        method: "PATCH",
        body: formData,
      });
    }
  }

  async deleteSafetyGuide(id: number): Promise<void> {
    return this.request(`/safety-guides/${id}/`, { method: "DELETE" });
  }

  async duplicateSafetyGuide(id: number): Promise<SafetyGuide> {
    try {
      return await this.request<SafetyGuide>(`/safety-guides/${id}/duplicate/`, { method: "POST" });
    } catch (duplicateError) {
      // Fallback: manual duplication
      console.log("Duplicate endpoint not available, creating manual copy...");

      const original = await this.getSafetyGuide(id);
      const duplicateData = {
        title: `${original.title} (Copy)`,
        title_rw: original.title_rw ? `${original.title_rw} (Copy)` : "",
        title_fr: original.title_fr ? `${original.title_fr} (Copy)` : "",
        content: original.content,
        content_rw: original.content_rw || "",
        content_fr: original.content_fr || "",
        category: original.category,
        target_audience: original.target_audience,
        disaster_types: original.disaster_types || [],
        is_featured: false,
        is_published: false,
      };

      return await this.createSafetyGuide(duplicateData);
    }
  }

  async getSafetyGuideStats(): Promise<any> {
    try {
      return await this.request("/safety-guides/stats/");
    } catch (error) {
      console.warn("Stats endpoint not available, generating fallback stats");

      try {
        const response = await this.request<ApiResponse<SafetyGuide>>("/safety-guides/?page_size=1000");
        const guides = response.results || [];

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return {
          total: response.count || guides.length,
          published: guides.filter((g) => g.is_published).length,
          featured: guides.filter((g) => g.is_featured).length,
          drafts: guides.filter((g) => !g.is_published).length,
          recent: guides.filter((g) => {
            const createdDate = new Date(g.created_at || "");
            return createdDate >= thirtyDaysAgo;
          }).length,
          total_attachments: guides.reduce((sum, g) => sum + (g.attachment_count || 0), 0),
        };
      } catch (fallbackError) {
        return {
          total: 0,
          published: 0,
          featured: 0,
          drafts: 0,
          recent: 0,
          total_attachments: 0,
        };
      }
    }
  }

  // ==================== NOTIFICATION TEMPLATES ====================

  async getNotificationTemplates(params: PaginationParams = {}): Promise<ApiResponse<NotificationTemplate>> {
    const query = new URLSearchParams(params as any).toString();
    return this.request<ApiResponse<NotificationTemplate>>(`/notification-templates/${query ? `?${query}` : ""}`);
  }

  async getNotificationTemplate(id: number): Promise<NotificationTemplate> {
    return this.request<NotificationTemplate>(`/notification-templates/${id}/`);
  }

  async createNotificationTemplate(templateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    return this.request<NotificationTemplate>("/notification-templates/", { method: "POST", body: templateData });
  }

  async updateNotificationTemplate(id: number, templateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    return this.request<NotificationTemplate>(`/notification-templates/${id}/`, { method: "PATCH", body: templateData });
  }

  async deleteNotificationTemplate(id: number): Promise<void> {
    return this.request(`/notification-templates/${id}/`, { method: "DELETE" });
  }

  // ==================== DASHBOARD ====================

  async getDashboard(): Promise<any> {
    return this.request("/dashboard/");
  }

  async getDashboardStats(): Promise<any> {
    return this.request("/dashboard/stats/");
  }

  async getRecentAlerts(): Promise<Alert[]> {
    return this.request<Alert[]>("/dashboard/recent-alerts/");
  }

  async getRecentIncidents(): Promise<Incident[]> {
    return this.request<Incident[]>("/dashboard/recent-incidents/");
  }

  // ==================== NOTIFICATIONS ====================

  async sendTestNotification(recipientId: number, message: string): Promise<any> {
    return this.request("/notifications/send-test/", {
      method: "POST",
      body: { recipient_id: recipientId, message },
    });
  }

  async getDeliveryReports(): Promise<any[]> {
    return this.request<any[]>("/notifications/delivery-reports/");
  }

  // ==================== SYSTEM & MONITORING ====================

  async getSystemHealth(): Promise<any> {
    return this.request("/system/health/");
  }

  async getSystemMetrics(): Promise<any> {
    return this.request("/system/metrics/");
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(this.url("/system/health/"), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      return res.ok;
    } catch (e) {
      console.error("Health check failed:", e);
      return false;
    }
  }

  // ==================== MOBILE APP SUPPORT ====================

  async getMobileAppConfig(): Promise<any> {
    return this.request("/mobile/app-config/", { includeAuth: false });
  }

  async checkForceUpdate(version: string, platform = "android"): Promise<any> {
    const params = new URLSearchParams({ version, platform }).toString();
    return this.request(`/mobile/force-update-check/?${params}`, { includeAuth: false });
  }

  // ==================== UTILITY METHODS ====================

  private formatValidationError(errorData: any): string {
    if (errorData && typeof errorData === "object") {
      const errors: string[] = [];
      Object.entries(errorData).forEach(([field, fieldErrors]) => {
        if (Array.isArray(fieldErrors)) {
          errors.push(`${field}: ${fieldErrors.join(", ")}`);
        } else {
          errors.push(`${field}: ${fieldErrors}`);
        }
      });
      return errors.length > 0 ? errors.join("; ") : "Validation failed";
    }
    return "Validation failed";
  }
}

// Singleton instance
const apiService = new ApiService();
export default apiService;
export { ApiService };