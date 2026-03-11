import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { 
  ArrowLeft, Save, User, Mail, Phone, Globe, FileText, Calendar, 
  AlertCircle, Plus, Trash2, Heart, MapPin, CheckCircle, Info
} from 'lucide-react';

interface CustomField {
  key: string;
  value: string;
}

interface RequiredDocument {
  id: number;
  title: string;
  optional: boolean;
}

interface ServiceType {
  id: number;
  key: string;
  name: string;
  description?: string;
  requirements?: RequiredDocument[]; // The nested documents from your Django backend
}

export default function NewApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for dynamic visa types
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    nationality: '',
    passport_number: '',
    passport_expiry_date: '',
    date_of_birth: '',
    gender: 'M' as 'M' | 'F' | 'O',
    marital_status: 'single' as 'single' | 'married' | 'divorced' | 'widowed',
    visa_type: '', // Starts empty, will be set when services load
    destination_country: 'UAE',
    travel_date: '',
    notes: ''
  });

  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Fetch Service Types on component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServiceTypes();
        const servicesList = Array.isArray(res) ? res : ((res as any)?.results || []);
        setServiceTypes(servicesList);
        
        // Auto-select the first visa type if available
        if (servicesList.length > 0) {
          setFormData(prev => ({ ...prev, visa_type: servicesList[0].name }));
        }
      } catch (err) {
        console.error('Failed to load visa types:', err);
        setError('Could not load visa types. Please refresh the page.');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', text: string) => {
    const newFields = [...customFields];
    newFields[index][field] = text;
    setCustomFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.visa_type) {
      setError('Please select a visa type');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const extraData = customFields.reduce((acc, field) => {
        if (field.key.trim()) {
          acc[field.key.trim()] = field.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const applicantData: any = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || '',
        phone: formData.phone.trim(),
        nationality: formData.nationality.trim() || '',
        passport_number: formData.passport_number.trim() || '',
        passport_expiry_date: formData.passport_expiry_date || null,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender,
        marital_status: formData.marital_status,
        visa_type: formData.visa_type,
        destination_country: formData.destination_country,
        travel_date: formData.travel_date || null,
        notes: formData.notes.trim() || '',
        status: 'new',
      };

      if (Object.keys(extraData).length > 0) {
        applicantData.extra_data = extraData;
      }

      const data = await api.createApplicant(applicantData);
      navigate(`/applications/${data.id}`);
    } catch (err: unknown) {
      console.error('Error creating application:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create application');
      }
    } finally {
      setLoading(false);
    }
  };

  // Find the currently selected service to display its requirements
  const selectedService = serviceTypes.find(s => s.name === formData.visa_type);

  return (
    <Layout>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5" /> Back
      </button>

      <div className="max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Applicant</h1>
          <p className="text-gray-600 mt-1">Create a new visa applicant profile with all required details</p>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-orange-500" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="As per passport"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="client@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+92 300 1234567"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Pakistan"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="AB123456"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="passport_expiry_date"
                    value={formData.passport_expiry_date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Visa Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Visa Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type *</label>
                {loadingServices ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                    Loading visa types...
                  </div>
                ) : (
                  <select
                    name="visa_type"
                    value={formData.visa_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                    required
                  >
                    <option value="" disabled>Select a Visa Type</option>
                    {serviceTypes.map(type => (
                      <option key={type.id} value={type.name}>{type.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    name="destination_country"
                    value={formData.destination_country}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    <option value="UAE">UAE</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Schengen">Schengen Area</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Travel Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    name="travel_date"
                    value={formData.travel_date}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Read-Only Required Documents Block */}
            {selectedService?.requirements && selectedService.requirements.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  Required Documents Checklist
                </h3>
                <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedService.requirements.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span className="leading-tight">
                          {doc.title}
                          {doc.optional && <span className="text-gray-400 italic ml-1">(Optional)</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-4 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    These documents are required for {selectedService.name} applications. You will upload them on the next screen.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Additional Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-lg py-2 px-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Any special requirements or additional information..."
            />
          </div>

          {/* Section 4: Custom Fields */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Additional Custom Fields
              </h2>
              <button 
                type="button" 
                onClick={addCustomField}
                className="text-sm flex items-center gap-1 text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="h-4 w-4" /> Add Field
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Add any country-specific requirements here (e.g., Father's Name, Mother's Name, Previous Visa Number, etc.)
            </p>

            {customFields.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500 mb-3">No custom fields added yet.</p>
                <button 
                  type="button" 
                  onClick={addCustomField}
                  className="text-sm text-orange-600 font-medium hover:underline"
                >
                  Add your first custom field
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {customFields.map((field, index) => (
                  <div key={index} className="flex gap-3 items-start bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Field Name (e.g. Father's Name)"
                        value={field.key}
                        onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                    <div className="flex-[2]">
                      <input
                        type="text"
                        placeholder="Value (e.g. John Doe)"
                        value={field.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeCustomField(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingServices}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}