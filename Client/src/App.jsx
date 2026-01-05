// // src/App.jsx - Complete Hierarchical Escalation System with i18n
// import React, { Suspense } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { I18nextProvider, useTranslation } from 'react-i18next'; // <-- ADDED useTranslation
// import i18n from './i18n';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import { LanguageProvider } from './contexts/LanguageContext';
// import ProtectedRoute from './components/ProtectedRoute';
// import ErrorBoundary from './components/ErrorBoundary';
// import Layout from './components/Layout';

// // Auth pages
// import Login from './pages/auth/Login';
// import Signup from './pages/auth/Signup';
// import ForgotPassword from './pages/auth/ForgotPassword';

// // Dashboard pages - All Hierarchical Levels
// import CitizenDashboard from './pages/dashboard/CitizenDashboard';
// import AdminDashboard from './pages/dashboard/AdminDashboard';
// import VillageDashboard from './pages/dashboard/VillageDashboard';
// import SectorDashboard from './pages/dashboard/SectorDashboard';
// import DistrictDashboard from './pages/dashboard/DistrictDashboard';
// import ProvinceDashboard from './pages/dashboard/ProvinceDashboard';
// import NationalDashboard from './pages/dashboard/NationalDashboard';
// import Home from './pages/Home';

// // Safety & Emergency pages
// import SafetyCheckin from './pages/safety/SafetyCheckin';
// import EmergencyContacts from './pages/safety/EmergencyContacts';
// import EmergencyGuide from './pages/safety/EmergencyGuide';

// // Admin pages
// import UserManagement from './pages/UserManagement';
// import LocationManagement from './pages/admin/LocationManagement';
// import DisasterTypes from './pages/admin/DisasterTypes';
// import AlertsManagement from './pages/admin/AlertsManagement';
// import { CreateAlert } from './pages/admin/CreateAlert';
// import { EditAlert } from './pages/admin/EditAlert';

// // Incident pages
// import IncidentsManagement from './pages/citizen/IncidentsManagement';
// import CitizenIncidentReport from './pages/citizen/CitizenIncidentReport';
// import IncidentListPage from './pages/citizen/IncidentListPage';
// import IncidentDetailPage from './pages/citizen/IncidentDetailPage';
// import IncidentEditPage from './pages/citizen/IncidentEditPage';
// import IncidentExportPage from './pages/citizen/IncidentExportPage';
// import CitizenReportPage from './pages/citizen/CitizenReportPage';

// // Safety Guide pages
// import SafetyGuideManagement from './pages/admin/SafetyGuideManagement';
// import SafetyGuideList from './pages/admin/SafetyGuideList';
// import CreateSafetyGuide from './pages/admin/CreateSafetyGuide';
// import EditSafetyGuide from './pages/admin/EditSafetyGuide';
// import ViewSafetyGuide from './pages/admin/ViewSafetyGuide';
// import PublicSafetyGuides from './pages/citizen/PublicSafetyGuides';
// import PublicSafetyGuideDetail from './pages/citizen/PublicSafetyGuideDetail';

// // Alert pages
// import AlertDeliveries from './pages/admin/AlertDeliveries';
// import ActiveAlerts from './pages/citizen/ActiveAlerts';
// import DisasterAnalyticsReport from './pages/admin/DisasterAnalyticsReport';

// // Chat pages
// import ChatListPage from './pages/Chat/ChatListPage';
// import ChatConversationPage from './pages/Chat/ChatConversationPage';
// import StartNewChatPage from './pages/Chat/StartNewChatPage';

// // Other pages
// import NotFound from './pages/NotFound';
// import Unauthorized from './pages/Unauthorized';
// import './App.css';

// // Layout wrapper component that provides user context and notifications
// function AppLayout({ children }) {
//   const { user, logout } = useAuth();

//   // Mock notifications - replace with your actual notification service
//   const notifications = [];

//   // Mock handlers - replace with your actual implementations
//   const handlePageChange = (page) => {
//     console.log('Page changed to:', page);
//   };

//   const handleLanguageChange = (language) => {
//     console.log('Language changed to:', language);
//     // The language change is already handled by the LanguageSwitcher and i18n
//   };

//   const handleEmergencyAlert = () => {
//     console.log('Emergency alert triggered');
//   };

//   const handleQuickAction = (actionType) => {
//     console.log('Quick action:', actionType);
//   };

