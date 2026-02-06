import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { getStatusColor } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Users, Clock, CheckCircle, AlertCircle, Plus, ArrowRight, 
  FileText, Upload, Calendar, TrendingUp,
  UserPlus, Eye, Headphones
} from 'lucide-react';

interface Applicant {
  id: number;
  full_name: string;
  email?: string;
  passport_number?: string;
  status: string;
  visa_type?: string;
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  total: number;
  active: number;
  completed: number;
  pendingDocs: number;
  approved: number;
}

interface Activity {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  link?: string;
}

interface Milestone {
  id: number;
  clientName: string;
  task: string;
  dueDate: string;
  urgency: 'high' | 'medium' | 'low';
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [applications, setApplications] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ total: 0, active: 0, completed: 0, pendingDocs: 0, approved: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // 1. Fetch dashboard stats
      // Note: If your backend doesn't have a dedicated stats endpoint yet, 
      // you might need to calculate this from the applicants list temporarily.
      try {
        const dashboardStats = await api.getDashboardStats();
        setStats({
          total: dashboardStats.total_applicants || 0,
          active: dashboardStats.active_applicants || 0,
          completed: dashboardStats.completed_applicants || 0,
          pendingDocs: dashboardStats.pending_documents || 0,
          approved: dashboardStats.completed_applicants || 0 // Assuming completed includes approved
        });
      } catch (e) {
        console.warn("Stats endpoint might not be ready, skipping stats load.");
      }

      // 2. Fetch applications (Handle Pagination safely)
      const response: any = await api.getApplicants({ ordering: '-created_at' });
      
      // CRITICAL FIX: Handle { results: [...] } pagination structure
      const appsList = Array.isArray(response) ? response : (response.results || []);
      setApplications(appsList);

      // 3. Generate activities from recent apps
      const recentActivities: Activity[] = appsList.slice(0, 10).map((app: any) => ({
        id: app.id,
        type: 'application',
        message: `${app.full_name || app.email} - ${app.status}`,
        timestamp: app.updated_at || app.created_at,
        link: `/applications/${app.id}`
      }));
      setActivities(recentActivities);

      // 4. Generate milestones
      const now = new Date();
      const upcomingMilestones: Milestone[] = appsList
        .filter((a: any) => !['APPROVED', 'REJECTED', 'COMPLETED'].includes(a.status?.toUpperCase()))
        .slice(0, 5)
        .map((app: any) => {
          const created = new Date(app.created_at);
          const daysElapsed = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          let urgency: 'high' | 'medium' | 'low' = 'low';
          if (daysElapsed > 15) urgency = 'high';
          else if (daysElapsed > 10) urgency = 'medium';
          
          return {
            id: app.id,
            clientName: app.full_name || app.email || 'Unknown',
            task: getNextTask(app.status),
            dueDate: new Date(created.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            urgency
          };
        });
      setMilestones(upcomingMilestones);

    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to empty array on error to prevent UI crash
      setApplications([]); 
    } finally {
      setLoading(false);
    }
  };

  const getNextTask = (status: string): string => {
    switch (status) {
      case 'New': return 'Submit initial documents';
      case 'Documents Pending': return 'Complete document submission';
      case 'Documents Received': return 'Await review';
      case 'Under Review': return 'Processing in progress';
      case 'Processing': return 'Final steps';
      case 'Final Documents': return 'Prepare completion';
      default: return 'Follow up required';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-green-500 bg-green-50';
    }
  };

  const quickActions = [
    { label: 'Add Applicant', icon: UserPlus, path: '/applications/new', color: 'bg-orange-500 hover:bg-orange-600' },
    { label: 'Upload Documents', icon: Upload, path: '/applications', color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'View All', icon: Eye, path: '/applications', color: 'bg-charcoal hover:bg-charcoal-dark' },
    { label: 'Contact Support', icon: Headphones, path: '/messages', color: 'bg-green-500 hover:bg-green-600' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  // Safety: Ensure applications is an array before rendering
  const safeApplications = Array.isArray(applications) ? applications : [];

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || 'Partner'}
        </h1>
        <p className="text-gray-600">{profile?.company_name || 'Dashboard Overview'}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Applicants</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 rounded-lg"><TrendingUp className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Active Applications</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-100 rounded-lg"><AlertCircle className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pending Documents</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingDocs}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link
              key={action.label}
              to={action.path}
              className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition shadow-sm hover:shadow-md`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activities.map(activity => (
                <Link
                  key={activity.id}
                  to={activity.link || '#'}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Milestones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Milestones</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          {milestones.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming milestones</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {milestones.map(milestone => (
                <Link
                  key={milestone.id}
                  to={`/applications/${milestone.id}`}
                  className={`block p-3 rounded-lg border-l-4 ${getUrgencyColor(milestone.urgency)} transition hover:shadow-sm`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{milestone.clientName}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{milestone.task}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Target</p>
                      <p className="text-xs font-medium text-gray-700">
                        {new Date(milestone.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          <Link to="/applications/new" className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm">
            <Plus className="h-4 w-4" /> New Application
          </Link>
        </div>

        {safeApplications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500 mb-6">Start by creating your first client application</p>
            <Link to="/applications/new" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600">
              <Plus className="h-5 w-5" /> Create Application
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* CRITICAL FIX: safeApplications ensures slice works */}
                  {safeApplications.slice(0, 5).map(app => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{app.full_name || app.email}</p>
                        <p className="text-sm text-gray-500">{app.email || app.passport_number}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-700 text-sm">{app.visa_type || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500 rounded-full transition-all"
                              style={{ width: `${0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">0%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/applications/${app.id}`} className="text-orange-500 hover:text-orange-600">
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {safeApplications.length > 5 && (
              <div className="px-6 py-4 bg-gray-50 border-t">
                <Link to="/applications" className="text-orange-500 hover:text-orange-600 font-medium text-sm">
                  View all {safeApplications.length} applications
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}