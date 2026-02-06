-- HAINAN BUILDER Portal Database Schema (Enhanced)
-- Run this in Supabase SQL Editor

-- 1. Create Tables

-- Profiles table with all roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'partner' CHECK (role IN ('partner', 'admin', 'team_member')),
  phone TEXT,
  country TEXT,
  department TEXT,
  specialization TEXT,
  max_workload INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications/Applicants table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  nationality TEXT,
  passport_number TEXT,
  date_of_birth DATE,
  service_type TEXT NOT NULL,
  company_name TEXT,
  position TEXT,
  status TEXT DEFAULT 'New',
  progress INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table with review workflow
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('pending', 'uploaded', 'approved', 'rejected')),
  admin_comment TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history for audit trail
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'deposit' CHECK (type IN ('deposit', 'final', 'additional')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log for audit
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_partner_id ON applications(partner_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_assigned_to ON applications(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_application_id ON status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles" ON profiles FOR SELECT 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE 
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Allow insert for authenticated" ON profiles;
CREATE POLICY "Allow insert for authenticated" ON profiles FOR INSERT 
  WITH CHECK (true);

-- 5. RLS Policies for applications
DROP POLICY IF EXISTS "View applications" ON applications;
CREATE POLICY "View applications" ON applications FOR SELECT 
  USING (partner_id = auth.uid() OR assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')));

DROP POLICY IF EXISTS "Insert applications" ON applications;
CREATE POLICY "Insert applications" ON applications FOR INSERT 
  WITH CHECK (partner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')));

DROP POLICY IF EXISTS "Update applications" ON applications;
CREATE POLICY "Update applications" ON applications FOR UPDATE 
  USING (partner_id = auth.uid() OR assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')));

-- 6. RLS Policies for documents
DROP POLICY IF EXISTS "View documents" ON documents;
CREATE POLICY "View documents" ON documents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert documents" ON documents;
CREATE POLICY "Insert documents" ON documents FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update documents" ON documents;
CREATE POLICY "Update documents" ON documents FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Delete documents" ON documents;
CREATE POLICY "Delete documents" ON documents FOR DELETE 
  USING (uploaded_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')));

-- 7. RLS Policies for messages
DROP POLICY IF EXISTS "View messages" ON messages;
CREATE POLICY "View messages" ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert messages" ON messages;
CREATE POLICY "Insert messages" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Update messages" ON messages;
CREATE POLICY "Update messages" ON messages FOR UPDATE USING (true);

-- 8. RLS Policies for status_history
DROP POLICY IF EXISTS "View status history" ON status_history;
CREATE POLICY "View status history" ON status_history FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert status history" ON status_history;
CREATE POLICY "Insert status history" ON status_history FOR INSERT WITH CHECK (changed_by = auth.uid());

-- 9. RLS Policies for payments
DROP POLICY IF EXISTS "View payments" ON payments;
CREATE POLICY "View payments" ON payments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage payments" ON payments;
CREATE POLICY "Manage payments" ON payments FOR ALL 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')));

-- 10. RLS Policies for notifications
DROP POLICY IF EXISTS "View own notifications" ON notifications;
CREATE POLICY "View own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Insert notifications" ON notifications;
CREATE POLICY "Insert notifications" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Update own notifications" ON notifications;
CREATE POLICY "Update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());

-- 11. RLS Policies for activity_logs
DROP POLICY IF EXISTS "View activity logs" ON activity_logs;
CREATE POLICY "View activity logs" ON activity_logs FOR SELECT 
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'team_member')));

DROP POLICY IF EXISTS "Insert activity logs" ON activity_logs;
CREATE POLICY "Insert activity logs" ON activity_logs FOR INSERT WITH CHECK (true);

-- 12. Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, company_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    'partner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 13. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 14. Create first admin user (update email after running)
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- 15. Storage buckets (create in Supabase Dashboard > Storage):
-- Bucket: partner-documents (public, 50MB limit)
-- Bucket: final-documents (public, 50MB limit)
-- Add policies for public read and authenticated write