//   return (
//     <Layout
//       user={user}
//       notifications={notifications}
//       onPageChange={handlePageChange}
//       onLogout={logout}
//       onLanguageChange={handleLanguageChange}
//       onEmergencyAlert={handleEmergencyAlert}
//       onQuickAction={handleQuickAction}
//     >
//       {children}
//     </Layout>
//   );
// }

// // Wrapper component to provide user context to UserManagement
// function UserManagementWrapper() {
//   const { user, logout } = useAuth();

//   return <UserManagement user={user} onLogout={logout} />;
// }

// // Dashboard redirect component based on user_type
// function DashboardRedirect() {
//   const { user, loading, getRedirectPath } = useAuth();

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-red-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/" replace />;
//   }

//   // Use the getRedirectPath function from AuthContext
//   const redirectPath = getRedirectPath(user.user_type);
//   return <Navigate to={redirectPath} replace />;
// }

// function AppRoutes() {
//   // FIX: Import the translation function 't' using the useTranslation hook
//   const { t } = useTranslation();

//   return (
//     <Routes>
//       {/* Default route - redirect to login */}
//       <Route path="/" element={<Login />} />

//       {/* Dashboard - Auto redirect to appropriate dashboard */}
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <DashboardRedirect />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== PUBLIC AUTH ROUTES ==================== */}
//       <Route path="/login" element={<Login />} />
//       <Route path="/signup" element={<Signup />} />
//       <Route path="/auth/login" element={<Login />} />
//       <Route path="/auth/signup" element={<Signup />} />
//       <Route path="/forgot-password" element={<ForgotPassword />} />
//       <Route path="/auth/forgot-password" element={<ForgotPassword />} />
//       <Route path="/auth/password-reset" element={<ForgotPassword />} />

//       {/* Public emergency information */}
//       <Route path="/emergency-guide" element={<EmergencyGuide />} />
//       <Route path="/emergency-contacts" element={<EmergencyContacts />} />

//       {/* ==================== ADMIN DASHBOARD ==================== */}
//       <Route
//         path="/admin/dashboard"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <AdminDashboard />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== HIERARCHICAL DASHBOARDS ==================== */}
//       {/* Village Level Dashboard */}
//       <Route
//         path="/village/dashboard"
//         element={
//           <ProtectedRoute requiredUserType="village">
//             <AppLayout>
//               <VillageDashboard />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Sector Level Dashboard */}
//       <Route
//         path="/sector/dashboard"
//         element={
//           <ProtectedRoute requiredUserType="sector">
//             <AppLayout>
//               <SectorDashboard />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* District Level Dashboard */}
//       <Route
//         path="/district/dashboard"
//         element={
//           <ProtectedRoute requiredUserType="district">
//             <AppLayout>
//               <DistrictDashboard />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Province Level Dashboard */}
//       <Route
//         path="/province/dashboard"
//         element={
//           <ProtectedRoute requiredUserType="province">
//             <AppLayout>
//               <ProvinceDashboard />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* National Level Dashboard */}
//       <Route
//         path="/national/dashboard"
//         element={
//           <ProtectedRoute requiredUserType="national">
//             <AppLayout>
//               <NationalDashboard />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Citizen Dashboard */}
//       <Route
//         path="/citizen/dashboard"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <CitizenDashboard />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== USER MANAGEMENT (ADMIN ONLY) ==================== */}
//       <Route
//         path="/users"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <UserManagementWrapper />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/admin/users"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <UserManagementWrapper />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/user/management"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <UserManagementWrapper />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== INCIDENT MANAGEMENT ==================== */}
//       {/* General incidents route */}
//       <Route
//         path="/incidents"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <IncidentsManagement />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Citizen Incident Routes - All Users Can Report */}
//       <Route
//         path="/incidents/citizen/reports"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <CitizenIncidentReport />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/report-incident"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <CitizenIncidentReport />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Citizen My Reports */}
//       <Route
//         path="/incidents/citizen/my-reports"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <IncidentListPage citizenView={true} />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/citizen/my-report"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <CitizenReportPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/incidents/citizen/:id/view"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <IncidentDetailPage citizenView={true} />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/incidents/citizen/:id/edit"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <IncidentEditPage citizenView={true} />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Admin/Staff Incident Routes - All Administrative Levels */}
//       <Route
//         path="/incidents/admin/list"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "village", "sector", "district", "province", "national"]}>
//             <AppLayout>
//               <IncidentListPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/incidents/admin/:id/view"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "village", "sector", "district", "province", "national"]}>
//             <AppLayout>
//               <IncidentDetailPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/incidents/admin/:id/edit"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "village", "sector", "district", "province", "national"]}>
//             <AppLayout>
//               <IncidentEditPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Incident Export - District Level and Above */}
//       <Route
//         path="/incidents/export"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <IncidentExportPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== ALERT MANAGEMENT ==================== */}
//       {/* Alert Management - District Level and Above */}
//       <Route
//         path="/admin/disaster-types"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <DisasterTypes />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/admin/alerts"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <AlertsManagement />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/admin/alerts/create"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <CreateAlert />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/admin/alerts/edit/:id"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <EditAlert />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/alerts"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <AlertsManagement />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/alerts/create"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <CreateAlert />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Alert Deliveries - District Level and Above */}
//       <Route
//         path="/admin/deliveries"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <AlertDeliveries />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/deliveries"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <AlertDeliveries />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Citizen Alert Responses */}
//       <Route
//         path="/alerts/my-responses"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <ActiveAlerts/>
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/alerts/respond"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <SafetyCheckin />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== ANALYTICS ==================== */}
//       {/* Analytics - District Level and Above */}
//       <Route
//         path="/analytics"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <DisasterAnalyticsReport />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== SAFETY GUIDES ==================== */}
//       {/* Admin Safety Guide Routes - Sector Level and Above */}
//       <Route
//         path="/safety-guides"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "village", "sector", "district", "province", "national"]}>
//             <AppLayout>
//               <SafetyGuideList />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/safety-guides/admin/create"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <CreateSafetyGuide />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/safety-guides/admin/:id/edit"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <EditSafetyGuide />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/safety-guides/admin/:id/view"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "village", "sector", "district", "province", "national"]}>
//             <AppLayout>
//               <ViewSafetyGuide />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* Public safety guide routes */}
//       <Route
//         path="/safety-guides/public"
//         element={
//           <AppLayout>
//             <PublicSafetyGuides />
//           </AppLayout>
//         }
//       />

