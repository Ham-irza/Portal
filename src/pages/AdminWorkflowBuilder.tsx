import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { 
  Plus, Trash2, ArrowRight, Mail, Bell, UserCheck, Clock, FileCheck,
  Settings, Play, Pause, Save, X, ChevronDown, ChevronRight, GitBranch,
  Zap, CheckCircle, AlertCircle
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  name: string;
  config: Record<string, string | number | boolean>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  is_active: boolean;
  steps: WorkflowStep[];
  created_at: string;
}

const TRIGGERS = [
  { id: 'status_change', name: 'Status Change', icon: GitBranch, description: 'When a status changes' },
  { id: 'document_upload', name: 'Document Upload', icon: FileCheck, description: 'When a document is uploaded' },
  { id: 'timer', name: 'Time Based', icon: Clock, description: 'After a specified time' },
  { id: 'partner_created', name: 'New Partner', icon: UserCheck, description: 'When a new partner registers' },
];

const ACTIONS = [
  { id: 'send_email', name: 'Send Email', icon: Mail, description: 'Send notification email' },
  { id: 'notify', name: 'Send Notification', icon: Bell, description: 'In-app notification' },
  { id: 'assign_task', name: 'Assign Task', icon: UserCheck, description: 'Assign to team member' },
  { id: 'update_status', name: 'Update Status', icon: CheckCircle, description: 'Change entity status' },
];

const TEMPLATES = [
  { id: 'onboarding', name: 'Partner Onboarding', description: 'Automated onboarding workflow', steps: 4 },
  { id: 'deal_approval', name: 'Deal Approval', description: 'Multi-level deal approval process', steps: 3 },
  { id: 'commission_approval', name: 'Commission Approval', description: 'Commission payout approval workflow', steps: 2 },
  { id: 'document_review', name: 'Document Review', description: 'Document verification workflow', steps: 3 },
];

