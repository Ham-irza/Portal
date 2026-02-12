import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  STATUS_STAGES, DOCUMENT_CATEGORIES, BACKEND_DOCUMENT_TYPES, ALLOWED_FILE_TYPES, MAX_FILE_SIZE,
  getStatusColor, getDocStatusColor, calculateProgress
} from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  ArrowLeft, Upload, Download, Send, FileText, MessageSquare, Clock, 
  Check, X, AlertCircle, User, Edit2, DollarSign, History, 
  Trash2, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';

interface Applicant {
  id: number; // Django AutoField
  full_name: string;
  email?: string;
  phone?: string;
  passport_number?: string;
  passport_expiry_date?: string;
  nationality?: string;
  visa_type?: string;
  date_of_birth?: string;
  destination_country?: string;
  marital_status?: string;
  status: string;
  notes?: string;
  extra_data?: Record<string, any>; // JSONField
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string; // UUIDField -> String in Frontend
  applicant: number;
  document_type: string; // e.g. 'passport', 'photo'
  file: string; // URL string
  original_filename: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string; // Backend uses 'notes', not 'admin_comment'
  uploaded_at: string;
  
}

interface Payment {
  id: number;
  applicant: number;
  amount: number | string; // DecimalField often comes as string to preserve precision
  currency: string;
  status: 'unpaid' | 'paid' | 'partial' | 'refunded';
  payment_date?: string | null;
  invoice_number?: string;
  receipt_file?: string | null;
  notes?: string;
  created_at: string;
}
interface ServiceType {
  id: number;
  key: string;
  name: string;
  description?: string;
}

