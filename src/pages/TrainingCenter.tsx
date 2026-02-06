import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  BookOpen, Play, CheckCircle, Clock, Award, FileText, Download,
  ChevronRight, Video, File, Lock, Star, Trophy, X, ArrowRight
} from 'lucide-react';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  content_type: 'video' | 'document' | 'interactive';
  duration: number;
  is_required: boolean;
  sort_order: number;
  content_url?: string;
}

interface TrainingProgress {
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percent: number;
  completed_at?: string;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

interface Certificate {
  id: string;
  module_id: string;
  certificate_number: string;
  issued_at: string;
}

export default function TrainingCenter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<Map<string, TrainingProgress>>(new Map());
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState<Certificate | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');

  // Sample categories
  const categories = ['all', 'Sales', 'Product', 'Compliance', 'Marketing', 'Technical'];

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch modules
      const { data: modulesData } = await supabase
        .from('training_modules')
        .select('*')
        .eq('is_published', true)
        .order('sort_order');
      
      // If no modules exist, use sample data
      const sampleModules: TrainingModule[] = modulesData?.length ? modulesData : [
        { id: '1', title: 'Partner Onboarding Essentials', description: 'Learn the basics of our partner program', category: 'Sales', content_type: 'video', duration: 30, is_required: true, sort_order: 1 },
        { id: '2', title: 'Product Deep Dive', description: 'Comprehensive overview of our services', category: 'Product', content_type: 'video', duration: 45, is_required: true, sort_order: 2 },
        { id: '3', title: 'Sales Techniques', description: 'Proven sales strategies and approaches', category: 'Sales', content_type: 'document', duration: 20, is_required: false, sort_order: 3 },
        { id: '4', title: 'Compliance Guidelines', description: 'Important regulatory requirements', category: 'Compliance', content_type: 'document', duration: 15, is_required: true, sort_order: 4 },
        { id: '5', title: 'Marketing Best Practices', description: 'How to effectively market our services', category: 'Marketing', content_type: 'video', duration: 25, is_required: false, sort_order: 5 },
        { id: '6', title: 'Technical Integration Guide', description: 'API and system integration details', category: 'Technical', content_type: 'document', duration: 40, is_required: false, sort_order: 6 },
      ];
      setModules(sampleModules);

      // Fetch progress
      const { data: progressData } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', user!.id);
      
      const progressMap = new Map<string, TrainingProgress>();
      (progressData || []).forEach(p => {
        progressMap.set(p.module_id, p);
      });
      setProgress(progressMap);