export default function AdminWorkflowBuilder() {
  const { profile } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: '1', name: 'Partner Onboarding', description: 'Welcome new partners', trigger_type: 'partner_created', is_active: true, steps: [], created_at: new Date().toISOString() },
    { id: '2', name: 'Deal Review Process', description: 'Multi-level deal approval', trigger_type: 'status_change', is_active: true, steps: [], created_at: new Date().toISOString() },
  ]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [builderSteps, setBuilderSteps] = useState<WorkflowStep[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('');

  const isAdmin = profile?.role === 'admin';

  const startNewWorkflow = () => {
    setWorkflowName('');
    setWorkflowDescription('');
    setSelectedTrigger('');
    setBuilderSteps([]);
    setSelectedWorkflow(null);
    setShowBuilder(true);
  };

  const editWorkflow = (workflow: Workflow) => {
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description);
    setSelectedTrigger(workflow.trigger_type);
    setBuilderSteps(workflow.steps);
    setSelectedWorkflow(workflow);
    setShowBuilder(true);
  };

  const addStep = (type: 'action' | 'condition') => {
    const newStep: WorkflowStep = {
      id: Date.now().toString(),
      type,
      name: type === 'action' ? 'New Action' : 'New Condition',
      config: {}
    };
    setBuilderSteps([...builderSteps, newStep]);
  };

  const removeStep = (stepId: string) => {
    setBuilderSteps(builderSteps.filter(s => s.id !== stepId));
  };

  const updateStepConfig = (stepId: string, key: string, value: string) => {
    setBuilderSteps(builderSteps.map(s => 
      s.id === stepId ? { ...s, config: { ...s.config, [key]: value } } : s
    ));
  };

  const saveWorkflow = () => {
    const workflow: Workflow = {
      id: selectedWorkflow?.id || Date.now().toString(),
      name: workflowName,
      description: workflowDescription,
      trigger_type: selectedTrigger,
      is_active: true,
      steps: builderSteps,
      created_at: selectedWorkflow?.created_at || new Date().toISOString()
    };

    if (selectedWorkflow) {
      setWorkflows(workflows.map(w => w.id === workflow.id ? workflow : w));
    } else {
      setWorkflows([...workflows, workflow]);
    }
    setShowBuilder(false);
  };

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(workflows.map(w => 
      w.id === workflowId ? { ...w, is_active: !w.is_active } : w
    ));
  };

  const deleteWorkflow = (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(workflows.filter(w => w.id !== workflowId));
    }
  };

  const useTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setWorkflowName(template.name);
      setWorkflowDescription(template.description);
      setSelectedTrigger(templateId === 'onboarding' ? 'partner_created' : 'status_change');
      
      // Generate sample steps based on template
      const sampleSteps: WorkflowStep[] = [];
      if (templateId === 'onboarding') {
        sampleSteps.push({ id: '1', type: 'action', name: 'Send Welcome Email', config: { action_type: 'send_email' } });
        sampleSteps.push({ id: '2', type: 'action', name: 'Assign Onboarding Manager', config: { action_type: 'assign_task' } });
        sampleSteps.push({ id: '3', type: 'action', name: 'Create Tasks', config: { action_type: 'notify' } });
      } else if (templateId === 'deal_approval') {
        sampleSteps.push({ id: '1', type: 'action', name: 'Notify Manager', config: { action_type: 'notify' } });
        sampleSteps.push({ id: '2', type: 'action', name: 'Request Approval', config: { action_type: 'assign_task' } });
      }
      setBuilderSteps(sampleSteps);
      setShowTemplates(false);
      setShowBuilder(true);
    }
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workflow Builder</h1>
        <p className="text-gray-600">Create and manage automated workflows</p>
      </div>

      {!showBuilder ? (
        <>
          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={startNewWorkflow}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" /> Create Workflow
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 border px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <Zap className="h-4 w-4" /> Use Template
            </button>
          </div>

          {/* Workflow List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Active Workflows</h2>
            </div>
            {workflows.length === 0 ? (
              <div className="p-12 text-center">
                <GitBranch className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                <p className="text-gray-500 mb-6">Create your first automated workflow</p>
              </div>
            ) : (
              <div className="divide-y">
                {workflows.map(workflow => (
                  <div key={workflow.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${workflow.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <GitBranch className={`h-5 w-5 ${workflow.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-500">{workflow.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            Trigger: {TRIGGERS.find(t => t.id === workflow.trigger_type)?.name}
                          </span>
                          <span className="text-xs text-gray-400">|</span>
                          <span className="text-xs text-gray-400">{workflow.steps.length} steps</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleWorkflow(workflow.id)}
                        className={`p-2 rounded-lg ${workflow.is_active ? 'hover:bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-400'}`}
                      >
                        {workflow.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => editWorkflow(workflow)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteWorkflow(workflow.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Workflow Builder UI */
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">{selectedWorkflow ? 'Edit Workflow' : 'Create Workflow'}</h2>
            <button onClick={() => setShowBuilder(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Name</label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Partner Onboarding"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Brief description"
                />
              </div>
            </div>

            {/* Trigger Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Trigger</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TRIGGERS.map(trigger => (
                  <button
                    key={trigger.id}
                    onClick={() => setSelectedTrigger(trigger.id)}
                    className={`p-4 border rounded-lg text-left transition ${
                      selectedTrigger === trigger.id 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <trigger.icon className={`h-5 w-5 mb-2 ${selectedTrigger === trigger.id ? 'text-orange-600' : 'text-gray-400'}`} />
                    <p className="font-medium text-sm">{trigger.name}</p>
                    <p className="text-xs text-gray-500">{trigger.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Steps Builder */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Workflow Steps</label>
              
              {/* Trigger Step */}
              {selectedTrigger && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-800">When: {TRIGGERS.find(t => t.id === selectedTrigger)?.name}</p>
                  </div>
                </div>
              )}

              {/* Action Steps */}
              {builderSteps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3 mb-3">
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-4 w-4 text-gray-400 my-1" />
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 p-3 bg-gray-50 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <select
                        value={step.config.action_type as string || ''}
                        onChange={(e) => updateStepConfig(step.id, 'action_type', e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="">Select Action</option>
                        {ACTIONS.map(action => (
                          <option key={action.id} value={action.id}>{action.name}</option>
                        ))}
                      </select>
                      <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-100 rounded text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {step.config.action_type === 'send_email' && (
                      <input
                        type="text"
                        placeholder="Email template name"
                        className="w-full border rounded px-2 py-1 text-sm"
                        onChange={(e) => updateStepConfig(step.id, 'template', e.target.value)}
                      />
                    )}
                    {step.config.action_type === 'update_status' && (
                      <input
                        type="text"
                        placeholder="New status"
                        className="w-full border rounded px-2 py-1 text-sm"
                        onChange={(e) => updateStepConfig(step.id, 'status', e.target.value)}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Add Step Button */}
              <button
                onClick={() => addStep('action')}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 text-sm font-medium mt-2"
              >
                <Plus className="h-4 w-4" /> Add Action Step
              </button>
            </div>

            {/* Save Button */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBuilder(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveWorkflow}
                disabled={!workflowName || !selectedTrigger}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" /> Save Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Workflow Templates</h2>
              <button onClick={() => setShowTemplates(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => useTemplate(template.id)}
                  className="p-4 border rounded-lg text-left hover:border-orange-300 hover:bg-orange-50 transition"
                >
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                  <p className="text-xs text-orange-600 mt-2">{template.steps} steps</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
