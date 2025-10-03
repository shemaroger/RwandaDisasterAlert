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

import LocationManagement from './pages/admin/LocationManagement';
import DisasterTypes from './pages/admin/DisasterTypes';
import AlertsManagement from './pages/admin/AlertsManagement';
import { CreateAlert } from './pages/admin/CreateAlert';
import { EditAlert } from './pages/admin/EditAlert';
import IncidentsManagement from './pages/citizen/IncidentsManagement';
import CitizenIncidentReport from './pages/citizen/CitizenIncidentReport';
import IncidentListPage from './pages/citizen/IncidentListPage';
import IncidentDetailPage from './pages/citizen/IncidentDetailPage';
import IncidentEditPage from './pages/citizen/IncidentEditPage';
import IncidentExportPage from './pages/citizen/IncidentExportPage';
import SafetyGuideManagement from './pages/admin/SafetyGuideManagement';
import SafetyGuideList from './pages/admin/SafetyGuideList';
import CreateSafetyGuide from './pages/admin/CreateSafetyGuide';
import EditSafetyGuide from './pages/admin/EditSafetyGuide';
import ViewSafetyGuide from './pages/admin/ViewSafetyGuide';
import AlertDeliveries from './pages/admin/AlertDeliveries';
import ActiveAlerts from './pages/citizen/ActiveAlerts';
import DisasterAnalyticsReport from './pages/admin/DisasterAnalyticsReport';
import CitizenReportPage from './pages/citizen/CitizenReportPage';

import PublicSafetyGuides from './pages/citizen/PublicSafetyGuides';
import PublicSafetyGuideDetail from './pages/citizen/PublicSafetyGuideDetail';

import ChatListPage from './pages/Chat/ChatListPage';
import ChatConversationPage from './pages/Chat/ChatConversationPage';
import StartNewChatPage from './pages/Chat/StartNewChatPage';

// Other pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import './App.css';

