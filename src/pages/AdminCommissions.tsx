import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { api, type Commission, type CommissionRule } from '@/lib/api'; // 1. Import types from API

// 2. Local interfaces removed to prevent conflicts

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'commissions' | 'rules' | 'payments'>('commissions');
  const [filter, setFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [commissionsRes, rulesRes] = await Promise.all([
        api.getCommissions(),
        api.getCommissionRules(),
      ]);

      setCommissions(commissionsRes || []);
      setRules(rulesRes || []);
    } catch (err) {
      console.error('Error loading commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCommissionStatus = async (id: number, status: string) => {
    try {
      await api.updateCommission(id, {
        // 3. Cast status to any because 'processing' might not be in the strict API type definition yet
        status: status as any, 
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      });
      loadData();
    } catch (err) {
      console.error('Error updating commission:', err);
    }
  };

  const batchApprove = async () => {
    try {
      await Promise.all(selectedIds.map(id => 
        // 3. Cast status here as well
        api.updateCommission(parseInt(id), { status: 'processing' as any })
      ));
      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error('Error batch approving:', err);
    }
  };

  const batchPay = async () => {
    try {
      await Promise.all(selectedIds.map(id => 
        api.updateCommission(parseInt(id), {
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
      ));
      setSelectedIds([]);
      loadData();
    } catch (err) {
      console.error('Error batch paying:', err);
    }
  };

  // --- UPDATED SAVE LOGIC ---
  const saveRule = async (ruleData: Partial<CommissionRule>) => {
    try {
      // Ensure we send numbers, not strings from inputs
      const payload = {
        ...ruleData,
        base_rate: Number(ruleData.base_rate),
        bonus_rate: Number(ruleData.bonus_rate),
        threshold: Number(ruleData.threshold),
      };

      if (editingRule) {
        await api.updateCommissionRule(editingRule.id, payload);
      } else {
        await api.createCommissionRule(payload);
      }

      setShowRuleModal(false);
      setEditingRule(null);
      loadData(); 
    } catch (err) {
      console.error('Error saving rule:', err);
      alert('Failed to save rule. Ensure you are an Admin.');
    }
  };

  const filteredCommissions = commissions.filter(c => filter === 'all' || c.status === filter);

  // Helper to safely parse amounts (handle string or number)
  const getAmount = (amt: string | number) => typeof amt === 'string' ? parseFloat(amt) : amt;

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + getAmount(c.amount), 0);
  const totalProcessing = commissions.filter(c => c.status === 'processing').reduce((s, c) => s + getAmount(c.amount), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + getAmount(c.amount), 0);

  const tierColors: Record<string, string> = {
    Bronze: 'bg-amber-100 text-amber-800',
    Silver: 'bg-gray-100 text-gray-800',
    Gold: 'bg-yellow-100 text-yellow-800',
    Platinum: 'bg-purple-100 text-purple-800',
  };

  // Helper for safe tier display
  const getTierColor = (tier: string) => {
      const key = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
      return tierColors[key] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Commission Management</h1>
          <p className="text-gray-600 mt-1">Manage partner commissions and payment rules</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-yellow-600">${totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border">
            <p className="text-sm text-gray-600">Processing (Awaiting Payment)</p>
            <p className="text-2xl font-bold text-blue-600">${totalProcessing.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border">
            <p className="text-sm text-gray-600">Paid This Month</p>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-5 border">
            <p className="text-sm text-gray-600">Total Commissions</p>
            <p className="text-2xl font-bold text-gray-800">{commissions.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {[
            { key: 'commissions', label: 'All Commissions' },
            { key: 'rules', label: 'Commission Rules' },
            { key: 'payments', label: 'Payment Processing' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {['all', 'pending', 'processing', 'paid'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                      filter === status ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={batchApprove}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    Mark Processing ({selectedIds.length})
                  </button>
                  <button
                    onClick={batchPay}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    Mark as Paid
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        onChange={e => setSelectedIds(e.target.checked ? filteredCommissions.filter(c => c.status !== 'paid').map(c => c.id.toString()) : [])}
                        className="h-4 w-4 text-orange-500 rounded"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredCommissions.map(commission => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        {commission.status !== 'paid' && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(commission.id.toString())}
                            onChange={e => setSelectedIds(prev => 
                              e.target.checked ? [...prev, commission.id.toString()] : prev.filter(id => id !== commission.id.toString())
                            )}
                            className="h-4 w-4 text-orange-500 rounded"
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {new Date(commission.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-800">
                        {commission.partner_name || 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {commission.applicant_name}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800">
                        ${getAmount(commission.amount).toLocaleString()} {commission.currency}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          commission.status === 'paid' ? 'bg-green-100 text-green-700' :
                          commission.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {commission.status === 'pending' && (
                          <button
                            onClick={() => updateCommissionStatus(commission.id, 'processing')}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Process
                          </button>
                        )}
                        {commission.status === 'processing' && (
                          <button
                            onClick={() => updateCommissionStatus(commission.id, 'paid')}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Commission Rules Tab */}
        {activeTab === 'rules' && (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setEditingRule(null); setShowRuleModal(true); }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Add Rule
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {rules.map(rule => (
                <div key={rule.id} className="bg-white rounded-xl border p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Use 'tier' as name if name property is missing */}
                      <h3 className="font-semibold text-gray-800">{(rule as any).name || `${rule.tier} Rule`}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs capitalize ${getTierColor(rule.tier)}`}>
                        {rule.tier} Tier
                      </span>
                    </div>
                    <button
                      onClick={() => { setEditingRule(rule); setShowRuleModal(true); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Base Rate</p>
                      <p className="text-xl font-bold text-orange-600">{Number(rule.base_rate)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bonus Rate</p>
                      <p className="text-xl font-bold text-green-600">+{Number(rule.bonus_rate)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Threshold (Value)</p>
                      <p className="text-lg font-medium text-gray-800">${Number(rule.threshold || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span className={`px-2 py-0.5 rounded text-xs ${(rule as any).is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {(rule as any).is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Payment Processing Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Batch Payment Processing</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800">Approved Commissions Ready for Payment</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  ${commissions.filter(c => c.status === 'processing').reduce((s, c) => s + getAmount(c.amount), 0).toLocaleString()}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {commissions.filter(c => c.status === 'processing').length} commission(s)
                </p>
              </div>
              
              <button
                onClick={() => {
                  const processingIds = commissions.filter(c => c.status === 'processing').map(c => c.id.toString());
                  setSelectedIds(processingIds);
                  setActiveTab('commissions');
                  setFilter('processing');
                }}
                className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
              >
                Go to Processing List to Pay
              </button>
            </div>
          </div>
        )}

        {/* Rule Modal */}
        {showRuleModal && (
          <RuleModal
            rule={editingRule}
            onSave={saveRule}
            onClose={() => { setShowRuleModal(false); setEditingRule(null); }}
          />
        )}
      </div>
    </Layout>
  );
}

// --- UPDATED RULE MODAL ---
function RuleModal({ rule, onSave, onClose }: { 
  rule: CommissionRule | null; 
  onSave: (rule: Partial<CommissionRule>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: (rule as any)?.name || '',
    tier: rule?.tier || 'Bronze', 
    base_rate: rule?.base_rate || 10,
    bonus_rate: rule?.bonus_rate || 0,
    threshold: rule?.threshold || 0,
    is_active: (rule as any)?.is_active ?? true,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{rule ? 'Edit' : 'Add'} Commission Rule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Rule Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name (Optional)</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. Standard Gold Tier"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
            <select
              value={form.tier}
              onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Rate (%)</label>
              <input
                type="number"
                step="0.5"
                value={form.base_rate}
                onChange={e => setForm(f => ({ ...f, base_rate: parseFloat(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Rate (%)</label>
              <input
                type="number"
                step="0.5"
                value={form.bonus_rate}
                onChange={e => setForm(f => ({ ...f, bonus_rate: parseFloat(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Threshold Amount ($)</label>
            <input
              type="number"
              value={form.threshold}
              onChange={e => setForm(f => ({ ...f, threshold: parseInt(e.target.value) }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Deal value to trigger bonus"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 text-orange-500 rounded"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
        
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple Icon Component
const X = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);