//       <Route
//         path="/safety-guides/public/:id"
//         element={
//           <AppLayout>
//             <PublicSafetyGuideDetail />
//           </AppLayout>
//         }
//       />

//       {/* ==================== LOCATION MANAGEMENT (ADMIN ONLY) ==================== */}
//       <Route
//         path="/locations"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <LocationManagement />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== SAFETY & EMERGENCY ROUTES ==================== */}
//       <Route
//         path="/safety/checkin"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <SafetyCheckin />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/citizen/safety/checkin"
//         element={
//           <ProtectedRoute requiredUserType="citizen">
//             <AppLayout>
//               <SafetyCheckin />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/emergency/contacts"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <EmergencyContacts />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/emergency-contacts"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <EmergencyContacts />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/emergency/guide"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <EmergencyGuide />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== CHAT/MESSAGING ROUTES ==================== */}
//       <Route
//         path="/chat"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <ChatListPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/chat/:id"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <ChatConversationPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/chat/new"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <StartNewChatPage />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== ADMIN SYSTEM ROUTES ==================== */}
//       <Route
//         path="/admin/settings"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <div className="p-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.systemSettings')}</h1>
//                 <p className="text-gray-600">{t('admin.systemConfigComingSoon')}</p>
//               </div>
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/settings"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <div className="p-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.systemSettings')}</h1>
//                 <p className="text-gray-600">{t('admin.systemConfigComingSoon')}</p>
//               </div>
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/system/health"
//         element={
//           <ProtectedRoute requiredUserType="admin">
//             <AppLayout>
//               <div className="p-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.systemHealth')}</h1>
//                 <p className="text-gray-600">{t('admin.healthMonitoringComingSoon')}</p>
//               </div>
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/notification-templates"
//         element={
//           <ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}>
//             <AppLayout>
//               <div className="p-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.notificationTemplates')}</h1>
//                 <p className="text-gray-600">{t('admin.templateManagementComingSoon')}</p>
//               </div>
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== PROFILE & USER SETTINGS ==================== */}
//       <Route
//         path="/profile"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <div className="p-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('profile.userProfile')}</h1>
//                 <p className="text-gray-600">{t('profile.profileManagementComingSoon')}</p>
//               </div>
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       <Route
//         path="/profile/preferences"
//         element={
//           <ProtectedRoute>
//             <AppLayout>
//               <div className="p-6">
//                 <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('profile.notificationPreferences')}</h1>
//                 <p className="text-gray-600">{t('profile.preferenceManagementComingSoon')}</p>
//               </div>
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />

