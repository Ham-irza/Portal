import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Profile } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { Users, Plus, Edit2, Trash2, X, UserCheck, Search } from 'lucide-react';

const ROLES = ['admin', 'team_member'] as const;
const DEPARTMENTS = ['Immigration', 'Business', 'Finance', 'Support'] as const;
const SPECIALIZATIONS = ['Work Visa', 'Family Visa', 'Business Visa', 'Business Registration'] as const;

export default function AdminTeam() {
  const { profile: currentUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'team_member' as typeof ROLES[number],
    department: '',
    specialization: '',
    phone: '',
    max_workload: 20
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'team_member'])
      .order('created_at', { ascending: false });
    setTeamMembers(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      await supabase.from('profiles').update({
        full_name: formData.full_name,
        role: formData.role,
        department: formData.department,
        specialization: formData.specialization,
        phone: formData.phone,
        max_workload: formData.max_workload
      }).eq('id', editingMember.id);
    }
    setShowModal(false);
    setEditingMember(null);
    resetForm();
    fetchTeamMembers();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'team_member',
      department: '',
      specialization: '',
      phone: '',
      max_workload: 20
    });
  };

  const openEditModal = (member: Profile) => {
    setEditingMember(member);
    setFormData({
      email: member.email,
      full_name: member.full_name || '',
      role: member.role as typeof ROLES[number],
      department: member.department || '',
      specialization: member.specialization || '',
      phone: member.phone || '',
      max_workload: member.max_workload || 20
    });
    setShowModal(true);
  };

  const toggleActive = async (member: Profile) => {
    await supabase.from('profiles').update({ is_active: !member.is_active }).eq('id', member.id);
    fetchTeamMembers();
  };

  const filtered = teamMembers.filter(m => 
    m.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500">{teamMembers.length} team members</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search team members..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{member.full_name || 'Unnamed'}</h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
                {currentUser?.role === 'admin' && member.id !== currentUser.id && (
                  <button onClick={() => openEditModal(member)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Edit2 className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {member.role === 'admin' ? 'Admin' : 'Team Member'}
                  </span>
                </div>
                {member.department && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department:</span>
                    <span className="text-gray-900">{member.department}</span>
                  </div>
                )}
                {member.specialization && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Specialization:</span>
                    <span className="text-gray-900">{member.specialization}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <button 
                    onClick={() => toggleActive(member)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      member.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {member.is_active !== false ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Edit Team Member</h2>
              <button onClick={() => { setShowModal(false); setEditingMember(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof ROLES[number] })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r === 'admin' ? 'Admin' : 'Team Member'}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select department...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select specialization...</option>
                  {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Workload (applicants)</label>
                <input
                  type="number"
                  value={formData.max_workload}
                  onChange={(e) => setFormData({ ...formData, max_workload: parseInt(e.target.value) || 20 })}
                  className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-orange-500"
                  min="1"
                  max="100"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingMember(null); }} 
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
