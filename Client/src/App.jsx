// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Dashboard pages
import CitizenDashboard from './pages/dashboard/CitizenDashboard';
import OperatorDashboard from './pages/dashboard/OperatorDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Home from './pages/Home';
import UserManagement from './pages/UserManagement';

// Safety & Emergency pages
import SafetyCheckin from './pages/safety/SafetyCheckin';
import EmergencyContacts from './pages/safety/EmergencyContacts';
import EmergencyGuide from './pages/safety/EmergencyGuide';

// Other pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import './App.css';

// Wrapper component to provide user context to UserManagement
function UserManagementWrapper() {
  const { user, logout } = useAuth();
  
  return <UserManagement user={user} onLogout={logout} />;
}

// Dashboard redirect component based on user role
function DashboardRedirect() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on user role
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'operator':
      return <Navigate to="/operator/dashboard" replace />;
    case 'citizen':
      return <Navigate to="/citizen/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Default route - redirect to dashboard */}
      <Route path="/" element={<Home />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        } 
      />

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

      {/* User Management Route - Fixed with proper protection */}
      <Route 
        path="/user/management" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <UserManagementWrapper />
            </Layout>
          </ProtectedRoute>
        } 
      />

      {/* Alternative User Management Route */}
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <UserManagementWrapper />
            </Layout>
          </ProtectedRoute>
        } 
      />

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

      {/* ==================== SHARED EMERGENCY & SAFETY ROUTES ==================== */}
      <Route
        path="/safety/checkin"
        element={
          <ProtectedRoute>
            <Layout>
              <SafetyCheckin />
            </Layout>
          </ProtectedRoute>
        }
      />

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

      {/* ==================== MULTI-ROLE ROUTES ==================== */}
      {/* These routes are accessible to both operators and admins */}
      
      {/* Alert Management Routes */}
      {/* 
      <Route
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
      */}

      {/* Incident Management Routes */}
      {/* 
      <Route
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
        path="/incidents/new"
        element={
          <ProtectedRoute>
            <Layout>
              <CreateIncident />
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
      */}

      {/* Monitoring Routes */}
      {/* 
      <Route
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
      />
      */}

      {/* Geography Management Routes */}
      {/* 
      <Route
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
      />
      */}

      {/* Subscriber Management Routes */}
      {/* 
      <Route
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
      />
      */}

      {/* Shelter Management Routes */}
      {/* 
      <Route
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
      />
      */}

      {/* Communication Management Routes */}
      {/* 
      <Route
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
      />
      */}

      {/* Analytics Routes */}
      {/* 
      <Route
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
      />
      */}

      {/* ==================== ADMIN-ONLY SYSTEM ROUTES ==================== */}
      
      {/* System Settings Routes */}
      {/* 
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
      */}

      {/* Audit & Logging Routes */}
      {/* 
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
      */}

      {/* Integration Management Routes */}
      {/* 
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
      */}

      {/* System Status Routes */}
      {/* 
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
      />
      */}

      {/* ==================== PROFILE & SETTINGS ROUTES ==================== */}
      {/* 
      <Route
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
      />
      */}

      {/* ==================== ALTERNATIVE/ALIAS ROUTES ==================== */}
      
      {/* Alternative Emergency Routes for better UX */}
      {/* 
      <Route
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
      />

      <Route
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
      />
      */}

      {/* Alternative Geography Routes */}
      
      <Route
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
      />
     

      {/* Alternative Communication Routes */}
      {/* 
      <Route
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
      />
      */}

      {/* ==================== ERROR ROUTES ==================== */}
      
      {/* Unauthorized access */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Catch-all route for 404 - with layout for authenticated users */}
      <Route
        path="*"
        element={
          <ProtectedRoute showUnauthorized={false}>
            <Layout>
              <NotFound />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;