//       {/* ==================== ERROR ROUTES ==================== */}
//       <Route path="/unauthorized" element={<Unauthorized />} />

//       <Route
//         path="*"
//         element={
//           <ProtectedRoute showUnauthorized={false}>
//             <AppLayout>
//               <NotFound />
//             </AppLayout>
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// }

// function App() {
//   return (
//     <ErrorBoundary>
//       <I18nextProvider i18n={i18n}>
//         <LanguageProvider>
//           <AuthProvider>
//             <Router>
//               <div className="App">
//                 <Suspense fallback={
//                   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//                     <div className="text-center">
//                       <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-red-600 mx-auto mb-4"></div>
//                       <p className="text-gray-600">Loading application...</p>
//                     </div>
//                   </div>
//                 }>
//                   <AppRoutes />
//                 </Suspense>
//               </div>
//             </Router>
//           </AuthProvider>
//         </LanguageProvider>
//       </I18nextProvider>
//     </ErrorBoundary>
//   );
// }

// export default App;

// src/App.jsx - Complete Hierarchical Escalation System with Cell Level Support
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// ✅ UPDATED: Dashboard pages - All Hierarchical Levels (including Cell)
import CitizenDashboard from './pages/dashboard/CitizenDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import VillageDashboard from './pages/dashboard/VillageDashboard';
import CellDashboard from './pages/dashboard/CellDashboard'; // ✅ ADDED: Cell Dashboard
import SectorDashboard from './pages/dashboard/SectorDashboard';
import DistrictDashboard from './pages/dashboard/DistrictDashboard';
import ProvinceDashboard from './pages/dashboard/ProvinceDashboard';
import NationalDashboard from './pages/dashboard/NationalDashboard';
import Home from './pages/Home';

// Safety & Emergency pages
import SafetyCheckin from './pages/safety/SafetyCheckin';
import EmergencyContacts from './pages/safety/EmergencyContacts';
import EmergencyGuide from './pages/safety/EmergencyGuide';

// Admin pages
import UserManagement from './pages/UserManagement';
import LocationManagement from './pages/admin/LocationManagement';
import DisasterTypes from './pages/admin/DisasterTypes';
import AlertsManagement from './pages/admin/AlertsManagement';
import { CreateAlert } from './pages/admin/CreateAlert';
import { EditAlert } from './pages/admin/EditAlert';

// Incident pages
import IncidentsManagement from './pages/citizen/IncidentsManagement';
import CitizenIncidentReport from './pages/citizen/CitizenIncidentReport';
import IncidentListPage from './pages/citizen/IncidentListPage';
import IncidentDetailPage from './pages/citizen/IncidentDetailPage';
import IncidentEditPage from './pages/citizen/IncidentEditPage';
import IncidentExportPage from './pages/citizen/IncidentExportPage';
import CitizenReportPage from './pages/citizen/CitizenReportPage';

// Safety Guide pages
import SafetyGuideManagement from './pages/admin/SafetyGuideManagement';
import SafetyGuideList from './pages/admin/SafetyGuideList';
import CreateSafetyGuide from './pages/admin/CreateSafetyGuide';
import EditSafetyGuide from './pages/admin/EditSafetyGuide';
import ViewSafetyGuide from './pages/admin/ViewSafetyGuide';
import PublicSafetyGuides from './pages/citizen/PublicSafetyGuides';
import PublicSafetyGuideDetail from './pages/citizen/PublicSafetyGuideDetail';

// Alert pages
import AlertDeliveries from './pages/admin/AlertDeliveries';
import ActiveAlerts from './pages/citizen/ActiveAlerts';
import DisasterAnalyticsReport from './pages/admin/DisasterAnalyticsReport';

// Chat pages
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
  const notifications = [];

  const handlePageChange = (page) => console.log('Page changed to:', page);
  const handleLanguageChange = (language) => console.log('Language changed to:', language);
  const handleEmergencyAlert = () => console.log('Emergency alert triggered');
  const handleQuickAction = (actionType) => console.log('Quick action:', actionType);

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

function UserManagementWrapper() {
  const { user, logout } = useAuth();
  return <UserManagement user={user} onLogout={logout} />;
}

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

  if (!user) return <Navigate to="/" replace />;
  const redirectPath = getRedirectPath(user.user_type);
  return <Navigate to={redirectPath} replace />;
}

