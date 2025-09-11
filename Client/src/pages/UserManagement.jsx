import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Plus, Search, Filter, Download, RefreshCw, Edit, Trash2, Eye,
  UserCheck, UserX, Lock, Mail, Phone, MapPin, Calendar, MoreVertical,
  ChevronDown, ChevronUp, X, Save, AlertTriangle, Check, Clock,
  Settings, Shield, Bell, Star, Activity, TrendingUp, Globe
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

const USER_TYPES = [
  { value: 'citizen', label: 'Citizen', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Users, count: 0 },
  { value: 'operator', label: 'Operator', color: 'bg-green-50 text-green-700 border-green-200', icon: Settings, count: 0 },
  { value: 'authority', label: 'Authority', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Shield, count: 0 },
  { value: 'admin', label: 'Administrator', color: 'bg-red-50 text-red-700 border-red-200', icon: UserCheck, count: 0 }
];

// Utility functions
const getUserTypeConfig = (userType) => {
  return USER_TYPES.find(type => type.value === userType) || USER_TYPES[0];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatPhoneNumber = (phone) => {
  if (!phone) return 'Not provided';
  return phone.replace(/(\+250)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
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
    district: ''
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

      const params = {
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
        page,
        page_size: pagination.pageSize
      };

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
        setPagination(prev => ({ ...prev, page: 1, total: response.length, totalPages: 1 }));
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.pageSize]);

  const updateUser = useCallback(async (userId, updates) => {
    try {
      await apiService.updateUser(userId, updates);
      await fetchUsers(pagination.page);
      return true;
    } catch (err) {
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
      toast.error(`Failed to delete user: ${err.message}`);
      return false;
    }
  }, [fetchUsers, pagination.page]);

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
    updateUser,
    deleteUser
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
                <div className="bg-green-100 p-1 rounded-full">
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
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
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4" />
            <span>{user.district || 'No district'}</span>
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors"
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <select
                value={filters.user_type}
                onChange={(e) => onFilterChange('user_type', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                value={filters.district}
                onChange={(e) => onFilterChange('district', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50"
              >
                <option value="">All Districts</option>
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

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirm) {
      setErrors({ password_confirm: 'Passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      await apiService.createUser(formData);
      toast.success('User created successfully');
      onSuccess();
      onClose();
      setFormData({
        username: '', email: '', password: '', password_confirm: '',
        first_name: '', last_name: '', phone_number: '', user_type: 'citizen',
        district: '', preferred_language: 'rw', is_active: true, is_verified: false
      });
    } catch (err) {
      toast.error(`Failed to create user: ${err.message}`);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Create New User</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.password_confirm ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.password_confirm && (
                <p className="text-red-600 text-sm mt-1">{errors.password_confirm}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="+250..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
              <select
                name="user_type"
                value={formData.user_type}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {USER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="rw">Kinyarwanda</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_verified"
                checked={formData.is_verified}
                onChange={handleChange}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="ml-2 text-sm text-gray-700">Verified</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
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
    updateUser,
    deleteUser
  } = useUserManagement();

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
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
      district: ''
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

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the user management system.</p>
          <button
            onClick={onLogout}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-3 mb-2">
                <div className="bg-green-100 p-3 rounded-xl">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                  <p className="text-gray-600">Manage system users and permissions</p>
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
                className="inline-flex items-center px-4 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
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
                    viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Table
                </button>
              </div>
              
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-lg transition-colors"
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
          {USER_TYPES.map(type => (
            <StatsCard
              key={type.value}
              icon={type.icon}
              title={type.label + 's'}
              value={userStats.byType[type.value] || 0}
              subtitle={`${Math.round((userStats.byType[type.value] / userStats.total) * 100) || 0}% of total`}
              color={type.value === 'admin' ? 'red' : type.value === 'authority' ? 'purple' : type.value === 'operator' ? 'green' : 'blue'}
            />
          ))}
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
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
                  className="px-4 py-2 text-green-600 hover:text-green-700 font-medium"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Create First User
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {users.map(user => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onEdit={(user) => console.log('Edit user:', user)}
                      onView={(user) => console.log('View user:', user)}
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
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          District
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
                      {users.map(user => {
                        const userTypeConfig = getUserTypeConfig(user.user_type);
                        const IconComponent = userTypeConfig.icon;
                        
                        return (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${userTypeConfig.color} border mr-3`}>
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${userTypeConfig.color}`}>
                                {userTypeConfig.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.district || 'Not specified'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  user.is_active 
                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {user.is_verified && (
                                  <div className="bg-green-100 p-1 rounded-full">
                                    <Check className="w-3 h-3 text-green-600" />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => console.log('View user:', user)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => console.log('Edit user:', user)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this user?')) {
                                      handleUserAction(user.id, 'delete');
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
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
                                ? 'bg-green-600 text-white'
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

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchUsers(pagination.page)}
      />
    </div>
  );
};

export default UserManagement;