// src/pages/UserManagement.jsx - Updated for Hierarchical System
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Plus, Search, Filter, Download, RefreshCw, Edit, Trash2, Eye,
  UserCheck, UserX, Lock, Mail, Phone, MapPin, Calendar, MoreVertical,
  ChevronDown, ChevronUp, X, Save, AlertTriangle, Check, Clock,
  Settings, Shield, Bell, Star, Activity, TrendingUp, Globe, Building,
  Home, Layers, Map
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../services/api';

// Constants
const RWANDA_DISTRICTS = [
  'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi',
  'Gisagara', 'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro',
  'Kirehe', 'Muhanga', 'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu',
  'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
  'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
];

// Updated USER_TYPES - Matching backend exactly
const USER_TYPES = [
  { value: 'citizen', label: 'Citizen', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Users, level: 0 },
  { value: 'village', label: 'Village Officer', color: 'bg-green-50 text-green-700 border-green-200', icon: Home, level: 1 },
  { value: 'sector', label: 'Sector Officer', color: 'bg-teal-50 text-teal-700 border-teal-200', icon: Building, level: 2 },
  { value: 'district', label: 'District Officer', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Layers, level: 3 },
  { value: 'province', label: 'Province Officer', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Map, level: 4 },
  { value: 'national', label: 'National Officer', color: 'bg-red-50 text-red-700 border-red-200', icon: Globe, level: 5 },
  { value: 'admin', label: 'System Administrator', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: Shield, level: 6 }
];

const LANGUAGE_OPTIONS = [
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' }
];