function AppRoutes() {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardRedirect /></AppLayout></ProtectedRoute>} />

      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/password-reset" element={<ForgotPassword />} />
      <Route path="/emergency-guide" element={<EmergencyGuide />} />
      <Route path="/emergency-contacts" element={<EmergencyContacts />} />

      {/* Dashboards */}
      <Route path="/admin/dashboard" element={<ProtectedRoute requiredUserType="admin"><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/village/dashboard" element={<ProtectedRoute requiredUserType="village"><AppLayout><VillageDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/cell/dashboard" element={<ProtectedRoute requiredUserType="cell"><AppLayout><CellDashboard /></AppLayout></ProtectedRoute>} /> {/* ✅ ADDED */}
      <Route path="/sector/dashboard" element={<ProtectedRoute requiredUserType="sector"><AppLayout><SectorDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/district/dashboard" element={<ProtectedRoute requiredUserType="district"><AppLayout><DistrictDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/province/dashboard" element={<ProtectedRoute requiredUserType="province"><AppLayout><ProvinceDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/national/dashboard" element={<ProtectedRoute requiredUserType="national"><AppLayout><NationalDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/citizen/dashboard" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><CitizenDashboard /></AppLayout></ProtectedRoute>} />

      {/* User Management */}
      <Route path="/users" element={<ProtectedRoute requiredUserType="admin"><AppLayout><UserManagementWrapper /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredUserType="admin"><AppLayout><UserManagementWrapper /></AppLayout></ProtectedRoute>} />
      <Route path="/user/management" element={<ProtectedRoute requiredUserType="admin"><AppLayout><UserManagementWrapper /></AppLayout></ProtectedRoute>} />

      {/* Incidents */}
      <Route path="/incidents" element={<ProtectedRoute><AppLayout><IncidentsManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/incidents/citizen/reports" element={<ProtectedRoute><AppLayout><CitizenIncidentReport /></AppLayout></ProtectedRoute>} />
      <Route path="/report-incident" element={<ProtectedRoute><AppLayout><CitizenIncidentReport /></AppLayout></ProtectedRoute>} />
      <Route path="/incidents/citizen/my-reports" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><IncidentListPage citizenView={true} /></AppLayout></ProtectedRoute>} />
      <Route path="/citizen/my-report" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><CitizenReportPage /></AppLayout></ProtectedRoute>} />
      <Route path="/incidents/citizen/:id/view" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><IncidentDetailPage citizenView={true} /></AppLayout></ProtectedRoute>} />
      <Route path="/incidents/citizen/:id/edit" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><IncidentEditPage citizenView={true} /></AppLayout></ProtectedRoute>} />
      {/* ✅ UPDATED: Include cell in admin incident routes */}
      <Route path="/incidents/admin/list" element={<ProtectedRoute requiredUserTypes={["admin", "village", "cell", "sector", "district", "province", "national"]}><AppLayout><IncidentListPage /></AppLayout></ProtectedRoute>} />
      <Route path="/incidents/admin/:id/view" element={<ProtectedRoute requiredUserTypes={["admin", "village", "cell", "sector", "district", "province", "national"]}><AppLayout><IncidentDetailPage /></AppLayout></ProtectedRoute>} />
      <Route path="/incidents/admin/:id/edit" element={<ProtectedRoute requiredUserTypes={["admin", "village", "cell", "sector", "district", "province", "national"]}><AppLayout><IncidentEditPage /></AppLayout></ProtectedRoute>} />
      <Route path="/incidents/export" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><IncidentExportPage /></AppLayout></ProtectedRoute>} />

      {/* Alerts */}
      <Route path="/admin/disaster-types" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><DisasterTypes /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/alerts" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><AlertsManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/alerts/create" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><CreateAlert /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/alerts/edit/:id" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><EditAlert /></AppLayout></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><AlertsManagement /></AppLayout></ProtectedRoute>} />
      <Route path="/alerts/create" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><CreateAlert /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/deliveries" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><AlertDeliveries /></AppLayout></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><AlertDeliveries /></AppLayout></ProtectedRoute>} />
      <Route path="/alerts/my-responses" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><ActiveAlerts /></AppLayout></ProtectedRoute>} />
      <Route path="/alerts/respond" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><SafetyCheckin /></AppLayout></ProtectedRoute>} />

      {/* Analytics */}
      <Route path="/analytics" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><DisasterAnalyticsReport /></AppLayout></ProtectedRoute>} />

      {/* Safety Guides - ✅ UPDATED: Include cell */}
      <Route path="/safety-guides" element={<ProtectedRoute requiredUserTypes={["admin", "village", "cell", "sector", "district", "province", "national"]}><AppLayout><SafetyGuideList /></AppLayout></ProtectedRoute>} />
      <Route path="/safety-guides/admin/create" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><CreateSafetyGuide /></AppLayout></ProtectedRoute>} />
      <Route path="/safety-guides/admin/:id/edit" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><EditSafetyGuide /></AppLayout></ProtectedRoute>} />
      <Route path="/safety-guides/admin/:id/view" element={<ProtectedRoute requiredUserTypes={["admin", "village", "cell", "sector", "district", "province", "national"]}><AppLayout><ViewSafetyGuide /></AppLayout></ProtectedRoute>} />
      <Route path="/safety-guides/public" element={<AppLayout><PublicSafetyGuides /></AppLayout>} />
      <Route path="/safety-guides/public/:id" element={<AppLayout><PublicSafetyGuideDetail /></AppLayout>} />

      {/* Location Management */}
      <Route path="/locations" element={<ProtectedRoute requiredUserType="admin"><AppLayout><LocationManagement /></AppLayout></ProtectedRoute>} />

      {/* Safety & Emergency */}
      <Route path="/safety/checkin" element={<ProtectedRoute><AppLayout><SafetyCheckin /></AppLayout></ProtectedRoute>} />
      <Route path="/citizen/safety/checkin" element={<ProtectedRoute requiredUserType="citizen"><AppLayout><SafetyCheckin /></AppLayout></ProtectedRoute>} />
      <Route path="/emergency/contacts" element={<ProtectedRoute><AppLayout><EmergencyContacts /></AppLayout></ProtectedRoute>} />
      <Route path="/emergency-contacts" element={<ProtectedRoute><AppLayout><EmergencyContacts /></AppLayout></ProtectedRoute>} />
      <Route path="/emergency/guide" element={<ProtectedRoute><AppLayout><EmergencyGuide /></AppLayout></ProtectedRoute>} />

      {/* Chat */}
      <Route path="/chat" element={<ProtectedRoute><AppLayout><ChatListPage /></AppLayout></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><AppLayout><ChatConversationPage /></AppLayout></ProtectedRoute>} />
      <Route path="/chat/new" element={<ProtectedRoute><AppLayout><StartNewChatPage /></AppLayout></ProtectedRoute>} />

      {/* Settings */}
      <Route path="/admin/settings" element={<ProtectedRoute requiredUserType="admin"><AppLayout><div className="p-6"><h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.systemSettings')}</h1><p className="text-gray-600">{t('admin.systemConfigComingSoon')}</p></div></AppLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute requiredUserType="admin"><AppLayout><div className="p-6"><h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.systemSettings')}</h1><p className="text-gray-600">{t('admin.systemConfigComingSoon')}</p></div></AppLayout></ProtectedRoute>} />
      <Route path="/system/health" element={<ProtectedRoute requiredUserType="admin"><AppLayout><div className="p-6"><h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.systemHealth')}</h1><p className="text-gray-600">{t('admin.healthMonitoringComingSoon')}</p></div></AppLayout></ProtectedRoute>} />
      <Route path="/notification-templates" element={<ProtectedRoute requiredUserTypes={["admin", "district", "province", "national"]}><AppLayout><div className="p-6"><h1 className="text-2xl font-bold text-gray-900 mb-4">{t('admin.notificationTemplates')}</h1><p className="text-gray-600">{t('admin.templateManagementComingSoon')}</p></div></AppLayout></ProtectedRoute>} />

      {/* Profile */}
      <Route path="/profile" element={<ProtectedRoute><AppLayout><div className="p-6"><h1 className="text-2xl font-bold text-gray-900 mb-4">{t('profile.userProfile')}</h1><p className="text-gray-600">{t('profile.profileManagementComingSoon')}</p></div></AppLayout></ProtectedRoute>} />
      <Route path="/profile/preferences" element={<ProtectedRoute><AppLayout><div className="p-6"><h1 className="text-2xl font-bold text-gray-900 mb-4">{t('profile.notificationPreferences')}</h1><p className="text-gray-600">{t('profile.preferenceManagementComingSoon')}</p></div></AppLayout></ProtectedRoute>} />

      {/* Error Routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<ProtectedRoute showUnauthorized={false}><AppLayout><NotFound /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="App">
                <Suspense fallback={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-red-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading application...</p>
                    </div>
                  </div>
                }>
                  <AppRoutes />
                </Suspense>
              </div>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;