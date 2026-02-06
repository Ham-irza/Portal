import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Download, Calendar } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>({});

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.getPartnerReport({ start_date: dateRange.from || undefined, end_date: dateRange.to || undefined });
      setReport(res);
    } catch (err) {
      console.error('Failed to fetch partner report', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onExportCSV = async () => {
    try {
      const blob = await api.exportPartnerReportCSV({ start_date: dateRange.from || undefined, end_date: dateRange.to || undefined });
      downloadBlob(blob, `partner-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.csv`);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  const onExportPDF = async () => {
    try {
      const blob = await api.exportPartnerReportPDF({ start_date: dateRange.from || undefined, end_date: dateRange.to || undefined });
      downloadBlob(blob, `partner-report-${dateRange.from || 'start'}-${dateRange.to || 'end'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <p className="text-gray-600">Partner performance and activity reports</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="border border-gray-300 rounded-lg py-2 px-3 text-sm" />
            <span className="text-gray-500">to</span>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="border border-gray-300 rounded-lg py-2 px-3 text-sm" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={onExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={onExportPDF} className="flex items-center gap-2 px-4 py-2 bg-charcoal text-white rounded-lg hover:bg-charcoal-dark transition">
              <Download className="h-4 w-4" /> Export PDF
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-700">{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}
    </Layout>
  );
}
