import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api'; 
import { getStatusColor } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Users, FileText, Building, UserCheck, TrendingUp, AlertCircle, 
  Clock, CheckCircle, ArrowRight, BarChart3
} from 'lucide-react';

interface AdminStats {
  totalPartners: number;
  totalApplicants: number;
  activeApplications: number;
  pendingDocuments: number;
  teamMembers: number;
  completedThisMonth: number;
}

// Interface matching your Django 'Applicant' model response
interface DashboardApplicant {
  id: number;
  full_name: string;
  status: string; // 'new', 'docs_pending', 'processing', 'approved', etc.
  created_at: string;
  visa_type?: string;
  partner_name?: string; // Assuming your serializer includes this, or you map it
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalPartners: 0,
    totalApplicants: 0,
    activeApplications: 0,
    pendingDocuments: 0,
    teamMembers: 0,
    completedThisMonth: 0
  });
  
  const [recentApps, setRecentApps] = useState<DashboardApplicant[]>([]);
  const [pendingActions, setPendingActions] = useState<DashboardApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Parallel Fetch using available API methods
      // Removed api.getUsers() because it doesn't exist in the API client
      const [partnersData, applicantsData] = await Promise.all([
        api.getPartners(),
        api.getApplicants(),
      ]);

      // Normalize data (Safety check in case the API wrapper didn't fully unwrap .results)
      const partners = Array.isArray(partnersData) ? partnersData : ((partnersData as any)?.results || []);
      const applicants = (Array.isArray(applicantsData) ? applicantsData : ((applicantsData as any)?.results || [])) as DashboardApplicant[];
      
      // 2. Calculate Statistics
      const now = new Date();
      
      const thisMonthCompleted = applicants.filter(a => {
        if (!a.created_at) return false;
        const created = new Date(a.created_at);
        return (
          created.getMonth() === now.getMonth() && 
          created.getFullYear() === now.getFullYear() && 
          (a.status === 'approved' || a.status === 'completed')
        );
      });

      // Active: Not in a final state
      const activeApps = applicants.filter(a => 
        !['approved', 'rejected', 'completed'].includes(a.status)
      );

      // Pending Docs: Specifically waiting on documents or just started
      const pendingDocsApps = applicants.filter(a => 
        a.status === 'docs_pending' || a.status === 'new'
      );

      setStats({
        totalPartners: partners.length,
        totalApplicants: applicants.length,
        activeApplications: activeApps.length,
        pendingDocuments: pendingDocsApps.length,
        // Default to 1 (You) since the getUsers endpoint is missing
        teamMembers: 1, 
        completedThisMonth: thisMonthCompleted.length
      });

      // 3. Set Recent Applications (Top 10)
      const sortedApps = [...applicants].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentApps(sortedApps.slice(0, 10));

      // 4. Set Pending Actions (New, Docs Pending, Processing)
      const actionItems = sortedApps
        .filter(a => ['new', 'docs_pending', 'processing'].includes(a.status))
        .slice(0, 5);
      
      setPendingActions(actionItems);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {/* Partners */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg"><Building className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Partners</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalPartners}</p>
            </div>
          </div>
        </div>

        {/* Applicants */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg"><Users className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Applicants</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalApplicants}</p>
            </div>
          </div>
        </div>

        {/* Active Applications */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-lg"><TrendingUp className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeApplications}</p>
            </div>
          </div>
        </div>

        {/* Pending Documents */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg"><AlertCircle className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pending Docs</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingDocuments}</p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg"><UserCheck className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Team</p>
              <p className="text-xl font-bold text-gray-900">{stats.teamMembers}</p>
            </div>
          </div>
        </div>

        {/* Completed Monthly */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-gray-500">This Month</p>
              <p className="text-xl font-bold text-gray-900">{stats.completedThisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/partners" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-orange-300 transition flex items-center gap-3 group">
          <Building className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-gray-900">Manage Partners</span>
        </Link>
        <Link to="/admin/team" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-orange-300 transition flex items-center gap-3 group">
          <Users className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-gray-900">Team Members</span>
        </Link>
        <Link to="/admin/documents" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-orange-300 transition flex items-center gap-3 group">
          <FileText className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-gray-900">Documents</span>
        </Link>
        <Link to="/admin/reports" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-orange-300 transition flex items-center gap-3 group">
          <BarChart3 className="h-6 w-6 text-orange-500 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-gray-900">Reports</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
            <div className="bg-yellow-100 p-1.5 rounded-full">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          {pendingActions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p>All caught up! No pending actions.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingActions.map(app => (
                <Link key={app.id} to={`/applications/${app.id}`} className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{app.full_name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{app.visa_type || 'Visa Application'}</span>
                        {app.partner_name && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span>{app.partner_name}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)} capitalize`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <div className="bg-blue-100 p-1.5 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No applications yet.</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {recentApps.map(app => (
                <Link key={app.id} to={`/applications/${app.id}`} className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition group">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">{app.full_name}</p>
                      <p className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}