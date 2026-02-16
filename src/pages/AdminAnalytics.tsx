import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';

interface PartnerStats {
  id: number;
  company_name: string;
  contact_name: string;
  status: string;
  commission_rate: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [stats, setStats] = useState({
    totalPartners: 0,
    approvedPartners: 0,
    pendingPartners: 0,
    totalApplicants: 0,
    activeApplicants: 0,
    completedApplicants: 0,
    totalCommission: 0,
    paidCommission: 0,
  });
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; applicants: number; completed: number }>>([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get admin stats
      let adminStats = null;
      try {
        adminStats = await api.getAdminStats();
      } catch (e) {
        console.log('Using fallback data fetch');
      }
      
      // Get partners from API
      const partnersData = await api.getPartners();
      const partners = Array.isArray(partnersData) ? partnersData : ((partnersData as any)?.results || []);
      
      // Get applicants from API
      const applicantsData = await api.getApplicants();
      const applicants = Array.isArray(applicantsData) ? applicantsData : ((applicantsData as any)?.results || []);
      
      // Get commissions
      const commissionsData = await api.getCommissions();
      const commissions = Array.isArray(commissionsData) ? commissionsData : ((commissionsData as any)?.results || []);
      
      // Calculate partner status distribution
      const statusDist: Record<string, number> = { approved: 0, pending: 0, blocked: 0 };
      partners.forEach((p: any) => {
        if (p.status) statusDist[p.status] = (statusDist[p.status] || 0) + 1;
      });
      setStatusDistribution(statusDist);
      
      // Calculate commissions
      const totalCommission = commissions.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
      const paidCommission = commissions.filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
      
      if (adminStats) {
        setStats({
          totalPartners: adminStats.total_partners || partners.length,
          approvedPartners: adminStats.approved_partners || statusDist.approved || 0,
          pendingPartners: adminStats.pending_partners || statusDist.pending || 0,
          totalApplicants: adminStats.total_applicants || applicants.length,
          activeApplicants: adminStats.active_applicants || 0,
          completedApplicants: adminStats.completed_applicants || 0,
          totalCommission: adminStats.total_commission_earned || totalCommission,
          paidCommission: adminStats.commission_paid || paidCommission,
        });
      } else {
        const activeApps = applicants.filter((a: any) => !['approved', 'rejected', 'completed'].includes(a.status));
        const completedApps = applicants.filter((a: any) => ['approved', 'completed'].includes(a.status));
        
        setStats({
          totalPartners: partners.length,
          approvedPartners: statusDist.approved || 0,
          pendingPartners: statusDist.pending || 0,
          totalApplicants: applicants.length,
          activeApplicants: activeApps.length,
          completedApplicants: completedApps.length,
          totalCommission,
          paidCommission,
        });
      }
      
      // Set partner stats
      const partnerWithCommissions = partners.map((p: any) => ({
        id: p.id,
        company_name: p.company_name,
        contact_name: p.contact_name || '',
        status: p.status,
        commission_rate: Number(p.commission_rate) || 0,
      }));
      setPartnerStats(partnerWithCommissions.slice(0, 10));
      
      // Monthly data (last 6 months)
      const months: Array<{ month: string; applicants: number; completed: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toISOString().slice(0, 7);
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        
        const monthApplicants = applicants.filter((a: any) => a.created_at?.startsWith(monthKey)).length;
        const monthCompleted = applicants.filter((a: any) => 
          a.created_at?.startsWith(monthKey) && 
          ['approved', 'completed'].includes(a.status)
        ).length;
        
        months.push({ month: monthName, applicants: monthApplicants, completed: monthCompleted });
      }
      setMonthlyData(months);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    let csv = 'Partner,Status,Commission Rate\n';
    csv += partnerStats.map(p => 
      `${p.company_name},${p.status},${p.commission_rate}%`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partners-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const statusColors: Record<string, string> = {
    approved: 'bg-green-500',
    pending: 'bg-yellow-500',
    blocked: 'bg-red-500',
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const maxApplicants = Math.max(...monthlyData.map(m => m.applicants), 1);
  const maxCompleted = Math.max(...monthlyData.map(m => m.completed), 1);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Monitor partner performance and business metrics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={exportReport}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Partners</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalPartners}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Approved Partners</p>
            <p className="text-2xl font-bold text-green-600">{stats.approvedPartners}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Applicants</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalApplicants}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-orange-600">{stats.completedApplicants}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-2xl font-bold text-purple-600">{stats.activeApplicants}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Pending Partners</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingPartners}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Commission</p>
            <p className="text-2xl font-bold text-gray-800">${stats.totalCommission.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Paid Commission</p>
            <p className="text-2xl font-bold text-green-600">${stats.paidCommission.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trend */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Monthly Trend</h2>
            <div className="space-y-4">
              {monthlyData.map((m, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{m.month}</span>
                    <span className="text-gray-800">{m.applicants} applicants / {m.completed} completed</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div 
                        className="bg-blue-500 rounded-full h-4 transition-all"
                        style={{ width: `${(m.applicants / maxApplicants) * 100}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div 
                        className="bg-green-500 rounded-full h-4 transition-all"
                        style={{ width: `${(m.completed / maxCompleted) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-gray-600">Applicants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Completed</span>
              </div>
            </div>
          </div>

          {/* Partner Status Distribution */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Partner Status Distribution</h2>
            <div className="space-y-4">
              {Object.entries(statusDistribution).map(([status, count]) => {
                const total = Object.values(statusDistribution).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize text-gray-800 font-medium">{status}</span>
                      <span className="text-gray-600">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-6">
                      <div 
                        className={`${statusColors[status] || 'bg-gray-400'} rounded-full h-6 transition-all flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      >
                        {pct > 15 && <span className="text-white text-xs font-medium">{count}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Partners Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-800">Partners</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {partnerStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No partner data available
                  </td>
                </tr>
              ) : (
                partnerStats.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{partner.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{partner.company_name}</td>
                    <td className="px-6 py-4 text-gray-600">{partner.contact_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        partner.status === 'approved' ? 'bg-green-100 text-green-700' :
                        partner.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {partner.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      {partner.commission_rate}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
