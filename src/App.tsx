import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Applications from '@/pages/Applications';
import NewApplication from '@/pages/NewApplication';
import ApplicationDetail from '@/pages/ApplicationDetail';
import Messages from '@/pages/Messages';
import Settings from '@/pages/Settings';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminPartners from '@/pages/AdminPartners';
import AdminTeam from '@/pages/AdminTeam';
import AdminDocuments from '@/pages/AdminDocuments';
import AdminReports from '@/pages/AdminReports';
import Reports from '@/pages/Reports';
import PartnerOnboarding from '@/pages/PartnerOnboarding';
import Referrals from '@/pages/Referrals';
import Commissions from '@/pages/Commissions';
import ResourceCenter from '@/pages/ResourceCenter';
import SupportTickets from '@/pages/SupportTickets';
import AdminCommissions from '@/pages/AdminCommissions';
import AdminContent from '@/pages/AdminContent';
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminTickets from '@/pages/AdminTickets';
// Phase 2 imports
import DealRegistration from '@/pages/DealRegistration';
import PartnerLifecycle from '@/pages/PartnerLifecycle';
import TrainingCenter from '@/pages/TrainingCenter';
import CobrandedAssets from '@/pages/CobrandedAssets';
import Gamification from '@/pages/Gamification';
import AdminWorkflowBuilder from '@/pages/AdminWorkflowBuilder';
import AdminDocumentVerification from '@/pages/AdminDocumentVerification';
import AdminBulkOperations from '@/pages/AdminBulkOperations';
import AdminPredictiveAnalytics from '@/pages/AdminPredictiveAnalytics';
import AdminReportBuilder from '@/pages/AdminReportBuilder';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
    </div>
  );
  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (profile?.role !== 'admin' && profile?.role !== 'team_member') {
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/onboarding" element={<PartnerOnboarding />} />
      
      {/* Partner Routes */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/lifecycle" element={<PrivateRoute><PartnerLifecycle /></PrivateRoute>} />
      <Route path="/applications" element={<PrivateRoute><Applications /></PrivateRoute>} />
      <Route path="/applications/new" element={<PrivateRoute><NewApplication /></PrivateRoute>} />
      <Route path="/applications/:id" element={<PrivateRoute><ApplicationDetail /></PrivateRoute>} />
      <Route path="/deals" element={<PrivateRoute><DealRegistration /></PrivateRoute>} />
      <Route path="/referrals" element={<PrivateRoute><Referrals /></PrivateRoute>} />
      <Route path="/commissions" element={<PrivateRoute><Commissions /></PrivateRoute>} />
      <Route path="/training" element={<PrivateRoute><TrainingCenter /></PrivateRoute>} />
      <Route path="/resources" element={<PrivateRoute><ResourceCenter /></PrivateRoute>} />
      <Route path="/assets" element={<PrivateRoute><CobrandedAssets /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/achievements" element={<PrivateRoute><Gamification /></PrivateRoute>} />
      <Route path="/support" element={<PrivateRoute><SupportTickets /></PrivateRoute>} />
      <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/partners" element={<AdminRoute><AdminPartners /></AdminRoute>} />
      <Route path="/admin/referrals" element={<AdminRoute><Referrals /></AdminRoute>} />
      <Route path="/admin/deals" element={<AdminRoute><DealRegistration /></AdminRoute>} />
      <Route path="/admin/commissions" element={<AdminRoute><AdminCommissions /></AdminRoute>} />
      <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
      <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/predictive" element={<AdminRoute><AdminPredictiveAnalytics /></AdminRoute>} />
      <Route path="/admin/workflows" element={<AdminRoute><AdminWorkflowBuilder /></AdminRoute>} />
      <Route path="/admin/verification" element={<AdminRoute><AdminDocumentVerification /></AdminRoute>} />
      <Route path="/admin/bulk" element={<AdminRoute><AdminBulkOperations /></AdminRoute>} />
      <Route path="/admin/report-builder" element={<AdminRoute><AdminReportBuilder /></AdminRoute>} />
      <Route path="/admin/team" element={<AdminRoute><AdminTeam /></AdminRoute>} />
      <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
      
      {/* Default Routes */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
