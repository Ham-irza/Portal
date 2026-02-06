import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  file_path: string;
  file_type: string;
  view_count: number;
  created_at: string;
}

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  duration: number;
  sort_order: number;
  is_required: boolean;
}

interface TrainingProgress {
  module_id: string;
  status: string;
  progress_percent: number;
  completed_at: string | null;
}

const CATEGORIES = [
  { key: 'all', label: 'All Resources' },
  { key: 'marketing', label: 'Marketing Materials' },
  { key: 'training', label: 'Training' },
  { key: 'templates', label: 'Templates' },
  { key: 'legal', label: 'Legal Documents' },
  { key: 'faq', label: 'FAQ & Guides' },
];

export default function ResourceCenter() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'resources' | 'training' | 'faq'>('resources');
  const [resources, setResources] = useState<Resource[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<TrainingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const [resourcesRes, modulesRes, progressRes] = await Promise.all([
      supabase.from('resources').select('*').eq('is_published', true).order('created_at', { ascending: false }),
      supabase.from('training_modules').select('*').order('sort_order'),
      user ? supabase.from('training_progress').select('*').eq('user_id', user.id) : Promise.resolve({ data: [] }),
    ]);
    
    setResources(resourcesRes.data || []);
    setModules(modulesRes.data || []);
    setProgress(progressRes.data || []);
    setLoading(false);
  };

  const startModule = async (moduleId: string) => {
    if (!user) return;
    
    const existing = progress.find(p => p.module_id === moduleId);
    if (!existing) {
      await supabase.from('training_progress').insert({
        user_id: user.id,
        module_id: moduleId,
        status: 'in_progress',
        progress_percent: 0,
      });
      loadData();
    }
  };

  const completeModule = async (moduleId: string) => {
    if (!user) return;
    
    await supabase.from('training_progress')
      .update({
        status: 'completed',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('module_id', moduleId);
    loadData();
  };

  const getModuleProgress = (moduleId: string) => {
    return progress.find(p => p.module_id === moduleId);
  };

  const filteredResources = resources.filter(r => {
    const matchCategory = category === 'all' || r.category === category;
    const matchSearch = !search || r.title.toLowerCase().includes(search.toLowerCase()) || 
                       r.description?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const completedModules = progress.filter(p => p.status === 'completed').length;
  const totalRequired = modules.filter(m => m.is_required).length;

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
          <h1 className="text-2xl font-bold text-gray-800">Resource Center</h1>
          <p className="text-gray-600 mt-1">Access training materials, marketing resources, and support documents</p>
        </div>

        {/* Training Progress Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Training Progress</h2>
              <p className="opacity-90 mt-1">Complete required modules to unlock advanced features</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{completedModules}/{modules.length}</p>
              <p className="text-sm opacity-90">Modules completed</p>
            </div>
          </div>
          <div className="mt-4 bg-white/20 rounded-full h-3">
            <div 
              className="bg-white rounded-full h-3 transition-all"
              style={{ width: `${modules.length ? (completedModules / modules.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {[
            { key: 'resources', label: 'Resources' },
            { key: 'training', label: 'Training Modules' },
            { key: 'faq', label: 'Knowledge Base' },
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

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      category === cat.key
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.length === 0 ? (
                <div className="col-span-full bg-white rounded-xl border p-12 text-center">
                  <p className="text-gray-500">No resources found</p>
                </div>
              ) : (
                filteredResources.map(resource => (
                  <div key={resource.id} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        resource.file_type === 'pdf' ? 'bg-red-100 text-red-600' :
                        resource.file_type === 'video' ? 'bg-purple-100 text-purple-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {resource.file_type === 'video' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          )}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{resource.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{resource.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs text-gray-400 capitalize">{resource.category}</span>
                          <span className="text-xs text-gray-400">{resource.view_count} views</span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 text-sm font-medium">
                      Download
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            {modules.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <p className="text-gray-500">No training modules available yet</p>
              </div>
            ) : (
              modules.map((module, idx) => {
                const prog = getModuleProgress(module.id);
                const isCompleted = prog?.status === 'completed';
                const isInProgress = prog?.status === 'in_progress';
                
                return (
                  <div key={module.id} className="bg-white rounded-xl border p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                        isCompleted ? 'bg-green-500 text-white' :
                        isInProgress ? 'bg-orange-500 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : idx + 1}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{module.title}</h3>
                          {module.is_required && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {module.duration} min
                          </span>
                          <span className="capitalize">{module.content_type}</span>
                        </div>

                        {isInProgress && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress</span>
                              <span className="text-orange-600">{prog?.progress_percent || 0}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-500 rounded-full h-2 transition-all"
                                style={{ width: `${prog?.progress_percent || 0}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        {isCompleted ? (
                          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                            Completed
                          </span>
                        ) : isInProgress ? (
                          <button
                            onClick={() => completeModule(module.id)}
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
                          >
                            Continue
                          </button>
                        ) : (
                          <button
                            onClick={() => startModule(module.id)}
                            className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* FAQ/Knowledge Base Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {[
              { q: 'How are commissions calculated?', a: 'Commissions are calculated based on your partner tier and the service type. Base rates range from 10% (Bronze) to 18% (Platinum), with additional bonuses for high-volume partners.' },
              { q: 'When are commissions paid?', a: 'Commissions are paid monthly, typically within the first 10 business days of the following month. Payments are processed once referrals result in completed transactions.' },
              { q: 'How do I upgrade my partner tier?', a: 'Partner tiers are automatically upgraded based on your referral performance. Silver tier requires 5+ successful referrals, Gold requires 15+, and Platinum requires 30+ referrals.' },
              { q: 'What documents are required for referrals?', a: 'Basic referral information includes client name, contact details, and services of interest. Additional documentation may be requested depending on the specific service being referred.' },
              { q: 'How can I track my referral status?', a: 'You can track all your referrals in real-time through the Referral Management section. Each referral shows its current status from Submitted through to Closed.' },
            ].map((faq, idx) => (
              <details key={idx} className="bg-white rounded-xl border group">
                <summary className="p-6 cursor-pointer list-none flex items-center justify-between">
                  <span className="font-medium text-gray-800">{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-6 text-gray-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
