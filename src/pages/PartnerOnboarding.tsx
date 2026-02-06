import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const STEPS = [
  { id: 1, title: 'Company Information', icon: 'building' },
  { id: 2, title: 'Contact Details', icon: 'user' },
  { id: 3, title: 'Business Profile', icon: 'briefcase' },
  { id: 4, title: 'Document Upload', icon: 'document' },
  { id: 5, title: 'Agreement', icon: 'check' },
];

const SPECIALIZATIONS = [
  'Company Registration',
  'Work Permits',
  'Visa Processing',
  'Tax Advisory',
  'Legal Consulting',
  'Real Estate',
  'Import/Export',
  'Investment Advisory',
];

export default function PartnerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    company_name: '',
    website: '',
    registration_number: '',
    contact_name: '',
    contact_email: user?.email || '',
    contact_phone: '',
    address: '',
    country: 'China',
    years_experience: 0,
    specializations: [] as string[],
    monthly_volume: '',
    business_license: null as File | null,
    certifications: [] as File[],
    agree_terms: false,
    signature: '',
  });

  const updateForm = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.agree_terms || !formData.signature) {
      setError('Please agree to terms and provide your signature');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload documents if any
      let licensePath = null;
      if (formData.business_license) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('partner-documents')
          .upload(`${user?.id}/business-license-${Date.now()}`, formData.business_license);
        if (uploadError) throw uploadError;
        licensePath = uploadData.path;
      }

      // Create partner record
      const { error: insertError } = await supabase.from('partners').insert({
        user_id: user?.id,
        company_name: formData.company_name,
        registration_number: formData.registration_number,
        country: formData.country,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
        address: formData.address,
        years_experience: formData.years_experience,
        specializations: formData.specializations,
        monthly_volume: formData.monthly_volume,
        application_status: 'pending',
        application_data: {
          license_path: licensePath,
          signature: formData.signature,
          submitted_at: new Date().toISOString(),
        }
      });

      if (insertError) throw insertError;

      navigate('/dashboard', { state: { message: 'Application submitted successfully!' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.company_name && formData.registration_number;
      case 2:
        return formData.contact_name && formData.contact_email && formData.contact_phone;
      case 3:
        return formData.years_experience >= 0 && formData.specializations.length > 0;
      case 4:
        return true;
      case 5:
        return formData.agree_terms && formData.signature;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center">
          <img src="/logo.png" alt="HCS" className="h-10" />
          <h1 className="ml-4 text-xl font-semibold text-gray-800">Partner Onboarding</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.id}
                </div>
                <span className={`ml-2 text-sm hidden md:block ${
                  currentStep >= step.id ? 'text-gray-800' : 'text-gray-400'
                }`}>{step.title}</span>
                {idx < STEPS.length - 1 && (
                  <div className={`w-16 lg:w-24 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Company Information</h2>
              <p className="text-gray-600">Tell us about your company</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={e => updateForm('company_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Your Company Ltd."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business License Number *</label>
                  <input
                    type="text"
                    value={formData.registration_number}
                    onChange={e => updateForm('registration_number', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="91110000XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={e => updateForm('website', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={e => updateForm('country', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="China">China</option>
                    <option value="Hong Kong">Hong Kong</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Contact Details</h2>
              <p className="text-gray-600">Primary contact person information</p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={e => updateForm('contact_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={e => updateForm('contact_email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={e => updateForm('contact_phone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+86 138 0000 0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                  <textarea
                    value={formData.address}
                    onChange={e => updateForm('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Full address including city and postal code"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Profile */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Business Profile</h2>
              <p className="text-gray-600">Tell us about your experience and focus areas</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                <input
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={e => updateForm('years_experience', parseInt(e.target.value) || 0)}
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Specializations * (select all that apply)</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SPECIALIZATIONS.map(spec => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialization(spec)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        formData.specializations.includes(spec)
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-orange-300'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expected Monthly Referral Volume</label>
                <select
                  value={formData.monthly_volume}
                  onChange={e => updateForm('monthly_volume', e.target.value)}
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select volume</option>
                  <option value="1-5">1-5 referrals</option>
                  <option value="6-15">6-15 referrals</option>
                  <option value="16-30">16-30 referrals</option>
                  <option value="30+">30+ referrals</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Document Upload */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Document Upload</h2>
              <p className="text-gray-600">Upload required business documents</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business License</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => updateForm('business_license', e.target.files?.[0] || null)}
                      className="hidden"
                      id="license-upload"
                    />
                    <label htmlFor="license-upload" className="cursor-pointer">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      {formData.business_license ? (
                        <p className="text-orange-600 font-medium">{formData.business_license.name}</p>
                      ) : (
                        <p className="text-gray-600">Click to upload or drag and drop<br/>PDF, JPG, PNG up to 10MB</p>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Certifications (optional)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                      onChange={e => updateForm('certifications', Array.from(e.target.files || []))}
                      className="hidden"
                      id="cert-upload"
                    />
                    <label htmlFor="cert-upload" className="cursor-pointer">
                      <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {formData.certifications.length > 0 ? (
                        <p className="text-orange-600 font-medium">{formData.certifications.length} file(s) selected</p>
                      ) : (
                        <p className="text-gray-600">Upload any relevant certifications</p>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Agreement & Signature */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Partnership Agreement</h2>
              <p className="text-gray-600">Review and sign the partnership agreement</p>
              
              <div className="bg-gray-50 rounded-lg p-6 h-64 overflow-y-auto border">
                <h3 className="font-semibold mb-4">Partner Agreement Terms</h3>
                <div className="text-sm text-gray-600 space-y-3">
                  <p>1. <strong>Referral Obligations:</strong> Partner agrees to refer qualified clients to Hainan Corporate Services (HCS) for business registration, visa processing, and related services.</p>
                  <p>2. <strong>Commission Structure:</strong> Partner shall receive commissions as per the current tier structure. Commission rates are subject to change with 30 days notice.</p>
                  <p>3. <strong>Confidentiality:</strong> Partner agrees to maintain confidentiality of all client information and proprietary business processes.</p>
                  <p>4. <strong>Compliance:</strong> Partner shall comply with all applicable laws and regulations in their jurisdiction.</p>
                  <p>5. <strong>Term:</strong> This agreement is effective upon approval and continues until terminated by either party with 30 days written notice.</p>
                  <p>6. <strong>Payment Terms:</strong> Commissions are paid monthly for referrals that result in completed transactions.</p>
                </div>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={formData.agree_terms}
                  onChange={e => updateForm('agree_terms', e.target.checked)}
                  className="mt-1 h-5 w-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                />
                <label htmlFor="agree-terms" className="ml-3 text-gray-700">
                  I have read and agree to the Partnership Agreement Terms and Conditions
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Electronic Signature *</label>
                <input
                  type="text"
                  value={formData.signature}
                  onChange={e => updateForm('signature', e.target.value)}
                  placeholder="Type your full legal name"
                  className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent italic"
                />
                <p className="text-sm text-gray-500 mt-2">By typing your name, you agree this constitutes your electronic signature.</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => currentStep === 1 ? navigate('/login') : setCurrentStep(s => s - 1)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(s => s + 1)}
                disabled={!canProceed()}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="px-8 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
