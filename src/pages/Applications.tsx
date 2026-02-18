import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getStatusColor } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Plus, Search, Filter, Eye, Trash2, AlertCircle, Loader, FileText, BadgeInfo, Edit2, X
} from 'lucide-react';

interface ServiceType {
  id: number;
  key: string;
  name: string;
  description?: string;
}

interface Applicant {
  id: number;
  full_name: string;
  passport_number: string;
  destination_country: string;
  visa_type: string;
  status: string;
  created_at: string;
  email?: string;
  phone?: string;
}

export default function Applications() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApplicant, setEditingApplicant] = useState<Applicant | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const [data, services] = await Promise.all([
        api.getApplicants(params),
        api.getServiceTypes().catch(() => [])
      ]);

      const applicantsList = Array.isArray(data) ? data : ((data as any)?.results || []);
      const servicesList = Array.isArray(services) ? services : ((services as any)?.results || []);
      
      setApplicants(applicantsList);
      setServiceTypes(servicesList);
    } catch (err: any) {
      console.error('Error fetching applicants:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const getServiceInfo = (visaType?: string) => {
    if (!visaType) return null;
    const key = visaType.toLowerCase().replace(/\s+/g, '_');
    return serviceTypes.find(s => s.key === key || s.name.toLowerCase() === visaType.toLowerCase());
  };

  const deleteApplicant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    setDeleting(id);
    try {
      await api.deleteApplicant(id);
      setApplicants(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      console.error('Error deleting applicant:', err);
      alert('Failed to delete application');
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (app: Applicant) => {
    setEditingApplicant({ ...app });
    setShowEditModal(true);
    setSaveError('');
    setSaveSuccess('');
  };

  const handleSaveEdit = async () => {
    if (!editingApplicant) return;
    
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    
    try {
      await api.updateApplicant(editingApplicant.id, {
        full_name: editingApplicant.full_name,
        passport_number: editingApplicant.passport_number,
        email: editingApplicant.email,
        phone: editingApplicant.phone,
        destination_country: editingApplicant.destination_country,
        visa_type: editingApplicant.visa_type,
        status: editingApplicant.status,
      });
      
      setSaveSuccess('Application updated successfully!');
      fetchApplicants();
      setTimeout(() => {
        setShowEditModal(false);
        setEditingApplicant(null);
        setSaveSuccess('');
      }, 1500);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update application');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600 mt-1">Manage visa applicant profiles</p>
          </div>
          <button 
            onClick={() => navigate('/applications/new')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
          >
            <Plus className="h-5 w-5" /> New Application
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, passport..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="docs_pending">Docs Pending</option>
              <option value="processing">Processing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-2" />
            <p className="text-gray-600">Loading applications...</p>
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4">Start by creating your first visa application.</p>
            <button 
              onClick={() => navigate('/applications/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
            >
              <Plus className="h-5 w-5" /> Create Application
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Full Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Passport</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Visa Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Destination</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applicants.map(app => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{app.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{app.passport_number || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="group relative inline-flex items-center gap-2">
                          {app.visa_type || '-'}
                          {getServiceInfo(app.visa_type) && (
                            <>
                              <BadgeInfo className="h-4 w-4 text-blue-500 opacity-0 group-hover:opacity-100 transition cursor-help" />
                              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-20">
                                {getServiceInfo(app.visa_type)?.description}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{app.destination_country || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEditModal(app)}
                            className="p-2 text-gray-400 hover:text-blue-500 transition"
                            title="Edit"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="p-2 text-gray-400 hover:text-orange-500 transition"
                            title="View details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => deleteApplicant(app.id)}
                            disabled={deleting === app.id}
                            className="p-2 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === app.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
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
      </div>

      {/* Edit Modal */}
      {showEditModal && editingApplicant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Application</h2>
              <button onClick={() => { setShowEditModal(false); setEditingApplicant(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {saveSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                  {saveSuccess}
                </div>
              )}
              
              {saveError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                  {saveError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingApplicant.full_name || ''}
                  onChange={(e) => setEditingApplicant({ ...editingApplicant, full_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingApplicant.email || ''}
                  onChange={(e) => setEditingApplicant({ ...editingApplicant, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editingApplicant.phone || ''}
                  onChange={(e) => setEditingApplicant({ ...editingApplicant, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <input
                  type="text"
                  value={editingApplicant.passport_number || ''}
                  onChange={(e) => setEditingApplicant({ ...editingApplicant, passport_number: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
                <input
                  type="text"
                  value={editingApplicant.visa_type || ''}
                  onChange={(e) => setEditingApplicant({ ...editingApplicant, visa_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                <input
                  type="text"
                  value={editingApplicant.destination_country || ''}
                  onChange={(e) => setEditingApplicant({ ...editingApplicant, destination_country: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editingApplicant.status || 'new'}
                  onChange={(e) => setEditingApplicant({ ...editingApplicant, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="new">New</option>
                  <option value="docs_pending">Docs Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 p-6 border-t">
              <button 
                onClick={() => { setShowEditModal(false); setEditingApplicant(null); }} 
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={saving}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
