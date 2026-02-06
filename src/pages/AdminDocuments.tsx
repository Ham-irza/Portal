import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { FileText, Search, Check, X, Download, AlertCircle } from 'lucide-react';

interface AdminDocument {
  id: string;
  applicant: number;
  document_type: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  original_filename?: string;
  notes?: string;
  file?: string;
}

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setError(null);
      // Ensure we handle pagination safely if the API returns { results: [...] }
      const response: any = await api.getAllAdminDocuments();
      const data = Array.isArray(response) ? response : (response.results || []);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setDocuments([]); // Safety fallback
    }
    setLoading(false);
  };

  const updateDocStatus = async (docId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      await api.verifyDocument(docId, { status, notes: notes });
      fetchDocuments(); // Refresh list after update
    } catch (err) {
      console.error('Failed to update document status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update document');
    }
  };

  const downloadFile = async (doc: AdminDocument) => {
    try {
      const blob = await api.downloadDocument(doc.id as unknown as number);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_filename || `document_${doc.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download document:', err);
      setError('Failed to download document');
    }
  };

  // Safely extract unique document types
  const documentTypes = [...new Set(documents.map(d => d.document_type || ''))].filter(Boolean);
  
  const filtered = documents.filter(doc => {
    if (search && !doc.original_filename?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && doc.status !== statusFilter) return false;
    if (typeFilter && doc.document_type !== typeFilter) return false;
    return true;
  });

  const pendingCount = documents.filter(d => d.status === 'pending').length;
  const approvedCount = documents.filter(d => d.status === 'approved').length;
  const rejectedCount = documents.filter(d => d.status === 'rejected').length;

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Repository</h1>
          <p className="text-sm text-gray-500">
            {documents.length} documents | {pendingCount} pending review
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <p className="text-xs text-red-700 mt-1">Make sure you're logged in as an admin.</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename..."
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
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Types</option>
            {documentTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
          <p className="text-sm text-gray-500">Total Documents</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-yellow-700">Pending Review</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
          <p className="text-sm text-green-700">Approved</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-sm text-red-700">Rejected</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[250px]">{doc.original_filename || `Document ${doc.id}`}</p>
                          <p className="text-xs text-gray-500">Applicant #{doc.applicant}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {(doc.document_type || 'Unknown').replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      {doc.notes && (
                        <p className="text-xs text-red-600 mt-1 truncate max-w-[150px]">{doc.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => downloadFile(doc)} 
                          className="p-1.5 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded" 
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {doc.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateDocStatus(doc.id, 'approved')} 
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded" 
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                const notes = prompt('Enter rejection reason (optional):');
                                updateDocStatus(doc.id, 'rejected', notes || undefined);
                              }} 
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded" 
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
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