// Layout wrapper component that provides user context and notifications
function AppLayout({ children }) {
  const { user, logout } = useAuth();
  
  // Mock notifications - replace with your actual notification service
  const notifications = [];
  
  // Mock handlers - replace with your actual implementations
  const handlePageChange = (page) => {
    console.log('Page changed to:', page);
  };
  
  const handleLanguageChange = (language) => {
    console.log('Language changed to:', language);
  };
  
  const handleEmergencyAlert = () => {
    console.log('Emergency alert triggered');
  };
  
  const handleQuickAction = (actionType) => {
    console.log('Quick action:', actionType);
  };
  
  return (
    <Layout
      user={user}
      notifications={notifications}
      onPageChange={handlePageChange}
      onLogout={logout}
      onLanguageChange={handleLanguageChange}
      onEmergencyAlert={handleEmergencyAlert}
      onQuickAction={handleQuickAction}
    >
      {children}
    </Layout>
  );
}

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
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  // Use the getRedirectPath function from AuthContext
  const redirectPath = getRedirectPath(user.user_type);
  return <Navigate to={redirectPath} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Default route - redirect to dashboard */}
      <Route path="/" element={<Login />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <DashboardRedirect />
            </AppLayout>
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

      {/* User Management Routes */}
      <Route 
        path="/users" 
        element={
          <ProtectedRoute requiredUserType="admin">
            <AppLayout>
              <UserManagementWrapper />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requiredUserType="admin">
            <AppLayout>
              <UserManagementWrapper />
            </AppLayout>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/disaster-types" 
        element={
          <ProtectedRoute>
            <AppLayout>
              <DisasterTypes />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/alerts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <AlertsManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/alerts/create"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateAlert />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/alerts/edit/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditAlert />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== CITIZEN ROUTES ==================== */}
      <Route
        path="/citizen/dashboard"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <CitizenDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/citizen/safety/checkin"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <SafetyCheckin />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== OPERATOR ROUTES ==================== */}
      <Route
        path="/operator/dashboard"
        element={
          <ProtectedRoute requiredUserType="operator">
            <AppLayout>
              <OperatorDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== ADMIN ROUTES ==================== */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredUserType="admin">
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== SHARED EMERGENCY & SAFETY ROUTES ==================== */}
      <Route
        path="/safety/checkin"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SafetyCheckin />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/emergency/contacts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EmergencyContacts />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/emergency/guide"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EmergencyGuide />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== RWANDADISASTERALERT SPECIFIC ROUTES ==================== */}
      
      <Route
        path="/alerts"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <AppLayout>
              <div>Alert Management Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts/create"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <AppLayout>
              <div>Create Alert Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Incident Management Routes */}
      <Route
        path="/incidents"
        element={
          <ProtectedRoute>
            <AppLayout>
              <IncidentsManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/citizen/reports"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <CitizenIncidentReport />
            </AppLayout>
          </ProtectedRoute>
        }
      />
<Route
  path="/citizen/my-report"
  element={
    <ProtectedRoute requiredUserType="citizen">
      <AppLayout>
        <CitizenReportPage />
      </AppLayout>
    </ProtectedRoute>
  }
/>
      <Route
        path="/incidents/citizen/my-reports"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <IncidentListPage citizenView={true} />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/citizen/:id/view"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <IncidentDetailPage citizenView={true} />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/citizen/:id/edit"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <IncidentEditPage citizenView={true} />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/admin/list"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "operator", "authority"]}>
            <AppLayout>
              <IncidentListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/admin/:id/view"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "operator", "authority"]}>
            <AppLayout>
              <IncidentDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/admin/:id/edit"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "operator", "authority"]}>
            <AppLayout>
              <IncidentEditPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/export"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "operator"]}>
            <AppLayout>
              <IncidentExportPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/report-incident"
        element={
          <AppLayout>
            <CitizenIncidentReport />
          </AppLayout>
        }
      />

      <Route
        path="/locations"
        element={
          <ProtectedRoute>
            <AppLayout>
              <LocationManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/emergency-contacts"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EmergencyContacts />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Safety Guide Admin Routes */}
      <Route
        path="/safety-guides"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SafetyGuideList />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/safety-guides/admin/create"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CreateSafetyGuide />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/safety-guides/admin/:id/edit"
        element={
          <ProtectedRoute>
            <AppLayout>
              <EditSafetyGuide />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/safety-guides/admin/:id/view"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ViewSafetyGuide />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Public safety guide routes with full-width layout */}
      <Route
        path="/safety-guides/public"
        element={
          <AppLayout>
            <PublicSafetyGuides />
          </AppLayout>
        }
      />

      <Route
        path="/safety-guides/public/:id"
        element={
          <AppLayout>
            <PublicSafetyGuideDetail />
          </AppLayout>
        }
      />

      <Route
        path="/admin/deliveries"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "operator"]}>
            <AppLayout>
              <AlertDeliveries />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/deliveries"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "operator"]}>
            <AppLayout>
              <AlertDeliveries />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
  path="/analytics"
  element={
    <ProtectedRoute requiredUserTypes={["admin"]}>
      <AppLayout>
        <DisasterAnalyticsReport />
      </AppLayout>
    </ProtectedRoute>
  }
/>

      <Route
        path="/notification-templates"
        element={
          <ProtectedRoute requiredUserTypes={["admin", "authority"]}>
            <AppLayout>
              <div>Notification Templates Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts/my-responses"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <ActiveAlerts/>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts/respond"
        element={
          <ProtectedRoute requiredUserType="citizen">
            <AppLayout>
              <SafetyCheckin />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== ADMIN-ONLY SYSTEM ROUTES ==================== */}
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredUserType="admin">
            <AppLayout>
              <div>System Settings Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredUserType="admin">
            <AppLayout>
              <div>System Settings Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/system/health"
        element={
          <ProtectedRoute requiredUserType="admin">
            <AppLayout>
              <div>System Health Monitoring Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== PROFILE & SETTINGS ROUTES ==================== */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div>User Profile Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/preferences"
        element={
          <ProtectedRoute>
            <AppLayout>
              <div>Notification Preferences Coming Soon</div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route 
        path="/user/management" 
        element={
          <ProtectedRoute requiredUserType="admin">
            <AppLayout>
              <UserManagementWrapper />
            </AppLayout>
          </ProtectedRoute>
        } 
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ChatListPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ChatConversationPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/chat/new"
        element={
          <ProtectedRoute>
            <AppLayout>
              <StartNewChatPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== ERROR ROUTES ==================== */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route
        path="*"
        element={
          <ProtectedRoute showUnauthorized={false}>
            <AppLayout>
              <NotFound />
            </AppLayout>
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