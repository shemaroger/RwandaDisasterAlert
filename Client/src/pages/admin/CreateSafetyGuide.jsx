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
  FileText,
  CheckCircle,
  Info,
  Trash2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

const CreateSafetyGuide = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Form data with attachment slots
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
    featured_image: null,
    // Attachment slots (1-5)
    attachment_1: null,
    attachment_1_name: '',
    attachment_1_description: '',
    attachment_2: null,
    attachment_2_name: '',
    attachment_2_description: '',
    attachment_3: null,
    attachment_3_name: '',
    attachment_3_description: '',
    attachment_4: null,
    attachment_4_name: '',
    attachment_4_description: '',
    attachment_5: null,
    attachment_5_name: '',
    attachment_5_description: '',
    is_featured: false,
    is_published: true,
    display_order: 0
  });
  const [formErrors, setFormErrors] = useState({});
  const [disasterTypes, setDisasterTypes] = useState([]);
  
  // File upload refs and preview states
  const featuredImageRef = useRef(null);
  const attachmentRefs = useRef([]);
  const [imagePreview, setImagePreview] = useState('');
  const [createdGuideId, setCreatedGuideId] = useState(null);
  
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
    // Initialize attachment refs
    attachmentRefs.current = Array(5).fill(null).map((_, i) => attachmentRefs.current[i] || React.createRef());
  }, []);

  const loadDisasterTypes = async () => {
    try {
      const response = await apiService.getDisasterTypes();
      console.log('Disaster types response:', response);
      // Handle both direct array and paginated response
      const types = response.results || response.data || response || [];
      setDisasterTypes(Array.isArray(types) ? types : []);
    } catch (err) {
      console.error('Failed to load disaster types:', err);
      setDisasterTypes([]);
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
    
    console.log('Disaster type change:', { value, checked, currentTypes: formData.disaster_types });
    
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
      setError('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    // Store the actual file and create preview
    setFormData(prev => ({
      ...prev,
      featured_image: file
    }));
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleAttachmentUpload = (slotNumber, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB

    if (file.size > maxSize) {
      setError(`File "${file.name}" is too large. Maximum size is 10MB.`);
      return;
    }

    // Store the file in the appropriate slot
    setFormData(prev => ({
      ...prev,
      [`attachment_${slotNumber}`]: file,
      [`attachment_${slotNumber}_name`]: file.name,
      [`attachment_${slotNumber}_description`]: ''
    }));

    setError(null);
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (slotNumber) => {
    setFormData(prev => ({
      ...prev,
      [`attachment_${slotNumber}`]: null,
      [`attachment_${slotNumber}_name`]: '',
      [`attachment_${slotNumber}_description`]: ''
    }));
  };

  const updateAttachmentName = (slotNumber, name) => {
    setFormData(prev => ({
      ...prev,
      [`attachment_${slotNumber}_name`]: name
    }));
  };

  const updateAttachmentDescription = (slotNumber, description) => {
    setFormData(prev => ({
      ...prev,
      [`attachment_${slotNumber}_description`]: description
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.title || !formData.title.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.content || !formData.content.trim()) {
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
    setSuccess(null);
    
    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('title', formData.title.trim());
      submitData.append('content', formData.content.trim());
      submitData.append('category', formData.category);
      submitData.append('target_audience', formData.target_audience);
      submitData.append('is_featured', formData.is_featured);
      submitData.append('is_published', formData.is_published);
      submitData.append('display_order', parseInt(formData.display_order) || 0);
      
      // Add optional multilingual fields
      if (formData.title_rw.trim()) {
        submitData.append('title_rw', formData.title_rw.trim());
      }
      if (formData.title_fr.trim()) {
        submitData.append('title_fr', formData.title_fr.trim());
      }
      if (formData.content_rw.trim()) {
        submitData.append('content_rw', formData.content_rw.trim());
      }
      if (formData.content_fr.trim()) {
        submitData.append('content_fr', formData.content_fr.trim());
      }
      
      // Add disaster types
      formData.disaster_types.forEach(typeId => {
        console.log('Adding disaster type:', typeId);
        submitData.append('disaster_types', typeId);
      });
      
      // Add featured image if present
      if (formData.featured_image) {
        submitData.append('featured_image', formData.featured_image);
      }

      // Add attachment files and their metadata
      for (let i = 1; i <= 5; i++) {
        const file = formData[`attachment_${i}`];
        const name = formData[`attachment_${i}_name`];
        const description = formData[`attachment_${i}_description`];

        if (file) {
          submitData.append(`attachment_${i}`, file);
          if (name) {
            submitData.append(`attachment_${i}_name`, name);
          }
          if (description) {
            submitData.append(`attachment_${i}_description`, description);
          }
        }
      }

      console.log('Creating safety guide...');
      
      // Debug: Log FormData contents before sending
      console.log('FormData contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const response = await apiService.createSafetyGuide(submitData);
      
      console.log('Safety guide created successfully:', response);
      const createdGuide = response.data || response;
      setCreatedGuideId(createdGuide.id);
      
      setSuccess('Safety guide created successfully with all attachments!');
      
      // Redirect after a short delay to show success message
      setTimeout(() => {
        navigate('/safety-guides', { 
          state: { message: 'Safety guide created successfully!' }
        });
      }, 2000);
      
    } catch (err) {
      console.error('Create safety guide error:', err);
      
      // Handle different types of errors
      if (err.response?.data) {
        const apiErrors = err.response.data;
        if (typeof apiErrors === 'object' && !Array.isArray(apiErrors)) {
          setFormErrors(apiErrors);
          setError('Please check the form for errors.');
        } else {
          setError(apiErrors.message || apiErrors.detail || 'Failed to create safety guide. Please try again.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to create safety guide. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.content) {
      if (window.confirm('Are you sure you want to discard your changes?')) {
        navigate('/safety-guides/admin');
      }
    } else {
      navigate('/safety-guides/admin');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAttachedFilesCount = () => {
    let count = 0;
    for (let i = 1; i <= 5; i++) {
      if (formData[`attachment_${i}`]) count++;
    }
    return count;
  };

  const renderAttachmentSlot = (slotNumber) => {
    const file = formData[`attachment_${slotNumber}`];
    const name = formData[`attachment_${slotNumber}_name`];
    const description = formData[`attachment_${slotNumber}_description`];

    return (
      <div key={slotNumber} className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Attachment {slotNumber}</h4>
          {file && (
            <button
              type="button"
              onClick={() => removeAttachment(slotNumber)}
              className="text-red-600 hover:text-red-800 p-1"
              title="Remove attachment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {!file ? (
          <div>
            <input
              ref={el => attachmentRefs.current[slotNumber - 1] = el}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.wmv,.flv,.webm,.mp3,.wav,.ogg,.aac,.zip,.rar,.7z,.tar,.gz"
              onChange={(e) => handleAttachmentUpload(slotNumber, e)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => attachmentRefs.current[slotNumber - 1]?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors text-gray-500 hover:text-gray-600"
            >
              <Upload className="w-5 h-5" />
              Choose File
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => updateAttachmentName(slotNumber, e.target.value)}
                placeholder="Enter display name for this file"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => updateAttachmentDescription(slotNumber, e.target.value)}
                placeholder="Enter description for this file"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                <Link to="/safety-guides" className="hover:text-gray-700 flex items-center gap-1">
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
            
            {/* Success Message */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <p className="text-red-800 whitespace-pre-line">{error}</p>
                  </div>
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
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFeaturedImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => featuredImageRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Choose Image
                  </button>
                  <span className="text-sm text-gray-500">JPG, PNG, GIF, WebP up to 5MB</span>
                </div>
                
                {imagePreview && (
                  <div className="mt-4 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Featured"
                      className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, featured_image: null }));
                        setImagePreview('');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Attachments - New Slot-Based System */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
                <span className="text-sm text-gray-500">
                  {getAttachedFilesCount()}/5 slots used
                </span>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex">
                  <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800 text-sm">
                    You can upload up to 5 attachments. Each file can be up to 10MB. Supported formats: documents (PDF, DOC, TXT), images, videos, audio files, and archives.
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map(slotNumber => renderAttachmentSlot(slotNumber))}
              </div>
            </div>

            {/* Disaster Types */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Applicable Disaster Types</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Select applicable disaster types (optional)
                </label>
                
                {disasterTypes.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {disasterTypes.map(type => {
                      const isChecked = formData.disaster_types.includes(type.id) || 
                                       formData.disaster_types.includes(type.id.toString()) ||
                                       formData.disaster_types.includes(parseInt(type.id));
                      
                      return (
                        <label key={type.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            value={type.id}
                            checked={isChecked}
                            onChange={handleDisasterTypesChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                          />
                          <span className="text-sm text-gray-700 select-none">{type.name}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                    <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No disaster types available</p>
                    <p className="text-xs mt-1">Check your API connection or add disaster types in the admin panel</p>
                    <button
                      type="button"
                      onClick={loadDisasterTypes}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Retry loading disaster types
                    </button>
                  </div>
                )}
                
                {/* Debug info - only in development */}
                {import.meta.env.DEV && (
                  <div className="mt-2 text-xs text-gray-500">
                    Debug: Found {disasterTypes.length} disaster types
                    {formData.disaster_types.length > 0 && (
                      <span> | Selected: {formData.disaster_types.join(', ')}</span>
                    )}
                  </div>
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
                disabled={loading || success}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating Guide...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Created Successfully!
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
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
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