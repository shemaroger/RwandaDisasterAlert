import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft,
  Save,
  AlertTriangle,
  Camera,
  X,
  RefreshCw,
  BookOpen,
  Globe,
  Target,
  Upload,
  FileText
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

// Helper function for media URLs
const getMediaUrl = (mediaPath) => {
  if (!mediaPath) return null;
  if (mediaPath.startsWith('http://') || mediaPath.startsWith('https://')) {
    return mediaPath;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const cleanPath = mediaPath.startsWith('/') ? mediaPath.substring(1) : mediaPath;
  return `${baseUrl}/${cleanPath}`;
};

const CreateSafetyGuide = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    title_rw: '',
    title_fr: '',
    content: '',
    content_rw: '',
    content_fr: '',
    category: 'general',
    target_audience: 'general',
    disaster_types: [],
    featured_image: '',
    attachments: [],
    is_featured: false,
    is_published: true,
    display_order: 0
  });
  const [formErrors, setFormErrors] = useState({});
  const [disasterTypes, setDisasterTypes] = useState([]);
  
  // File upload refs
  const featuredImageRef = useRef(null);
  const attachmentsRef = useRef(null);
  
  // Tab state for multilingual content
  const [activeTab, setActiveTab] = useState('en');

  const CATEGORY_OPTIONS = [
    { value: 'general', label: 'General Preparedness' },
    { value: 'before', label: 'Before Disaster' },
    { value: 'during', label: 'During Disaster' },
    { value: 'after', label: 'After Disaster' }
  ];

  const TARGET_AUDIENCE_OPTIONS = [
    { value: 'general', label: 'General Public' },
    { value: 'families', label: 'Families with Children' },
    { value: 'elderly', label: 'Elderly' },
    { value: 'disabled', label: 'People with Disabilities' },
    { value: 'business', label: 'Businesses' },
    { value: 'schools', label: 'Schools' }
  ];

  const LANGUAGE_TABS = [
    { key: 'en', label: 'English', required: true },
    { key: 'rw', label: 'Kinyarwanda', required: false },
    { key: 'fr', label: 'French', required: false }
  ];

  useEffect(() => {
    loadDisasterTypes();
  }, []);

  const loadDisasterTypes = async () => {
    try {
      const response = await apiService.getDisasterTypes();
      setDisasterTypes(response.results || []);
    } catch (err) {
      console.error('Failed to load disaster types:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDisasterTypesChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      disaster_types: checked 
        ? [...prev.disaster_types, value]
        : prev.disaster_types.filter(id => id !== value)
    }));
  };

  const handleFeaturedImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // For demo purposes, create object URL
    // In production, you'd upload to your storage service
    const imageUrl = URL.createObjectURL(file);
    setFormData(prev => ({
      ...prev,
      featured_image: imageUrl
    }));
  };

  const handleAttachmentsUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = [];

    files.forEach(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      // For demo purposes, create object URLs
      const fileUrls = validFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));
      
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileUrls]
      }));
    }

    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.content.trim()) {
      errors.content = 'Content is required';
    } else if (formData.content.trim().length < 50) {
      errors.content = 'Content must be at least 50 characters';
    }
    
    if (formData.display_order < 0) {
      errors.display_order = 'Display order cannot be negative';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        disaster_types: formData.disaster_types,
        display_order: parseInt(formData.display_order) || 0
      };

      await apiService.createSafetyGuide(submitData);
      
      // Redirect to safety guides list with success message
      navigate('/safety-guides/admin', { 
        state: { message: 'Safety guide created successfully!' }
      });
      
    } catch (err) {
      console.error('Create safety guide error:', err);
      setError('Failed to create safety guide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.content) {
      if (confirm('Are you sure you want to discard your changes?')) {
        navigate('/safety-guides/admin');
      }
    } else {
      navigate('/safety-guides/admin');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link to="/safety-guides/admin" className="hover:text-gray-700 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Safety Guides
                </Link>
                <span>/</span>
                <span className="text-gray-900">Create New Guide</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900">Create Safety Guide</h1>
              <p className="text-gray-600">Create a new safety guide and preparedness information</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Basic Settings */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Audience *
                </label>
                <select
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {TARGET_AUDIENCE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multilingual Content */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Content</h3>
              
              {/* Language Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {LANGUAGE_TABS.map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="w-4 h-4" />
                      {tab.label}
                      {tab.required && <span className="text-red-500">*</span>}
                    </div>
                  </button>
                ))}
              </div>

              {/* English Content */}
              {activeTab === 'en' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Title (English) *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      maxLength="200"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    <div className="mt-1 flex justify-between text-sm">
                      <div>
                        {formErrors.title && <span className="text-red-600">{formErrors.title}</span>}
                      </div>
                      <span className="text-gray-500">{formData.title.length}/200</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Content (English) *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={12}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formErrors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter detailed safety guide content..."
                      required
                    />
                    {formErrors.content && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Kinyarwanda Content */}
              {activeTab === 'rw' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Title (Kinyarwanda)
                    </label>
                    <input
                      type="text"
                      name="title_rw"
                      value={formData.title_rw}
                      onChange={handleInputChange}
                      maxLength="200"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="mt-1 text-right text-sm text-gray-500">
                      {formData.title_rw.length}/200
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Content (Kinyarwanda)
                    </label>
                    <textarea
                      name="content_rw"
                      value={formData.content_rw}
                      onChange={handleInputChange}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Injiza ibiriho by'amakuru y'umutekano..."
                    />
                  </div>
                </div>
              )}

              {/* French Content */}
              {activeTab === 'fr' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Title (French)
                    </label>
                    <input
                      type="text"
                      name="title_fr"
                      value={formData.title_fr}
                      onChange={handleInputChange}
                      maxLength="200"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="mt-1 text-right text-sm text-gray-500">
                      {formData.title_fr.length}/200
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Content (French)
                    </label>
                    <textarea
                      name="content_fr"
                      value={formData.content_fr}
                      onChange={handleInputChange}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Entrez le contenu détaillé du guide de sécurité..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Featured Image */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Featured Image</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Upload Featured Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    ref={featuredImageRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFeaturedImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => featuredImageRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Camera className="w-4 h-4" />
                    Choose Image
                  </button>
                  <span className="text-sm text-gray-500">JPG, PNG up to 5MB</span>
                </div>
                
                {formData.featured_image && (
                  <div className="mt-4 relative inline-block">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Attachments</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Upload Additional Files
                </label>
                <div className="flex items-center gap-4">
                  <input
                    ref={attachmentsRef}
                    type="file"
                    multiple
                    onChange={handleAttachmentsUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => attachmentsRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4" />
                    Choose Files
                  </button>
                  <span className="text-sm text-gray-500">Documents, images, videos up to 10MB each</span>
                </div>
                
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{file.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Disaster Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Applicable Disaster Types</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select applicable disaster types (optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {disasterTypes.map(type => (
                    <label key={type.id} className="flex items-center">
                      <input
                        type="checkbox"
                        value={type.id}
                        checked={formData.disaster_types.includes(type.id)}
                        onChange={handleDisasterTypesChange}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{type.name}</span>
                    </label>
                  ))}
                </div>
                {disasterTypes.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No disaster types available</p>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Settings</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleInputChange}
                    min="0"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.display_order ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.display_order && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.display_order}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">Lower numbers appear first</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Featured Guide
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 ml-7">Featured guides appear prominently</p>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_published"
                      checked={formData.is_published}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Published
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 ml-7">Unpublished guides are only visible to administrators</p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Guide...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Safety Guide
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSafetyGuide;