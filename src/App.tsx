import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import ApplicantDashboard from '@/pages/ApplicantDashboard';
import Applications from '@/pages/Applications';
import NewApplication from '@/pages/NewApplication';
import ApplicationDetail from '@/pages/ApplicationDetail';
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
import AdminAnalytics from '@/pages/AdminAnalytics';
import AdminTickets from '@/pages/AdminTickets';
// Phase 2 imports
import DealRegistration from '@/pages/DealRegistration';
import Deals from '@/pages/Deals';
import PartnerLifecycle from '@/pages/PartnerLifecycle';
import TrainingCenter from '@/pages/TrainingCenter';
import CobrandedAssets from '@/pages/CobrandedAssets';
import Gamification from '@/pages/Gamification';
import AcceptInvitation from '@/pages/AcceptInvitation';
import VerifyEmail from '@/pages/VerifyEmail';

// 1. ADD THIS NEW COMPONENT TO RENDER YOUR HTML FILE
function LandingPage() {
  return (
    <iframe 
      src="/landing.html" 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%', 
        height: '100%', 
        border: 'none',
        margin: 0,
        padding: 0
      }} 
      title="Hainan Partnership Landing"
    />
  );
}

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
  if (user) {
    // Redirect applicants to a simpler applicant dashboard
    // and partners/admins to the partner dashboard
    const { profile } = useAuth();
    if (profile?.role === 'applicant') return <Navigate to="/applicant" />;
    return <Navigate to="/dashboard" />;
  }
  return <>{children}</>;
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
      {/* 2. CHANGE THIS ROUTE FROM <Navigate to="/dashboard" /> to <LandingPage /> */}
      <Route path="/" element={<LandingPage />} />

      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/onboarding" element={<PartnerOnboarding />} />
      <Route path="/accept-invitation" element={<PublicRoute><AcceptInvitation /></PublicRoute>} />
      <Route path="/verify-email" element={<PublicRoute><VerifyEmail /></PublicRoute>} />
      
      {/* Partner / Applicant Routes */}
      <Route path="/applicant" element={<PrivateRoute><ApplicantDashboard /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/lifecycle" element={<PrivateRoute><PartnerLifecycle /></PrivateRoute>} />
      <Route path="/applications" element={<PrivateRoute><Applications /></PrivateRoute>} />
      <Route path="/applications/new" element={<PrivateRoute><NewApplication /></PrivateRoute>} />
      <Route path="/applications/:id" element={<PrivateRoute><ApplicationDetail /></PrivateRoute>} />
      <Route path="/deals" element={<PrivateRoute><Deals /></PrivateRoute>} />
      <Route path="/referrals" element={<PrivateRoute><Referrals /></PrivateRoute>} />
      <Route path="/commissions" element={<PrivateRoute><Commissions /></PrivateRoute>} />
      <Route path="/training" element={<PrivateRoute><TrainingCenter /></PrivateRoute>} />
      <Route path="/resources" element={<PrivateRoute><ResourceCenter /></PrivateRoute>} />
      <Route path="/assets" element={<PrivateRoute><CobrandedAssets /></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
      <Route path="/achievements" element={<PrivateRoute><Gamification /></PrivateRoute>} />
      <Route path="/support" element={<PrivateRoute><SupportTickets /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/partners" element={<AdminRoute><AdminPartners /></AdminRoute>} />
      <Route path="/admin/referrals" element={<AdminRoute><Referrals /></AdminRoute>} />
      <Route path="/admin/deals" element={<AdminRoute><Deals /></AdminRoute>} />
      <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
      <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
      <Route path="/admin/team" element={<AdminRoute><AdminTeam /></AdminRoute>} />
      <Route path="/admin/documents" element={<AdminRoute><AdminDocuments /></AdminRoute>} />
      <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
      
      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" />} />
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
