import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kyajquwtvaybeubmwwup.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'partner' | 'admin' | 'team_member' | 'applicant';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: UserRole;
  phone: string | null;
  country: string | null;
  department: string | null;
  specialization: string | null;
  max_workload: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Partner = {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  country: string;
  address: string | null;
  status: 'active' | 'suspended' | 'pending';
  contract_start: string | null;
  contract_end: string | null;
  created_at: string;
};

export type Applicant = {
  id: string;
  partner_id: string;
  assigned_to: string | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  nationality: string | null;
  passport_number: string | null;
  date_of_birth: string | null;
  service_type: string;
  company_name: string | null;
  position: string | null;
  status: string;
  progress: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  partner?: Partner;
  assigned_team_member?: Profile;
};

export type Application = Applicant; // Alias for backward compatibility

export type Document = {
  id: string;
  application_id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  admin_comment: string | null;
  uploaded_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  application_id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
};

export type StatusHistory = {
  id: string;
  application_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  notes: string | null;
  created_at: string;
  changer?: Profile;
};

export type Payment = {
  id: string;
  application_id: string;
  amount: number;
  currency: string;
  type: 'deposit' | 'final' | 'additional';
  status: 'pending' | 'paid' | 'cancelled';
  due_date: string | null;
  paid_at: string | null;
  invoice_number: string | null;
  notes: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
};

export const SERVICE_TYPES = [
  'Business Registration',
  'Work Visa',
  'Family Visa',
  'Business Visa',
  'Tourist Visa'
] as const;

export const STATUS_STAGES = [
  'New',
  'Documents Pending',
  'Documents Received',
  'Under Review',
  'Processing',
  'Final Documents',
  'Approved',
  'Rejected'
] as const;

export const DOCUMENT_CATEGORIES: Record<string, string[]> = {
  'Business Registration': ['Passport Copy', 'Business Plan', 'Company Documents', 'Bank Statement', 'Application Form', 'Other'],
  'Work Visa': ['Passport Copy', 'Employment Contract', 'Education Certificates', 'Photo', 'Health Certificate', 'Criminal Record', 'Other'],
  'Family Visa': ['Passport Copy', 'Marriage Certificate', 'Birth Certificate', 'Photo', 'Sponsor Documents', 'Other'],
  'Business Visa': ['Passport Copy', 'Invitation Letter', 'Business License', 'Photo', 'Bank Statement', 'Other'],
  'Tourist Visa': ['Passport Copy', 'Photo', 'Travel Itinerary', 'Hotel Booking', 'Bank Statement', 'Other']
};

/** Backend document_type choices (Document.DOC_TYPE_*). Use these values when calling API. */
export const BACKEND_DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport Scan' },
  { value: 'photo', label: 'Passport Photo' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'ticket', label: 'Flight Ticket' },
  { value: 'insurance', label: 'Travel Insurance' },
  { value: 'other', label: 'Other' },
] as const;

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Helper functions
export const calculateProgress = (status: string): number => {
  const idx = STATUS_STAGES.indexOf(status as typeof STATUS_STAGES[number]);
  if (idx === -1) return 0;
  return Math.round((idx / (STATUS_STAGES.length - 1)) * 100);
};

export const getStatusColor = (status: string): string => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'docs_pending':
    case 'documents pending': return 'bg-yellow-100 text-yellow-800';
    case 'documents received': return 'bg-indigo-100 text-indigo-800';
    case 'under review': return 'bg-purple-100 text-purple-800';
    case 'processing': return 'bg-orange-100 text-orange-800';
    case 'final documents': return 'bg-cyan-100 text-cyan-800';
    case 'approved':
    case 'completed': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getDocStatusColor = (status: string): string => {
  switch (status) {
    case 'pending': return 'text-yellow-600 bg-yellow-50';
    case 'uploaded': return 'text-blue-600 bg-blue-50';
    case 'approved': return 'text-green-600 bg-green-50';
    case 'rejected': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};
