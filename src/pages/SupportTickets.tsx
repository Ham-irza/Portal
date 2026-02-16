import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface TicketMessage {
  id: number;
  author: number;
  author_email: string;
  body: string;
  is_staff_reply: boolean;
  created_at: string;
}

interface Ticket {
  id: number;
  subject: string;
  status: string;
  category?: string;
  priority?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

const CATEGORIES = ['General', 'Technical', 'Billing', 'Referral', 'Commission', 'Account'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function SupportTickets() {
  const { user, profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [filter, setFilter] = useState('all');

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'General',
    priority: 'medium',
  });

  useEffect(() => {
    loadTickets();
  }, [user]);

  useEffect(() => {
    if (selectedTicket) {
      loadTicketDetails(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    if (!user) return;
    
    try {
      const data = await api.getTickets();
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId: number) => {
    try {
      const ticket = await api.getTicket(ticketId);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Error loading ticket details:', error);
    }
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const data = await api.createTicket({
        subject: newTicket.subject,
        initial_message: newTicket.description,
        category: newTicket.category.toLowerCase(),
        priority: newTicket.priority.toLowerCase(),
      });
      setShowNewTicket(false);
      setNewTicket({ subject: '', description: '', category: 'General', priority: 'medium' });
      loadTickets();
      setSelectedTicket(data);
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket');
    }
  };

  const addReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyContent.trim()) return;

    try {
      await api.replyToTicket(selectedTicket.id, replyContent);
      setReplyContent('');
      loadTicketDetails(selectedTicket.id);
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    }
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Support Center</h1>
            <p className="text-gray-600 mt-1">Get help with your questions and issues</p>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Ticket
          </button>
        </div>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Ticket List */}
          <div className="w-full lg:w-1/3 flex flex-col">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['all', 'open', 'in_progress', 'resolved'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filter === status ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredTickets.length === 0 ? (
                <div className="bg-white rounded-xl border p-8 text-center">
                  <p className="text-gray-500">No tickets found</p>
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full text-left bg-white rounded-xl border p-4 hover:border-orange-300 transition-colors ${
                      selectedTicket?.id === ticket.id ? 'border-orange-500 ring-1 ring-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-gray-800 line-clamp-1">{ticket.subject}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${statusColors[ticket.status]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="hidden lg:flex lg:flex-1 flex-col bg-white rounded-xl border">
            {selectedTicket ? (
              <>
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{selectedTicket.subject}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {new Date(selectedTicket.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedTicket.status] || 'bg-gray-100 text-gray-700'}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {(selectedTicket.messages || []).map(msg => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.is_staff_reply ? 'bg-gray-50 mr-8' : 'bg-orange-50 ml-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-800">
                          {msg.author_email}
                        </span>
                        {msg.is_staff_reply && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Support
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-600">{msg.body}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={addReply} className="p-4 border-t">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      placeholder="Type your reply..."
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
                Select a ticket to view details
              </div>
            )}
          </div>
        </div>

        {/* New Ticket Modal */}
        {showNewTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create Support Ticket</h2>
                <button onClick={() => setShowNewTicket(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={createTicket} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={newTicket.subject}
                    onChange={e => setNewTicket(t => ({ ...t, subject: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Brief description of your issue"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={e => setNewTicket(t => ({ ...t, category: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={e => setNewTicket(t => ({ ...t, priority: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      {PRIORITIES.map(p => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    required
                    value={newTicket.description}
                    onChange={e => setNewTicket(t => ({ ...t, description: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Provide detailed information about your issue..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewTicket(false)}
                    className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Create Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
