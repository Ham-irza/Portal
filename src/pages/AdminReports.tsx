import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Download, FileText, TrendingUp, Users, Calendar, DollarSign, Filter } from 'lucide-react';

interface ReportData {
  byService: Record<string, number>;
  byStatus: Record<string, number>;
  byDealStatus: Record<string, number>;
  byMonth: { month: string; count: number }[];
  partnerPerformance: { 
    name: string; 
    total: number; 
    completed: number;
    revenue: number;
    converted_deals: number;
    deals_count: number;
  }[];
  financialData: { totalRevenue: number; pendingPayments: number; paidPayments: number; byType: Record<string, number> };
  dealStats?: {
    total_deals: number;
    deal_total_amount: number;
    deal_paid_amount: number;
  };
}

export default function AdminReports() {
  const { profile } = useAuth();

  const [reportData, setReportData] = useState<ReportData>({
    byService: {},
    byStatus: {},
    byDealStatus: {},
    byMonth: [],
    partnerPerformance: [],
    financialData: { totalRevenue: 0, pendingPayments: 0, paidPayments: 0, byType: {} }
  });
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'overview' | 'partner' | 'deals' | 'application' | 'team' | 'financial'>('overview');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedPartner, setSelectedPartner] = useState<number | ''>('');
  const [partners, setPartners] = useState<any[]>([]);

  useEffect(() => {
    fetchReportData();
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const data: any = await api.getPartners();
      // Handle both array and paginated response
      setPartners(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error('Error fetching partners:', err);
      setPartners([]);
    }
  };

  const fetchReportData = async () => {
    try {
      if (profile?.role === 'admin' || profile?.role === 'team_member') {
        const params: any = {};
        if (dateRange.from) params.start_date = dateRange.from;
        if (dateRange.to) params.end_date = dateRange.to;
        if (selectedPartner) params.partner_id = selectedPartner;
        
        const res = await api.getAdminReport(params);
        
        // Parse deal status breakdown if available
        const dealByStatus = res.deals_by_status || {};
        
        setReportData(prev => ({
          ...prev,
          byService: res.by_service || res.byService || {},
          byStatus: res.applicants_by_status || res.byStatus || {},
          byDealStatus: dealByStatus,
          byMonth: res.by_month || res.byMonth || [],
          // Map backend field names to frontend expected names
          partnerPerformance: (res.partner_rankings || res.partnerPerformance || []).map((p: any) => ({
            name: p.company_name,
            total: p.applicants_count,
            deals_count: p.deals_count,
            revenue: p.revenue,
            converted_deals: p.converted_deals,
          })),
          financialData: res.financial || res.financialData || { 
            totalRevenue: res.deal_paid_amount || res.total_revenue || 0, 
            pendingPayments: 0, 
            paidPayments: 0, 
            byType: {} 
          },
          dealStats: {
            total_deals: res.total_deals || 0,
            deal_total_amount: res.deal_total_amount || 0,
            deal_paid_amount: res.deal_paid_amount || 0,
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setLoading(true);
    fetchReportData();
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onExportCSV = async () => {
    try {
      if (profile?.role === 'admin' || profile?.role === 'team_member') {
        const params: any = {};
        if (dateRange.from) params.start_date = dateRange.from;
        if (dateRange.to) params.end_date = dateRange.to;
        if (selectedPartner) params.partner_id = selectedPartner;
        
        const blob = await api.exportAdminReportCSV(params);
        downloadBlob(blob, `admin-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.csv`);
      }
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. Check console for details.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const reports = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'deals', label: 'Deals Report', icon: FileText },
    { key: 'partner', label: 'Partner Performance', icon: Users },
    { key: 'application', label: 'Application Analytics', icon: FileText },
    { key: 'financial', label: 'Financial Report', icon: DollarSign },
    { key: 'team', label: 'Team Performance', icon: TrendingUp }
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

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">View performance metrics and generate reports</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="border border-gray-300 rounded-lg py-2 px-3 text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="border border-gray-300 rounded-lg py-2 px-3 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value ? Number(e.target.value) : '')}
              className="border border-gray-300 rounded-lg py-2 px-3 text-sm"
            >
              <option value="">All Partners</option>
              {partners.map(partner => (
                <option key={partner.id} value={partner.id}>
                  {partner.company_name}
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleFilter}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Apply Filter
          </button>
          
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {reports.map(report => (
          <button
            key={report.key}
            onClick={() => setActiveReport(report.key as typeof activeReport)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
              activeReport === report.key 
                ? 'bg-orange-500 text-white' 
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <report.icon className="h-4 w-4" />
            {report.label}
          </button>
        ))}
      </div>

      {/* Overview Report */}
      {activeReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary Cards */}
          <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {Object.values(reportData.byStatus).reduce((a: number, b: any) => a + (Number(b) || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Applicants</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {reportData.dealStats?.total_deals || Object.values(reportData.byDealStatus).reduce((a: number, b: any) => a + (Number(b) || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Deals</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(reportData.financialData?.totalRevenue || 0)}
                </p>
                <p className="text-sm text-gray-600">Total Revenue</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {reportData.dealStats?.deal_total_amount ? formatCurrency(reportData.dealStats.deal_total_amount) : '$0'}
                </p>
                <p className="text-sm text-gray-600">Deal Value</p>
              </div>
            </div>
          </div>

          {/* By Deal Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deals by Status</h2>
            <div className="space-y-3">
              {Object.entries(reportData.byDealStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${(count / Math.max(Object.values(reportData.byDealStatus).reduce((a: number, b: any) => a + (Number(b) || 0), 0), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Applicant Status */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicants by Status</h2>
            <div className="space-y-3">
              {Object.entries(reportData.byStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / Math.max(Object.values(reportData.byStatus).reduce((a: number, b: any) => a + (Number(b) || 0), 0), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Deals Report */}
      {activeReport === 'deals' && (
        <div className="space-y-6">
          {/* Deal Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-gray-500">Total Deals</span>
              </div>
              <p className="text-2xl font-bold">{reportData.dealStats?.total_deals || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-500">Total Value</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(reportData.dealStats?.deal_total_amount || 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <span className="text-sm text-gray-500">Paid Amount</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(reportData.dealStats?.deal_paid_amount || 0)}</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-gray-500">Balance</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency((reportData.dealStats?.deal_total_amount || 0) - (reportData.dealStats?.deal_paid_amount || 0))}
              </p>
            </div>
          </div>

          {/* Deal Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deals Status Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(reportData.byDealStatus).map(([status, count]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 capitalize">{status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partner Performance Report */}
      {activeReport === 'partner' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Partner Performance Report</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicants</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Converted Deals</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.partnerPerformance.map((partner, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{partner.name}</td>
                  <td className="px-6 py-4 text-gray-700">{partner.total}</td>
                  <td className="px-6 py-4 text-gray-700">{partner.deals_count || 0}</td>
                  <td className="px-6 py-4 text-gray-700">{formatCurrency(partner.revenue)}</td>
                  <td className="px-6 py-4 text-gray-700">{partner.converted_deals || 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${partner.deals_count ? (partner.converted_deals / partner.deals_count) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {partner.deals_count ? Math.round((partner.converted_deals / partner.deals_count) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Analytics */}
      {activeReport === 'application' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">
                {Object.values(reportData.byStatus).reduce((a: number, b: any) => a + (Number(b) || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{reportData.byStatus['approved'] || 0}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">
                {Object.entries(reportData.byStatus)
                  .filter(([s]) => !['approved', 'rejected'].includes(s))
                  .reduce((a: number, [, c]) => a + (Number(c) || 0), 0)}
              </p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{reportData.byStatus['rejected'] || 0}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Report */}
      {activeReport === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.financialData?.totalRevenue || 0)}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(reportData.dealStats?.deal_total_amount ? reportData.dealStats.deal_total_amount - reportData.dealStats.deal_paid_amount : 0)}
              </p>
              <p className="text-sm text-gray-500">Pending Payments</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {reportData.dealStats?.deal_paid_amount ? formatCurrency(reportData.dealStats.deal_paid_amount) : '$0'}
              </p>
              <p className="text-sm text-gray-500">Paid Amount</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {reportData.dealStats?.deal_total_amount ? formatCurrency(reportData.dealStats.deal_total_amount) : '$0'}
              </p>
              <p className="text-sm text-gray-500">Total Deal Value</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance */}
      {activeReport === 'team' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h2>
          <p className="text-gray-500 text-center py-12">
            Team performance metrics will be available once team assignments are configured.
          </p>
        </div>
      )}
    </Layout>
  );
}
