import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Trophy, Medal, Award, Star, Target, Zap, Users, TrendingUp, Gift,
  Crown, Flame, Clock, ChevronRight, Lock, CheckCircle
} from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  points_required: number;
  category: string;
  earned?: boolean;
  earned_at?: string;
}

interface PointsTransaction {
  id: string;
  points: number;
  action_type: string;
  description: string;
  created_at: string;
}

interface LeaderboardEntry {
  rank: number;
  partner_id: string;
  name: string;
  company: string;
  points: number;
  deals: number;
  isCurrentUser: boolean;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  reward_points: number;
  end_date: string;
  progress: number;
  target: number;
  completed: boolean;
}

export default function Gamification() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<Set<string>>(new Set());
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'leaderboard' | 'challenges'>('overview');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'monthly' | 'quarterly' | 'alltime'>('monthly');

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch badges
      const { data: badgesData } = await supabase.from('badges').select('*').order('points_required');
      setBadges(badgesData || []);

      // Fetch earned badges
      const { data: earnedData } = await supabase
        .from('partner_badges')
        .select('badge_id, earned_at')
        .eq('partner_id', user!.id);
      
      const earnedSet = new Set((earnedData || []).map(e => e.badge_id));
      setEarnedBadges(earnedSet);

      // Fetch points transactions
      const { data: pointsData } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('partner_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setTransactions(pointsData || []);
      const total = (pointsData || []).reduce((sum, t) => sum + t.points, 0);
      setTotalPoints(total);

      // Generate mock leaderboard (in real app, this would be a view/aggregation)
      const mockLeaderboard: LeaderboardEntry[] = [
        { rank: 1, partner_id: '1', name: 'Global Partners Inc.', company: 'GP Inc.', points: 15420, deals: 47, isCurrentUser: false },
        { rank: 2, partner_id: '2', name: 'Asia Pacific Trading', company: 'APT', points: 12850, deals: 38, isCurrentUser: false },
        { rank: 3, partner_id: '3', name: 'European Ventures', company: 'EV', points: 11200, deals: 32, isCurrentUser: false },
        { rank: 4, partner_id: '4', name: 'North Star Consulting', company: 'NSC', points: 9800, deals: 28, isCurrentUser: false },
        { rank: 5, partner_id: user!.id, name: profile?.full_name || 'You', company: profile?.company_name || '', points: total, deals: 12, isCurrentUser: true },
        { rank: 6, partner_id: '6', name: 'Pacific Rim Partners', company: 'PRP', points: 7500, deals: 21, isCurrentUser: false },
        { rank: 7, partner_id: '7', name: 'Atlantic Associates', company: 'AA', points: 6200, deals: 18, isCurrentUser: false },
        { rank: 8, partner_id: '8', name: 'Summit Solutions', company: 'SS', points: 5400, deals: 15, isCurrentUser: false },
        { rank: 9, partner_id: '9', name: 'Delta Dynamics', company: 'DD', points: 4100, deals: 11, isCurrentUser: false },
        { rank: 10, partner_id: '10', name: 'Horizon Holdings', company: 'HH', points: 3200, deals: 9, isCurrentUser: false },
      ];
      setLeaderboard(mockLeaderboard);

      // Generate challenges
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const challengeList: Challenge[] = [
        { id: '1', name: 'Deal Dash', description: 'Register 5 new deals this month', reward_points: 500, end_date: endOfMonth.toISOString(), progress: 2, target: 5, completed: false },
        { id: '2', name: 'Training Champion', description: 'Complete 3 training modules', reward_points: 300, end_date: endOfMonth.toISOString(), progress: 1, target: 3, completed: false },
        { id: '3', name: 'Referral Rush', description: 'Submit 10 referrals', reward_points: 750, end_date: endOfMonth.toISOString(), progress: 4, target: 10, completed: false },
        { id: '4', name: 'Quick Closer', description: 'Close your first deal of the quarter', reward_points: 1000, end_date: endOfMonth.toISOString(), progress: 0, target: 1, completed: false },
      ];
      setChallenges(challengeList);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, typeof Trophy> = {
      'trophy': Trophy,
      'star': Star,
      'award': Award,
      'zap': Zap,
      'dollar-sign': Target,
      'users': Users,
      'book-open': Medal,
    };
    const Icon = icons[iconName] || Award;
    return <Icon className="h-6 w-6" />;
  };

  const getBadgeColor = (category: string, earned: boolean) => {
    if (!earned) return 'bg-gray-100 text-gray-400 border-gray-200';
    switch (category) {
      case 'deals': return 'bg-blue-100 text-blue-600 border-blue-300';
      case 'performance': return 'bg-purple-100 text-purple-600 border-purple-300';
      case 'training': return 'bg-green-100 text-green-600 border-green-300';
      case 'onboarding': return 'bg-orange-100 text-orange-600 border-orange-300';
      case 'revenue': return 'bg-yellow-100 text-yellow-600 border-yellow-300';
      case 'referrals': return 'bg-pink-100 text-pink-600 border-pink-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const userRank = leaderboard.find(e => e.isCurrentUser)?.rank || 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Achievements & Rewards</h1>
        <p className="text-gray-600">Track your progress and compete with other partners</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Star className="h-6 w-6" /></div>
            <div>
              <p className="text-orange-100 text-sm">Total Points</p>
              <p className="text-2xl font-bold">{totalPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Award className="h-6 w-6" /></div>
            <div>
              <p className="text-purple-100 text-sm">Badges Earned</p>
              <p className="text-2xl font-bold">{earnedBadges.size}/{badges.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Trophy className="h-6 w-6" /></div>
            <div>
              <p className="text-blue-100 text-sm">Leaderboard Rank</p>
              <p className="text-2xl font-bold">#{userRank}</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Target className="h-6 w-6" /></div>
            <div>
              <p className="text-green-100 text-sm">Active Challenges</p>
              <p className="text-2xl font-bold">{challenges.filter(c => !c.completed).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="border-b">
          <div className="flex">
            {(['overview', 'badges', 'leaderboard', 'challenges'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium text-sm border-b-2 -mb-px transition ${
                  activeTab === tab
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Points */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No activity yet. Start earning points!</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map(tx => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${tx.points > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tx.points > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tx.description || tx.action_type}</p>
                            <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured Badges */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Featured Badges</h3>
                <div className="grid grid-cols-3 gap-3">
                  {badges.slice(0, 6).map(badge => {
                    const earned = earnedBadges.has(badge.id);
                    return (
                      <div key={badge.id} className={`p-4 rounded-lg border text-center ${getBadgeColor(badge.category, earned)}`}>
                        <div className="mb-2">{getIconComponent(badge.icon)}</div>
                        <p className="text-xs font-medium truncate">{badge.name}</p>
                        {!earned && <Lock className="h-3 w-3 mx-auto mt-1 opacity-50" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.map(badge => {
                const earned = earnedBadges.has(badge.id);
                return (
                  <div key={badge.id} className={`p-5 rounded-xl border-2 text-center relative ${getBadgeColor(badge.category, earned)}`}>
                    {earned && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    )}
                    <div className="mb-3 inline-flex p-3 rounded-full bg-white/50">
                      {getIconComponent(badge.icon)}
                    </div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs opacity-75 mb-2">{badge.description}</p>
                    {badge.points_required > 0 && (
                      <p className="text-xs font-medium">{badge.points_required} pts required</p>
                    )}
                    {!earned && <Lock className="h-4 w-4 mx-auto mt-2 opacity-40" />}
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              <div className="flex gap-2 mb-4">
                {(['monthly', 'quarterly', 'alltime'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setLeaderboardPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      leaderboardPeriod === period
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {period === 'alltime' ? 'All Time' : period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                {leaderboard.map(entry => (
                  <div
                    key={entry.partner_id}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      entry.isCurrentUser ? 'bg-orange-50 border-2 border-orange-300' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                      entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {entry.rank <= 3 ? (
                        <Crown className="h-5 w-5" />
                      ) : (
                        entry.rank
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${entry.isCurrentUser ? 'text-orange-700' : 'text-gray-900'}`}>
                        {entry.name} {entry.isCurrentUser && '(You)'}
                      </p>
                      <p className="text-sm text-gray-500">{entry.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{entry.points.toLocaleString()} pts</p>
                      <p className="text-xs text-gray-500">{entry.deals} deals</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Challenges Tab */}
          {activeTab === 'challenges' && (
            <div className="space-y-4">
              {challenges.map(challenge => (
                <div key={challenge.id} className={`p-5 rounded-xl border-2 ${challenge.completed ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {challenge.completed ? (
                        <div className="p-2 bg-green-500 rounded-lg text-white"><CheckCircle className="h-5 w-5" /></div>
                      ) : (
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Flame className="h-5 w-5" /></div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">{challenge.name}</h4>
                        <p className="text-sm text-gray-500">{challenge.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-orange-600">
                        <Gift className="h-4 w-4" />
                        <span className="font-bold">{challenge.reward_points}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Ends {new Date(challenge.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{challenge.progress}/{challenge.target}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${challenge.completed ? 'bg-green-500' : 'bg-orange-500'}`}
                        style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