// Utility functions
const getUserTypeConfig = (userType) => {
  return USER_TYPES.find(type => type.value === userType) || USER_TYPES[0];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const getUserLevelBadge = (userType) => {
  const config = getUserTypeConfig(userType);
  const levelLabels = {
    0: 'Public',
    1: 'Village Level',
    2: 'Sector Level',
    3: 'District Level',
    4: 'Province Level',
    5: 'National Level',
    6: 'System Level'
  };
  
  return {
    label: levelLabels[config.level] || 'Unknown',
    level: config.level
  };
};

// Custom hooks
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const useUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    user_type: '',
    is_active: '',
    is_verified: '',
    location: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1
  });

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      // Build params object, filtering out empty values
      const params = {
        page,
        page_size: pagination.pageSize
      };

      // Only add filter params if they have values
      if (filters.search) params.search = filters.search;
      if (filters.user_type) params.user_type = filters.user_type;
      if (filters.is_active !== '') params.is_active = filters.is_active;
      if (filters.is_verified !== '') params.is_verified = filters.is_verified;
      if (filters.location) params.location = filters.location;

      console.log('Fetching users with params:', params);

      const response = await apiService.getUsers(params);
      
      if (response?.results) {
        setUsers(response.results);
        setPagination(prev => ({
          ...prev,
          page,
          total: response.count,
          totalPages: Math.ceil(response.count / pagination.pageSize)
        }));
      } else if (Array.isArray(response)) {
        setUsers(response);
        setPagination(prev => ({ 
          ...prev, 
          page: 1, 
          total: response.length, 
          totalPages: 1 
        }));
      } else {
        setUsers([]);
        setPagination(prev => ({ 
          ...prev, 
          page: 1, 
          total: 0, 
          totalPages: 1 
        }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
      toast.error(`Failed to load users: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  const createUser = useCallback(async (userData) => {
    try {
      await apiService.createUser(userData);
      toast.success('User created successfully');
      await fetchUsers(pagination.page);
      return true;
    } catch (err) {
      console.error('Error creating user:', err);
      toast.error(`Failed to create user: ${err.message}`);
      return false;
    }
  }, [fetchUsers, pagination.page]);

  const updateUser = useCallback(async (userId, updates) => {
    try {
      await apiService.updateUser(userId, updates);
      toast.success('User updated successfully');
      await fetchUsers(pagination.page);
      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      toast.error(`Failed to update user: ${err.message}`);
      return false;
    }
  }, [fetchUsers, pagination.page]);

  const deleteUser = useCallback(async (userId) => {
    try {
      await apiService.deleteUser(userId);
      toast.success('User deleted successfully');
      await fetchUsers(pagination.page);
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error(`Failed to delete user: ${err.message}`);
      return false;
    }
  }, [fetchUsers, pagination.page]);

  const getUserById = useCallback(async (userId) => {
    try {
      const user = await apiService.getUserById(userId);
      return user;
    } catch (err) {
      console.error('Error fetching user:', err);
      toast.error(`Failed to fetch user: ${err.message}`);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById
  };
};

// Components
const StatsCard = ({ icon: Icon, title, value, subtitle, trend, color = 'blue' }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {trend && (
            <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
              trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              <TrendingUp className="w-3 h-3 mr-1" />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className={`text-3xl font-bold text-${color}-600 mt-2 group-hover:scale-105 transition-transform`}>
          {value.toLocaleString()}
        </p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 bg-${color}-100 rounded-xl group-hover:bg-${color}-200 transition-colors`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

const UserCard = ({ user, onEdit, onView, onDelete, onToggleStatus, onVerify }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const userTypeConfig = getUserTypeConfig(user.user_type);
  const levelBadge = getUserLevelBadge(user.user_type);
  const IconComponent = userTypeConfig.icon;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${userTypeConfig.color} border`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
              {user.is_verified && (
                <div className="bg-green-100 p-1 rounded-full" title="Verified User">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                <button
                  onClick={() => { onView(user); setShowDropdown(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </button>
                <button
                  onClick={() => { onEdit(user); setShowDropdown(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </button>
                {!user.is_verified && (
                  <button
                    onClick={() => { onVerify(user.id); setShowDropdown(false); }}
                    className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    Verify User
                  </button>
                )}
                <button
                  onClick={() => { onToggleStatus(user.id, !user.is_active); setShowDropdown(false); }}
                  className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 ${
                    user.is_active ? 'text-red-700' : 'text-green-700'
                  }`}
                >
                  {user.is_active ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { 
                    if (window.confirm('Are you sure you want to delete this user?')) {
                      onDelete(user.id);
                    }
                    setShowDropdown(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{user.district || 'No location'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(user.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${userTypeConfig.color}`}>
            {userTypeConfig.label}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.is_active 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Level Badge */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
          <Layers className="w-3 h-3 mr-1" />
          {levelBadge.label}
        </span>
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, onClearFilters, showFilters, onToggleFilters }) => {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onToggleFilters}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Name, email, username..."
                  value={filters.search}
                  onChange={(e) => onFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <select
                value={filters.user_type}
                onChange={(e) => onFilterChange('user_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              >
                <option value="">All Types</option>
                {USER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.is_active}
                onChange={(e) => onFilterChange('is_active', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              >
                <option value="">All Statuses</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
              <select
                value={filters.is_verified}
                onChange={(e) => onFilterChange('is_verified', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              >
                <option value="">All Locations</option>
                {RWANDA_DISTRICTS.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserModal = ({ isOpen, onClose, onSuccess, user = null, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    user_type: 'citizen',
    district: '',
    preferred_language: 'rw',
    is_active: true,
    is_verified: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data when user is provided (edit mode)
  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '', // Always empty in edit mode
        password_confirm: '', // Always empty in edit mode
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        user_type: user.user_type || 'citizen',
        district: user.district || '',
        preferred_language: user.preferred_language || 'rw',
        is_active: user.is_active !== undefined ? user.is_active : true,
        is_verified: user.is_verified !== undefined ? user.is_verified : false
      });
    } else if (mode === 'create') {
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        user_type: 'citizen',
        district: '',
        preferred_language: 'rw',
        is_active: true,
        is_verified: false
      });
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // First name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    // Last name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    // Password validation
    if (mode === 'create') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (!formData.password_confirm) {
        newErrors.password_confirm = 'Please confirm your password';
      } else if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = 'Passwords do not match';
      }
    } else if (mode === 'edit' && formData.password) {
      // Only validate password in edit mode if it's provided
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = 'Passwords do not match';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the form errors');
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      
      // Build submit data
      const submitData = { ...formData };
      
      // Handle password fields based on mode
      if (mode === 'edit') {
        // In edit mode, only include password fields if a new password was entered
        if (!submitData.password || submitData.password.trim() === '') {
          // No password change - remove both password fields completely
          delete submitData.password;
          delete submitData.password_confirm;
        }
        // If password is provided, keep both password and password_confirm
      }
      // In create mode, always keep password and password_confirm (they're required)

      console.log('Submitting user data:', { 
        ...submitData, 
        password: submitData.password ? '***' : undefined,
        password_confirm: submitData.password_confirm ? '***' : undefined 
      });

      if (mode === 'edit') {
        await apiService.updateUser(user.id, submitData);
        toast.success('User updated successfully');
      } else {
        await apiService.createUser(submitData);
        toast.success('User created successfully');
      }
      
      onSuccess();
      onClose();
      
      // Reset form for create mode
      if (mode === 'create') {
        setFormData({
          username: '', email: '', password: '', password_confirm: '',
          first_name: '', last_name: '', phone_number: '', user_type: 'citizen',
          district: '', preferred_language: 'rw', is_active: true, is_verified: false
        });
      }
    } catch (err) {
      console.error('Error submitting user form:', err);
      const action = mode === 'edit' ? 'update' : 'create';
      toast.error(`Failed to ${action} user: ${err.message}`);
      if (err.data && typeof err.data === 'object') {
        setErrors(err.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  const title = mode === 'edit' ? 'Edit User' : 'Create New User';
  const submitText = mode === 'edit' ? 'Update User' : 'Create User';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {mode === 'create' ? 'Add a new user to the system' : 'Update user information and permissions'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter username"
                  required
                />
                {errors.username && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {errors.username}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="user@example.com"
                  required
                />
                {errors.email && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                  required
                />
                {errors.first_name && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                  required
                />
                {errors.last_name && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {errors.last_name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Lock className="w-4 h-4 mr-2 text-blue-600" />
              Security
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password {mode === 'create' && <span className="text-red-500">*</span>}
                  {mode === 'edit' && <span className="text-gray-500 text-xs ml-1">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={mode === 'create' ? 'Enter password' : 'Leave blank to keep current'}
                  required={mode === 'create'}
                  minLength="8"
                />
                {errors.password ? (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {errors.password}
                  </p>
                ) : mode === 'create' && (
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password {mode === 'create' && <span className="text-red-500">*</span>}
                  {mode === 'edit' && formData.password && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.password_confirm ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={mode === 'create' || formData.password ? 'Confirm password' : 'Not required'}
                  required={mode === 'create' || !!formData.password}
                  disabled={mode === 'edit' && !formData.password}
                />
                {errors.password_confirm && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {errors.password_confirm}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact & Location */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-blue-600" />
              Contact & Location
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+250 XXX XXX XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select District</option>
                  {RWANDA_DISTRICTS.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
                <select
                  name="preferred_language"
                  value={formData.preferred_language}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LANGUAGE_OPTIONS.map(lang => (
                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-blue-600" />
              Role & Permissions
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User Type / Role *</label>
                <select
                  name="user_type"
                  value={formData.user_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {USER_TYPES.map(type => {
                    const levelBadge = getUserLevelBadge(type.value);
                    return (
                      <option key={type.value} value={type.value}>
                        {type.label} - {levelBadge.label}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the appropriate user type based on their responsibilities and access level
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-blue-600" />
              Account Status
            </h3>
            <div className="flex items-center space-x-6 bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Active Account</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_verified"
                  checked={formData.is_verified}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Verified User</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {submitText}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserViewModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const userTypeConfig = getUserTypeConfig(user.user_type);
  const levelBadge = getUserLevelBadge(user.user_type);
  const IconComponent = userTypeConfig.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`p-4 rounded-xl ${userTypeConfig.color} border`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {user.first_name} {user.last_name}
                </h3>
                {user.is_verified && (
                  <div className="bg-green-100 p-1 rounded-full" title="Verified User">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                )}
              </div>
              <p className="text-lg text-gray-600">@{user.username}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${userTypeConfig.color}`}>
                  {userTypeConfig.label}
                </span>
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
                  <Layers className="w-3 h-3 mr-1" />
                  {levelBadge.label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{user.phone_number || 'Not provided'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">District</label>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{user.district || 'Not specified'}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Preferred Language</label>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {user.preferred_language === 'rw' ? 'Kinyarwanda' : 
                     user.preferred_language === 'fr' ? 'Français' : 'English'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">User Type</label>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${userTypeConfig.color}`}>
                  {userTypeConfig.label}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    user.is_active 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    user.is_verified 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(user.created_at)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(user.updated_at)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Login</label>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(user.last_login)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notification Preferences
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Bell className={`w-4 h-4 ${user.push_notifications_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-700">Push</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.push_notifications_enabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {user.push_notifications_enabled ? 'On' : 'Off'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Mail className={`w-4 h-4 ${user.email_notifications_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-700">Email</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.email_notifications_enabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {user.email_notifications_enabled ? 'On' : 'Off'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Phone className={`w-4 h-4 ${user.sms_notifications_enabled ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-sm text-gray-700">SMS</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.sms_notifications_enabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {user.sms_notifications_enabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const UserManagement = ({ user, onLogout }) => {
  const {
    users,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById
  } = useUserManagement();

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const debouncedSearch = useDebounce(filters.search, 300);

  // Update search filter when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch }));
    }
  }, [debouncedSearch, filters.search, setFilters]);

  // Computed values
  const userStats = useMemo(() => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      verified: users.filter(u => u.is_verified).length,
      byType: {}
    };

    USER_TYPES.forEach(type => {
      stats.byType[type.value] = users.filter(u => u.user_type === type.value).length;
    });

    return stats;
  }, [users]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [setFilters, setPagination]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      user_type: '',
      is_active: '',
      is_verified: '',
      location: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [setFilters, setPagination]);

  const handleUserAction = useCallback(async (userId, action, data = {}) => {
    switch (action) {
      case 'verify':
        return await updateUser(userId, { is_verified: true });
      case 'toggle_status':
        return await updateUser(userId, { is_active: data.isActive });
      case 'delete':
        return await deleteUser(userId);
      default:
        return false;
    }
  }, [updateUser, deleteUser]);

  const handleViewUser = useCallback(async (userData) => {
    setSelectedUser(userData);
    setShowViewModal(true);
  }, []);

  const handleEditUser = useCallback(async (userData) => {
    setSelectedUser(userData);
    setShowEditModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedUser(null);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
  }, []);

  const handleModalSuccess = useCallback(() => {
    fetchUsers(pagination.page);
  }, [fetchUsers, pagination.page]);

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the user management system.</p>
          <button
            onClick={onLogout}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                  <p className="text-gray-600">Manage system users and hierarchical permissions</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>{pagination.total} total users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {formatDate(new Date())}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fetchUsers(pagination.page)}
                disabled={loading}
                className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => {/* Export functionality */}}
                className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>

              <div className="flex bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Table
                </button>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New User
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            icon={Users}
            title="Total Users"
            value={userStats.total}
            subtitle={`${userStats.active} active`}
            color="blue"
            trend={5}
          />
          <StatsCard
            icon={Home}
            title="Village Officers"
            value={userStats.byType['village'] || 0}
            subtitle="Level 1"
            color="green"
          />
          <StatsCard
            icon={Building}
            title="Administrative"
            value={(userStats.byType['sector'] || 0) + (userStats.byType['district'] || 0)}
            subtitle="Sector & District"
            color="indigo"
          />
          <StatsCard
            icon={Globe}
            title="High Level"
            value={(userStats.byType['province'] || 0) + (userStats.byType['national'] || 0) + (userStats.byType['admin'] || 0)}
            subtitle="Province, National & Admin"
            color="red"
          />
        </div>

        {/* Filters */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={() => fetchUsers(pagination.page)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">
                {Object.values(filters).some(v => v !== '') 
                  ? 'Try adjusting your filters or search terms.'
                  : 'Get started by creating your first user.'
                }
              </p>
              {Object.values(filters).some(v => v !== '') ? (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  Create First User
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map(userData => (
                    <UserCard
                      key={userData.id}
                      user={userData}
                      onEdit={handleEditUser}
                      onView={handleViewUser}
                      onDelete={(userId) => handleUserAction(userId, 'delete')}
                      onToggleStatus={(userId, isActive) => handleUserAction(userId, 'toggle_status', { isActive })}
                      onVerify={(userId) => handleUserAction(userId, 'verify')}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type / Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map(userData => {
                        const userTypeConfig = getUserTypeConfig(userData.user_type);
                        const levelBadge = getUserLevelBadge(userData.user_type);
                        const IconComponent = userTypeConfig.icon;
                        
                        return (
                          <tr key={userData.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${userTypeConfig.color} border mr-3`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {userData.first_name} {userData.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">@{userData.username}</div>
                                  <div className="text-sm text-gray-500">{userData.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${userTypeConfig.color}`}>
                                {userTypeConfig.label}
                              </span>
                              <div className="mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md bg-gray-100 text-gray-700">
                                  {levelBadge.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div>{userData.district || 'Not specified'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  userData.is_active 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {userData.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {userData.is_verified && (
                                  <div className="bg-green-100 p-1 rounded-full">
                                    <Check className="w-3 h-3 text-green-600" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(userData.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleViewUser(userData)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditUser(userData)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Edit User"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this user?')) {
                                      handleUserAction(userData.id, 'delete');
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
                    {pagination.total} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fetchUsers(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchUsers(pageNum)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              pageNum === pagination.page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => fetchUsers(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={showCreateModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        mode="create"
      />

      <UserModal
        isOpen={showEditModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        user={selectedUser}
        mode="edit"
      />

      <UserViewModal
        isOpen={showViewModal}
        onClose={handleModalClose}
        user={selectedUser}
      />
    </div>
  );
};

export default UserManagement;