import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface MessageThread { application_id: string; client_name: string; last_message: string; last_date: string; unread: number; }

export default function Messages() {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchThreads(); }, [user]);

  const fetchThreads = async () => {
    const appsQuery = profile?.role === 'admin'
      ? supabase.from('applications').select('id, client_name')
      : supabase.from('applications').select('id, client_name').eq('partner_id', user!.id);
    const { data: apps } = await appsQuery;
    
    if (apps) {
      const threadData: MessageThread[] = [];
      for (const app of apps) {
        const { data: msgs } = await supabase.from('messages').select('*').eq('application_id', app.id).order('created_at', { ascending: false }).limit(1);
        const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('application_id', app.id).eq('is_read', false).neq('sender_id', user!.id);
        if (msgs?.length) {
          threadData.push({ application_id: app.id, client_name: app.client_name, last_message: msgs[0].content, last_date: msgs[0].created_at, unread: count || 0 });
        }
      }
      threadData.sort((a, b) => new Date(b.last_date).getTime() - new Date(a.last_date).getTime());
      setThreads(threadData);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">Messages will appear here when you communicate on applications</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
          {threads.map(t => (
            <Link key={t.application_id} to={`/applications/${t.application_id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{t.client_name}</p>
                  {t.unread > 0 && <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">{t.unread}</span>}
                </div>
                <p className="text-sm text-gray-500 truncate">{t.last_message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(t.last_date).toLocaleString()}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
