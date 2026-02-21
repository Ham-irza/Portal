import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, Search, FileText, DollarSign, Calendar, User, Phone, Mail,
  Building, Clock, CheckCircle, XCircle, AlertCircle, Eye, Edit2, Trash2,
  X, Upload, MessageSquare, UserCheck, CreditCard, FileCheck, StickyNote
} from 'lucide-react';

// Deal status options
const DEAL_STATUSES = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-700' },
  { value: 'docs_pending', label: 'Docs Pending', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-100 text-purple-700' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
];

// Payment status options
const PAYMENT_STATUSES = [
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-100 text-red-700' },
  { value: 'partial', label: 'Partial', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-700' },
];

// Currency options
const CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP'];

interface Deal {
  id: number;
  deal_id: string;
  applicant: number;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  applicant_passport?: string;
  visa_type: string;
  destination_country: string;
  status: string;
  payment_status: string;
  amount: number;
  paid_amount: number;
  balance: number;
  currency: string;
  partner_notes: string;
  partner_name?: string;
  internal_notes?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
  notes?: DealNote[];
}

interface DealNote {
  id: number;
  content: string;
  author_name: string;
  is_internal: boolean;
  created_at: string;
}

interface Applicant {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  passport_number: string;
  visa_type: string;
  destination_country: string;
}

interface Document {
  id: string;
  document_type: string;
  status: string;
  uploaded_at: string;
}

export default function Deals() {
  const { profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealDocuments, setDealDocuments] = useState<Document[]>([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | ''>('');
  const [assigningPartner, setAssigningPartner] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  
  // Form
  const [form, setForm] = useState({
    applicant: '',
    visa_type: '',
    destination_country: '',
    amount: '',
    currency: 'USD',
    partner_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'team_member';

  useEffect(() => {
    fetchDeals();
    fetchApplicants();
    if (isAdmin) {
      fetchPartners();
    }
  }, []);

  const fetchDeals = async () => {
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (filterPaymentStatus !== 'all') params.payment_status = filterPaymentStatus;
      if (dateRange.from) params.from_date = dateRange.from;
      if (dateRange.to) params.to_date = dateRange.to;
      
      const data = await api.getDeals(params);
      setDeals(data || []);
    } catch (err) {
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    try {
      const data = await api.getApplicantsForDeal();
      setApplicants(data || []);
    } catch (err) {
      console.error('Error fetching applicants:', err);
    }
  };

  const fetchPartners = async () => {
    try {
      const data: any = await api.getPartners();
      setPartners(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error('Error fetching partners:', err);
    }
  };

  const handleAssignPartner = async () => {
    if (!selectedDeal || !selectedPartnerId) return;
    try {
      await api.updateDeal(selectedDeal.id, { partner_id: selectedPartnerId });
      setAssigningPartner(false);
      setSelectedPartnerId('');
      // Refresh deal details
      const fullDeal = await api.getDeal(selectedDeal.id);
      setSelectedDeal(fullDeal);
      fetchDeals();
    } catch (err) {
      console.error('Error assigning partner:', err);
      alert('Failed to assign partner');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const dealData = {
        applicant: parseInt(form.applicant),
        visa_type: form.visa_type,
        destination_country: form.destination_country,
        amount: parseFloat(form.amount) || 0,
        currency: form.currency,
        partner_notes: form.partner_notes
      };

      if (editingDeal) {
        await api.updateDeal(editingDeal.id, dealData);
      } else {
        await api.createDeal(dealData);
      }

      resetForm();
      fetchDeals();
    } catch (err) {
      console.error('Error saving deal:', err);
      alert('Failed to save deal');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      applicant: '',
      visa_type: '',
      destination_country: '',
      amount: '',
      currency: 'USD',
      partner_notes: ''
    });
    setShowForm(false);
    setEditingDeal(null);
  };

  const handleEdit = (deal: Deal) => {
    setForm({
      applicant: deal.applicant.toString(),
      visa_type: deal.visa_type || '',
      destination_country: deal.destination_country || '',
      amount: deal.amount.toString(),
      currency: deal.currency,
      partner_notes: deal.partner_notes || ''
    });
    setEditingDeal(deal);
    setShowForm(true);
  };

  // Auto-fill form when applicant is selected
  const handleApplicantChange = (applicantId: string) => {
    setForm({ ...form, applicant: applicantId });
    
    if (applicantId) {
      const applicant = applicants.find(a => a.id === parseInt(applicantId));
      if (applicant) {
        // Auto-fill visa_type and destination_country from applicant
        setForm(prev => ({
          ...prev,
          applicant: applicantId,
          visa_type: applicant.visa_type || '',
          destination_country: applicant.destination_country || ''
        }));
      }
    }
  };

  const handleDelete = async (dealId: number) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await api.deleteDeal(dealId);
      fetchDeals();
    } catch (err) {
      console.error('Error deleting deal:', err);
      alert('Failed to delete deal');
    }
  };

  const handleViewDetails = async (deal: Deal) => {
    try {
      const fullDeal = await api.getDeal(deal.id);
      setSelectedDeal(fullDeal);
      
      // Fetch documents for this applicant
      const docs = await api.getDocuments(deal.applicant);
      setDealDocuments(docs || []);
    } catch (err) {
      console.error('Error fetching deal details:', err);
    }
  };

  const handleAddNote = async () => {
    if (!selectedDeal || !noteContent.trim()) return;
    
    try {
      await api.createDealNote(selectedDeal.id, noteContent, false);
      setNoteContent('');
      setShowNoteForm(false);
      // Refresh deal details
      const fullDeal = await api.getDeal(selectedDeal.id);
      setSelectedDeal(fullDeal);
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note');
    }
  };

  const handleUpdateStatus = async (dealId: number, newStatus: string) => {
    try {
      await api.updateDeal(dealId, { status: newStatus });
      fetchDeals();
      if (selectedDeal?.id === dealId) {
        const fullDeal = await api.getDeal(dealId);
        setSelectedDeal(fullDeal);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleUpdatePayment = async (dealId: number, paidAmount: number, paymentStatus: string) => {
    try {
      // Update the deal with new payment info
      const updatedDeal = await api.updateDeal(dealId, { 
        paid_amount: paidAmount,
        payment_status: paymentStatus
      });
      
      // Update local deals state with the updated deal
      setDeals(prevDeals => prevDeals.map(d => {
        if (d.id === dealId) {
          return {
            ...d,
            paid_amount: paidAmount,
            payment_status: paymentStatus,
            balance: updatedDeal.balance || (updatedDeal.amount - paidAmount)
          };
        }
        return d;
      }));
      
      // Also refresh the full deal details
      if (selectedDeal?.id === dealId) {
        const fullDeal = await api.getDeal(dealId);
        setSelectedDeal(fullDeal);
      }
    } catch (err) {
      console.error('Error updating payment:', err);
      alert('Failed to update payment');
    }
  };

  // Handle partner "Pay Now" - pay full amount
  const handlePayNow = async (dealId: number, amount: number) => {
    if (!confirm(`Confirm payment of ${formatCurrency(amount)}?`)) return;
    try {
      const updatedDeal = await api.updateDeal(dealId, { 
        paid_amount: amount,
        payment_status: 'paid'
      });
      
      // Update local state
      setDeals(prevDeals => prevDeals.map(d => {
        if (d.id === dealId) {
          return {
            ...d,
            paid_amount: amount,
            payment_status: 'paid',
            balance: 0
          };
        }
        return d;
      }));
      
      if (selectedDeal?.id === dealId) {
        const fullDeal = await api.getDeal(dealId);
        setSelectedDeal(fullDeal);
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Failed to process payment');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusObj = DEAL_STATUSES.find(s => s.value === status);
    return statusObj ? (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusObj.color}`}>
        {statusObj.label}
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusObj = PAYMENT_STATUSES.find(s => s.value === status);
    return statusObj ? (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusObj.color}`}>
        {statusObj.label}
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Stats
  const stats = {
    total: deals.length,
    totalAmount: deals.reduce((sum, d) => sum + d.amount, 0),
    totalPaid: deals.reduce((sum, d) => sum + d.paid_amount, 0),
    totalBalance: deals.reduce((sum, d) => sum + d.balance, 0),
    paidCount: deals.filter(d => d.payment_status === 'paid').length,
    pendingCount: deals.filter(d => d.payment_status === 'unpaid').length,
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
        <p className="text-gray-600">Manage visa application cases and track progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Deals</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalAmount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalPaid)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Balance</p>
              <p className="text-xl font-bold">{formatCurrency(stats.totalBalance)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><AlertCircle className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Unpaid</p>
              <p className="text-xl font-bold">{stats.pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDeals()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              {DEAL_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Payments</option>
              {PAYMENT_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              placeholder="From"
            />
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
              placeholder="To"
            />
            <button
              onClick={fetchDeals}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Filter
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            <Plus className="h-4 w-4" /> New Deal
          </button>
        </div>
      </div>

      {/* Deals Table */}
      {deals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-500 mb-6">Create your first deal to start tracking visa applications</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" /> Create Deal
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visa Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map(deal => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium">{deal.deal_id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{deal.applicant_name}</p>
                        <p className="text-sm text-gray-500">{deal.applicant_phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deal.visa_type || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {deal.destination_country || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(deal.status)}
                    </td>
                    <td className="px-6 py-4">
                      {getPaymentBadge(deal.payment_status)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{formatCurrency(deal.amount, deal.currency)}</p>
                        <p className="text-sm text-gray-500">
                          {deal.balance > 0 ? `Bal: ${formatCurrency(deal.balance, deal.currency)}` : 'Paid'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(deal.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(deal)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(deal)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{editingDeal ? 'Edit Deal' : 'Create New Deal'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicant *</label>
                <select
                  required
                  value={form.applicant}
                  onChange={(e) => handleApplicantChange(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  disabled={!!editingDeal}
                >
                  <option value="">Select an applicant...</option>
                  {applicants.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.full_name} {app.passport_number ? `(${app.passport_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
                  <input
                    type="text"
                    value={form.visa_type}
                    onChange={(e) => setForm({ ...form, visa_type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Tourist, Business, Work"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                  <input
                    type="text"
                    value={form.destination_country}
                    onChange={(e) => setForm({ ...form, destination_country: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., China, USA"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <div className="flex gap-2">
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Partner Notes)</label>
                <textarea
                  value={form.partner_notes}
                  onChange={(e) => setForm({ ...form, partner_notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Add any notes for this deal..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingDeal ? 'Update Deal' : 'Create Deal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Details Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Deal Details</h2>
                <p className="text-sm text-gray-500">{selectedDeal.deal_id}</p>
              </div>
              <button onClick={() => setSelectedDeal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Applicant Summary */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Applicant Summary</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">Name</p>
                    <p className="font-medium truncate" title={selectedDeal.applicant_name}>{selectedDeal.applicant_name}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">Phone</p>
                    <p className="font-medium truncate" title={selectedDeal.applicant_phone || '-'}>{selectedDeal.applicant_phone || '-'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">Email</p>
                    <p className="font-medium truncate" title={selectedDeal.applicant_email || '-'}>{selectedDeal.applicant_email || '-'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 truncate">Passport No.</p>
                    <p className="font-medium truncate" title={selectedDeal.applicant_passport || '-'}>{selectedDeal.applicant_passport || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Deal Info */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Deal Information</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Visa Type</p>
                    <p className="font-medium">{selectedDeal.visa_type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Destination</p>
                    <p className="font-medium">{selectedDeal.destination_country || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    {getStatusBadge(selectedDeal.status)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment</p>
                    {getPaymentBadge(selectedDeal.payment_status)}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assigned To</p>
                    <p className="font-medium">{selectedDeal.assigned_to_name || 'Unassigned'}</p>
                  </div>
                </div>
                
                {/* Admin Status Update & Partner Assignment */}
                {isAdmin && (
                  <>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Update Status (Admin Only)</p>
                      <div className="flex gap-2 flex-wrap">
                        {DEAL_STATUSES.map(status => (
                          <button
                            key={status.value}
                            onClick={() => handleUpdateStatus(selectedDeal.id, status.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${status.color} ${selectedDeal.status === status.value ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-60 hover:opacity-100'}`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Partner Assignment */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">Assign to Partner (Admin Only)</p>
                        <button
                          onClick={() => {
                            setAssigningPartner(!assigningPartner);
                            setSelectedPartnerId('');
                          }}
                          className="text-xs text-orange-500 hover:text-orange-600"
                        >
                          {assigningPartner ? 'Cancel' : 'Change Partner'}
                        </button>
                      </div>
                      
                      {assigningPartner ? (
                        <div className="flex gap-2">
                          <select
                            value={selectedPartnerId}
                            onChange={(e) => setSelectedPartnerId(e.target.value ? Number(e.target.value) : '')}
                            className="flex-1 border rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="">Select a partner...</option>
                            {partners.map(partner => (
                              <option key={partner.id} value={partner.id}>
                                {partner.company_name}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleAssignPartner}
                            disabled={!selectedPartnerId}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 text-sm"
                          >
                            Assign
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-medium">{selectedDeal.partner_name || 'No partner assigned'}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Payments */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-900">Payments</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Amount</p>
                    <p className="text-xl font-bold">{formatCurrency(selectedDeal.amount, selectedDeal.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid Amount</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(selectedDeal.paid_amount, selectedDeal.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Balance</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(selectedDeal.balance, selectedDeal.currency)}</p>
                  </div>
                </div>
                
                {/* Payment Button for Partners */}
                {!isAdmin && selectedDeal.balance > 0 && (
                  <button 
                    onClick={() => handlePayNow(selectedDeal.id, selectedDeal.amount)}
                    className="w-full mt-4 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" /> Pay Now (Pay {formatCurrency(selectedDeal.balance, selectedDeal.currency)})
                  </button>
                )}
                
                {/* Admin Payment Update */}
                {isAdmin && selectedDeal.balance > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-2">Update Payment (Admin Only)</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdatePayment(selectedDeal.id, selectedDeal.amount, 'paid')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => handleUpdatePayment(selectedDeal.id, selectedDeal.paid_amount + selectedDeal.amount * 0.5, 'partial')}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        Add 50%
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Documents Checklist */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900">Documents Checklist</h3>
                  </div>
                  <button className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1">
                    <Upload className="h-4 w-4" /> Upload
                  </button>
                </div>
                {dealDocuments.length > 0 ? (
                  <div className="space-y-2">
                    {dealDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">{doc.document_type}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                )}
              </div>

              {/* Notes & Updates */}
              <div className="bg-white rounded-xl border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-5 w-5 text-orange-500" />
                    <h3 className="font-semibold text-gray-900">Notes & Updates</h3>
                  </div>
                  <button 
                    onClick={() => setShowNoteForm(true)}
                    className="text-sm text-orange-500 hover:text-orange-600 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Note
                  </button>
                </div>
                
                {showNoteForm && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <textarea
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Add a note..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => { setShowNoteForm(false); setNoteContent(''); }}
                        className="px-3 py-1 text-sm text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddNote}
                        className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                )}
                
                {selectedDeal.notes && selectedDeal.notes.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDeal.notes.map(note => (
                      <div key={note.id} className={`p-3 rounded-lg ${note.is_internal ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{note.author_name}</span>
                          <span className="text-xs text-gray-500">{formatDate(note.created_at)}</span>
                        </div>
                        <p className="text-sm">{note.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No notes yet.</p>
                )}
                
                {selectedDeal.partner_notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-1">Partner Notes:</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{selectedDeal.partner_notes}</p>
                  </div>
                )}
                
                {isAdmin && selectedDeal.internal_notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 mb-1">Internal Notes (Staff Only):</p>
                    <p className="text-sm bg-red-50 p-3 rounded-lg">{selectedDeal.internal_notes}</p>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-500 pt-4 border-t flex justify-between">
                <p>Created: {formatDate(selectedDeal.created_at)}</p>
                <p>Last Updated: {formatDate(selectedDeal.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
