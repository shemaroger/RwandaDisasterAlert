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

import GeoZoneManagement from './pages/admin/GeoZoneManagement';
import LocationManagement from './pages/admin/LocationManagement';

// Other pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import './App.css';

// Wrapper component to provide user context to UserManagement
function UserManagementWrapper() {
  const { user, logout } = useAuth();
  
  return <UserManagement user={user} onLogout={logout} />;
}

// Dashboard redirect component based on user_type
function DashboardRedirect() {
  const { user, loading, getRedirectPath } = useAuth();
  
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
  
  // Use the getRedirectPath function from AuthContext
  const redirectPath = getRedirectPath(user.user_type);
  return <Navigate to={redirectPath} replace />;
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
            <Layout>
              <DashboardRedirect />
            </Layout>
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

      {/* User Management Routes - Updated for RwandaDisasterAlert */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requiredUserType="admin">
            <Layout>
              <UserManagementWrapper />
            </Layout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requiredUserType="admin">
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
          <ProtectedRoute requiredUserType="citizen">
            <Layout>
              <CitizenDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/citizen/safety/checkin"
        element={
          <ProtectedRoute requiredUserType="citizen">
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
          <ProtectedRoute requiredUserType="operator">
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
          <ProtectedRoute requiredUserType="admin">
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

      {/* ==================== RWANDADISASTERALERT SPECIFIC ROUTES ==================== */}
      
      {/* Alert Management Routes - Admin and Authority */}
      <Route
        path="/alerts"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <Layout>
              <div>Alert Management Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts/create"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <Layout>
              <div>Create Alert Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Incident Management Routes - All user types can view, Admin/Authority/Operator can manage */}
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <Layout>
              <div>Incident Management Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/my-reports"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <Layout>
              <div>My Incident Reports Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Location Management Routes - Admin and Authority */}

<Route
  path="/locations"
  element={
    <ProtectedRoute>
      <Layout>
        <LocationManagement  />
      </Layout>
    </ProtectedRoute>
  }
/>



      {/* Emergency Contacts Routes - All users can view */}
      <Route
        path="/emergency-contacts"
        element={
          <ProtectedRoute>
            <Layout>
              <EmergencyContacts />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Safety Guides Routes - All users can view */}
      <Route
        path="/safety-guides"
        element={
          <ProtectedRoute>
            <Layout>
              <div>Safety Guides Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Alert Delivery Routes - Admin, Authority, Operator */}
      <Route
        path="/deliveries"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority", "operator"]}>
            <Layout>
              <div>Alert Delivery Management Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Analytics Routes - Admin, Authority, Operator */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority", "operator"]}>
            <Layout>
              <div>Analytics Dashboard Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Notification Templates Routes - Admin and Authority */}
      <Route
        path="/notification-templates"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <Layout>
              <div>Notification Templates Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Alert Response Routes - Citizens */}
      <Route
        path="/alerts/my-responses"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <Layout>
              <div>My Alert Responses Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts/respond"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <Layout>
              <SafetyCheckin />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== ADMIN-ONLY SYSTEM ROUTES ==================== */}
      
      {/* System Settings Routes */}
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredUserType="admin">
            <Layout>
              <div>System Settings Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredUserType="admin">
            <Layout>
              <div>System Settings Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* System Health Routes */}
      <Route
        path="/system/health"
        element={
          <ProtectedRoute requiredUserType="admin">
            <Layout>
              <div>System Health Monitoring Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== PROFILE & SETTINGS ROUTES ==================== */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <div>User Profile Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/preferences"
        element={
          <ProtectedRoute>
            <Layout>
              <div>Notification Preferences Coming Soon</div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ==================== LEGACY/ALIAS ROUTES ==================== */}
      
      {/* Geography Management - Legacy route support
      <Route
        path="/geography"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <Layout>
              <GeoZoneManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/geography/zones"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <Layout>
              <GeoZoneManagement />
            </Layout>
          </ProtectedRoute>
        }
      /> */}

      {/* Legacy user management route */}
      <Route 
        path="/user/management" 
        element={
          <ProtectedRoute requiredUserType="admin">
            <Layout>
              <UserManagementWrapper />
            </Layout>
          </ProtectedRoute>
        } 
      />

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