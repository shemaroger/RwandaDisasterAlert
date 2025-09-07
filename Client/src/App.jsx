// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard';
import CitizenDashboard from './pages/dashboard/CitizenDashboard';
import OperatorDashboard from './pages/dashboard/OperatorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Home from './pages/Home';

// // Alert Management pages
// import AlertManagement from './pages/alerts/AlertManagement';
// import CreateAlert from './pages/alerts/CreateAlert';
// import AlertDetails from './pages/alerts/AlertDetails';
// import AlertDistribution from './pages/alerts/AlertDistribution';
// import AlertAnalytics from './pages/alerts/AlertAnalytics';

// // Incident Management pages
// import IncidentManagement from './pages/incidents/IncidentManagement';
// import CreateIncident from './pages/incidents/CreateIncident';
// import IncidentDetails from './pages/incidents/IncidentDetails';
// import IncidentTracking from './pages/incidents/IncidentTracking';

// // Geographic Management pages
// import GeoZoneManagement from './pages/geography/GeoZoneManagement';
// import CreateGeoZone from './pages/geography/CreateGeoZone';
// import ZoneDetails from './pages/geography/ZoneDetails';

// // Subscriber Management pages
// import SubscriberManagement from './pages/subscribers/SubscriberManagement';
// import SubscriberDetails from './pages/subscribers/SubscriberDetails';
// import DeviceManagement from './pages/subscribers/DeviceManagement';

// // Shelter Management pages
// import ShelterManagement from './pages/shelters/ShelterManagement';
// import CreateShelter from './pages/shelters/CreateShelter';
// import ShelterDetails from './pages/shelters/ShelterDetails';
// import ShelterCapacity from './pages/shelters/ShelterCapacity';

// // Communication pages
// import ChannelConfiguration from './pages/communication/ChannelConfiguration';
// import MessageTemplates from './pages/communication/MessageTemplates';
// import DeliveryReports from './pages/communication/DeliveryReports';

// // Monitoring pages
// import LiveMonitoring from './pages/monitoring/LiveMonitoring';
// import SystemStatus from './pages/monitoring/SystemStatus';
// import WeatherMonitoring from './pages/monitoring/WeatherMonitoring';

// // Analytics & Reports pages
// import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
// import PerformanceReports from './pages/analytics/PerformanceReports';
// import ResponseMetrics from './pages/analytics/ResponseMetrics';

// // Admin pages
// import UserManagement from './pages/admin/UserManagement';
// import SystemSettings from './pages/admin/SystemSettings';
// import AuditLogs from './pages/admin/AuditLogs';
// import IntegrationSetup from './pages/admin/IntegrationSetup';
// import ProviderManagement from './pages/admin/ProviderManagement';

// // Profile & Settings pages
// import Profile from './pages/profile/Profile';
// import ProfileSettings from './pages/profile/ProfileSettings';
// import NotificationSettings from './pages/profile/NotificationSettings';

// // Safety & Emergency pages
import SafetyCheckin from './pages/safety/SafetyCheckin';
import EmergencyContacts from './pages/safety/EmergencyContacts';
import EmergencyGuide from './pages/safety/EmergencyGuide';

