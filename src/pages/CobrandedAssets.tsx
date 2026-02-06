import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { 
  Upload, Download, FileText, Image, Palette, Search, Filter, 
  Grid, List, Eye, Trash2, Clock, CheckCircle, X, RefreshCw
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  description: string;
  category: string;
  template_url: string;
  preview_url: string;
  file_type: string;
  downloads: number;
  created_at: string;
}

interface GeneratedAsset {
  id: string;
  asset_id: string;
  partner_logo_url: string;
  output_url: string;
  created_at: string;
}

export default function CobrandedAssets() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [partnerLogo, setPartnerLogo] = useState<File | null>(null);
  const [partnerLogoPreview, setPartnerLogoPreview] = useState('');
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = ['all', 'Brochures', 'Presentations', 'Email Templates', 'Social Media', 'Flyers', 'Banners'];

  // Sample assets
  const sampleAssets: Asset[] = [
    { id: '1', name: 'Product Brochure', description: 'Professional product overview brochure', category: 'Brochures', template_url: '#', preview_url: '', file_type: 'PDF', downloads: 234, created_at: new Date().toISOString() },
    { id: '2', name: 'Sales Presentation', description: 'Comprehensive sales deck for client meetings', category: 'Presentations', template_url: '#', preview_url: '', file_type: 'PPTX', downloads: 189, created_at: new Date().toISOString() },
    { id: '3', name: 'Email Signature', description: 'Professional email signature template', category: 'Email Templates', template_url: '#', preview_url: '', file_type: 'HTML', downloads: 156, created_at: new Date().toISOString() },
    { id: '4', name: 'LinkedIn Banner', description: 'Social media banner for LinkedIn', category: 'Social Media', template_url: '#', preview_url: '', file_type: 'PNG', downloads: 312, created_at: new Date().toISOString() },
    { id: '5', name: 'Service Flyer', description: 'Single-page service overview flyer', category: 'Flyers', template_url: '#', preview_url: '', file_type: 'PDF', downloads: 98, created_at: new Date().toISOString() },
    { id: '6', name: 'Web Banner', description: 'Website banner for partner sites', category: 'Banners', template_url: '#', preview_url: '', file_type: 'PNG', downloads: 267, created_at: new Date().toISOString() },
    { id: '7', name: 'Case Study Template', description: 'Template for client success stories', category: 'Brochures', template_url: '#', preview_url: '', file_type: 'DOCX', downloads: 145, created_at: new Date().toISOString() },
    { id: '8', name: 'Partner Introduction Deck', description: 'Introduction to partnership benefits', category: 'Presentations', template_url: '#', preview_url: '', file_type: 'PPTX', downloads: 178, created_at: new Date().toISOString() },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // In real app, fetch from database
      setAssets(sampleAssets);
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPartnerLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPartnerLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCobrandedAsset = async () => {
    if (!selectedAsset || !partnerLogo) return;
    
    setGenerating(true);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real app, this would call an API to generate the co-branded asset
    const newGenerated: GeneratedAsset = {
      id: Date.now().toString(),
      asset_id: selectedAsset.id,
      partner_logo_url: partnerLogoPreview,
      output_url: '#',
      created_at: new Date().toISOString()
    };
    
    setGeneratedAssets(prev => [newGenerated, ...prev]);
    setGenerating(false);
    setSelectedAsset(null);
    setPartnerLogo(null);
    setPartnerLogoPreview('');
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case 'PDF': return <FileText className="h-6 w-6 text-red-500" />;
      case 'PPTX': return <FileText className="h-6 w-6 text-orange-500" />;
      case 'PNG': case 'JPG': return <Image className="h-6 w-6 text-blue-500" />;
      default: return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Co-Branded Marketing Assets</h1>
        <p className="text-gray-600">Generate professional marketing materials with your logo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FileText className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Templates</p>
              <p className="text-xl font-bold">{assets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Generated</p>
              <p className="text-xl font-bold">{generatedAssets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><Download className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Downloads</p>
              <p className="text-xl font-bold">{assets.reduce((sum, a) => sum + a.downloads, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg"><Palette className="h-5 w-5 text-orange-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Categories</p>
              <p className="text-xl font-bold">{categories.length - 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Generated Assets (if any) */}
      {generatedAssets.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-3">Your Generated Assets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {generatedAssets.slice(0, 3).map(gen => {
              const asset = assets.find(a => a.id === gen.asset_id);
              return (
                <div key={gen.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFileIcon(asset?.file_type || 'PDF')}
                    <div>
                      <p className="font-medium text-sm">{asset?.name}</p>
                      <p className="text-xs text-gray-500">{new Date(gen.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-green-100 rounded-lg text-green-600">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Assets Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAssets.map(asset => (
            <div key={asset.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group">
              <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  {getFileIcon(asset.file_type)}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{asset.name}</h3>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{asset.file_type}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{asset.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{asset.downloads} downloads</span>
                  <button
                    onClick={() => setSelectedAsset(asset)}
                    className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    <Palette className="h-4 w-4" /> Customize
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downloads</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssets.map(asset => (
                <tr key={asset.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getFileIcon(asset.file_type)}
                      <div>
                        <p className="font-medium text-gray-900">{asset.name}</p>
                        <p className="text-sm text-gray-500">{asset.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{asset.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.file_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{asset.downloads}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="p-2 hover:bg-orange-100 rounded-lg text-orange-600"
                        title="Customize"
                      >
                        <Palette className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Preview">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Download Original">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customization Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Customize: {selectedAsset.name}</h2>
              <button onClick={() => { setSelectedAsset(null); setPartnerLogo(null); setPartnerLogoPreview(''); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preview */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
                  <div className="border rounded-lg p-4 bg-gray-50 aspect-[4/3] flex items-center justify-center relative">
                    <div className="text-center">
                      {getFileIcon(selectedAsset.file_type)}
                      <p className="text-sm text-gray-500 mt-2">{selectedAsset.name}</p>
                    </div>
                    {partnerLogoPreview && (
                      <div className="absolute bottom-4 right-4 w-20 h-10 bg-white rounded shadow-md flex items-center justify-center overflow-hidden">
                        <img src={partnerLogoPreview} alt="Partner Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Your Logo</h3>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    {partnerLogoPreview ? (
                      <div className="space-y-3">
                        <img src={partnerLogoPreview} alt="Preview" className="max-h-24 mx-auto" />
                        <button
                          onClick={() => { setPartnerLogo(null); setPartnerLogoPreview(''); }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Upload your company logo</p>
                        <label className="inline-block cursor-pointer">
                          <span className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-200">
                            Choose File
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      Your logo will be placed in the designated partner area of the template.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setSelectedAsset(null); setPartnerLogo(null); setPartnerLogoPreview(''); }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={generateCobrandedAsset}
                  disabled={!partnerLogo || generating}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Palette className="h-4 w-4" /> Generate Co-Branded Asset</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
