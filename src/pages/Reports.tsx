import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Download, Calendar, Users, FileText, DollarSign, TrendingUp, Filter } from 'lucide-react';

interface Deal {
  id: number;
  deal_id: string;
  applicant_name: string;
  applicant_email: string;
  status: string;
  payment_status: string;
  amount: number;
  paid_amount: number;
  balance: number;
  currency: string;
  created_at: string;
}

const DEAL_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'docs_pending', label: 'Docs Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
];

export default function Reports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>({});
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');

  useEffect(() => {
    fetchReport();
    fetchDeals();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getPartnerReport({ 
        start_date: dateRange.from || undefined, 
        end_date: dateRange.to || undefined 
      });
      setReport(res);
    } catch (err) {
      console.error('Failed to fetch partner report', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const params: any = {};
      if (dateRange.from) params.from_date = dateRange.from;
      if (dateRange.to) params.to_date = dateRange.to;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPaymentStatus !== 'all') params.payment_status = filterPaymentStatus;
      
      const data = await api.getDeals(params);
      setDeals(data || []);
    } catch (err) {
      console.error('Failed to fetch deals', err);
    }
  };

  const handleFilter = () => {
    fetchReport();
    fetchDeals();
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
      const blob = await api.exportPartnerReportCSV({ 
        start_date: dateRange.from || undefined, 
        end_date: dateRange.to || undefined 
      });
      downloadBlob(blob, `partner-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.csv`);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  const onExportPDF = async () => {
    try {
      const blob = await api.exportPartnerReportPDF({ 
        start_date: dateRange.from || undefined, 
        end_date: dateRange.to || undefined 
      });
      downloadBlob(blob, `partner-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700',
      docs_pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-purple-100 text-purple-700',
      approved: 'bg-green-100 text-green-700',
      completed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      new: 'New',
      docs_pending: 'Docs Pending',
      processing: 'Processing',
      approved: 'Approved',
      completed: 'Completed',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: 'bg-red-100 text-red-700',
      partial: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
    };
    const labels: Record<string, string> = {
      unpaid: 'Unpaid',
      partial: 'Partial',
      paid: 'Paid',
    };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Debug: log the report data
  console.log('Report data:', report);
  console.log('deal_paid_amount:', report?.deal_paid_amount);
  
  // Use deal_paid_amount from backend (that's what it's for!)
  const stats = {
    totalApplicants: report?.total_applicants_submitted || 0,
    totalDeals: report?.total_deals || deals.length,
    totalPaid: (report && report.deal_paid_amount !== undefined) ? report.deal_paid_amount : 0,
    totalCommission: report?.total_commission_earned || 0,
  };

  // Filtered deals
  const filteredDeals = deals.filter(deal => {
    const matchesStatus = filterStatus === 'all' || deal.status === filterStatus;
    const matchesPayment = filterPaymentStatus === 'all' || deal.payment_status === filterPaymentStatus;
    return matchesStatus && matchesPayment;
  });

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Partner performance and money overview</p>
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
            <button onClick={onExportPDF} className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-lg hover:bg-charcoal-dark transition">
              <Download className="h-4 w-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">Loading...</div>
      ) : (
        <>
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Applicants Submitted</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalApplicants}</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Deals (Cases)</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDeals}</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Paid Amount</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">Total Commission Earned</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalCommission)}</p>
            </div>
          </div>

          {/* Report Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Detailed Report</h2>
              <div className="flex items-center gap-2 ml-auto">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  {DEAL_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Payments</option>
                  {PAYMENT_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {filteredDeals.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No deals found for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDeals.map(deal => (
                      <tr key={deal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm">{deal.deal_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{deal.applicant_name}</p>
                            <p className="text-sm text-gray-500">{deal.applicant_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(deal.status)}
                        </td>
                        <td className="px-6 py-4">
                          {getPaymentBadge(deal.payment_status)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{formatCurrency(deal.amount)}</p>
                          <p className="text-sm text-gray-500">
                            {deal.payment_status === 'paid' ? 'Paid' : `Balance: ${formatCurrency(deal.balance)}`}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {formatCurrency(deal.amount * 0.1)} {/* Placeholder - should come from backend */}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(deal.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