interface DocumentRequirement {
  id: number;
  service: number;
  service_key?: string;
  service_name?: string;
  document_name: string;
  is_optional: boolean;
}
export default function ApplicationDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [app, setApp] = useState<Applicant | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'documents' | 'messages' | 'history' | 'payments'>('documents');
  const [editingExtra, setEditingExtra] = useState(false);
  const [extraDataEdit, setExtraDataEdit] = useState<Record<string, string>>({});
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'team_member';

  // Get document requirements for the applicant's visa type
  const visaTypeKey = app?.visa_type?.toLowerCase().replace(/\s+/g, '_') || '';
  const applicantDocRequirements = documentRequirements.filter(
    (req) => req.service_key === visaTypeKey || req.service_name?.toLowerCase() === app?.visa_type?.toLowerCase()
  );

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const applicantId = parseInt(id);
      const [appData, docsData, payData, servicesData, reqsData] = await Promise.all([
        api.getApplicant(applicantId),
        api.getDocuments(applicantId),
        api.getPayments(applicantId),
        api.getServiceTypes().catch(() => []),
        api.getDocumentRequirements().catch(() => []),
      ]);
      setApp(appData);

      // `getDocuments` and `getPayments` may return either an array or a paginated
      // object { results: [...] }. Normalize both to arrays to avoid runtime
      // errors like "documents.filter is not a function".
      const normalizedDocs = Array.isArray(docsData) ? docsData : ((docsData as any)?.results || []);
      const normalizedPayments = Array.isArray(payData) ? payData : ((payData as any)?.results || []);

      setDocuments(normalizedDocs);
      setPayments(normalizedPayments);
      setServiceTypes(Array.isArray(servicesData) ? servicesData : ((servicesData as any)?.results || []));
      setDocumentRequirements(Array.isArray(reqsData) ? reqsData : ((reqsData as any)?.results || []));

      // Messages and status history not available in backend yet
      setMessages([]);
      setStatusHistory([]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (newStatus: string) => {
    if (!app) return;
    try {
      await api.updateApplicant(app.id, { status: newStatus });
      setApp({ ...app, status: newStatus });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const startEditingExtra = () => {
    if (app?.extra_data) {
      setExtraDataEdit({ ...app.extra_data });
    } else {
      setExtraDataEdit({});
    }
    setEditingExtra(true);
  };

  const cancelEditingExtra = () => {
    setEditingExtra(false);
    setNewFieldKey('');
    setNewFieldValue('');
  };

  const addNewExtraField = () => {
    if (newFieldKey.trim()) {
      setExtraDataEdit({
        ...extraDataEdit,
        [newFieldKey.trim()]: newFieldValue
      });
      setNewFieldKey('');
      setNewFieldValue('');
    }
  };

  const removeExtraField = (key: string) => {
    const updated = { ...extraDataEdit };
    delete updated[key];
    setExtraDataEdit(updated);
  };

  const updateExtraField = (key: string, value: string) => {
    setExtraDataEdit({
      ...extraDataEdit,
      [key]: value
    });
  };

  const saveExtraData = async () => {
    if (!app) return;
    try {
      await api.updateApplicant(app.id, { extra_data: extraDataEdit });
      setApp({ ...app, extra_data: extraDataEdit });
      setEditingExtra(false);
      setNewFieldKey('');
      setNewFieldValue('');
    } catch (error) {
      console.error('Error saving custom fields:', error);
      alert('Failed to save custom fields');
    }
  };

  const sendMessage = async () => {
    // Messages not implemented in backend yet
    alert('Messages feature coming soon');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 50MB`;
    }
    return null;
  };

  const uploadFile = async (file: File, category: string) => {
    if (!app) return;
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('applicant', app.id.toString());
      formData.append('document_type', category);
      formData.append('file', file);
      const typeLabel = BACKEND_DOCUMENT_TYPES.find(t => t.value === category)?.label;
      if (typeLabel) {
        formData.append('notes', `Uploaded: ${typeLabel}`);
      }

      await api.uploadDocument(formData);
      fetchData();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && selectedCategory) {
      for (const file of files) {
        await uploadFile(file, selectedCategory);
      }
    } else if (!selectedCategory) {
      alert('Please select a document category first');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !selectedCategory) return;
    for (const file of Array.from(files)) {
      await uploadFile(file, selectedCategory);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadFile = async (doc: Document) => {
    try {
      const blob = await api.downloadDocument(doc.id as any);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.original_filename || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download document');
    }
  };

  const updateDocStatus = async (docId: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      await api.updateDocument(docId, {
        status,
        notes: comment || undefined,
      });
      fetchData();
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  };

  const deleteDocument = async (doc: Document) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteDocument(doc.id);
      fetchData();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  if (loading) return <Layout><div className="text-center py-12"><div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div></div></Layout>;
  if (!app) return <Layout><div className="text-center py-12">Application not found</div></Layout>;

  // Backend status values: new, docs_pending, processing, approved, rejected, completed
  const BACKEND_STATUSES = ['new', 'docs_pending', 'processing', 'approved', 'rejected', 'completed'] as const;

  const documentTypeOptions = [...BACKEND_DOCUMENT_TYPES];

  // Compute progress stage from documents according to rules:
  // - If some documents uploaded and all pending -> Documents Pending (idx 1)
  // - If all required documents uploaded -> Documents Received (idx 2)
  // - If any approved or rejected -> Under Review (idx 3)
  // - If >50% categories approved -> Processing (idx 4)
  // - If >90% categories approved -> Final Documents (idx 5)
  // - If all categories approved -> Approved (idx 6)
  const computeStageFromDocs = () => {
    const categories = documentTypeOptions.map(d => d.value);
    const totalRequired = categories.length;
    if (totalRequired === 0) return -1; // no document-type information

    const categoryDocs = categories.map(cat => documents.filter(d => d.document_type === cat));
    const uploadedCategories = categoryDocs.filter(arr => arr.length > 0).length;
    const approvedCategories = categoryDocs.filter(arr => arr.some(d => d.status === 'approved')).length;
    const rejectedCategories = categoryDocs.filter(arr => arr.some(d => d.status === 'rejected')).length;
    // categories where at least one file exists and all files are pending
    const pendingOnlyCategories = categoryDocs.filter(arr => arr.length > 0 && arr.every(d => d.status === 'pending')).length;

    const approvedPercent = approvedCategories / totalRequired;

    if (approvedCategories === totalRequired) return 6; // Approved
    if (approvedPercent > 0.9) return 5; // Final Documents
    if (approvedPercent > 0.5) return 4; // Processing
    if (approvedCategories > 0 || rejectedCategories > 0) return 3; // Under Review
    if (uploadedCategories === totalRequired) return 2; // Documents Received
    if (uploadedCategories > 0 && pendingOnlyCategories === uploadedCategories) return 1; // Documents Pending
    return 0; // New
  };

  const statusToStageIndex: Record<string, number> = {
    new: 0,
    docs_pending: 1,
    processing: 4,
    approved: 6,
    rejected: 7,
    completed: 6,
  };

  // Prefer document-driven stage when we have document-type definitions; fall back to backend status otherwise.
  const docStage = computeStageFromDocs();
  const backendStage = statusToStageIndex[app.status] ?? 0;
  const currentStageIdx = docStage >= 0 ? Math.max(backendStage, docStage) : backendStage;

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" /> Back
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Client Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-500" />
                  {app.full_name}
                </h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                  {app.status}
                </span>
              </div>
              {isAdmin && (
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="h-5 w-5 text-gray-500" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Passport:</span> <span className="text-gray-900 font-medium">{app.passport_number || '-'}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{app.email || '-'}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{app.phone || '-'}</span></div>
              <div><span className="text-gray-500">Nationality:</span> <span className="text-gray-900">{app.nationality || '-'}</span></div>
              <div><span className="text-gray-500">Visa Type:</span> <span className="text-gray-900 font-medium">{app.visa_type || '-'}</span></div>
              <div><span className="text-gray-500">DOB:</span> <span className="text-gray-900">{app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : '-'}</span></div>
            </div>
            {app.notes && <p className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{app.notes}</p>}
          </div>

          {/* Custom Fields Section */}
          {(app.extra_data && Object.keys(app.extra_data).length > 0) || editingExtra ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Additional Information
                </h3>
                {isAdmin && !editingExtra && (
                  <button 
                    onClick={startEditingExtra}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm"
                  >
                    <Edit2 className="h-4 w-4" /> Edit
                  </button>
                )}
              </div>

              {editingExtra ? (
                <div className="space-y-4">
                  {/* Display existing fields for editing */}
                  {Object.entries(extraDataEdit).map(([key, value]) => (
                    <div key={key} className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          value={key}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateExtraField(key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExtraField(key)}
                        className="p-2 text-gray-400 hover:text-red-500 transition mt-5"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}

                  {/* Add new field section */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">Add a new custom field:</p>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Field Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Father's Name"
                          value={newFieldKey}
                          onChange={(e) => setNewFieldKey(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={newFieldValue}
                          onChange={(e) => setNewFieldValue(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addNewExtraField}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <button
                      onClick={cancelEditingExtra}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveExtraData}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium text-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {Object.entries(app.extra_data || {}).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-gray-900 font-medium block">{typeof value === 'object' ? JSON.stringify(value) : String(value || '-')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Document Requirements Section */}
          {applicantDocRequirements.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Required Documents for {app?.visa_type || 'This Visa'}
                </h3>
              </div>
              <div className="space-y-2">
                {applicantDocRequirements.map((req) => {
                  const uploadedDocs = documents.filter(
                    (doc) => doc.document_type.toLowerCase().includes(req.document_name.toLowerCase())
                  );
                  const hasApproved = uploadedDocs.some((d) => d.status === 'approved');
                  const hasUploaded = uploadedDocs.length > 0;

                  return (
                    <div
                      key={req.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition ${
                        hasApproved
                          ? 'border-green-200 bg-green-50'
                          : hasUploaded
                          ? 'border-blue-200 bg-blue-50'
                          : req.is_optional
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-yellow-200 bg-yellow-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {hasApproved ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : hasUploaded ? (
                          <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        ) : req.is_optional ? (
                          <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {req.document_name}
                            {req.is_optional && (
                              <span className="text-xs font-normal text-gray-500 ml-2">(Optional)</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap ml-2 ${
                          hasApproved
                            ? 'bg-green-100 text-green-700'
                            : hasUploaded
                            ? 'bg-blue-100 text-blue-700'
                            : req.is_optional
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {hasApproved ? 'Approved' : hasUploaded ? 'Uploaded' : req.is_optional ? 'Optional' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Timeline */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Progress</h3>
            <div className="relative">
              <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded">
                <div className="h-full bg-orange-500 rounded transition-all" style={{ width: `${(currentStageIdx / (STATUS_STAGES.length - 1)) * 100}%` }} />
              </div>
              <div className="relative flex justify-between">
                {STATUS_STAGES.map((stage, idx) => (
                  <div key={stage} className="flex flex-col items-center" style={{ width: `${100 / STATUS_STAGES.length}%` }}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium z-10 border-2 ${
                      idx < currentStageIdx ? 'bg-orange-500 border-orange-500 text-white' :
                      idx === currentStageIdx ? 'bg-orange-500 border-orange-500 text-white ring-4 ring-orange-100' :
                      'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {idx < currentStageIdx ? <Check className="h-5 w-5" /> : idx + 1}
                    </div>
                    <span className="mt-2 text-xs text-center text-gray-600 hidden md:block max-w-[80px]">{stage}</span>
                  </div>
                ))}
              </div>
            </div>
            {isAdmin && (
              <div className="mt-6 pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                <select value={app.status} onChange={(e) => updateStatus(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500">
                  <option value="new">New</option>
                  <option value="docs_pending">Docs Pending</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b">
              {[
                { key: 'documents', label: 'Documents', icon: FileText, count: documents.length },
                { key: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
                { key: 'history', label: 'Status History', icon: History, count: statusHistory.length },
                { key: 'payments', label: 'Payments', icon: DollarSign, count: payments.length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition ${
                    activeTab === tab.key ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div>
                  {/* Upload Area */}
                  <div className="mb-6">
                    <div className="flex gap-4 mb-4">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select document type...</option>
                        {documentTypeOptions.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition ${
                        selectedCategory ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}>
                        <Upload className="h-4 w-4" /> Upload
                        <input 
                          ref={fileInputRef}
                          type="file" 
                          className="hidden" 
                          onChange={handleFileChange}
                          disabled={!selectedCategory || uploading}
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                      </label>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                        dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      }`}
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin text-orange-500" />
                          <span className="text-gray-600">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-600">Drag and drop files here</p>
                          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX - Max 50MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Document Checklist */}
                  <h4 className="font-medium text-gray-900 mb-3">Document Checklist</h4>
                  <div className="space-y-2">
                    {documentTypeOptions.map(({ value, label }) => {
                      const catDocs = documents.filter(d => d.document_type === value);
                      const hasApproved = catDocs.some(d => d.status === 'approved');
                      const hasUploaded = catDocs.length > 0;
                      return (
                        <div key={value} className={`flex items-center justify-between p-3 rounded-lg border ${
                          hasApproved ? 'border-green-200 bg-green-50' : hasUploaded ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            {hasApproved ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                             hasUploaded ? <Clock className="h-5 w-5 text-blue-600" /> :
                             <AlertCircle className="h-5 w-5 text-gray-400" />}
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            hasApproved ? 'bg-green-100 text-green-700' :
                            hasUploaded ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {hasApproved ? 'Approved' : hasUploaded ? 'Uploaded' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Document List */}
                  {documents.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                      <div className="space-y-2">
                        {documents.map(doc => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{doc.original_filename}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{doc.document_type}</span>
                                  <span>-</span>
                                  <span>{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                  <span className={`px-1.5 py-0.5 rounded ${getDocStatusColor(doc.status)}`}>
                                    {doc.status}
                                  </span>
                                </div>
                                {doc.notes && (
                                  <p className="text-xs text-red-600 mt-1">{doc.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAdmin && doc.status === 'pending' && (
                                <>
                                  <button onClick={() => updateDocStatus(doc.id, 'approved')} 
                                    className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Approve">
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => {
                                    const comment = prompt('Rejection reason:');
                                    if (comment) updateDocStatus(doc.id, 'rejected', comment);
                                  }} className="p-1.5 text-red-600 hover:bg-red-100 rounded" title="Reject">
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              )}
                              <button onClick={() => downloadFile(doc)} className="p-1.5 text-orange-500 hover:bg-orange-100 rounded">
                                <Download className="h-4 w-4" />
                              </button>
                              {doc.status === 'rejected' && !isAdmin && (
                                <label className="p-1.5 text-blue-500 hover:bg-blue-100 rounded cursor-pointer" title="Re-upload">
                                  <RefreshCw className="h-4 w-4" />
                                  <input type="file" className="hidden" onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      await deleteDocument(doc);
                                      await uploadFile(file, doc.document_type);
                                    }
                                  }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                                </label>
                              )}
                              {isAdmin && (
                                <button onClick={() => deleteDocument(doc)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div>
                  <div className="h-80 overflow-y-auto mb-4 space-y-3">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
                    ) : (
                      messages.map(msg => (
                        <div key={msg.id} className={`p-3 rounded-lg ${msg.sender_id === user?.id ? 'bg-orange-50 ml-8' : 'bg-gray-100 mr-8'}`}>
                          <p className="text-sm text-gray-900">{msg.content}</p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} 
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..." className="flex-1 border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500" />
                    <button onClick={sendMessage} className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Status History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  {statusHistory.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No status history</p>
                  ) : (
                    statusHistory.map(h => (
                      <div key={h.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <History className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {h.old_status && <span className="text-sm text-gray-500">{h.old_status}</span>}
                            {h.old_status && <span className="text-gray-400">-&gt;</span>}
                            <span className={`text-sm font-medium px-2 py-0.5 rounded ${getStatusColor(h.new_status)}`}>{h.new_status}</span>
                          </div>
                          {h.notes && <p className="text-xs text-gray-500 mt-1">{h.notes}</p>}
                          <p className="text-xs text-gray-400 mt-1">{new Date(h.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div>
                  {isAdmin && (
                    <div className="mb-4 flex gap-2">
                      <button 
                        onClick={async () => {
                          const amount = prompt('Enter amount (USD):');
                          if (!amount || isNaN(parseFloat(amount))) return;
                          const invoiceNum = `INV-${Date.now().toString(36).toUpperCase()}`;
                          await api.createPayment({
                            applicant: app.id,
                            amount: parseFloat(amount),
                            currency: 'USD',
                            status: 'unpaid',
                            invoice_number: invoiceNum,
                          });
                          fetchData();
                        }}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                      >
                        Create Invoice
                      </button>
                    </div>
                  )}
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No payment records</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map(pay => (
                        <div key={pay.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Payment</p>
                            <p className="text-sm text-gray-500">{pay.invoice_number || 'No invoice'}</p>
                            {pay.payment_date && <p className="text-xs text-gray-400">Date: {new Date(pay.payment_date).toLocaleDateString()}</p>}
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="text-lg font-bold text-gray-900">{pay.currency} {typeof pay.amount === 'number' ? pay.amount.toLocaleString() : pay.amount}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                pay.status === 'paid' ? 'bg-green-100 text-green-700' :
                                pay.status === 'unpaid' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {pay.status}
                              </span>
                            </div>
                            {isAdmin && pay.status === 'unpaid' && (
                              <button 
                                onClick={async () => {
                                  try {
                                    await api.updatePayment(pay.id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] });
                                    fetchData();
                                  } catch (error) {
                                    console.error('Error updating payment:', error);
                                  }
                                }}
                                className="px-3 py-1.5 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-900">{app.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Documents</span>
                <span className="font-medium text-gray-900">{documents.filter(d => d.status === 'approved').length}/{documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-sm text-gray-900">{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-sm text-gray-900">{new Date(app.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => { setActiveTab('documents'); setSelectedCategory(documentTypeOptions[0]?.value ?? ''); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                <Upload className="h-4 w-4" /> Upload Document
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <MessageSquare className="h-4 w-4" /> Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
