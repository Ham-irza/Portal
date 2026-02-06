import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Download, FileText, TrendingUp, Users, Calendar, DollarSign } from 'lucide-react';

interface ReportData {
  byService: Record<string, number>;
  byStatus: Record<string, number>;
  byMonth: { month: string; count: number }[];
  partnerPerformance: { name: string; total: number; completed: number }[];
  financialData: { totalRevenue: number; pendingPayments: number; paidPayments: number; byType: Record<string, number> };
}

export default function AdminReports() {
  const { profile } = useAuth();

  const [reportData, setReportData] = useState<ReportData>({
    byService: {},
    byStatus: {},
    byMonth: [],
    partnerPerformance: [],
    financialData: { totalRevenue: 0, pendingPayments: 0, paidPayments: 0, byType: {} }
  });
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<'overview' | 'partner' | 'application' | 'team' | 'financial'>('overview');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Use backend report endpoints. Admin gets aggregated data including partner filter,
      // partners get their own partner report.
      if (profile?.role === 'admin' || profile?.role === 'team_member') {
        const res = await api.getAdminReport();
        // Expect backend to return structured object similar to ReportData
        setReportData(prev => ({
          ...prev,
          byService: res.by_service || res.byService || {},
          byStatus: res.by_status || res.byStatus || {},
          byMonth: res.by_month || res.byMonth || [],
          partnerPerformance: res.partner_performance || res.partnerPerformance || [],
          financialData: res.financial || res.financialData || { totalRevenue: 0, pendingPayments: 0, paidPayments: 0, byType: {} }
        }));
      } else {
        // Partner view
        const res = await api.getPartnerReport();
        setReportData(prev => ({
          ...prev,
          byService: res.by_service || res.byService || {},
          byStatus: res.by_status || res.byStatus || {},
          byMonth: res.by_month || res.byMonth || [],
          partnerPerformance: res.partner_performance || res.partnerPerformance || [],
          financialData: res.financial || res.financialData || { totalRevenue: 0, pendingPayments: 0, paidPayments: 0, byType: {} }
        }));
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
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
        const blob = await api.exportAdminReportCSV({ start_date: dateRange.from || undefined, end_date: dateRange.to || undefined });
        downloadBlob(blob, `admin-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.csv`);
      } else {
        const blob = await api.exportPartnerReportCSV({ start_date: dateRange.from || undefined, end_date: dateRange.to || undefined });
        downloadBlob(blob, `partner-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.csv`);
      }
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. Check console for details.');
    }
  };

  const onExportPDF = async () => {
    try {
      if (profile?.role === 'admin' || profile?.role === 'team_member') {
        // Admin PDF export uses CSV route currently; backend may provide PDF endpoint for admin as well
        const blob = await api.exportAdminReportCSV({ start_date: dateRange.from || undefined, end_date: dateRange.to || undefined });
        downloadBlob(blob, `admin-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.csv`);
      } else {
        const blob = await api.exportPartnerReportPDF({ start_date: dateRange.from || undefined, end_date: dateRange.to || undefined });
        downloadBlob(blob, `partner-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.pdf`);
      }
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. Check console for details.');
    }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h]).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reports = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
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

      {/* Date Range Filter */}
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
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={onExportPDF} className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-lg hover:bg-charcoal-dark transition">
              <Download className="h-4 w-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Overview Report */}
      {activeReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Service Type */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Applications by Service</h2>
              <button 
                onClick={() => exportCSV(Object.entries(reportData.byService).map(([service, count]) => ({ service, count })), 'applications-by-service')}
                className="text-orange-500 hover:text-orange-600 text-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(reportData.byService).map(([service, count]) => (
                <div key={service}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{service}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(reportData.byService), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Applications by Status</h2>
              <button 
                onClick={() => exportCSV(Object.entries(reportData.byStatus).map(([status, count]) => ({ status, count })), 'applications-by-status')}
                className="text-orange-500 hover:text-orange-600 text-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-3">
              {Object.entries(reportData.byStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{status}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(count / Math.max(...Object.values(reportData.byStatus), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Monthly Trend</h2>
              <button 
                onClick={() => exportCSV(reportData.byMonth, 'monthly-trend')}
                className="text-orange-500 hover:text-orange-600 text-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="flex items-end gap-4 h-48">
              {reportData.byMonth.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all"
                    style={{ height: `${(item.count / Math.max(...reportData.byMonth.map(m => m.count), 1)) * 100}%`, minHeight: '10px' }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partner Performance Report */}
      {activeReport === 'partner' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Partner Performance Report</h2>
              <button 
                onClick={() => exportCSV(reportData.partnerPerformance, 'partner-performance')}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Applications</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportData.partnerPerformance.map((partner, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{partner.name}</td>
                  <td className="px-6 py-4 text-gray-700">{partner.total}</td>
                  <td className="px-6 py-4 text-gray-700">{partner.completed}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${partner.total > 0 ? (partner.completed / partner.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {partner.total > 0 ? Math.round((partner.completed / partner.total) * 100) : 0}%
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-500">
                {Object.values(reportData.byStatus).reduce((a, b) => a + b, 0)}
              </p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{reportData.byStatus['Approved'] || 0}</p>
              <p className="text-sm text-gray-500">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-500">
                {Object.entries(reportData.byStatus)
                  .filter(([s]) => !['Approved', 'Rejected'].includes(s))
                  .reduce((a, [, c]) => a + c, 0)}
              </p>
              <p className="text-sm text-gray-500">In Progress</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">{reportData.byStatus['Rejected'] || 0}</p>
              <p className="text-sm text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Report */}
      {activeReport === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                ${(reportData.financialData?.totalRevenue || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Revenue</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                ${(reportData.financialData?.pendingPayments || 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Pending Payments</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {reportData.financialData?.paidPayments || 0}
              </p>
              <p className="text-sm text-gray-500">Completed Transactions</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <p className="text-2xl font-bold text-gray-900">
                ${((reportData.financialData?.totalRevenue || 0) + (reportData.financialData?.pendingPayments || 0)).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total Value</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Revenue by Payment Type</h2>
              <button 
                onClick={() => exportCSV([
                  { type: 'Deposit', amount: reportData.financialData?.byType?.deposit || 0 },
                  { type: 'Final', amount: reportData.financialData?.byType?.final || 0 },
                  { type: 'Additional', amount: reportData.financialData?.byType?.additional || 0 }
                ], 'revenue-by-type')}
                className="text-orange-500 hover:text-orange-600 text-sm"
              >
                Export CSV
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Deposit Payments', value: reportData.financialData?.byType?.deposit || 0, color: 'bg-blue-500' },
                { label: 'Final Payments', value: reportData.financialData?.byType?.final || 0, color: 'bg-green-500' },
                { label: 'Additional Payments', value: reportData.financialData?.byType?.additional || 0, color: 'bg-purple-500' }
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-medium text-gray-900">${item.value.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${Math.min((item.value / Math.max((reportData.financialData?.totalRevenue || 1), 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Summary</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-xl font-bold text-green-600">Paid</p>
                <p className="text-sm text-gray-600">${(reportData.financialData?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-xl font-bold text-yellow-600">Pending</p>
                <p className="text-sm text-gray-600">${(reportData.financialData?.pendingPayments || 0).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xl font-bold text-gray-600">Collection Rate</p>
                <p className="text-sm text-gray-600">
                  {(reportData.financialData?.totalRevenue || 0) + (reportData.financialData?.pendingPayments || 0) > 0
                    ? Math.round(((reportData.financialData?.totalRevenue || 0) / ((reportData.financialData?.totalRevenue || 0) + (reportData.financialData?.pendingPayments || 0))) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Performance */}
      {activeReport === 'team' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h2>
          <p className="text-gray-500 text-center py-12">
            Team performance metrics will be available once team assignments are configured.
          </p>
        </div>
      )}
    </Layout>
  );
}
