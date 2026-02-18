import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Resource {
  id: number;
  title: string;
  description: string;
  category: string;
  file_path: string;
  file_type: string;
  file_size: number;
  is_published: boolean;
  view_count: number;
  created_at: string;
}

interface TrainingModule {
  id: number;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  duration: number;
  sort_order: number;
  is_required: boolean;
}

const CATEGORIES = ['general', 'marketing', 'training', 'templates', 'legal', 'faq'];

export default function AdminContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'resources' | 'training'>('resources');
  const [resources, setResources] = useState<Resource[]>([]);
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [resourcesRes, modulesRes] = await Promise.all([
      supabase.from('resources').select('*').order('created_at', { ascending: false }),
      supabase.from('training_modules').select('*').order('sort_order'),
    ]);

    setResources(resourcesRes.data || []);
    setModules(modulesRes.data || []);
    setLoading(false);
  };

  const togglePublish = async (id: number | string, current: boolean) => {
    await supabase.from('resources').update({ is_published: !current }).eq('id', id);
    loadData();
  };

  const deleteResource = async (id: number | string) => {
    if (confirm('Delete this resource?')) {
      await supabase.from('resources').delete().eq('id', id);
      loadData();
    }
  };

  const deleteModule = async (id: number | string) => {
    if (confirm('Delete this training module?')) {
      await supabase.from('training_modules').delete().eq('id', id);
      loadData();
    }
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
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Content Management</h1>
          <p className="text-gray-600 mt-1">Manage resources, training materials, and marketing content</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'resources', label: 'Resources & Materials' },
              { key: 'training', label: 'Training Modules' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => activeTab === 'resources' 
              ? (setEditingResource(null), setShowResourceModal(true))
              : (setEditingModule(null), setShowModuleModal(true))
            }
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add {activeTab === 'resources' ? 'Resource' : 'Module'}
          </button>
        </div>

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No resources found. Add your first resource.
                    </td>
                  </tr>
                ) : (
                  resources.map(resource => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-800">{resource.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{resource.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">{resource.category}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 uppercase">{resource.file_type || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{resource.view_count}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => togglePublish(resource.id, resource.is_published)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            resource.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {resource.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingResource(resource); setShowResourceModal(true); }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteResource(resource.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Training Modules Tab */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            {modules.length === 0 ? (
              <div className="bg-white rounded-xl border p-12 text-center">
                <p className="text-gray-500">No training modules. Create your first module.</p>
              </div>
            ) : (
              modules.map((module, idx) => (
                <div key={module.id} className="bg-white rounded-xl border p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{module.title}</h3>
                          {module.is_required && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Required</span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{module.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="capitalize">{module.content_type}</span>
                          <span>{module.duration} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingModule(module); setShowModuleModal(true); }}
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteModule(module.id)}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Resource Modal */}
        {showResourceModal && (
          <ResourceModal
            resource={editingResource}
            userId={user?.id ? String(user.id) : ""}
            onSave={() => { setShowResourceModal(false); loadData(); }}
            onClose={() => { setShowResourceModal(false); setEditingResource(null); }}
          />
        )}

        {/* Module Modal */}
        {showModuleModal && (
          <ModuleModal
            module={editingModule}
            onSave={() => { setShowModuleModal(false); loadData(); }}
            onClose={() => { setShowModuleModal(false); setEditingModule(null); }}
          />
        )}
      </div>
    </Layout>
  );
}

function ResourceModal({ resource, userId, onSave, onClose }: {
  resource: Resource | null;
  userId?: string;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: resource?.title || '',
    description: resource?.description || '',
    category: resource?.category || 'general',
    file_type: resource?.file_type || 'pdf',
    file_path: resource?.file_path || '',
    is_published: resource?.is_published ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (resource) {
      await supabase.from('resources').update(form).eq('id', resource.id);
    } else {
      await supabase.from('resources').insert({ ...form, created_by: userId });
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{resource ? 'Edit' : 'Add'} Resource</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
              <select
                value={form.file_type}
                onChange={e => setForm(f => ({ ...f, file_type: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="image">Image</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
            <input
              type="text"
              value={form.file_path}
              onChange={e => setForm(f => ({ ...f, file_path: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="https://..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="h-4 w-4 text-orange-500 rounded"
            />
            <label htmlFor="published" className="text-sm text-gray-700">Publish immediately</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ModuleModal({ module, onSave, onClose }: {
  module: TrainingModule | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: module?.title || '',
    description: module?.description || '',
    content_type: module?.content_type || 'video',
    content_url: module?.content_url || '',
    duration: module?.duration || 15,
    sort_order: module?.sort_order || 0,
    is_required: module?.is_required ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (module) {
      await supabase.from('training_modules').update(form).eq('id', module.id);
    } else {
      await supabase.from('training_modules').insert(form);
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{module ? 'Edit' : 'Add'} Training Module</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={form.content_type}
                onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="article">Article</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content URL</label>
            <input
              type="text"
              value={form.content_url}
              onChange={e => setForm(f => ({ ...f, content_url: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) }))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_required}
                  onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
                  className="h-4 w-4 text-orange-500 rounded"
                />
                <span className="text-sm text-gray-700">Required for partners</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
