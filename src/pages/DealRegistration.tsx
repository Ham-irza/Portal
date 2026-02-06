import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Plus, Search, Filter, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle,
  DollarSign, Calendar, Building, User, Phone, Mail, FileText, Shield,
  TrendingUp, Eye, Edit2, Trash2, RefreshCw
} from 'lucide-react';

interface Deal {
  id: string;
  partner_id: string;
  customer_name: string;
  customer_company: string;
  customer_email: string;
  customer_phone: string;
  opportunity_value: number;
  currency: string;
  expected_close_date: string;
  competitive_situation: string;
  notes: string;
  status: string;
  protection_expiry: string;
  assigned_to: string;
  won_date: string;
  lost_reason: string;
  created_at: string;
}

const CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP'];
const STATUSES = ['submitted', 'under_review', 'approved', 'in_progress', 'won', 'lost'];

export default function DealRegistration() {
  const { user, profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  
  const [form, setForm] = useState({
    customer_name: '',
    customer_company: '',
    customer_email: '',
    customer_phone: '',
    opportunity_value: '',
    currency: 'USD',
    expected_close_date: '',
    competitive_situation: '',
    notes: ''
  });

  const isAdmin = profile?.role === 'admin' || profile?.role === 'team_member';

  useEffect(() => {
    if (user) fetchDeals();
  }, [user]);

  const fetchDeals = async () => {
    try {
      let query = supabase.from('deals').select('*').order('created_at', { ascending: false });
      if (!isAdmin) {
        query = query.eq('partner_id', user!.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setDeals(data || []);
    } catch (err) {
      console.error('Error fetching deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicate = async (company: string, email: string) => {
    if (!company && !email) return;
    const { data } = await supabase
      .from('deals')
      .select('id, customer_company, customer_email, partner_id')
      .or(`customer_company.ilike.%${company}%,customer_email.ilike.%${email}%`)
      .neq('id', editingDeal?.id || '00000000-0000-0000-0000-000000000000');
    
    if (data && data.length > 0) {
      const existing = data[0];
      if (existing.partner_id === user?.id) {
        setDuplicateWarning('You already have a deal registered for this customer.');
      } else {
        setDuplicateWarning('This customer may already be registered by another partner.');
      }
    } else {
      setDuplicateWarning('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const protectionExpiry = new Date();
      protectionExpiry.setDate(protectionExpiry.getDate() + 90);
      
      const dealData = {
        partner_id: user!.id,
        customer_name: form.customer_name,
        customer_company: form.customer_company,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        opportunity_value: parseFloat(form.opportunity_value) || 0,
        currency: form.currency,
        expected_close_date: form.expected_close_date || null,
        competitive_situation: form.competitive_situation,
        notes: form.notes,
        status: 'submitted',
        protection_expiry: protectionExpiry.toISOString().split('T')[0]
      };

      if (editingDeal) {
        const { error } = await supabase.from('deals').update(dealData).eq('id', editingDeal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('deals').insert(dealData);
        if (error) throw error;
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
      customer_name: '',
      customer_company: '',
      customer_email: '',
      customer_phone: '',
      opportunity_value: '',
      currency: 'USD',
      expected_close_date: '',
      competitive_situation: '',
      notes: ''
    });
    setShowForm(false);
    setEditingDeal(null);
    setDuplicateWarning('');
  };

  const handleEdit = (deal: Deal) => {
    setForm({
      customer_name: deal.customer_name,
      customer_company: deal.customer_company,
      customer_email: deal.customer_email || '',
      customer_phone: deal.customer_phone || '',
      opportunity_value: deal.opportunity_value.toString(),
      currency: deal.currency,
      expected_close_date: deal.expected_close_date || '',
      competitive_situation: deal.competitive_situation || '',
      notes: deal.notes || ''
    });
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleStatusUpdate = async (dealId: string, newStatus: string) => {
    try {
      const updates: Partial<Deal> = { status: newStatus };
      if (newStatus === 'won') updates.won_date = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase.from('deals').update(updates).eq('id', dealId);
      if (error) throw error;
      fetchDeals();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'in_progress': return <TrendingUp className="h-4 w-4" />;
      case 'won': return <CheckCircle className="h-4 w-4" />;
      case 'lost': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-700';
      case 'under_review': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-purple-100 text-purple-700';
      case 'won': return 'bg-emerald-100 text-emerald-700';
      case 'lost': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.customer_company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || deal.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: deals.length,
    submitted: deals.filter(d => d.status === 'submitted').length,
    approved: deals.filter(d => d.status === 'approved' || d.status === 'in_progress').length,
    won: deals.filter(d => d.status === 'won').length,
    totalValue: deals.reduce((sum, d) => sum + (d.opportunity_value || 0), 0),
    wonValue: deals.filter(d => d.status === 'won').reduce((sum, d) => sum + (d.opportunity_value || 0), 0)
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
        <h1 className="text-2xl font-bold text-gray-900">Deal Registration</h1>
        <p className="text-gray-600">Register and track your sales opportunities</p>
      </div>

      {/* Stats */}
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
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold">{stats.submitted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Won</p>
              <p className="text-xl font-bold">{stats.won}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><DollarSign className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pipeline Value</p>
              <p className="text-lg font-bold">{formatCurrency(stats.totalValue, 'USD')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            <Plus className="h-4 w-4" /> Register Deal
          </button>
        </div>
      </div>

      {/* Deal Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingDeal ? 'Edit Deal' : 'Register New Deal'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {duplicateWarning && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{duplicateWarning}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={form.customer_company}
                      onChange={(e) => {
                        setForm({ ...form, customer_company: e.target.value });
                        checkDuplicate(e.target.value, form.customer_email);
                      }}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={form.customer_email}
                      onChange={(e) => {
                        setForm({ ...form, customer_email: e.target.value });
                        checkDuplicate(form.customer_company, e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="john@acme.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.customer_phone}
                      onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Value *</label>
                  <div className="flex gap-2">
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                    >
                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={form.opportunity_value}
                        onChange={(e) => setForm({ ...form, opportunity_value: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="10000"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="date"
                      value={form.expected_close_date}
                      onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competitive Situation</label>
                <select
                  value={form.competitive_situation}
                  onChange={(e) => setForm({ ...form, competitive_situation: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select...</option>
                  <option value="no_competition">No Competition</option>
                  <option value="weak_competition">Weak Competition</option>
                  <option value="strong_competition">Strong Competition</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Additional details about this opportunity..."
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-700">Deal protection: 90 days from registration</span>
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
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {editingDeal ? 'Update Deal' : 'Register Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-500 mb-6">Register your first deal to start tracking opportunities</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" /> Register Deal
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Protection</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expected Close</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDeals.map(deal => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{deal.customer_name}</p>
                      <p className="text-sm text-gray-500">{deal.customer_company}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{formatCurrency(deal.opportunity_value, deal.currency)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                        {getStatusIcon(deal.status)}
                        {deal.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {deal.protection_expiry && (
                        <span className={`text-sm ${new Date(deal.protection_expiry) < new Date() ? 'text-red-600' : 'text-green-600'}`}>
                          {new Date(deal.protection_expiry).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(deal)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {isAdmin && deal.status === 'submitted' && (
                          <button
                            onClick={() => handleStatusUpdate(deal.id, 'approved')}
                            className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                            title="Approve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {(deal.status === 'approved' || deal.status === 'in_progress') && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(deal.id, 'won')}
                              className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                              title="Mark as Won"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(deal.id, 'lost')}
                              className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                              title="Mark as Lost"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
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
    </Layout>
  );
}
