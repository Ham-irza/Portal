import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  user_id: string;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  user?: { full_name: string; email: string; company_name: string };
}

interface Reply {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user?: { full_name: string; role: string };
}

export default function AdminTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) loadReplies(selectedTicket.id);
  }, [selectedTicket]);

  const loadTickets = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, user:profiles(full_name, email, company_name)')
      .order('created_at', { ascending: false });
    
    setTickets(data || []);
    setLoading(false);
  };

  const loadReplies = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_replies')
      .select('*, user:profiles(full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at');
    
    setReplies(data || []);
  };

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;
    
    await supabase.from('support_tickets').update({ 
      status,
      resolved_at: status === 'resolved' ? new Date().toISOString() : null,
      assigned_to: status === 'in_progress' ? user?.id : selectedTicket.assigned_to,
    }).eq('id', selectedTicket.id);
    
    setSelectedTicket({ ...selectedTicket, status });
    loadTickets();
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyContent.trim()) return;

    await supabase.from('ticket_replies').insert({
      ticket_id: selectedTicket.id,
      user_id: user.id,
      content: replyContent,
    });

    // Update ticket status if it was waiting
    if (selectedTicket.status === 'open' || selectedTicket.status === 'waiting_response') {
      await supabase.from('support_tickets').update({ 
        status: 'in_progress',
        assigned_to: user.id,
      }).eq('id', selectedTicket.id);
    }

    setReplyContent('');
    loadReplies(selectedTicket.id);
    loadTickets();
  };

  const filteredTickets = tickets.filter(t => filter === 'all' || t.status === filter);

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const statusColors: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    waiting_response: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-gray-100 text-gray-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length,
    avgResponse: '2.4h',
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Support Ticket Management</h1>
          <p className="text-gray-600 mt-1">Manage and respond to partner support requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Open Tickets</p>
            <p className="text-2xl font-bold text-green-600">{stats.open}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Urgent</p>
            <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border">
            <p className="text-sm text-gray-600">Avg Response</p>
            <p className="text-2xl font-bold text-gray-800">{stats.avgResponse}</p>
          </div>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Ticket List */}
          <div className="w-1/3 flex flex-col">
            <div className="flex gap-2 mb-4">
              {['all', 'open', 'in_progress', 'waiting_response', 'resolved'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                    filter === status ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left bg-white rounded-xl border p-4 hover:border-orange-300 transition-colors ${
                    selectedTicket?.id === ticket.id ? 'border-orange-500 ring-1 ring-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-gray-800 line-clamp-1">{ticket.subject}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{ticket.user?.company_name || ticket.user?.full_name}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[ticket.status]}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="flex-1 flex flex-col bg-white rounded-xl border">
            {selectedTicket ? (
              <>
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{selectedTicket.subject}</h2>
                      <p className="text-sm text-gray-500">
                        From: {selectedTicket.user?.full_name} ({selectedTicket.user?.email})
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(selectedTicket.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[selectedTicket.priority]}`}>
                          {selectedTicket.priority}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedTicket.status]}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </div>
                      <select
                        value={selectedTicket.status}
                        onChange={e => updateTicketStatus(e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_response">Waiting Response</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{selectedTicket.description}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {replies.map(reply => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg ${
                        reply.user?.role === 'admin' || reply.user?.role === 'team_member'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-gray-50 mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-800">{reply.user?.full_name}</span>
                        {(reply.user?.role === 'admin' || reply.user?.role === 'team_member') && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">HCS Team</span>
                        )}
                        <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-600">{reply.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendReply} className="p-4 border-t">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="Type your response..."
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={!replyContent.trim()}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a ticket to view and respond
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
