import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Layout from '@/components/Layout';
import { Users, Search, Building, Check, Ban, Mail, Phone, Plus, X, Send, Copy, CheckCircle } from 'lucide-react';

interface TeamMember {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  is_active: boolean;
  is_team_member?: boolean;
}

interface TeamInvitation {
  id: number;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Partner {
  id: number;
  email: string;
  company_name: string;
  contact_name: string;
  status: string;
}

export default function AdminTeam() {
  const { profile: currentUser } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddFromPartnerModal, setShowAddFromPartnerModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('team_member');
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedPartnerRole, setSelectedPartnerRole] = useState('team_member');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersData, invitationsData] = await Promise.all([
        api.getTeamMembers(),
        api.getTeamInvitations()
      ]);
      setTeamMembers(Array.isArray(membersData) ? membersData : (membersData as any)?.results || []);
      setInvitations(Array.isArray(invitationsData) ? invitationsData : (invitationsData as any)?.results || []);
    } catch (error) {
      console.error('Error fetching team data:', error);
      try {
        const partnersData = await api.getPartners();
        const partners = Array.isArray(partnersData) ? partnersData : ((partnersData as any)?.results || []);
        
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    
    try {
      await api.createTeamInvitation({ email: inviteEmail, role: inviteRole });
      setInviteSuccess('Invitation sent successfully!');
      setInviteEmail('');
      fetchData();
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess('');
      }, 2000);
    } catch (error: any) {
      setInviteError(error.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvitation = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    try {
      await api.deleteTeamInvitation(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete invitation:', error);
    }
  };

  const copyInviteLink = (token: string) => {
    const frontendUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5173';
    const link = `${frontendUrl}/accept-invitation?token=${token}`;
    navigator.clipboard.writeText(link);
    alert('Invitation link copied to clipboard!');
  };

  const fetchPartners = async () => {
    try {
      const data = await api.getPartners();
      const partnersData = Array.isArray(data) ? data : ((data as any)?.results || []);
      setPartners(partnersData);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
    }
  };

  const openAddFromPartnerModal = async () => {
    await fetchPartners();
    setShowAddFromPartnerModal(true);
  };

  const handleAddPartnerAsTeamMember = async () => {
    if (!selectedPartnerId) return;
    setInviting(true);
    setInviteError('');
    try {
      await api.addPartnerAsTeamMember(selectedPartnerId, selectedPartnerRole);
      setInviteSuccess('Partner added as team member successfully!');
      setSelectedPartnerId(null);
      fetchData();
      setTimeout(() => {
        setShowAddFromPartnerModal(false);
        setInviteSuccess('');
      }, 2000);
    } catch (error: any) {
      setInviteError(error.message || 'Failed to add partner as team member');
    } finally {
      setInviting(false);
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
        <button
          onClick={openAddFromPartnerModal}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          <Building className="h-5 w-5" />
          Add Team Member
        </button>
      </div>

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

      {invitations.filter(i => i.status === 'pending').length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-yellow-100 p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Pending Invitations</h2>
          <div className="space-y-2">
            {invitations.filter(i => i.status === 'pending').map(invitation => (
              <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-gray-900">{invitation.email}</p>
                    <p className="text-sm text-gray-500">Role: {invitation.role} | Expires: {new Date(invitation.expires_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyInviteLink(invitation.id.toString())}
                    className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                    title="Copy invite link"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInvitation(invitation.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    title="Cancel invitation"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Invite Team Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              {inviteSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                  <CheckCircle className="h-5 w-5" />
                  {inviteSuccess}
                </div>
              )}
              
              {inviteError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                  {inviteError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="team_member">Team Member</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium disabled:opacity-50"
                >
                  {inviting ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" /> : <><Send className="h-5 w-5" /> Send Invitation</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddFromPartnerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add from Existing Partner</h2>
              <button onClick={() => setShowAddFromPartnerModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {inviteSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg mb-4">
                  <CheckCircle className="h-5 w-5" />
                  {inviteSuccess}
                </div>
              )}
              
              {inviteError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg mb-4">
                  {inviteError}
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Partner</label>
                <select
                  value={selectedPartnerId || ''}
                  onChange={(e) => setSelectedPartnerId(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Select a Partner --</option>
                  {partners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.company_name || partner.email} ({partner.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={selectedPartnerRole}
                  onChange={(e) => setSelectedPartnerRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="team_member">Team Member</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t flex gap-3">
              <button
                type="button"
                onClick={() => { setShowAddFromPartnerModal(false); setSelectedPartnerId(null); setInviteError(''); }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPartnerAsTeamMember}
                disabled={!selectedPartnerId || inviting}
                className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {inviting ? ' Adding...' : 'Add to Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
