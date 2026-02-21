import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage, LANGUAGES } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, FileText, Users, Settings, LogOut, Menu, X, 
  Building, UserCheck, BarChart3, FolderOpen, Bell,
  DollarSign, BookOpen, HeadphonesIcon, PieChart, FileEdit, Shield,
  Briefcase, Target, Award, Palette, Globe, GitBranch, FileCheck,
  Database, TrendingUp, FileSpreadsheet
} from 'lucide-react';
import { useState } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const isAdmin = profile?.role === 'admin';
  const isTeamMember = profile?.role === 'team_member';
  const hasAdminAccess = isAdmin || isTeamMember;

  const partnerNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/applications', label: 'Applicants', icon: FileText },
    { path: '/deals', label: 'Deals', icon: Briefcase },
    { path: '/referrals', label: 'Referrals', icon: Users },
    { path: '/commissions', label: 'Commissions', icon: DollarSign },
    { path: '/support', label: 'Support', icon: HeadphonesIcon },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
    { path: '/applications', label: 'All Applicants', icon: FileText },
    { path: '/admin/partners', label: 'Partners', icon: Building },
    { path: '/admin/deals', label: 'Deals', icon: Briefcase },
    { path: '/admin/referrals', label: 'Referrals', icon: Users },
    { path: '/admin/tickets', label: 'Support Tickets', icon: HeadphonesIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: PieChart },
    { path: '/admin/team', label: 'Team Members', icon: UserCheck },
    { path: '/admin/documents', label: 'Documents', icon: FolderOpen },
    { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const navItems = hasAdminAccess ? adminNavItems : partnerNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <img src="/logo.png" alt="Logo" className="h-8" />
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1"
            >
              <Globe className="h-5 w-5 text-gray-600" />
              <span className="text-xs font-medium">{language.toUpperCase().split('-')[0]}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code as 'en' | 'zh-CN' | 'zh-TW'); setShowLangMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${language === lang.code ? 'bg-orange-50 text-orange-600' : ''}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
          </button>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b flex items-center justify-between">
          <img src="/logo.png" alt="Hainan Builder" className="h-10" />
          {/* Desktop Language Selector */}
          <div className="hidden lg:block relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-1.5 hover:bg-gray-100 rounded-lg flex items-center gap-1 text-gray-600"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs">{LANGUAGES.find(l => l.code === language)?.flag}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-32">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code as 'en' | 'zh-CN' | 'zh-TW'); setShowLangMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${language === lang.code ? 'bg-orange-50 text-orange-600' : ''}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <nav className="px-4 py-4 space-y-1 overflow-y-auto h-[calc(100vh-200px)]">
          {navItems.map(item => (
            <Link 
              key={item.path} 
              to={item.path} 
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm ${
                isActive(item.path) 
                  ? 'bg-orange-50 text-orange-600 font-medium' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="px-4 py-2 mb-2">
            <p className="font-medium text-gray-900 text-sm truncate">{profile?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
            <div className="flex gap-1 mt-1">
              {isAdmin && (
                <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">Admin</span>
              )}
              {isTeamMember && (
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">Team</span>
              )}
              {!hasAdminAccess && (
                <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Partner</span>
              )}
            </div>
          </div>
          <button 
            onClick={handleSignOut} 
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition"
          >
            <LogOut className="h-5 w-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  );
}
