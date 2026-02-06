import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

interface PartnerStats {
  id: string;
  company_name: string;
  tier: string;
  referral_count: number;
  commission_total: number;
  conversion_rate: number;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [stats, setStats] = useState({
    totalPartners: 0,
    activePartners: 0,
    totalReferrals: 0,
    closedReferrals: 0,
    totalCommissions: 0,
    paidCommissions: 0,
  });
  const [partnerStats, setPartnerStats] = useState<PartnerStats[]>([]);
  const [tierDistribution, setTierDistribution] = useState<Record<string, number>>({});
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; referrals: number; revenue: number }>>([]);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    // Get basic counts
    const [partnersRes, referralsRes, commissionsRes] = await Promise.all([
      supabase.from('partners').select('id, tier, status'),
      supabase.from('referrals').select('id, status, partner_id, created_at'),
      api.getCommissions(),
    ]);

    const partners = partnersRes.data || [];
    const referrals = referralsRes.data || [];
    const commissions = commissionsRes || [];

    // Calculate stats
    const tiers: Record<string, number> = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    partners.forEach(p => {
      if (p.tier) tiers[p.tier] = (tiers[p.tier] || 0) + 1;
    });
    setTierDistribution(tiers);

    setStats({
      totalPartners: partners.length,
      activePartners: partners.filter(p => p.status === 'active').length,
      totalReferrals: referrals.length,
      closedReferrals: referrals.filter(r => r.status === 'closed_won').length,
      totalCommissions: commissions.reduce((s, c) => s + (c.amount || 0), 0),
      paidCommissions: commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.amount || 0), 0),
    });

    // Partner performance - note: commissions are now from API (no direct partner_id field)
    // This is a simplified version that still aggregates data
    const partnerPerf: Record<string, PartnerStats> = {};
    partners.forEach(p => {
      partnerPerf[p.id] = {
        id: p.id,
        company_name: 'Loading...',
        tier: p.tier || 'bronze',
        referral_count: 0,
        commission_total: 0,
        conversion_rate: 0,
      };
    });

    referrals.forEach(r => {
      if (partnerPerf[r.partner_id]) {
        partnerPerf[r.partner_id].referral_count++;
        if (r.status === 'closed_won') {
          partnerPerf[r.partner_id].conversion_rate++;
        }
      }
    });

    // Get partner names
    const { data: partnerDetails } = await supabase
      .from('partners')
      .select('id, company_name')
      .in('id', Object.keys(partnerPerf));

    partnerDetails?.forEach(pd => {
      if (partnerPerf[pd.id]) {
        partnerPerf[pd.id].company_name = pd.company_name;
      }
    });

    // Calculate conversion rates
    Object.values(partnerPerf).forEach(p => {
      p.conversion_rate = p.referral_count > 0 
        ? Math.round((p.conversion_rate / p.referral_count) * 100) 
        : 0;
    });

    setPartnerStats(Object.values(partnerPerf).sort((a, b) => b.commission_total - a.commission_total).slice(0, 10));

    // Monthly data (last 6 months)
    const months: Array<{ month: string; referrals: number; revenue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toISOString().slice(0, 7);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      
      const monthReferrals = referrals.filter(r => r.created_at?.startsWith(monthKey)).length;
      const monthRevenue = commissions
        .filter(c => c.created_at?.startsWith(monthKey) && c.status === 'paid')
        .reduce((s, c) => s + c.amount, 0);
      
      months.push({ month: monthName, referrals: monthReferrals, revenue: monthRevenue });
    }
    setMonthlyData(months);

    setLoading(false);
  };

  const exportReport = (type: 'partners' | 'referrals' | 'commissions') => {
    let csv = '';
    if (type === 'partners') {
      csv = 'Partner,Tier,Referrals,Commissions,Conversion Rate\n';
      csv += partnerStats.map(p => 
        `${p.company_name},${p.tier},${p.referral_count},$${p.commission_total},${p.conversion_rate}%`
      ).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const tierColors: Record<string, string> = {
    bronze: 'bg-amber-500',
    silver: 'bg-gray-400',
    gold: 'bg-yellow-500',
    platinum: 'bg-purple-500',
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

  const maxReferrals = Math.max(...monthlyData.map(m => m.referrals), 1);
  const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Monitor partner performance and business metrics</p>
          </div>
          <div className="flex gap-3">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={() => exportReport('partners')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Export Report
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Partners</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalPartners}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Active Partners</p>
            <p className="text-2xl font-bold text-green-600">{stats.activePartners}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Referrals</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalReferrals}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Closed Won</p>
            <p className="text-2xl font-bold text-orange-600">{stats.closedReferrals}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Total Commissions</p>
            <p className="text-2xl font-bold text-gray-800">${stats.totalCommissions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Paid Out</p>
            <p className="text-2xl font-bold text-green-600">${stats.paidCommissions.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly Trend */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Monthly Trend</h2>
            <div className="space-y-4">
              {monthlyData.map((m, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{m.month}</span>
                    <span className="text-gray-800">{m.referrals} referrals / ${m.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div 
                        className="bg-blue-500 rounded-full h-4 transition-all"
                        style={{ width: `${(m.referrals / maxReferrals) * 100}%` }}
                      />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-4">
                      <div 
                        className="bg-green-500 rounded-full h-4 transition-all"
                        style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-gray-600">Referrals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600">Revenue</span>
              </div>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-semibold text-gray-800 mb-4">Partner Tier Distribution</h2>
            <div className="space-y-4">
              {Object.entries(tierDistribution).map(([tier, count]) => {
                const total = Object.values(tierDistribution).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize text-gray-800 font-medium">{tier}</span>
                      <span className="text-gray-600">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-6">
                      <div 
                        className={`${tierColors[tier]} rounded-full h-6 transition-all flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      >
                        {pct > 15 && <span className="text-white text-xs font-medium">{count}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Partners */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="font-semibold text-gray-800">Top Performing Partners</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Referrals</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total Commissions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {partnerStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No partner data available
                  </td>
                </tr>
              ) : (
                partnerStats.map((partner, idx) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-gray-100 text-gray-700' :
                        idx === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">{partner.company_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs capitalize ${
                        partner.tier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                        partner.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                        partner.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {partner.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{partner.referral_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-green-500 rounded-full h-2"
                            style={{ width: `${partner.conversion_rate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{partner.conversion_rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-green-600">
                      ${partner.commission_total.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
