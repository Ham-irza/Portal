import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  TrendingUp, TrendingDown, AlertTriangle, Users, Target, Star,
  Activity, BarChart3, ArrowRight, ArrowUp, ArrowDown, RefreshCw,
  Zap, Shield, Award, ChevronRight, Eye
} from 'lucide-react';

interface PartnerHealth {
  id: string;
  partner_name: string;
  company: string;
  health_score: number;
  activity_score: number;
  deals_score: number;
  training_score: number;
  churn_risk: 'high' | 'medium' | 'low';
  trend: 'up' | 'down' | 'stable';
  last_activity: string;
  recommendations: string[];
}

interface Trend {
  label: string;
  value: number;
  change: number;
  isPositive: boolean;
}

export default function AdminPredictiveAnalytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerHealth[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<PartnerHealth | null>(null);
  const [filterRisk, setFilterRisk] = useState('all');
  const [sortBy, setSortBy] = useState<'health' | 'risk' | 'activity'>('risk');

  const trends: Trend[] = [
    { label: 'Average Health Score', value: 72, change: 5, isPositive: true },
    { label: 'At-Risk Partners', value: 8, change: -2, isPositive: true },
    { label: 'High-Potential', value: 15, change: 3, isPositive: true },
    { label: 'Active Partners', value: 89, change: 12, isPositive: true },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Simulate data fetch
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const samplePartners: PartnerHealth[] = [
      { id: '1', partner_name: 'John Smith', company: 'Global Partners Inc.', health_score: 92, activity_score: 95, deals_score: 88, training_score: 93, churn_risk: 'low', trend: 'up', last_activity: new Date(Date.now() - 86400000).toISOString(), recommendations: ['Consider for Platinum tier upgrade', 'Invite to partner advisory board'] },
      { id: '2', partner_name: 'Sarah Johnson', company: 'Asia Pacific Trading', health_score: 78, activity_score: 72, deals_score: 82, training_score: 80, churn_risk: 'low', trend: 'stable', last_activity: new Date(Date.now() - 172800000).toISOString(), recommendations: ['Encourage more training completion', 'Share new product materials'] },
      { id: '3', partner_name: 'Mike Chen', company: 'Eastern Ventures', health_score: 45, activity_score: 30, deals_score: 55, training_score: 50, churn_risk: 'high', trend: 'down', last_activity: new Date(Date.now() - 1209600000).toISOString(), recommendations: ['Schedule check-in call immediately', 'Offer incentive program', 'Assign dedicated support'] },
      { id: '4', partner_name: 'Emily Brown', company: 'North Star Consulting', health_score: 65, activity_score: 58, deals_score: 70, training_score: 67, churn_risk: 'medium', trend: 'down', last_activity: new Date(Date.now() - 604800000).toISOString(), recommendations: ['Review recent deal pipeline', 'Send engagement survey', 'Provide additional training'] },
      { id: '5', partner_name: 'David Wilson', company: 'Pacific Rim Partners', health_score: 88, activity_score: 90, deals_score: 85, training_score: 89, churn_risk: 'low', trend: 'up', last_activity: new Date(Date.now() - 43200000).toISOString(), recommendations: ['Assign high-value leads', 'Invite to certification program'] },
      { id: '6', partner_name: 'Lisa Anderson', company: 'Summit Solutions', health_score: 52, activity_score: 45, deals_score: 58, training_score: 53, churn_risk: 'high', trend: 'down', last_activity: new Date(Date.now() - 2592000000).toISOString(), recommendations: ['Urgent: Partner at risk of churning', 'Schedule executive call', 'Review partnership terms'] },
      { id: '7', partner_name: 'Robert Taylor', company: 'Delta Dynamics', health_score: 71, activity_score: 68, deals_score: 75, training_score: 70, churn_risk: 'medium', trend: 'stable', last_activity: new Date(Date.now() - 345600000).toISOString(), recommendations: ['Push for next tier qualification', 'Share co-marketing opportunities'] },
      { id: '8', partner_name: 'Jennifer Lee', company: 'Horizon Holdings', health_score: 85, activity_score: 82, deals_score: 88, training_score: 85, churn_risk: 'low', trend: 'up', last_activity: new Date(Date.now() - 129600000).toISOString(), recommendations: ['High potential for growth', 'Consider for featured partner spotlight'] },
    ];
    
    setPartners(samplePartners);
    setLoading(false);
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />;
      default: return <ArrowRight className="h-4 w-4 text-gray-400" />;
    }
  };

  const filteredPartners = partners
    .filter(p => filterRisk === 'all' || p.churn_risk === filterRisk)
    .sort((a, b) => {
      switch (sortBy) {
        case 'health': return b.health_score - a.health_score;
        case 'risk': return (a.churn_risk === 'high' ? 0 : a.churn_risk === 'medium' ? 1 : 2) - (b.churn_risk === 'high' ? 0 : b.churn_risk === 'medium' ? 1 : 2);
        case 'activity': return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
        default: return 0;
      }
    });

  const riskCounts = {
    high: partners.filter(p => p.churn_risk === 'high').length,
    medium: partners.filter(p => p.churn_risk === 'medium').length,
    low: partners.filter(p => p.churn_risk === 'low').length,
  };

  const highPotential = partners.filter(p => p.health_score >= 85);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Predictive Analytics</h1>
        <p className="text-gray-600">Partner health scores and churn prediction</p>
      </div>

      {/* Trend Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {trends.map((trend, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{trend.label}</p>
              <span className={`flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(trend.change)}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{trend.value}{i === 0 ? '%' : ''}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Risk Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Churn Risk Distribution</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" /> High Risk
                </span>
                <span className="font-medium">{riskCounts.high}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${(riskCounts.high / partners.length) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-yellow-500" /> Medium Risk
                </span>
                <span className="font-medium">{riskCounts.medium}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(riskCounts.medium / partners.length) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" /> Low Risk
                </span>
                <span className="font-medium">{riskCounts.low}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(riskCounts.low / partners.length) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* High Potential Partners */}
        <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">High-Potential Partners</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highPotential.slice(0, 4).map(partner => (
              <div key={partner.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                  <Star className="h-5 w-5 text-green-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{partner.company}</p>
                  <p className="text-sm text-green-600">Health Score: {partner.health_score}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Partner Health Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between">
          <h3 className="font-semibold text-gray-900">Partner Health Scores</h3>
          <div className="flex gap-3">
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'health' | 'risk' | 'activity')}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="risk">Sort by Risk</option>
              <option value="health">Sort by Health</option>
              <option value="activity">Sort by Activity</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Health Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deals</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Training</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Churn Risk</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trend</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPartners.map(partner => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{partner.company}</p>
                    <p className="text-sm text-gray-500">{partner.partner_name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getHealthBg(partner.health_score)}`}>
                        <span className={`text-sm font-bold ${getHealthColor(partner.health_score)}`}>{partner.health_score}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className={`h-full rounded-full ${partner.activity_score >= 70 ? 'bg-green-500' : partner.activity_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${partner.activity_score}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{partner.activity_score}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{partner.deals_score}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">{partner.training_score}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBadge(partner.churn_risk)}`}>
                      {partner.churn_risk.charAt(0).toUpperCase() + partner.churn_risk.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getTrendIcon(partner.trend)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedPartner(partner)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedPartner.company}</h2>
              <button onClick={() => setSelectedPartner(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {/* Health Breakdown */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Health Score Breakdown</h3>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getHealthBg(selectedPartner.health_score)}`}>
                      <span className={`text-xl font-bold ${getHealthColor(selectedPartner.health_score)}`}>{selectedPartner.health_score}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Overall</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getHealthBg(selectedPartner.activity_score)}`}>
                      <span className={`text-xl font-bold ${getHealthColor(selectedPartner.activity_score)}`}>{selectedPartner.activity_score}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Activity</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getHealthBg(selectedPartner.deals_score)}`}>
                      <span className={`text-xl font-bold ${getHealthColor(selectedPartner.deals_score)}`}>{selectedPartner.deals_score}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Deals</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getHealthBg(selectedPartner.training_score)}`}>
                      <span className={`text-xl font-bold ${getHealthColor(selectedPartner.training_score)}`}>{selectedPartner.training_score}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Training</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">AI Recommendations</h3>
                <div className="space-y-2">
                  {selectedPartner.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                      <Zap className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-orange-800">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
                  View Full Profile
                </button>
                <button className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                  Take Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