      // Fetch certificates
      const { data: certsData } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user!.id);
      
      setCertificates(certsData || []);

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const startModule = async (module: TrainingModule) => {
    setSelectedModule(module);
    
    // Update progress to in_progress
    const existingProgress = progress.get(module.id);
    if (!existingProgress) {
      await supabase.from('training_progress').insert({
        user_id: user!.id,
        module_id: module.id,
        status: 'in_progress',
        progress_percent: 0
      });
    }
  };

  const completeModule = async () => {
    if (!selectedModule) return;
    
    // Generate sample quiz questions
    const sampleQuestions: QuizQuestion[] = [
      { id: '1', question: `What is the main focus of "${selectedModule.title}"?`, options: ['Option A', 'Option B', 'The core concept', 'None of the above'], correct_answer: 2 },
      { id: '2', question: 'Which best describes our partner program benefits?', options: ['Limited access', 'Comprehensive support and resources', 'Self-service only', 'No benefits'], correct_answer: 1 },
      { id: '3', question: 'What is required for certification?', options: ['Complete all modules', 'Pass the quiz with 70%+', 'Both A and B', 'Neither'], correct_answer: 2 },
    ];
    setQuizQuestions(sampleQuestions);
    setShowQuiz(true);
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizComplete(false);
  };

  const answerQuestion = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate score
      let correct = 0;
      newAnswers.forEach((ans, idx) => {
        if (ans === quizQuestions[idx].correct_answer) correct++;
      });
      const score = Math.round((correct / quizQuestions.length) * 100);
      setQuizScore(score);
      setQuizComplete(true);

      // If passed, issue certificate
      if (score >= 70 && selectedModule) {
        issueCertificate();
      }
    }
  };

  const issueCertificate = async () => {
    if (!selectedModule || !user) return;
    
    const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    try {
      const { data, error } = await supabase.from('certificates').insert({
        user_id: user.id,
        module_id: selectedModule.id,
        certificate_number: certNumber
      }).select().single();

      if (!error && data) {
        setCertificates(prev => [...prev, data]);
      }

      // Update progress to completed
      await supabase.from('training_progress').upsert({
        user_id: user.id,
        module_id: selectedModule.id,
        status: 'completed',
        progress_percent: 100,
        completed_at: new Date().toISOString()
      });

      setProgress(prev => {
        const newMap = new Map(prev);
        newMap.set(selectedModule.id, {
          module_id: selectedModule.id,
          status: 'completed',
          progress_percent: 100,
          completed_at: new Date().toISOString()
        });
        return newMap;
      });
    } catch (err) {
      console.error('Error issuing certificate:', err);
    }
  };

  const getModuleProgress = (moduleId: string) => {
    return progress.get(moduleId);
  };

  const hasCertificate = (moduleId: string) => {
    return certificates.some(c => c.module_id === moduleId);
  };

  const getCertificate = (moduleId: string) => {
    return certificates.find(c => c.module_id === moduleId);
  };

  const filteredModules = modules.filter(m => 
    filterCategory === 'all' || m.category === filterCategory
  );

  const completedCount = modules.filter(m => getModuleProgress(m.id)?.status === 'completed').length;
  const overallProgress = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;

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
        <h1 className="text-2xl font-bold text-gray-900">Training Center</h1>
        <p className="text-gray-600">Complete courses, earn certifications, and enhance your skills</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><BookOpen className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Courses</p>
              <p className="text-xl font-bold">{modules.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Award className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Certificates</p>
              <p className="text-xl font-bold">{certificates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Trophy className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Overall Progress</p>
              <p className="text-xl font-bold">{overallProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterCategory === cat
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {cat === 'all' ? 'All Courses' : cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map(module => {
          const moduleProgress = getModuleProgress(module.id);
          const isCompleted = moduleProgress?.status === 'completed';
          const hasCert = hasCertificate(module.id);
          const cert = getCertificate(module.id);

          return (
            <div key={module.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isCompleted ? 'border-green-300' : ''}`}>
              <div className={`h-2 ${isCompleted ? 'bg-green-500' : moduleProgress?.status === 'in_progress' ? 'bg-orange-500' : 'bg-gray-200'}`} 
                   style={{ width: `${moduleProgress?.progress_percent || 0}%` }} />
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    module.content_type === 'video' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {module.content_type === 'video' ? (
                      <Video className="h-5 w-5 text-red-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  {module.is_required && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-medium rounded">Required</span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 mb-1">{module.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{module.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {module.duration} min</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded">{module.category}</span>
                </div>

                {isCompleted ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Completed</span>
                    </div>
                    {hasCert && cert && (
                      <button
                        onClick={() => setShowCertificate(cert)}
                        className="w-full flex items-center justify-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition"
                      >
                        <Award className="h-4 w-4" /> View Certificate
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => startModule(module)}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                  >
                    {moduleProgress?.status === 'in_progress' ? (
                      <>Continue <ArrowRight className="h-4 w-4" /></>
                    ) : (
                      <><Play className="h-4 w-4" /> Start Course</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Content Modal */}
      {selectedModule && !showQuiz && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedModule.title}</h2>
              <button onClick={() => setSelectedModule(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                {selectedModule.content_type === 'video' ? (
                  <div className="text-center">
                    <Video className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Video content would play here</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Document content would display here</p>
                  </div>
                )}
              </div>

              <div className="prose max-w-none mb-6">
                <p>{selectedModule.description}</p>
                <p>This module covers essential topics that will help you succeed as a partner. Complete the content and pass the quiz to earn your certification.</p>
              </div>

              <button
                onClick={completeModule}
                className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-medium"
              >
                Complete & Take Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuiz && selectedModule && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Certification Quiz: {selectedModule.title}</h2>
            </div>
            <div className="p-6">
              {!quizComplete ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
                      <span>{Math.round(((currentQuestion + 1) / quizQuestions.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mb-4">{quizQuestions[currentQuestion]?.question}</h3>
                  
                  <div className="space-y-3">
                    {quizQuestions[currentQuestion]?.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => answerQuestion(idx)}
                        className="w-full text-left p-4 border rounded-lg hover:border-orange-300 hover:bg-orange-50 transition"
                      >
                        <span className="font-medium text-gray-600 mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  {quizScore >= 70 ? (
                    <>
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-green-700 mb-2">Congratulations!</h3>
                      <p className="text-gray-600 mb-4">You scored {quizScore}% and earned your certification!</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="h-10 w-10 text-red-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-700 mb-2">Not Quite</h3>
                      <p className="text-gray-600 mb-4">You scored {quizScore}%. You need 70% to pass. Try again!</p>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowQuiz(false);
                      setSelectedModule(null);
                    }}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Certificate of Completion</h2>
              <button onClick={() => setShowCertificate(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="border-4 border-orange-500 rounded-xl p-8 text-center bg-gradient-to-br from-orange-50 to-white">
                <Award className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                <h3 className="text-3xl font-bold text-gray-900 mb-2">Certificate of Completion</h3>
                <p className="text-gray-600 mb-6">This certifies that</p>
                <p className="text-2xl font-bold text-orange-600 mb-6">{user?.email}</p>
                <p className="text-gray-600 mb-2">has successfully completed the course</p>
                <p className="text-xl font-semibold text-gray-900 mb-6">
                  {modules.find(m => m.id === showCertificate.module_id)?.title}
                </p>
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-gray-500">Certificate #: {showCertificate.certificate_number}</p>
                  <p className="text-sm text-gray-500">Issued: {new Date(showCertificate.issued_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
                <Download className="h-4 w-4" /> Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
