import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  Upload, Download, FileSpreadsheet, Users, CheckCircle, XCircle, 
  AlertCircle, ArrowRight, RefreshCw, Trash2, Edit2, Calendar,
  ChevronDown, Filter
} from 'lucide-react';

interface ImportMapping {
  csvColumn: string;
  dbField: string;
}

interface Partner {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  status: string;
  tier: string;
  selected?: boolean;
}

interface ScheduledExport {
  id: string;
  name: string;
  type: string;
  schedule: string;
  last_run: string;
  next_run: string;
  is_active: boolean;
}

export default function AdminBulkOperations() {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'bulk' | 'export'>('import');
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<string[][]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importMapping, setImportMapping] = useState<ImportMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  // Bulk operations state
  const [partners, setPartners] = useState<Partner[]>([
    { id: '1', company_name: 'Partner A', contact_name: 'John Doe', email: 'john@partnera.com', status: 'active', tier: 'Silver', selected: false },
    { id: '2', company_name: 'Partner B', contact_name: 'Jane Smith', email: 'jane@partnerb.com', status: 'active', tier: 'Bronze', selected: false },
    { id: '3', company_name: 'Partner C', contact_name: 'Bob Wilson', email: 'bob@partnerc.com', status: 'pending', tier: 'Bronze', selected: false },
    { id: '4', company_name: 'Partner D', contact_name: 'Alice Brown', email: 'alice@partnerd.com', status: 'active', tier: 'Gold', selected: false },
    { id: '5', company_name: 'Partner E', contact_name: 'Charlie Davis', email: 'charlie@partnere.com', status: 'suspended', tier: 'Silver', selected: false },
  ]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Export state
  const [exportType, setExportType] = useState('partners');
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportDateRange, setExportDateRange] = useState({ start: '', end: '' });
  const [exporting, setExporting] = useState(false);
  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([
    { id: '1', name: 'Weekly Partner Report', type: 'partners', schedule: 'Weekly', last_run: new Date(Date.now() - 604800000).toISOString(), next_run: new Date(Date.now() + 604800000).toISOString(), is_active: true },
    { id: '2', name: 'Monthly Commission Report', type: 'commissions', schedule: 'Monthly', last_run: new Date(Date.now() - 2592000000).toISOString(), next_run: new Date(Date.now() + 604800000).toISOString(), is_active: true },
  ]);

  const dbFields = [
    { value: 'company_name', label: 'Company Name' },
    { value: 'contact_name', label: 'Contact Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'country', label: 'Country' },
    { value: 'status', label: 'Status' },
    { value: 'tier', label: 'Tier' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1, 6).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      
      setImportHeaders(headers);
      setImportPreview(data);
      setImportMapping(headers.map(h => ({ csvColumn: h, dbField: '' })));
    };
    reader.readAsText(file);
  };

  const updateMapping = (csvColumn: string, dbField: string) => {
    setImportMapping(importMapping.map(m =>
      m.csvColumn === csvColumn ? { ...m, dbField } : m
    ));
  };

  const handleImport = async () => {
    setImporting(true);
    // Simulate import
    await new Promise(resolve => setTimeout(resolve, 2000));
    setImportResult({ success: importPreview.length, failed: 0 });
    setImporting(false);
  };

  const toggleSelectAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    setPartners(partners.map(p => ({ ...p, selected: newValue })));
  };

  const toggleSelect = (id: string) => {
    setPartners(partners.map(p =>
      p.id === id ? { ...p, selected: !p.selected } : p
    ));
  };

  const handleBulkAction = () => {
    if (!bulkAction) return;
    const selectedIds = partners.filter(p => p.selected).map(p => p.id);
    
    if (bulkAction === 'status' && bulkValue) {
      setPartners(partners.map(p =>
        selectedIds.includes(p.id) ? { ...p, status: bulkValue } : p
      ));
    } else if (bulkAction === 'tier' && bulkValue) {
      setPartners(partners.map(p =>
        selectedIds.includes(p.id) ? { ...p, tier: bulkValue } : p
      ));
    } else if (bulkAction === 'delete') {
      if (confirm(`Delete ${selectedIds.length} selected partners?`)) {
        setPartners(partners.filter(p => !selectedIds.includes(p.id)));
      }
    }
    
    setBulkAction('');
    setBulkValue('');
    setSelectAll(false);
    setPartners(prev => prev.map(p => ({ ...p, selected: false })));
  };

  const handleExport = async () => {
    setExporting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate CSV content
    let csvContent = '';
    if (exportType === 'partners') {
      csvContent = 'Company Name,Contact Name,Email,Status,Tier\n';
      partners.forEach(p => {
        csvContent += `"${p.company_name}","${p.contact_name}","${p.email}","${p.status}","${p.tier}"\n`;
      });
    }
    
    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
    a.click();
    
    setExporting(false);
  };

  const selectedCount = partners.filter(p => p.selected).length;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Operations</h1>
        <p className="text-gray-600">Import, export, and manage data in bulk</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="border-b">
          <div className="flex">
            {(['import', 'bulk', 'export'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium text-sm border-b-2 -mb-px transition ${
                  activeTab === tab
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'import' ? 'CSV Import' : tab === 'bulk' ? 'Bulk Update' : 'Export Data'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div>
              {!importFile ? (
                <div className="border-2 border-dashed rounded-xl p-12 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
                  <p className="text-gray-500 mb-4">Drag and drop or click to select</p>
                  <label className="inline-block cursor-pointer">
                    <span className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                      Choose File
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-400 mt-4">Supported format: CSV (max 10MB)</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-medium">{importFile.name}</p>
                        <p className="text-sm text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setImportFile(null); setImportPreview([]); setImportHeaders([]); setImportResult(null); }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Column Mapping */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Column Mapping</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {importMapping.map(m => (
                        <div key={m.csvColumn} className="flex items-center gap-2">
                          <span className="w-32 text-sm text-gray-600 truncate">{m.csvColumn}</span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <select
                            value={m.dbField}
                            onChange={(e) => updateMapping(m.csvColumn, e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                          >
                            <option value="">Skip</option>
                            {dbFields.map(f => (
                              <option key={f.value} value={f.value}>{f.label}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Preview (first 5 rows)</h4>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {importHeaders.map((h, i) => (
                              <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {importPreview.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) => (
                                <td key={j} className="px-3 py-2 text-gray-700">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {importResult ? (
                    <div className={`p-4 rounded-lg ${importResult.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <div className="flex items-center gap-2">
                        {importResult.failed > 0 ? (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        <span className="font-medium">
                          Import complete: {importResult.success} successful, {importResult.failed} failed
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleImport}
                      disabled={importing || importMapping.every(m => !m.dbField)}
                      className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {importing ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Importing...</>
                      ) : (
                        <><Upload className="h-4 w-4" /> Start Import</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bulk Update Tab */}
          {activeTab === 'bulk' && (
            <div>
              {/* Bulk Action Bar */}
              {selectedCount > 0 && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                  <span className="text-orange-700 font-medium">{selectedCount} partners selected</span>
                  <div className="flex items-center gap-3">
                    <select
                      value={bulkAction}
                      onChange={(e) => { setBulkAction(e.target.value); setBulkValue(''); }}
                      className="border rounded-lg px-3 py-1.5"
                    >
                      <option value="">Select Action</option>
                      <option value="status">Change Status</option>
                      <option value="tier">Change Tier</option>
                      <option value="delete">Delete</option>
                    </select>
                    {bulkAction === 'status' && (
                      <select
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        className="border rounded-lg px-3 py-1.5"
                      >
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    )}
                    {bulkAction === 'tier' && (
                      <select
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        className="border rounded-lg px-3 py-1.5"
                      >
                        <option value="">Select Tier</option>
                        <option value="Bronze">Bronze</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    )}
                    <button
                      onClick={handleBulkAction}
                      disabled={!bulkAction || (bulkAction !== 'delete' && !bulkValue)}
                      className="bg-orange-500 text-white px-4 py-1.5 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Partner List */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-orange-500 rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {partners.map(partner => (
                      <tr key={partner.id} className={partner.selected ? 'bg-orange-50' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={partner.selected}
                            onChange={() => toggleSelect(partner.id)}
                            className="w-4 h-4 text-orange-500 rounded"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{partner.company_name}</p>
                          <p className="text-sm text-gray-500">{partner.email}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{partner.contact_name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            partner.status === 'active' ? 'bg-green-100 text-green-700' :
                            partner.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {partner.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            partner.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                            partner.tier === 'Silver' ? 'bg-gray-100 text-gray-700' :
                            partner.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {partner.tier}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                      <select
                        value={exportType}
                        onChange={(e) => setExportType(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="partners">Partner List</option>
                        <option value="commissions">Commission Report</option>
                        <option value="referrals">Referral Report</option>
                        <option value="deals">Deal Report</option>
                        <option value="activity">Activity Log</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                      <div className="flex gap-3">
                        {['csv', 'xlsx'].map(format => (
                          <button
                            key={format}
                            onClick={() => setExportFormat(format)}
                            className={`flex-1 px-4 py-2 border rounded-lg ${
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <input
                          type="date"
                          value={exportDateRange.start}
                          onChange={(e) => setExportDateRange({ ...exportDateRange, start: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <input
                          type="date"
                          value={exportDateRange.end}
                          onChange={(e) => setExportDateRange({ ...exportDateRange, end: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleExport}
                      disabled={exporting}
                      className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {exporting ? (
                        <><RefreshCw className="h-4 w-4 animate-spin" /> Exporting...</>
                      ) : (
                        <><Download className="h-4 w-4" /> Export Now</>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Scheduled Exports</h4>
                  <div className="space-y-3">
                    {scheduledExports.map(exp => (
                      <div key={exp.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900">{exp.name}</h5>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${exp.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {exp.is_active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{exp.schedule}</span>
                          <span>|</span>
                          <span>Next: {new Date(exp.next_run).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    <button className="w-full border border-dashed rounded-lg p-3 text-gray-500 hover:text-orange-600 hover:border-orange-300 flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" /> Schedule New Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
