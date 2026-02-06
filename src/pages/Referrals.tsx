import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface Referral {
  id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string;
  services_interested: string[];
  status: string;
  commission_amount: number;
  commission_status: string;
  notes: string;
  created_at: string;
}

const STATUS_STEPS = [
  { key: 'submitted', label: 'Submitted', color: 'gray' },
  { key: 'under_review', label: 'Under Review', color: 'blue' },
  { key: 'contacted', label: 'Contacted', color: 'yellow' },
  { key: 'in_negotiation', label: 'Negotiation', color: 'orange' },
  { key: 'closed_won', label: 'Closed Won', color: 'green' },
  { key: 'closed_lost', label: 'Closed Lost', color: 'red' },
];

const SERVICES = [
  'Company Registration',
  'Work Permit',
  'Visa Processing',
  'Tax Advisory',
  'Banking Services',
  'Legal Consulting',
];

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [partnerId, setPartnerId] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_name: '',
    client_company: '',
    client_email: '',
    client_phone: '',
    services_interested: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    // Get partner ID
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (partner) {
      setPartnerId(partner.id);
      
      const { data } = await supabase
        .from('referrals')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false });
      
      setReferrals(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId) return;

    const { error } = await supabase.from('referrals').insert({
      partner_id: partnerId,
      ...form,
    });

    if (!error) {
      setShowModal(false);
      setForm({
        client_name: '',
        client_company: '',
        client_email: '',
        client_phone: '',
        services_interested: [],
        notes: '',
      });
      loadData();
    }
  };

  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      services_interested: prev.services_interested.includes(service)
        ? prev.services_interested.filter(s => s !== service)
        : [...prev.services_interested, service]
    }));
  };

  const exportCSV = () => {
    const headers = ['Client Name', 'Company', 'Email', 'Status', 'Commission', 'Date'];
    const rows = filteredReferrals.map(r => [
      r.client_name,
      r.client_company,
      r.client_email,
      r.status,
      r.commission_amount,
      new Date(r.created_at).toLocaleDateString(),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referrals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredReferrals = referrals.filter(r => filter === 'all' || r.status === filter);

  const getStatusIndex = (status: string) => STATUS_STEPS.findIndex(s => s.key === status);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Referral Management</h1>
            <p className="text-gray-600 mt-1">Track and manage your client referrals</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={exportCSV}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Referral
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Referrals</p>
            <p className="text-2xl font-bold text-gray-800">{referrals.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">
              {referrals.filter(r => !['closed_won', 'closed_lost'].includes(r.status)).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Closed Won</p>
            <p className="text-2xl font-bold text-green-600">
              {referrals.filter(r => r.status === 'closed_won').length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Commissions</p>
            <p className="text-2xl font-bold text-orange-600">
              ${referrals.reduce((sum, r) => sum + (r.commission_amount || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {STATUS_STEPS.map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                filter === s.key ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Referrals List */}
        <div className="space-y-4">
          {filteredReferrals.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-gray-500">No referrals found</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium"
              >
                Submit your first referral
              </button>
            </div>
          ) : (
            filteredReferrals.map(referral => (
              <div key={referral.id} className="bg-white rounded-xl border p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-800">{referral.client_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        referral.status === 'closed_won' ? 'bg-green-100 text-green-700' :
                        referral.status === 'closed_lost' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {STATUS_STEPS.find(s => s.key === referral.status)?.label}
                      </span>
                    </div>
                    <p className="text-gray-600">{referral.client_company}</p>
                    <div className="flex gap-4 text-sm text-gray-500 mt-2">
                      <span>{referral.client_email}</span>
                      <span>{referral.client_phone}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {referral.services_interested?.map(s => (
                        <span key={s} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">{s}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 lg:mt-0 lg:text-right">
                    <p className="text-sm text-gray-500">{new Date(referral.created_at).toLocaleDateString()}</p>
                    {referral.commission_amount > 0 && (
                      <p className="text-lg font-semibold text-green-600 mt-1">
                        ${referral.commission_amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Progress */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    {STATUS_STEPS.slice(0, -1).map((step, idx) => {
                      const currentIdx = getStatusIndex(referral.status);
                      const isComplete = idx < currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div key={step.key} className="flex items-center flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isComplete ? 'bg-green-500 text-white' :
                            isCurrent ? 'bg-orange-500 text-white' :
                            'bg-gray-200 text-gray-500'
                          }`}>
                            {isComplete ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : idx + 1}
                          </div>
                          {idx < STATUS_STEPS.length - 2 && (
                            <div className={`flex-1 h-1 mx-2 ${isComplete ? 'bg-green-500' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Referral Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">New Referral</h2>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                  <input
                    type="text"
                    required
                    value={form.client_name}
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={form.client_company}
                    onChange={e => setForm(f => ({ ...f, client_company: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.client_email}
                      onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.client_phone}
                      onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Services of Interest</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICES.map(service => (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggleService(service)}
                        className={`px-3 py-2 rounded-lg border text-sm ${
                          form.services_interested.includes(service)
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                      >
                        {service}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Submit Referral
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
