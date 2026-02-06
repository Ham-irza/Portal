import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { 
  FileText, CheckCircle, XCircle, Clock, Eye, Download, Search, 
  AlertCircle, MessageSquare, FileCheck, RefreshCw
} from 'lucide-react';

// --- Interfaces Matching Django Backend ---

interface Document {
  id: string; // UUID
  applicant: number; // ID
  document_type: string;
  file: string; // URL
  original_filename: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string; // Admin notes
  uploaded_at: string;
  // Optional expanded fields (depends on if your serializer nests them)
  applicant_name?: string; 
  partner_name?: string;
  file_size?: number; 
}

interface VerificationChecklist {
  id: string;
  label: string;
  checked: boolean;
}

export default function AdminDocumentVerification() {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  // Verification Modal State
  const [comment, setComment] = useState('');
  const [checklist, setChecklist] = useState<VerificationChecklist[]>([]);

  // Constants
  const documentTypes = ['passport', 'photo', 'bank_statement', 'ticket', 'insurance', 'other'];
  
  const defaultChecklist: VerificationChecklist[] = [
    { id: '1', label: 'Document is legible and clear', checked: false },
    { id: '2', label: 'Information matches applicant details', checked: false },
    { id: '3', label: 'Document is not expired', checked: false },
    { id: '4', label: 'All required pages included', checked: false },
    { id: '5', label: 'No signs of tampering', checked: false },
  ];

  // --- Actions ---

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Fetch all documents for admin
      const response: any = await api.getAllAdminDocuments();
      const data = Array.isArray(response) ? response : (response.results || []);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const downloadFile = async (doc: Document) => {
    try {
      const blob = await api.downloadDocument(doc.id as any);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_filename || `doc-${doc.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  const openVerification = (doc: Document) => {
    setSelectedDoc(doc);
    setComment(doc.notes || '');
    // Reset checklist on open
    setChecklist(defaultChecklist.map(c => ({ ...c, checked: false })));
  };

  const handleVerification = async (status: 'approved' | 'rejected') => {
    if (!selectedDoc) return;

    try {
      // Call API to update status
      await api.verifyDocument(selectedDoc.id, { 
        status, 
        notes: comment 
      });

      // Update local state to reflect change immediately
      setDocuments(documents.map(d =>
        d.id === selectedDoc.id ? { ...d, status, notes: comment } : d
      ));
      
      setSelectedDoc(null);
    } catch (err) {
      console.error('Error updating document:', err);
      alert('Failed to update document status');
    }
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(c =>
      c.id === id ? { ...c, checked: !c.checked } : c
    ));
  };

  // --- Helpers ---

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter Logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = (doc.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(doc.applicant).includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending').length,
    approved: documents.filter(d => d.status === 'approved').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
          <p className="text-gray-600">Review and verify partner uploaded documents</p>
        </div>
        <button onClick={fetchDocuments} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-bold text-green-600">{stats.approved}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search filename or applicant ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 capitalize"
          >
            <option value="all">All Types</option>
            {documentTypes.map(type => (
              <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Document Queue</h2>
          <span className="text-xs text-gray-500">Showing {filteredDocs.length} documents</span>
        </div>
        
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500">All caught up! No documents match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="p-4 hover:bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate pr-4">{doc.original_filename}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs capitalize">
                        {doc.document_type.replace(/_/g, ' ')}
                      </span>
                      <span>•</span>
                      <span>Applicant #{doc.applicant}</span>
                      {doc.applicant_name && (
                        <>
                          <span>•</span>
                          <span>{doc.applicant_name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)} capitalize`}>
                    {doc.status}
                  </span>
                  
                  {/* Action Buttons */}
                  {doc.status === 'pending' && (
                    <button
                      onClick={() => openVerification(doc)}
                      className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-600 shadow-sm transition"
                    >
                      <Eye className="h-4 w-4" /> Review
                    </button>
                  )}
                  
                  {(doc.status === 'approved' || doc.status === 'rejected') && (
                    <button
                      onClick={() => openVerification(doc)}
                      className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 transition"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Verify Document</h2>
                <p className="text-sm text-gray-500">Applicant ID: {selectedDoc.applicant}</p>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-2 hover:bg-gray-100 rounded-full transition">
                <XCircle className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left Column: File Preview */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Document Preview
                  </h3>
                  
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50 flex flex-col items-center justify-center text-center h-64">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                      <FileText className="h-12 w-12 text-orange-500" />
                    </div>
                    <p className="font-medium text-gray-900 break-all">{selectedDoc.original_filename}</p>
                    <p className="text-sm text-gray-500 mb-6 capitalize">{selectedDoc.document_type.replace(/_/g, ' ')}</p>
                    
                    <button 
                      onClick={() => downloadFile(selectedDoc)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg font-medium transition hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4" /> Download to View
                    </button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Metadata
                    </h4>
                    <div className="space-y-1 text-xs text-blue-800">
                      <p>Uploaded: {new Date(selectedDoc.uploaded_at).toLocaleString()}</p>
                      <p>Type: {selectedDoc.document_type}</p>
                      <p>Status: <span className="uppercase font-bold">{selectedDoc.status}</span></p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Verification Controls */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Quality Checklist
                    </h3>
                    <div className="space-y-2">
                      {checklist.map(item => (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                            item.checked ? 'bg-green-50 border-green-200 shadow-sm' : 'hover:bg-gray-50 border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={selectedDoc.status !== 'pending'}
                            checked={item.checked}
                            onChange={() => toggleChecklistItem(item.id)}
                            className="mt-1 w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
                          />
                          <span className={`text-sm ${item.checked ? 'text-green-800 font-medium' : 'text-gray-600'}`}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Comments / Rejection Reason
                    </label>
                    <textarea
                      value={comment}
                      disabled={selectedDoc.status !== 'pending'}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                      placeholder="Enter verification notes..."
                    />
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t flex gap-3">
                    {selectedDoc.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleVerification('rejected')}
                          className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-700 bg-red-50 px-4 py-2.5 rounded-lg hover:bg-red-100 font-medium transition"
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleVerification('approved')}
                          disabled={!checklist.every(c => c.checked)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition"
                        >
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                      </>
                    ) : (
                      <div className={`w-full p-3 rounded-lg text-center font-medium flex items-center justify-center gap-2 ${
                        selectedDoc.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedDoc.status === 'approved' ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        Document marked as {selectedDoc.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}