import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';

export default function ApplicantDashboard() {
  const { profile } = useAuth();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile?.full_name || 'Applicant'}</h1>
        <p className="text-gray-600 mt-2">As an individual applicant, you can manage your own visa application below.</p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Link
          to="/applications/new"
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-8 hover:shadow-xl transition flex flex-col items-center justify-center min-h-48"
        >
          <Plus className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Create New Application</h3>
          <p className="text-orange-100 text-center text-sm">Start your visa application process</p>
        </Link>

        <Link
          to="/applications"
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-8 hover:shadow-xl transition flex flex-col items-center justify-center min-h-48"
        >
          <FileText className="h-12 w-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">My Applications</h3>
          <p className="text-blue-100 text-center text-sm">View and manage your applications and documents</p>
        </Link>
      </div>

      {/* Info Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
        <h2 className="text-lg font-semibold mb-4">How to Get Started</h2>
        <ol className="space-y-3 text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">1</span>
            <span>Click "Create New Application" to start a new visa application</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">2</span>
            <span>Fill in your personal and visa details</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">3</span>
            <span>Upload required documents for your visa type</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">4</span>
            <span>Submit your application for review</span>
          </li>
        </ol>
      </div>
    </Layout>
  );
}
