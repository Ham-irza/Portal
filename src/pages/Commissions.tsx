import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { api, type Commission } from '@/lib/api';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, Download, Calculator, 
  AlertCircle, FileText, X, Globe, RefreshCw, Plus // Added Plus icon
} from 'lucide-react';

// ... (Interfaces remain the same) ...
interface Partner {
  id: number;
  tier: string;
  commission_rate: number;
}

interface CommissionRule {
  tier: string;
  type: string;
  base_rate: number;
  bonus_rate: number;
  threshold: number;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function Commissions() {
  const { user, profile } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]); // New State for Applicants dropdown
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  
  // Modal States
  const [showCalculator, setShowCalculator] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false); // New State
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  
  // Create Commission Form State
  const [newCommission, setNewCommission] = useState({
    applicantId: '',
    amount: '',
    currency: 'USD',
    notes: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // Calculator state
  const [calcDealValue, setCalcDealValue] = useState('');
  const [calcServiceType, setCalcServiceType] = useState('Business Registration');
  const [calcResult, setCalcResult] = useState<{ base: number; bonus: number; total: number } | null>(null);
  
  // Dispute state
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const commissionRules: CommissionRule[] = [
    { tier: 'Bronze', type: 'tiered', base_rate: 5, bonus_rate: 0, threshold: 0 },
    { tier: 'Silver', type: 'tiered', base_rate: 7, bonus_rate: 2, threshold: 10000 },
    { tier: 'Gold', type: 'tiered', base_rate: 10, bonus_rate: 3, threshold: 25000 },
    { tier: 'Platinum', type: 'tiered', base_rate: 12, bonus_rate: 5, threshold: 50000 },
  ];

  // Document requirements for different services (fallback hardcoded data)
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  const documentRequirements: Record<string, { title: string; items: string[] }> = {
    'business_registration': {
      title: 'Business Registration',
      items: [
        'Company 3 name suggestions',
        'Shareholder Information',
        'Email',
        'Phone number',
        'Passport bio page',
        'Passport signature page (optional)',
        'China Last Entry Page (optional)',
        'China or Other Country Address',
        'Business Scope in Short',
      ]
    },
    'work_permit_z': {
      title: 'Work Permit (Z Visa)',
      items: [
        'White background photo',
        'Degree Certificate or Transcript',
        'Medical File',
        'Police Non-Criminal Certificate',
        'Experience letter',
        'Any professional Certificate (optional)',
        'Language Certificate (Chinese or other) (optional)',
        'Any additional certificate (optional)'
      ]
    },
    'm_visa': {
      title: 'M Visa',
      items: [
        'Passport bio page',
        'White background photo',
        'Non criminal certificate',
        'Hotel booking',
        'Flight booking',
        'Itinerary',
        'Email',
        'Phone number',
        'Incorporation letter (if any)',
        'Information sheet filling',
        'China last entry page (optional)'
      ]
    },
    'tourist_group': {
      title: 'Tourist Group Visa (min 3 people)',
      items: [
        'Passport bio page',
        'Passport signature page (if any)',
        'White background photo',
        'Police non criminal certificate (optional)',
        'China last entry page (optional)'
      ]
    },
    'health_tour': {
      title: 'Health Tour Visa',
      items: [
        'All M Visa documents',
        'Previous health reports history and documents proof'
      ]
    },
    'family_visa': {
      title: 'Family Visa',
      items: [
        'Z Visa documents (as above)',
        'Children Passport(s)',
        'Child Passport bio page photo',
        'White background photo',
        'Marriage certificate',
        'Birth certificate'
      ]
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      if (profile) {
        setPartner({ 
          id: user.id, 
          tier: 'Silver', 
          commission_rate: 7 
        });
      }
      
      // Fetch Commissions, Applicants, and Service Types (for document requirements)
      const [commData, applicantsData, serviceTypesData] = await Promise.all([
        api.getCommissions(),
        api.getApplicants(),
        api.getServiceTypes().catch(() => []),
      ]);

      setCommissions(commData);
      // Ensure applicants is an array (handle potential pagination wrapper)
      setApplicants(Array.isArray(applicantsData) ? applicantsData : (applicantsData as any).results || []);
      setServiceTypes(Array.isArray(serviceTypesData) ? serviceTypesData : ((serviceTypesData as any)?.results || []));

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAmount = (amt: string | number): number => {
    return typeof amt === 'string' ? parseFloat(amt) : amt;
  };

  // --- New Function: Handle Manual Creation ---
  const handleCreateCommission = async () => {
    if (!newCommission.applicantId || !newCommission.amount) {
      alert("Please select an applicant and enter an amount");
      return;
    }

    try {
      setIsCreating(true);
      await api.createCommission({
        applicant: parseInt(newCommission.applicantId),
        amount: parseFloat(newCommission.amount),
        currency: newCommission.currency,
        status: 'pending', // Default to pending for manual requests

      });

      alert("Commission requested successfully!");
      setShowCreateModal(false);
      setNewCommission({ applicantId: '', amount: '', currency: 'USD', notes: '' }); // Reset
      loadData(); // Refresh list
    } catch (error) {
      console.error("Failed to create commission", error);
      alert("Failed to submit commission request.");
    } finally {
      setIsCreating(false);
    }
  };

  // ... (Existing Calculator, Dispute, and Download functions remain the same) ...
  const calculateCommission = () => {
    const value = parseFloat(calcDealValue) || 0;
    const rule = commissionRules.find(r => r.tier === partner?.tier) || commissionRules[0];
    const base = (value * rule.base_rate) / 100;
    const bonus = value >= rule.threshold ? (value * rule.bonus_rate) / 100 : 0;
    setCalcResult({ base, bonus, total: base + bonus });
  };

  const submitDispute = async () => {
    if (!selectedCommission || !disputeReason) return;
    setSubmittingDispute(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('Dispute submitted successfully.');
    setShowDispute(false);
    setSubmittingDispute(false);
  };

  const downloadStatement = (format: 'pdf' | 'csv') => {
    /* ... existing implementation ... */ 
    alert(`Downloading ${format} statement...`);
  };

  const downloadTaxDoc = () => {
    alert('Tax document generation would happen here.');
  };

  const convertCurrency = (amount: number, from: string, to: string) => {
    const rates: Record<string, number> = { USD: 1, EUR: 0.92, CNY: 7.24, GBP: 0.79 };
    return (amount / (rates[from] || 1)) * (rates[to] || 1);
  };

  const formatCurrency = (amount: number, currency: string = displayCurrency) => {
    const curr = CURRENCIES.find(c => c.code === currency);
    return `${curr?.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredCommissions = commissions.filter(c => filter === 'all' || c.status === filter);

  const totalEarned = commissions
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + getAmount(c.amount), 0);
    
  const pending = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + getAmount(c.amount), 0);

  const tierColors: Record<string, string> = {
    Bronze: 'bg-amber-100 text-amber-800',
    Silver: 'bg-gray-100 text-gray-800',
    Gold: 'bg-yellow-100 text-yellow-800',
    Platinum: 'bg-purple-100 text-purple-800',
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="text-gray-600">Track your earnings and payment history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value)}
              className="border-0 focus:ring-0 text-sm"
            >
              {CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>
          
          {partner && (
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${tierColors[partner.tier] || tierColors.Bronze}`}>
              {partner.tier} Partner
            </span>
          )}
        </div>
      </div>

        {/* Document Requirements Section */}
        <div className="bg-white rounded-xl p-5 mb-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Document Requirements</h3>
            <p className="text-sm text-gray-500">Checklist per service / visa type</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceTypes.length > 0 ? (
              serviceTypes.map((svc: any) => (
                <div key={svc.key || svc.id} className="border rounded-lg">
                  <button
                    onClick={() => setOpenDoc(openDoc === (svc.key || svc.id) ? null : (svc.key || svc.id))}
                    className="w-full text-left p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{svc.name}</p>
                      <p className="text-xs text-gray-500">{(svc.requirements || []).length} items</p>
                    </div>
                    <div className="text-gray-400">{openDoc === (svc.key || svc.id) ? '−' : '+'}</div>
                  </button>

                  {openDoc === (svc.key || svc.id) && (
                    <div className="p-4 pt-0 border-t">
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {(svc.requirements || []).map((it: any, i: number) => (
                          <li key={i} className={it.optional ? 'opacity-80 italic' : ''}>
                            {it.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              Object.entries(documentRequirements).map(([key, def]) => (
                <div key={key} className="border rounded-lg">
                  <button
                    onClick={() => setOpenDoc(openDoc === key ? null : key)}
                    className="w-full text-left p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{def.title}</p>
                      <p className="text-xs text-gray-500">{def.items.length} items</p>
                    </div>
                    <div className="text-gray-400">{openDoc === key ? '−' : '+'}</div>
                  </button>

                  {openDoc === key && (
                    <div className="p-4 pt-0 border-t">
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {def.items.map((it, i) => (
                          <li key={i} className={it.toLowerCase().includes('(optional)') ? 'opacity-80 italic' : ''}>
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(convertCurrency(totalEarned, 'USD', displayCurrency))}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{formatCurrency(convertCurrency(pending, 'USD', displayCurrency))}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><CheckCircle className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Commission Rate</p>
              <p className="text-xl font-bold text-purple-600">{partner?.commission_rate || 7}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Structure Info */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 mb-6 border border-orange-200">
        <h3 className="font-semibold text-orange-800 mb-3">Your Commission Structure</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {commissionRules.map(rule => (
            <div key={rule.tier} className={`p-3 rounded-lg bg-white/50 ${rule.tier === partner?.tier ? 'ring-2 ring-orange-400' : ''}`}>
              <p className="font-medium text-gray-900">{rule.tier}</p>
              <p className="text-sm text-gray-600">Base: {rule.base_rate}%</p>
              {rule.bonus_rate > 0 && <p className="text-sm text-orange-600">+{rule.bonus_rate}% bonus</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Request Commission
        </button>
        <button
          onClick={() => setShowCalculator(true)}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          <Calculator className="h-4 w-4" /> Calculator
        </button>
        <button
          onClick={() => downloadStatement('csv')}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          <Download className="h-4 w-4" /> Statement
        </button>
        <button
          onClick={downloadTaxDoc}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
        >
          <FileText className="h-4 w-4" /> Tax Docs
        </button>
      </div>

      {/* Commission List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row justify-between gap-3">
          <h3 className="font-semibold">Commission History</h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        {filteredCommissions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions yet</h3>
            <p className="text-gray-500">Start referring clients to earn commissions</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredCommissions.map(commission => (
              <div key={commission.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{commission.applicant_name}</p>
                    <p className="text-sm text-gray-500">Applicant #{commission.applicant}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(convertCurrency(getAmount(commission.amount), commission.currency, displayCurrency))}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      commission.status === 'paid' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {commission.status.charAt(0).toUpperCase() + commission.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-gray-500">Amount: </span>
                      <span className="font-medium">{formatCurrency(getAmount(commission.amount))} {commission.currency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedCommission(commission); setShowAuditTrail(true); }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        View Details
                      </button>
                      {commission.status !== 'paid' && (
                        <button
                          onClick={() => { setSelectedCommission(commission); setShowDispute(true); }}
                          className="text-xs text-orange-600 hover:text-orange-700"
                        >
                          Dispute
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(commission.created_at).toLocaleDateString()}
                  {commission.paid_at && ` | Paid: ${new Date(commission.paid_at).toLocaleDateString()}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Request Commission Modal (NEW) --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Request Commission</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Applicant</label>
                <select
                  value={newCommission.applicantId}
                  onChange={e => setNewCommission({...newCommission, applicantId: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">-- Choose Applicant --</option>
                  {applicants.map((app: any) => (
                    <option key={app.id} value={app.id}>{app.full_name} ({app.email})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Only applicants linked to your account appear here.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={newCommission.amount}
                    onChange={e => setNewCommission({...newCommission, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={newCommission.currency}
                    onChange={e => setNewCommission({...newCommission, currency: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={newCommission.notes}
                  onChange={e => setNewCommission({...newCommission, notes: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="e.g. 50% upfront for visa processing"
                />
              </div>

              <button
                onClick={handleCreateCommission}
                disabled={isCreating}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
              >
                {isCreating ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Commission Calculator</h2>
              <button onClick={() => { setShowCalculator(false); setCalcResult(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value ({displayCurrency})</label>
                <input
                  type="number"
                  value={calcDealValue}
                  onChange={(e) => setCalcDealValue(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter deal value"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  value={calcServiceType}
                  onChange={(e) => setCalcServiceType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option>Business Registration</option>
                  <option>Work Visa</option>
                  <option>Family Visa</option>
                  <option>Business Visa</option>
                </select>
              </div>
              <button
                onClick={calculateCommission}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 mb-4"
              >
                Calculate
              </button>
              
              {calcResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Estimated Commission</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base ({partner?.commission_rate || 7}%)</span>
                      <span className="font-medium">{formatCurrency(calcResult.base)}</span>
                    </div>
                    {calcResult.bonus > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Performance Bonus</span>
                        <span className="font-medium text-green-600">+{formatCurrency(calcResult.bonus)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold text-green-700">{formatCurrency(calcResult.total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDispute && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Submit Dispute</h2>
              <button onClick={() => setShowDispute(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Commission Amount: <span className="font-medium">{formatCurrency(getAmount(selectedCommission.amount))}</span></p>
                <p className="text-sm text-gray-600">Applicant: {selectedCommission.applicant_name}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select reason...</option>
                  <option value="incorrect_amount">Incorrect Amount</option>
                  <option value="wrong_tier">Wrong Tier Applied</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                <textarea
                  value={disputeDetails}
                  onChange={(e) => setDisputeDetails(e.target.value)}
                  rows={4}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Please provide details..."
                />
              </div>
              
              <button
                onClick={submitDispute}
                disabled={!disputeReason || submittingDispute}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingDispute ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />} Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Commission Details</h2>
              <button onClick={() => setShowAuditTrail(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <div className="space-y-1 text-gray-600">
                    <p>Applicant: {selectedCommission.applicant_name}</p>
                    <p>Status: <span className="font-medium uppercase">{selectedCommission.status}</span></p>
                    {selectedCommission.notes && <p>Notes: {selectedCommission.notes}</p>}
                    {selectedCommission.payout_reference && <p>Reference: {selectedCommission.payout_reference}</p>}
                    <p className="font-medium text-gray-900 pt-2 border-t">Total: {formatCurrency(getAmount(selectedCommission.amount))} {selectedCommission.currency}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Audit Trail</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-500">{new Date(selectedCommission.created_at).toLocaleString()}</span>
                    <span>Commission generated</span>
                  </div>
                  {selectedCommission.paid_at && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-500">{new Date(selectedCommission.paid_at).toLocaleString()}</span>
                      <span>Payment completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}