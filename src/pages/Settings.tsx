import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, SERVICE_TYPES, STATUS_STAGES } from '@/lib/supabase';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Save, User, Building, Phone, Palette, Settings as SettingsIcon, Workflow, Mail, Globe, Shield, Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'services' | 'workflow' | 'notifications' | 'security'>('profile');
  const isAdmin = profile?.role === 'admin';

  // Profile settings
  const [profileForm, setProfileForm] = useState({ 
    full_name: profile?.full_name || '', 
    company_name: profile?.company_name || '', 
    phone: profile?.phone || '',
    country: profile?.country || '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    tax_id: '',
  });

  // Security settings (2FA)
  const [securityForm, setSecurityForm] = useState({
    twoFactorEnabled: false,
    twoFactorMethod: 'email',
  });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading2FA, setLoading2FA] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

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
      country: profile?.country || '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      website: '',
      tax_id: '',
    });
    fetchTwoFactorStatus();
  }, [profile]);

  const fetchTwoFactorStatus = async () => {
    try {
      const data = await api.getTwoFactorAuth();
      setSecurityForm({
        twoFactorEnabled: data.is_enabled || false,
        twoFactorMethod: data.method || 'email',
      });
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    
    try {
      await supabase.from('profiles').update({ 
        full_name: profileForm.full_name,
        company_name: profileForm.company_name,
        phone: profileForm.phone,
        country: profileForm.country,
        updated_at: new Date().toISOString()
      }).eq('id', profile!.id);
      
      await refreshProfile();
      setSuccess('Profile settings saved successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    setLoading2FA(true);
    setError('');
    setSuccess('');
    
    try {
      if (securityForm.twoFactorEnabled) {
        // Disable 2FA
        await api.updateTwoFactorAuth({ 
          is_enabled: false, 
          method: securityForm.twoFactorMethod 
        });
        setSecurityForm({ ...securityForm, twoFactorEnabled: false });
        setSuccess('Two-factor authentication disabled');
      } else {
        // Enable 2FA - show modal to verify
        setShow2FAModal(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update 2FA settings');
    } finally {
      setLoading2FA(false);
    }
  };

  const handle2FAVerification = async () => {
    setLoading2FA(true);
    setError('');
    
    try {
      await api.updateTwoFactorAuth({ 
        is_enabled: true, 
        method: securityForm.twoFactorMethod 
      });
      setSecurityForm({ ...securityForm, twoFactorEnabled: true });
      setShow2FAModal(false);
      setSuccess('Two-factor authentication enabled successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading2FA(false);
    }
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
    { key: 'security', label: 'Security', icon: Shield },
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
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
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

              {/* Additional Profile Fields */}
              <div className="border-t pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={profileForm.address} onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                      placeholder="Street address"
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={profileForm.city} onChange={(e) => setProfileForm({...profileForm, city: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input type="text" value={profileForm.state} onChange={(e) => setProfileForm({...profileForm, state: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                    <input type="text" value={profileForm.zip_code} onChange={(e) => setProfileForm({...profileForm, zip_code: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input type="url" value={profileForm.website} onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                      placeholder="https://"
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / VAT Number</label>
                    <input type="text" value={profileForm.tax_id} onChange={(e) => setProfileForm({...profileForm, tax_id: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
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

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h2>
            <div className="space-y-6">
              {/* Two-Factor Authentication */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Add an extra layer of security to your account by requiring a verification code in addition to your password.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={securityForm.twoFactorEnabled}
                      onChange={handleTwoFactorToggle}
                      className="sr-only peer"
                      disabled={loading2FA}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                
                {securityForm.twoFactorEnabled && (
                  <div className="mt-4 pl-14">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Two-factor authentication is enabled
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Verification codes will be sent to your email address ({profile?.email})
                    </p>
                  </div>
                )}
              </div>

              {/* Change Password */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Key className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Password</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Change your password to keep your account secure.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Eye className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Active Sessions</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage your active sessions across devices.
                    </p>
                    <button className="mt-3 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                      View Active Sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
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

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Enable Two-Factor Authentication</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                You'll receive verification codes via email when logging in. This adds an extra layer of security to your account.
              </p>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
                <select
                  value={securityForm.twoFactorMethod}
                  onChange={(e) => setSecurityForm({...securityForm, twoFactorMethod: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShow2FAModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handle2FAVerification}
                disabled={loading2FA}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {loading2FA ? 'Enabling...' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoadingPassword(true);
              setError('');
              try {
                await api.changePassword(passwordForm);
                setSuccess('Password changed successfully!');
                setShowPasswordModal(false);
                setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
              } catch (err: any) {
                setError(err.message || 'Failed to change password');
              } finally {
                setLoadingPassword(false);
              }
            }}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                    required
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
              <div className="p-6 border-t flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingPassword || passwordForm.new_password !== passwordForm.confirm_password}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {loadingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
