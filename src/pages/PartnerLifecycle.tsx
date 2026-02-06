import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { 
  CheckCircle, Circle, Clock, Download, Award, TrendingUp, Users, 
  BookOpen, Target, Star, ArrowRight, FileText, Shield, Zap, Gift,
  ChevronRight, ExternalLink
} from 'lucide-react';

type LifecycleStage = 'onboarding' | 'active' | 'growing' | 'premium';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link?: string;
}

interface StarterKit {
  id: string;
  name: string;
  description: string;
  fileType: string;
  downloadUrl: string;
}

export default function PartnerLifecycle() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<LifecycleStage>('onboarding');
  const [daysAsPartner, setDaysAsPartner] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [stats, setStats] = useState({ deals: 0, referrals: 0, revenue: 0, training: 0 });
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const stages: { key: LifecycleStage; label: string; description: string; icon: typeof Zap }[] = [
    { key: 'onboarding', label: 'Onboarding', description: 'First 30 days', icon: Zap },
    { key: 'active', label: 'Active', description: '30-90 days', icon: Target },
    { key: 'growing', label: 'Growing', description: '90+ days', icon: TrendingUp },
    { key: 'premium', label: 'Premium', description: 'Top performer', icon: Star },
  ];

  const starterKits: StarterKit[] = [
    { id: '1', name: 'Partner Marketing Guide', description: 'Comprehensive marketing strategies and templates', fileType: 'PDF', downloadUrl: '#' },
    { id: '2', name: 'Sales Playbook', description: 'Proven sales techniques and scripts', fileType: 'PDF', downloadUrl: '#' },
    { id: '3', name: 'Brand Assets Package', description: 'Logos, images, and brand guidelines', fileType: 'ZIP', downloadUrl: '#' },
    { id: '4', name: 'Product Overview Deck', description: 'Presentation slides for client meetings', fileType: 'PPTX', downloadUrl: '#' },
    { id: '5', name: 'Pricing Calculator', description: 'Interactive pricing and commission calculator', fileType: 'XLSX', downloadUrl: '#' },
    { id: '6', name: 'Client Onboarding Checklist', description: 'Step-by-step client onboarding guide', fileType: 'PDF', downloadUrl: '#' },
  ];

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Calculate days as partner
      const createdAt = new Date(profile?.created_at || Date.now());
      const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      setDaysAsPartner(days);

      // Determine stage based on days and performance
      let currentStage: LifecycleStage = 'onboarding';
      if (days > 90) currentStage = 'growing';
      else if (days > 30) currentStage = 'active';
      setStage(currentStage);

      // Fetch stats
      const [dealsRes, referralsRes, commissionsRes, trainingRes] = await Promise.all([
        supabase.from('deals').select('id', { count: 'exact' }).eq('partner_id', user!.id),
        supabase.from('referrals').select('id', { count: 'exact' }).eq('partner_id', user!.id),
        api.getCommissions(),
        supabase.from('training_progress').select('id', { count: 'exact' }).eq('user_id', user!.id).eq('status', 'completed'),
      ]);

      const totalRevenue = (commissionsRes || []).reduce((sum, c) => sum + (c.amount || 0), 0);

      setStats({
        deals: dealsRes.count || 0,
        referrals: referralsRes.count || 0,
        revenue: totalRevenue,
        training: trainingRes.count || 0,
      });

      // Calculate health score
      let score = 50;
      if (days > 30) score += 10;
      if (dealsRes.count && dealsRes.count > 0) score += 15;
      if (referralsRes.count && referralsRes.count > 3) score += 10;
      if (trainingRes.count && trainingRes.count > 0) score += 15;
      setHealthScore(Math.min(100, score));

      // Check if premium
      if (score >= 85 && totalRevenue > 50000) {
        setStage('premium');
      }

      // Build checklist
      const checklistItems: ChecklistItem[] = [
        { id: '1', title: 'Complete Profile', description: 'Fill in all company details', completed: !!profile?.company_name, link: '/settings' },
        { id: '2', title: 'Download Starter Kit', description: 'Get essential marketing materials', completed: days > 1 },
        { id: '3', title: 'Complete First Training', description: 'Finish at least one training module', completed: (trainingRes.count || 0) > 0, link: '/resources' },
        { id: '4', title: 'Submit First Referral', description: 'Register your first client referral', completed: (referralsRes.count || 0) > 0, link: '/referrals' },
        { id: '5', title: 'Register First Deal', description: 'Create your first deal registration', completed: (dealsRes.count || 0) > 0, link: '/deals' },
        { id: '6', title: 'Review Commission Structure', description: 'Understand your earning potential', completed: days > 7, link: '/commissions' },
      ];
      setChecklist(checklistItems);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (s: LifecycleStage) => stages.findIndex(st => st.key === s);
  const currentStageIndex = getStageIndex(stage);
  const completedChecklist = checklist.filter(c => c.completed).length;
  const checklistProgress = (completedChecklist / checklist.length) * 100;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Partner Journey</h1>
        <p className="text-gray-600">Track your progress and unlock new opportunities</p>
      </div>

      {/* Lifecycle Stage Indicator */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Your Partner Journey</h2>
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${((currentStageIndex + 1) / stages.length) * 100}%` }}
            />
          </div>
          
          {/* Stages */}
          <div className="relative flex justify-between">
            {stages.map((s, index) => {
              const isComplete = index <= currentStageIndex;
              const isCurrent = index === currentStageIndex;
              return (
                <div key={s.key} className="flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center z-10 transition-all ${
                    isCurrent ? 'bg-orange-500 text-white ring-4 ring-orange-200' :
                    isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isComplete && index < currentStageIndex ? (
                      <CheckCircle className="h-8 w-8" />
                    ) : (
                      <s.icon className="h-8 w-8" />
                    )}
                  </div>
                  <p className={`mt-2 font-medium text-sm ${isCurrent ? 'text-orange-600' : 'text-gray-600'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-gray-400">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700">You are in the <span className="font-bold">{stages[currentStageIndex].label}</span> stage</p>
              <p className="text-xs text-orange-600 mt-1">{daysAsPartner} days as a partner</p>
            </div>
            {currentStageIndex < stages.length - 1 && (
              <div className="text-right">
                <p className="text-xs text-orange-600">Next milestone</p>
                <p className="text-sm font-medium text-orange-700">{stages[currentStageIndex + 1].label}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Partner Health Score */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Partner Health Score</h3>
          <div className="flex items-center gap-4">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${getHealthColor(healthScore)}`}>
              <span className="text-3xl font-bold">{healthScore}</span>
            </div>
            <div className="flex-1">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Activity</span>
                  <span className="font-medium">{stats.deals + stats.referrals} actions</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Training</span>
                  <span className="font-medium">{stats.training} completed</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-medium">${stats.revenue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-blue-700">{stats.referrals}</p>
              <p className="text-xs text-blue-600">Referrals</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <FileText className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{stats.deals}</p>
              <p className="text-xs text-green-600">Deals</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <BookOpen className="h-6 w-6 text-purple-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple-700">{stats.training}</p>
              <p className="text-xs text-purple-600">Trainings</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <Award className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-700">
                {stage === 'premium' ? 'Top' : stage === 'growing' ? 'Mid' : 'New'}
              </p>
              <p className="text-xs text-orange-600">Tier</p>
            </div>
          </div>
        </div>

        {/* Onboarding Progress */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Onboarding Progress</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Completion</span>
              <span className="font-medium">{completedChecklist}/{checklist.length}</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all"
                style={{ width: `${checklistProgress}%` }}
              />
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {checklist.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg ${item.completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                {item.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                )}
                <span className={`text-sm ${item.completed ? 'text-green-700' : 'text-gray-600'}`}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Starter Kit Downloads */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Starter Kit Downloads</h3>
          <Gift className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {starterKits.map(kit => (
            <div key={kit.id} className="border rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50/50 transition group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 group-hover:text-orange-600">{kit.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{kit.description}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{kit.fileType}</span>
                </div>
                <button className="p-2 hover:bg-orange-100 rounded-lg text-gray-400 group-hover:text-orange-600">
                  <Download className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Readiness Assessment */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Readiness Assessment</h3>
        <p className="text-gray-600 mb-4">Complete these milestones to advance your partner journey</p>
        <div className="space-y-4">
          {checklist.map(item => (
            <div key={item.id} className={`border rounded-lg p-4 ${item.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <Circle className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h4 className={`font-medium ${item.completed ? 'text-green-700' : 'text-gray-900'}`}>{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                {!item.completed && item.link && (
                  <a href={item.link} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium">
                    Complete <ChevronRight className="h-4 w-4" />
                  </a>
                )}
                {item.completed && (
                  <span className="text-green-600 text-sm font-medium">Completed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
