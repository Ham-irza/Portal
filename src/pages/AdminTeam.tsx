import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Users, Search, Building, Check, Ban, Mail, Phone } from 'lucide-react';

interface TeamMember {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
}

export default function AdminTeam() {
  const { profile: currentUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const data = await api.getTeamMembers();
      const members = Array.isArray(data) ? data : ((data as any)?.results || []);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Fallback: try to get from users endpoint or partners
      try {
        // Try fetching partners as fallback (since team members might be stored there)
        const partnersData = await api.getPartners();
        const partners = Array.isArray(partnersData) ? partnersData : ((partnersData as any)?.results || []);
        
        // Convert partners to team member format for display
        const membersFromPartners = partners.map((p: any) => ({
          id: p.id,
          email: p.email || '',
          first_name: p.contact_name?.split(' ')[0] || '',
          last_name: p.contact_name?.split(' ').slice(1).join(' ') || '',
          role: 'team_member',
          is_active: p.status === 'approved',
        }));
        setTeamMembers(membersFromPartners);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const filtered = teamMembers.filter(member => 
    member.email?.toLowerCase().includes(search.toLowerCase()) ||
    member.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    member.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    member.role?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-orange-100 text-orange-700';
      case 'staff':
        return 'bg-blue-100 text-blue-700';
      case 'team_member':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-sm text-gray-500">{teamMembers.length} team members in the system</p>
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
                    <h3 className="font-medium text-gray-900">
                      {member.first_name || member.last_name 
                        ? `${member.first_name || ''} ${member.last_name || ''}`.trim() 
                        : 'Team Member'}
                    </h3>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Role:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadge(member.role)}`}>
                    {member.role?.replace('_', ' ') || 'Team Member'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    member.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {search ? 'No team members match your search.' : 'No team members found.'}
        </div>
      )}
    </Layout>
  );
}
