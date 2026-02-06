import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  FileText, Plus, Download, Calendar, Filter, Settings, Save,
  Trash2, Eye, BarChart3, Users, DollarSign, TrendingUp, Clock,
  ChevronDown, GripVertical, X, RefreshCw, Mail
} from 'lucide-react';

interface ReportColumn {
  id: string;
  name: string;
  field: string;
  enabled: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: typeof FileText;
}

interface SavedReport {
  id: string;
  name: string;
  template: string;
  filters: Record<string, string>;
  columns: string[];
  created_at: string;
  last_run: string;
  schedule?: string;
}

const TEMPLATES: ReportTemplate[] = [
  { id: 'partner_performance', name: 'Partner Performance', type: 'performance', description: 'Partner activity, deals, and revenue metrics', icon: Users },
  { id: 'revenue_analysis', name: 'Revenue Analysis', type: 'revenue', description: 'Revenue breakdown by partner, service, and region', icon: DollarSign },
  { id: 'commission_report', name: 'Commission Report', type: 'commission', description: 'Commission calculations and payment status', icon: TrendingUp },
  { id: 'activity_log', name: 'Activity Log', type: 'activity', description: 'User actions and system events', icon: Clock },
];

const COLUMNS_BY_TYPE: Record<string, ReportColumn[]> = {
  performance: [
    { id: '1', name: 'Partner Name', field: 'partner_name', enabled: true },
    { id: '2', name: 'Company', field: 'company', enabled: true },
    { id: '3', name: 'Tier', field: 'tier', enabled: true },
    { id: '4', name: 'Total Referrals', field: 'total_referrals', enabled: true },
    { id: '5', name: 'Total Deals', field: 'total_deals', enabled: true },
    { id: '6', name: 'Win Rate', field: 'win_rate', enabled: false },
    { id: '7', name: 'Revenue Generated', field: 'revenue', enabled: true },
    { id: '8', name: 'Commission Earned', field: 'commission', enabled: true },
    { id: '9', name: 'Training Progress', field: 'training', enabled: false },
    { id: '10', name: 'Last Activity', field: 'last_activity', enabled: true },
  ],
  revenue: [
    { id: '1', name: 'Period', field: 'period', enabled: true },
    { id: '2', name: 'Partner', field: 'partner', enabled: true },
    { id: '3', name: 'Service Type', field: 'service_type', enabled: true },
    { id: '4', name: 'Region', field: 'region', enabled: true },
    { id: '5', name: 'Gross Revenue', field: 'gross_revenue', enabled: true },
    { id: '6', name: 'Net Revenue', field: 'net_revenue', enabled: true },
    { id: '7', name: 'Growth %', field: 'growth', enabled: true },
  ],
  commission: [
    { id: '1', name: 'Partner', field: 'partner', enabled: true },
    { id: '2', name: 'Period', field: 'period', enabled: true },
    { id: '3', name: 'Base Commission', field: 'base', enabled: true },
    { id: '4', name: 'Bonus', field: 'bonus', enabled: true },
    { id: '5', name: 'Total', field: 'total', enabled: true },
    { id: '6', name: 'Status', field: 'status', enabled: true },
    { id: '7', name: 'Payment Date', field: 'payment_date', enabled: true },
  ],
  activity: [
    { id: '1', name: 'Timestamp', field: 'timestamp', enabled: true },
    { id: '2', name: 'User', field: 'user', enabled: true },
    { id: '3', name: 'Action', field: 'action', enabled: true },
    { id: '4', name: 'Entity Type', field: 'entity_type', enabled: true },
    { id: '5', name: 'Details', field: 'details', enabled: true },
  ],
};

