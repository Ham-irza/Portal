import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type Language = 'en' | 'zh-CN' | 'zh-TW';

interface Translations {
  [key: string]: {
    en: string;
    'zh-CN': string;
    'zh-TW': string;
  };
}

const translations: Translations = {
  // Navigation
  dashboard: { en: 'Dashboard', 'zh-CN': '仪表板', 'zh-TW': '儀表板' },
  applications: { en: 'Applicants', 'zh-CN': '申请人', 'zh-TW': '申請人' },
  referrals: { en: 'Referrals', 'zh-CN': '推荐', 'zh-TW': '推薦' },
  commissions: { en: 'Commissions', 'zh-CN': '佣金', 'zh-TW': '佣金' },
  resources: { en: 'Resources', 'zh-CN': '资源', 'zh-TW': '資源' },
  support: { en: 'Support', 'zh-CN': '支持', 'zh-TW': '支援' },
  messages: { en: 'Messages', 'zh-CN': '消息', 'zh-TW': '訊息' },
  settings: { en: 'Settings', 'zh-CN': '设置', 'zh-TW': '設定' },
  deals: { en: 'Deals', 'zh-CN': '交易', 'zh-TW': '交易' },
  training: { en: 'Training', 'zh-CN': '培训', 'zh-TW': '培訓' },
  gamification: { en: 'Achievements', 'zh-CN': '成就', 'zh-TW': '成就' },
  lifecycle: { en: 'My Journey', 'zh-CN': '我的旅程', 'zh-TW': '我的旅程' },
  assets: { en: 'Marketing Assets', 'zh-CN': '营销资产', 'zh-TW': '行銷資產' },
  
  // Admin
  adminDashboard: { en: 'Admin Dashboard', 'zh-CN': '管理仪表板', 'zh-TW': '管理儀表板' },
  partners: { en: 'Partners', 'zh-CN': '合作伙伴', 'zh-TW': '合作夥伴' },
  analytics: { en: 'Analytics', 'zh-CN': '分析', 'zh-TW': '分析' },
  workflows: { en: 'Workflows', 'zh-CN': '工作流程', 'zh-TW': '工作流程' },
  verification: { en: 'Verification', 'zh-CN': '验证', 'zh-TW': '驗證' },
  bulkOps: { en: 'Bulk Operations', 'zh-CN': '批量操作', 'zh-TW': '批量操作' },
  predictive: { en: 'Predictive Analytics', 'zh-CN': '预测分析', 'zh-TW': '預測分析' },
  reportBuilder: { en: 'Report Builder', 'zh-CN': '报告生成器', 'zh-TW': '報告生成器' },
  
  // Common
  save: { en: 'Save', 'zh-CN': '保存', 'zh-TW': '儲存' },
  cancel: { en: 'Cancel', 'zh-CN': '取消', 'zh-TW': '取消' },
  submit: { en: 'Submit', 'zh-CN': '提交', 'zh-TW': '提交' },
  delete: { en: 'Delete', 'zh-CN': '删除', 'zh-TW': '刪除' },
  edit: { en: 'Edit', 'zh-CN': '编辑', 'zh-TW': '編輯' },
  view: { en: 'View', 'zh-CN': '查看', 'zh-TW': '查看' },
  search: { en: 'Search', 'zh-CN': '搜索', 'zh-TW': '搜尋' },
  filter: { en: 'Filter', 'zh-CN': '筛选', 'zh-TW': '篩選' },
  export: { en: 'Export', 'zh-CN': '导出', 'zh-TW': '匯出' },
  import: { en: 'Import', 'zh-CN': '导入', 'zh-TW': '匯入' },
  loading: { en: 'Loading...', 'zh-CN': '加载中...', 'zh-TW': '載入中...' },
  noData: { en: 'No data found', 'zh-CN': '未找到数据', 'zh-TW': '未找到資料' },
  success: { en: 'Success', 'zh-CN': '成功', 'zh-TW': '成功' },
  error: { en: 'Error', 'zh-CN': '错误', 'zh-TW': '錯誤' },
  welcome: { en: 'Welcome back', 'zh-CN': '欢迎回来', 'zh-TW': '歡迎回來' },
  
  // Deal Registration
  registerDeal: { en: 'Register Deal', 'zh-CN': '注册交易', 'zh-TW': '註冊交易' },
  customerName: { en: 'Customer Name', 'zh-CN': '客户名称', 'zh-TW': '客戶名稱' },
  customerCompany: { en: 'Company', 'zh-CN': '公司', 'zh-TW': '公司' },
  opportunityValue: { en: 'Opportunity Value', 'zh-CN': '机会价值', 'zh-TW': '機會價值' },
  expectedClose: { en: 'Expected Close Date', 'zh-CN': '预计成交日期', 'zh-TW': '預計成交日期' },
  competitiveSituation: { en: 'Competitive Situation', 'zh-CN': '竞争情况', 'zh-TW': '競爭情況' },
  
  // Status
  submitted: { en: 'Submitted', 'zh-CN': '已提交', 'zh-TW': '已提交' },
  underReview: { en: 'Under Review', 'zh-CN': '审核中', 'zh-TW': '審核中' },
  approved: { en: 'Approved', 'zh-CN': '已批准', 'zh-TW': '已批准' },
  inProgress: { en: 'In Progress', 'zh-CN': '进行中', 'zh-TW': '進行中' },
  won: { en: 'Won', 'zh-CN': '已成交', 'zh-TW': '已成交' },
  lost: { en: 'Lost', 'zh-CN': '已失去', 'zh-TW': '已失去' },
  
  // Lifecycle
  onboarding: { en: 'Onboarding', 'zh-CN': '入职', 'zh-TW': '入職' },
  active: { en: 'Active', 'zh-CN': '活跃', 'zh-TW': '活躍' },
  growing: { en: 'Growing', 'zh-CN': '成长中', 'zh-TW': '成長中' },
  premium: { en: 'Premium', 'zh-CN': '高级', 'zh-TW': '高級' },
  
  // Currency
  usd: { en: 'USD', 'zh-CN': '美元', 'zh-TW': '美元' },
  eur: { en: 'EUR', 'zh-CN': '欧元', 'zh-TW': '歐元' },
  cny: { en: 'CNY', 'zh-CN': '人民币', 'zh-TW': '人民幣' },
  gbp: { en: 'GBP', 'zh-CN': '英镑', 'zh-TW': '英鎊' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (date: string | Date) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred_language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_language', lang);
  };

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) return key;
    return translation[language] || translation.en || key;
  };

  const formatNumber = (num: number): string => {
    const locales: Record<Language, string> = {
      en: 'en-US',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
    };
    return new Intl.NumberFormat(locales[language]).format(num);
  };

  const formatCurrency = (amount: number, currency = 'USD'): string => {
    const locales: Record<Language, string> = {
      en: 'en-US',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
    };
    return new Intl.NumberFormat(locales[language], {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string | Date): string => {
    const locales: Record<Language, string> = {
      en: 'en-US',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-TW',
    };
    return new Intl.DateTimeFormat(locales[language], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatNumber, formatCurrency, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'zh-CN', label: '简体中文', flag: 'CN' },
  { code: 'zh-TW', label: '繁體中文', flag: 'TW' },
] as const;
