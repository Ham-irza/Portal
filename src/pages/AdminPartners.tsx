import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Building, Search, Edit2, Ban, CheckCircle, X, Mail, Phone, Award } from 'lucide-react';

interface Partner {
  id: number;
  email: string;
  company_name: string;
  contact_name: string;
  contact_phone: string;
  status: 'pending' | 'approved' | 'blocked';
  commission_type: string;
  commission_rate: string | number;
  created_at: string;
  updated_at?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Approval',
  approved: 'Approved',
  blocked: 'Blocked',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  blocked: 'bg-red-100 text-red-800',
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const data = await api.getPartners();
      const partnersData = Array.isArray(data) ? data : ((data as any)?.results || []);
      setPartners(partnersData);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
    setLoading(false);
  };

  const updatePartnerStatus = async (id: number, newStatus: string) => {
    try {
      await api.updatePartner(id, { status: newStatus });
      fetchPartners();
    } catch (error) {
      console.error('Failed to update partner status:', error);
    }
  };

  const updateCommissionRate = async (id: number, rate: string) => {
    try {
      await api.updatePartner(id, { commission_rate: parseFloat(rate) || 0 });
      fetchPartners();
    } catch (error) {
      console.error('Failed to update commission rate:', error);
    }
  };

  const approvePartner = async (id: number) => {
    try {
      await api.approvePartner(id);
      fetchPartners();
    } catch (error) {
      console.error('Failed to approve partner:', error);
      alert('Failed to approve partner');
    }
  };

  const blockPartner = async (id: number) => {
    try {
      await api.updatePartner(id, { status: 'blocked' });
      fetchPartners();
    } catch (error) {
      console.error('Failed to block partner:', error);
    }
  };

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!editingPartner) return;
    
    try {
      await api.updatePartner(editingPartner.id, {
        company_name: editingPartner.company_name,
        contact_name: editingPartner.contact_name,
        contact_phone: editingPartner.contact_phone,
        commission_rate: editingPartner.commission_rate,
      });
      
      setShowModal(false);
      setEditingPartner(null);
      fetchPartners();
    } catch (error) {
      console.error('Failed to save partner:', error);
    }
  };

  const pendingPartners = partners.filter(p => p.status === 'pending');
  const filtered = partners.filter(p => {
    if (activeTab === 'pending') {
      if (p.status !== 'pending') return false;
    }
    if (search) {
      const s = search.toLowerCase();
      if (!p.company_name?.toLowerCase().includes(s) && 
          !p.contact_name?.toLowerCase().includes(s) && 
          !p.email?.toLowerCase().includes(s)) return false;
    }
    if (statusFilter && p.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    total: partners.length,
    approved: partners.filter(p => p.status === 'approved').length,
    pending: pendingPartners.length,
    blocked: partners.filter(p => p.status === 'blocked').length,
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Partner Management</h1>
            <p className="text-sm text-gray-500">Manage partner tiers, applications, and performance</p>
          </div>
          {pendingPartners.length > 0 && (
            <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
              {pendingPartners.length} pending application(s)
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Partners</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Blocked</p>
            <p className="text-2xl font-bold text-red-600">{stats.blocked}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'all' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            All Partners
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
              activeTab === 'pending' ? 'bg-white shadow-sm' : 'text-gray-600'
            }`}
          >
            Pending Approval
            {pendingPartners.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {pendingPartners.length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company, contact name, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No partners found</h3>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(partner => (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Building className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{partner.company_name || 'No company'}</p>
                            <p className="text-xs text-gray-500">Created {new Date(partner.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{partner.email}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            {partner.contact_name || '-'}
                          </div>
                          {partner.contact_phone && (
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Phone className="h-3 w-3" /> {partner.contact_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={partner.commission_rate}
                          onChange={(e) => updateCommissionRate(partner.id, e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                          placeholder="0.00"
                          step="0.01"
                        />
                        <p className="text-xs text-gray-500 mt-1">{partner.commission_type}</p>
                      </td>
                      <td className="px-6 py-4">
                        {partner.status === 'pending' ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS.pending}`}>
                            {STATUS_LABELS.pending}
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[partner.status] || STATUS_COLORS.approved}`}>
                            {STATUS_LABELS[partner.status] || partner.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(partner)} 
                            className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded"
                            title="Edit Partner"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showModal && editingPartner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Edit Partner</h2>
                <button onClick={() => { setShowModal(false); setEditingPartner(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    value={editingPartner.company_name || ''} 
                    onChange={(e) => setEditingPartner({ ...editingPartner, company_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                  <input 
                    type="text" 
                    value={editingPartner.contact_name || ''} 
                    onChange={(e) => setEditingPartner({ ...editingPartner, contact_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={editingPartner.contact_phone || ''} 
                    onChange={(e) => setEditingPartner({ ...editingPartner, contact_phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingPartner.commission_rate || 0} 
                    onChange={(e) => setEditingPartner({ ...editingPartner, commission_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
              </div>
              
              <div className="flex gap-3 p-6 border-t">
                <button 
                  onClick={() => { setShowModal(false); setEditingPartner(null); }} 
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