export default function AdminReportBuilder() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'builder' | 'saved'>('builder');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [reportName, setReportName] = useState('');
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [exportFormat, setExportFormat] = useState('csv');
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [scheduleEmail, setScheduleEmail] = useState('');

  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    { id: '1', name: 'Monthly Partner Overview', template: 'partner_performance', filters: { tier: 'all' }, columns: ['partner_name', 'company', 'revenue'], created_at: new Date(Date.now() - 604800000).toISOString(), last_run: new Date(Date.now() - 86400000).toISOString(), schedule: 'Monthly' },
    { id: '2', name: 'Q4 Revenue Report', template: 'revenue_analysis', filters: { region: 'all' }, columns: ['period', 'gross_revenue', 'net_revenue'], created_at: new Date(Date.now() - 2592000000).toISOString(), last_run: new Date(Date.now() - 604800000).toISOString() },
  ]);

  const selectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setColumns(COLUMNS_BY_TYPE[template.type] || []);
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(columns.map(c =>
      c.id === columnId ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const generateReport = async () => {
    setGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate sample data
    const enabledColumns = columns.filter(c => c.enabled);
    let csvContent = enabledColumns.map(c => c.name).join(',') + '\n';
    
    for (let i = 0; i < 10; i++) {
      const row = enabledColumns.map(c => {
        switch (c.field) {
          case 'partner_name': return `Partner ${i + 1}`;
          case 'company': return `Company ${String.fromCharCode(65 + i)}`;
          case 'tier': return ['Bronze', 'Silver', 'Gold', 'Platinum'][i % 4];
          case 'total_referrals': return Math.floor(Math.random() * 50);
          case 'total_deals': return Math.floor(Math.random() * 20);
          case 'revenue': return `$${(Math.random() * 100000).toFixed(2)}`;
          case 'commission': return `$${(Math.random() * 10000).toFixed(2)}`;
          default: return `Value ${i + 1}`;
        }
      }).join(',');
      csvContent += row + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportName || 'report'}_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    a.click();

    setGenerating(false);
  };

  const saveReport = () => {
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: reportName,
      template: selectedTemplate,
      filters,
      columns: columns.filter(c => c.enabled).map(c => c.field),
      created_at: new Date().toISOString(),
      last_run: new Date().toISOString(),
      schedule: showSchedule ? scheduleFrequency : undefined,
    };
    setSavedReports([newReport, ...savedReports]);
    alert('Report saved successfully!');
  };

  const runSavedReport = async (report: SavedReport) => {
    setSavedReports(savedReports.map(r =>
      r.id === report.id ? { ...r, last_run: new Date().toISOString() } : r
    ));
    // Would trigger actual report generation
    alert(`Running report: ${report.name}`);
  };

  const deleteSavedReport = (reportId: string) => {
    if (confirm('Delete this saved report?')) {
      setSavedReports(savedReports.filter(r => r.id !== reportId));
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Report Builder</h1>
        <p className="text-gray-600">Create custom reports with flexible filters and columns</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="border-b">
          <div className="flex">
            {(['builder', 'saved'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium text-sm border-b-2 -mb-px transition ${
                  activeTab === tab
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'builder' ? 'Build Report' : 'Saved Reports'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'builder' && (
            <div>
              {/* Template Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Report Template</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => selectTemplate(template.id)}
                      className={`p-4 border rounded-lg text-left transition ${
                        selectedTemplate === template.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <template.icon className={`h-6 w-6 mb-2 ${selectedTemplate === template.id ? 'text-orange-600' : 'text-gray-400'}`} />
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTemplate && (
                <>
                  {/* Report Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      className="w-full max-w-md border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g., Q4 Partner Performance"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="border rounded-lg px-3 py-2"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="border rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* Column Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Columns</label>
                    <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {columns.map(column => (
                          <label
                            key={column.id}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition ${
                              column.enabled ? 'bg-orange-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={column.enabled}
                              onChange={() => toggleColumn(column.id)}
                              className="w-4 h-4 text-orange-500 rounded"
                            />
                            <GripVertical className="h-4 w-4 text-gray-300" />
                            <span className={column.enabled ? 'text-gray-900' : 'text-gray-500'}>{column.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                    <div className="flex gap-3">
                      {['csv', 'xlsx', 'pdf'].map(format => (
                        <button
                          key={format}
                          onClick={() => setExportFormat(format)}
                          className={`px-4 py-2 border rounded-lg ${
                            exportFormat === format
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Option */}
                  <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showSchedule}
                        onChange={(e) => setShowSchedule(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded"
                      />
                      <span className="font-medium">Schedule recurring report</span>
                    </label>
                    
                    {showSchedule && (
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Frequency</label>
                          <select
                            value={scheduleFrequency}
                            onChange={(e) => setScheduleFrequency(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Send to Email</label>
                          <input
                            type="email"
                            value={scheduleEmail}
                            onChange={(e) => setScheduleEmail(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2"
                            placeholder="email@example.com"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" /> Preview
                    </button>
                    <button
                      onClick={saveReport}
                      disabled={!reportName}
                      className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" /> Save Report
                    </button>
                    <button
                      onClick={generateReport}
                      disabled={generating || columns.filter(c => c.enabled).length === 0}
                      className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      {generating ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</>
                      ) : (
                        <><Download className="h-4 w-4" /> Generate & Download</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
              {savedReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No saved reports</h3>
                  <p className="text-gray-500">Build and save your first report</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedReports.map(report => (
                    <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{report.name}</h4>
                          <p className="text-sm text-gray-500">
                            Template: {TEMPLATES.find(t => t.id === report.template)?.name} | 
                            Last run: {new Date(report.last_run).toLocaleDateString()}
                          </p>
                          {report.schedule && (
                            <span className="inline-flex items-center gap-1 mt-1 text-xs text-orange-600">
                              <Clock className="h-3 w-3" /> {report.schedule}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => runSavedReport(report)}
                            className="flex items-center gap-1 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-orange-600"
                          >
                            <RefreshCw className="h-4 w-4" /> Run
                          </button>
                          <button
                            onClick={() => deleteSavedReport(report.id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Report Preview</h2>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.filter(c => c.enabled).map(col => (
                        <th key={col.id} className="px-4 py-3 text-left font-medium text-gray-600">{col.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[1, 2, 3, 4, 5].map(i => (
                      <tr key={i}>
                        {columns.filter(c => c.enabled).map(col => (
                          <td key={col.id} className="px-4 py-3 text-gray-700">Sample Data {i}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-500 mt-4 text-center">Showing preview with sample data. Generate to see actual data.</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