// Other pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Default route - redirect to dashboard or login */}
              <Route path="/" element={<Navigate to="/Dashboard" replace />} />

              {/* Public routes - no layout */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              
              {/* Public emergency information */}
              <Route path="/emergency-guide" element={<EmergencyGuide />} />
              <Route path="/emergency-contacts" element={<EmergencyContacts />} />

              {/* Main Dashboard - with role-based redirection */}
              {/* <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* ==================== CITIZEN ROUTES ==================== */}
              <Route
                path="/citizen/dashboard"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <Layout>
                      <CitizenDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
{/* 
              <Route
                path="/citizen/incidents"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <Layout>
                      <IncidentManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/citizen/incidents/new"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <Layout>
                      <CreateIncident />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/citizen/safety/checkin"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <Layout>
                      <SafetyCheckin />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/citizen/shelters"
                element={
                  <ProtectedRoute requiredRole="citizen">
                    <Layout>
                      <ShelterManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* ==================== OPERATOR ROUTES ==================== */}
              <Route
                path="/operator/dashboard"
                element={
                  <ProtectedRoute requiredRole="operator">
                    <Layout>
                      <OperatorDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Alert Management for Operators */}
              {/* <Route
                path="/alerts"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <AlertManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alerts/new"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <CreateAlert />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alerts/:id"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <AlertDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/alerts/distribution"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <AlertDistribution />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Incident Management for Operators */}
              {/* <Route
                path="/incidents"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <IncidentManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/incidents/:id"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <IncidentDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/incidents/tracking"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <IncidentTracking />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Monitoring Routes */}
              {/* <Route
                path="/monitoring"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <LiveMonitoring />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/monitoring/live"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <LiveMonitoring />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/monitoring/weather"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <WeatherMonitoring />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Geography Management */}
              {/* <Route
                path="/geozones"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <GeoZoneManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/geozones/new"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <CreateGeoZone />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/geozones/:id"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ZoneDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Subscriber Management */}
              {/* <Route
                path="/subscribers"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <SubscriberManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/subscribers/:id"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <SubscriberDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/devices"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <DeviceManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Shelter Management */}
              {/* <Route
                path="/shelters"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ShelterManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/shelters/new"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <CreateShelter />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/shelters/:id"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ShelterDetails />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/shelters/capacity"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ShelterCapacity />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Communication Management */}
              {/* <Route
                path="/channels"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ChannelConfiguration />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/templates"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <MessageTemplates />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/delivery-reports"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <DeliveryReports />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Analytics Routes */}
              {/* <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <AnalyticsDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics/performance"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <PerformanceReports />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics/response"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ResponseMetrics />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics/alerts"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <AlertAnalytics />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* ==================== ADMIN ROUTES ==================== */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
{/* 
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <SystemSettings />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <SystemSettings />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <AuditLogs />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <AuditLogs />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/integrations"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <IntegrationSetup />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/integrations"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <IntegrationSetup />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/providers"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <ProviderManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/providers"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <ProviderManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/system-status"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <SystemStatus />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/system-status"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Layout>
                      <SystemStatus />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* ==================== PROFILE & SETTINGS ROUTES ==================== */}
              {/* <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProfileSettings />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile/notifications"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <NotificationSettings />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* ==================== EMERGENCY & SAFETY ROUTES ==================== */}
              {/* <Route
                path="/safety/checkin"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <SafetyCheckin />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              <Route
                path="/emergency/contacts"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EmergencyContacts />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/emergency/guide"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <EmergencyGuide />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* ==================== ALTERNATIVE ROUTES FOR BETTER UX ==================== */}
              {/* Alternative Alert Routes */}
              {/* <Route
                path="/emergency/alerts"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <AlertManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/emergency/alerts/new"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <CreateAlert />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Alternative Incident Routes */}
              {/* <Route
                path="/emergency/incidents"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <IncidentManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/emergency/incidents/report"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateIncident />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Alternative Geography Routes */}
              {/* <Route
                path="/geography"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <GeoZoneManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/geography/zones"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <GeoZoneManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Alternative Communication Routes */}
              {/* <Route
                path="/communication"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ChannelConfiguration />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/communication/channels"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <ChannelConfiguration />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/communication/templates"
                element={
                  <ProtectedRoute requiredRoles={["operator", "admin"]}>
                    <Layout>
                      <MessageTemplates />
                    </Layout>
                  </ProtectedRoute>
                }
              /> */}

              {/* Unauthorized access */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Catch-all route for 404 - with layout for authenticated users */}
              <Route
                path="*"
                element={
                  <Layout>
                    <NotFound />
                  </Layout>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;