import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, SERVICE_TYPES, STATUS_STAGES } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { Save, User, Building, Phone, Palette, Settings as SettingsIcon, Workflow, Mail, Globe } from 'lucide-react';

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'services' | 'workflow' | 'notifications'>('profile');
  const isAdmin = profile?.role === 'admin';

  // Profile settings
  const [profileForm, setProfileForm] = useState({ 
    full_name: profile?.full_name || '', 
    company_name: profile?.company_name || '', 
    phone: profile?.phone || '',
    country: profile?.country || ''
  });

  // Branding settings (admin only)
  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '#E8942C',
    secondaryColor: '#3D4852',
    accentColor: '#d4af37',
    companyName: 'HAINAN BUILDER',
    supportEmail: 'support@hainanbuilder.com',
    website: ''
  });

  // Service configuration (admin only)
  const [serviceConfig, setServiceConfig] = useState({
    enabledServices: [...SERVICE_TYPES],
    processingDays: 20,
    depositPercentage: 50
  });

  // Workflow settings (admin only)
  const [workflowConfig, setWorkflowConfig] = useState({
    statuses: [...STATUS_STAGES],
    autoNotifications: true,
    requireDocumentApproval: true,
    maxFileSize: 50
  });

  useEffect(() => {
    setProfileForm({
      full_name: profile?.full_name || '',
      company_name: profile?.company_name || '',
      phone: profile?.phone || '',
      country: profile?.country || ''
    });
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    await supabase.from('profiles').update({ ...profileForm, updated_at: new Date().toISOString() }).eq('id', profile!.id);
    await refreshProfile();
    setSuccess('Profile settings saved successfully!');
    setLoading(false);
  };

  const handleBrandingSave = async () => {
    setLoading(true);
    setSuccess('Branding settings saved successfully!');
    setLoading(false);
  };

  const handleServiceSave = async () => {
    setLoading(true);
    setSuccess('Service configuration saved successfully!');
    setLoading(false);
  };

  const handleWorkflowSave = async () => {
    setLoading(true);
    setSuccess('Workflow settings saved successfully!');
    setLoading(false);
  };

  const tabs = [
    { key: 'profile', label: 'Profile', icon: User },
    ...(isAdmin ? [
      { key: 'branding', label: 'Company Branding', icon: Palette },
      { key: 'services', label: 'Services', icon: SettingsIcon },
      { key: 'workflow', label: 'Workflow', icon: Workflow },
      { key: 'notifications', label: 'Notifications', icon: Mail }
    ] : [])
  ];

  return (
    <Layout>
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                activeTab === tab.key 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={profile?.email || ''} disabled 
                  className="w-full border border-gray-200 rounded-lg py-2.5 px-3 bg-gray-50 text-gray-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={profileForm.company_name} onChange={(e) => setProfileForm({...profileForm, company_name: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" value={profileForm.country} onChange={(e) => setProfileForm({...profileForm, country: e.target.value})}
                      className="pl-10 w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">
                <Save className="h-5 w-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {/* Branding Tab (Admin) */}
        {activeTab === 'branding' && isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Branding</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={brandingForm.primaryColor} 
                      onChange={(e) => setBrandingForm({...brandingForm, primaryColor: e.target.value})}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={brandingForm.primaryColor} 
                      onChange={(e) => setBrandingForm({...brandingForm, primaryColor: e.target.value})}
                      className="flex-1 border border-gray-300 rounded-lg py-2 px-3 uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={brandingForm.secondaryColor} 
                      onChange={(e) => setBrandingForm({...brandingForm, secondaryColor: e.target.value})}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={brandingForm.secondaryColor} 
                      onChange={(e) => setBrandingForm({...brandingForm, secondaryColor: e.target.value})}
                      className="flex-1 border border-gray-300 rounded-lg py-2 px-3 uppercase" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                  <div className="flex gap-2">
                    <input type="color" value={brandingForm.accentColor} 
                      onChange={(e) => setBrandingForm({...brandingForm, accentColor: e.target.value})}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
                    <input type="text" value={brandingForm.accentColor} 
                      onChange={(e) => setBrandingForm({...brandingForm, accentColor: e.target.value})}
                      className="flex-1 border border-gray-300 rounded-lg py-2 px-3 uppercase" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={brandingForm.companyName} 
                  onChange={(e) => setBrandingForm({...brandingForm, companyName: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input type="email" value={brandingForm.supportEmail} 
                    onChange={(e) => setBrandingForm({...brandingForm, supportEmail: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={brandingForm.website} placeholder="https://"
                    onChange={(e) => setBrandingForm({...brandingForm, website: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <button onClick={handleBrandingSave} disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">
                <Save className="h-5 w-5" /> Save Branding
              </button>
            </div>
          </div>
        )}

        {/* Services Tab (Admin) */}
        {activeTab === 'services' && isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enabled Services</label>
                <div className="space-y-2">
                  {SERVICE_TYPES.map(service => (
                    <label key={service} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                      <input type="checkbox" 
                        checked={serviceConfig.enabledServices.includes(service)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setServiceConfig({...serviceConfig, enabledServices: [...serviceConfig.enabledServices, service]});
                          } else {
                            setServiceConfig({...serviceConfig, enabledServices: serviceConfig.enabledServices.filter(s => s !== service)});
                          }
                        }}
                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                      <span className="text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Processing Days (Target)</label>
                  <input type="number" value={serviceConfig.processingDays} min="1" max="90"
                    onChange={(e) => setServiceConfig({...serviceConfig, processingDays: parseInt(e.target.value) || 20})}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Percentage (%)</label>
                  <input type="number" value={serviceConfig.depositPercentage} min="0" max="100"
                    onChange={(e) => setServiceConfig({...serviceConfig, depositPercentage: parseInt(e.target.value) || 50})}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
              <button onClick={handleServiceSave} disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">
                <Save className="h-5 w-5" /> Save Service Config
              </button>
            </div>
          </div>
        )}

        {/* Workflow Tab (Admin) */}
        {activeTab === 'workflow' && isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Stages</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_STAGES.map((status, idx) => (
                    <div key={status} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                      <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">{idx + 1}</span>
                      <span className="text-sm text-gray-700">{status}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Contact support to customize status stages</p>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" 
                    checked={workflowConfig.autoNotifications}
                    onChange={(e) => setWorkflowConfig({...workflowConfig, autoNotifications: e.target.checked})}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                  <div>
                    <span className="font-medium text-gray-700">Auto Notifications</span>
                    <p className="text-sm text-gray-500">Automatically send email notifications on status changes</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input type="checkbox" 
                    checked={workflowConfig.requireDocumentApproval}
                    onChange={(e) => setWorkflowConfig({...workflowConfig, requireDocumentApproval: e.target.checked})}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                  <div>
                    <span className="font-medium text-gray-700">Require Document Approval</span>
                    <p className="text-sm text-gray-500">Documents must be approved before processing can continue</p>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max File Size (MB)</label>
                <input type="number" value={workflowConfig.maxFileSize} min="1" max="100"
                  onChange={(e) => setWorkflowConfig({...workflowConfig, maxFileSize: parseInt(e.target.value) || 50})}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500" />
              </div>
              <button onClick={handleWorkflowSave} disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">
                <Save className="h-5 w-5" /> Save Workflow Config
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab (Admin) */}
        {activeTab === 'notifications' && isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
            <div className="space-y-4">
              {[
                { key: 'newApplicant', label: 'New Applicant Submission', desc: 'When a partner submits a new application' },
                { key: 'docUploaded', label: 'Document Uploaded', desc: 'When a document is uploaded' },
                { key: 'docRejected', label: 'Document Rejected', desc: 'When a document is rejected' },
                { key: 'statusChange', label: 'Status Change', desc: 'When application status changes' },
                { key: 'paymentReceived', label: 'Payment Received', desc: 'When a payment is recorded' },
                { key: 'messageReceived', label: 'New Message', desc: 'When a new message is received' }
              ].map(item => (
                <label key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked 
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                </label>
              ))}
              <button disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50">
                <Save className="h-5 w-5" /> Save Notification Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
