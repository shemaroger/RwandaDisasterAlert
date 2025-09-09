import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Clock,
  UserPlus,
  UserCheck,
  UserX,
  MoreVertical,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { 
  PageHeader, 
  LoadingSpinner, 
  ErrorMessage, 
  StatusBadge, 
  DataTable, 
  EmptyState, 
  FormField,
  Toast
} from './SharedComponents';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0
  });

  useEffect(() => {
    loadUsers();
  }, [searchTerm, roleFilter, statusFilter, pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.page,
        search: searchTerm,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter === 'active' && { is_active: true }),
        ...(statusFilter === 'inactive' && { is_active: false }),
        ...(statusFilter === 'pending' && { is_approved: false })
      };

      // Since your Django API doesn't have a users endpoint, we'll simulate it
      // Replace this with actual API call: const response = await apiService.getUsers(params);
      const mockUsers = [
        {
          id: 1,
          email: 'admin@minema.rw',
          first_name: 'System',
          last_name: 'Administrator',
          phone: '+250788123456',
          role: 'admin',
          district: 'Kigali',
          preferred_language: 'en',
          is_active: true,
          is_approved: true,
          created_at: '2024-01-15T08:00:00Z',
          last_seen: '2024-01-20T14:30:00Z'
        },
        {
          id: 2,
          email: 'operator@minema.rw',
          first_name: 'John',
          last_name: 'Operator',
          phone: '+250788123457',
          role: 'operator',
          district: 'Gasabo',
          preferred_language: 'rw',
          is_active: true,
          is_approved: true,
          created_at: '2024-01-16T09:00:00Z',
          last_seen: '2024-01-20T13:45:00Z'
        },
        {
          id: 3,
          email: 'citizen@example.rw',
          first_name: 'Marie',
          last_name: 'Citizen',
          phone: '+250788123458',
          role: 'citizen',
          district: 'Nyarugenge',
          preferred_language: 'fr',
          is_active: true,
          is_approved: false,
          created_at: '2024-01-19T10:00:00Z',
          last_seen: '2024-01-19T15:30:00Z'
        }
      ];

      setUsers(mockUsers);
      setPagination(prev => ({
        ...prev,
        totalCount: mockUsers.length,
        totalPages: Math.ceil(mockUsers.length / 10)
      }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      // Replace with actual API call: await apiService.createUser(userData);
      setNotification({ type: 'success', message: 'User created successfully' });
      setShowCreateModal(false);
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      // Replace with actual API call: await apiService.updateUser(userId, userData);
      setNotification({ type: 'success', message: 'User updated successfully' });
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      // Replace with actual API call: await apiService.deleteUser(userId);
      setNotification({ type: 'success', message: 'User deleted successfully' });
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      // Replace with actual API call: await apiService.approveUser(userId);
      setNotification({ type: 'success', message: 'User approved successfully' });
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      // Replace with actual API call: await apiService.updateUser(userId, { is_active: !isActive });
      setNotification({ 
        type: 'success', 
        message: `User ${!isActive ? 'activated' : 'deactivated'} successfully` 
      });
      loadUsers();
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      operator: 'bg-blue-100 text-blue-800',
      citizen: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (user) => {
    if (!user.is_approved) return <UserX className="h-4 w-4 text-yellow-500" />;
    if (!user.is_active) return <XCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active && user.is_approved) ||
      (statusFilter === 'inactive' && !user.is_active) ||
      (statusFilter === 'pending' && !user.is_approved);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns = [
    {
      header: 'User',
      key: 'user',
      render: (_, user) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      key: 'role',
      render: (role) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(role)}`}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      )
    },
    {
      header: 'Contact',
      key: 'contact',
      render: (_, user) => (
        <div className="text-sm text-gray-900">
          <div className="flex items-center space-x-1">
            <Phone className="h-3 w-3 text-gray-400" />
            <span>{user.phone}</span>
          </div>
          <div className="flex items-center space-x-1 mt-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span>{user.district}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (_, user) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(user)}
          <span className="text-sm text-gray-600">
            {!user.is_approved ? 'Pending' : user.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      header: 'Last Seen',
      key: 'last_seen',
      render: (lastSeen) => (
        <div className="text-sm text-gray-500">
          {lastSeen ? new Date(lastSeen).toLocaleDateString() : 'Never'}
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, user) => (
        <div className="flex items-center space-x-2">
          {!user.is_approved && (
            <button
              onClick={() => handleApproveUser(user.id)}
              className="text-green-600 hover:text-green-700 p-1"
              title="Approve user"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
            className={`p-1 ${user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
            title={user.is_active ? 'Deactivate user' : 'Activate user'}
          >
            {user.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              setEditingUser(user);
              setShowEditModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 p-1"
            title="Edit user"
          >
            <Edit className="h-4 w-4" />
          </button>
          {user.id !== currentUser?.id && (
            <button
              onClick={() => handleDeleteUser(user.id)}
              className="text-red-600 hover:text-red-700 p-1"
              title="Delete user"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const stats = [
    {
      name: 'Total Users',
      value: users.length,
      icon: Users,
      iconColor: 'text-blue-500'
    },
    {
      name: 'Administrators',
      value: users.filter(u => u.role === 'admin').length,
      icon: Shield,
      iconColor: 'text-red-500'
    },
    {
      name: 'Operators',
      value: users.filter(u => u.role === 'operator').length,
      icon: Users,
      iconColor: 'text-blue-500'
    },
    {
      name: 'Citizens',
      value: users.filter(u => u.role === 'citizen').length,
      icon: Users,
      iconColor: 'text-green-500'
    }
  ];

  const actions = [
    <button
      key="create"
      onClick={() => setShowCreateModal(true)}
      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add User
    </button>
  ];

  return (
    <div className="space-y-6">
      {notification && (
        <Toast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <PageHeader
        title="User Management"
        description="Manage system users and their roles"
        actions={actions}
        stats={stats}
      />

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="operator">Operator</option>
            <option value="citizen">Citizen</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending Approval</option>
          </select>

          <div className="flex space-x-2">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        error={error}
        emptyMessage="No users found"
      />

      {/* Create User Modal */}
      {showCreateModal && (
        <UserFormModal
          title="Add New User"
          user={null}
          onSave={handleCreateUser}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <UserFormModal
          title="Edit User"
          user={editingUser}
          onSave={(userData) => handleUpdateUser(editingUser.id, userData)}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

// User Form Modal Component
const UserFormModal = ({ title, user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    role: user?.role || 'citizen',
    district: user?.district || '',
    preferred_language: user?.preferred_language || 'rw',
    is_active: user?.is_active ?? true,
    is_approved: user?.is_approved ?? true,
    password: '',
    password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.role) newErrors.role = 'Role is required';

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Phone format validation
    const phoneRegex = /^\+250[0-9]{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Phone must be in format +250XXXXXXXXX';
    }

    // Password validation for new users
    if (!user) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (!formData.password_confirm) {
        newErrors.password_confirm = 'Password confirmation is required';
      } else if (formData.password !== formData.password_confirm) {
        newErrors.password_confirm = 'Passwords do not match';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { password_confirm, ...submitData } = formData;
      if (user) {
        // For updates, remove password if empty
        if (!submitData.password) {
          delete submitData.password;
        }
      }
      await onSave(submitData);
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = [
    { value: 'citizen', label: 'Citizen' },
    { value: 'operator', label: 'Operator' },
    { value: 'admin', label: 'Administrator' }
  ];

  const languageOptions = [
    { value: 'rw', label: 'Kinyarwanda' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' }
  ];

  const districts = [
    'Kigali', 'Gasabo', 'Kicukiro', 'Nyarugenge',
    'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe',
    'Ngoma', 'Rwamagana', 'Gicumbi', 'Musanze',
    'Burera', 'Gakenke', 'Rulindo', 'Karongi',
    'Ngororero', 'Nyabihu', 'Rubavu', 'Rusizi',
    'Nyamasheke', 'Huye', 'Muhanga', 'Kamonyi',
    'Ruhango', 'Nyanza', 'Gisagara', 'Nyaruguru',
    'Nyamagabe', 'Kirehe'
  ].map(district => ({ value: district, label: district }));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{errors.general}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />

              <FormField
                label="Role"
                name="role"
                type="select"
                value={formData.role}
                onChange={handleChange}
                options={roleOptions}
                error={errors.role}
                required
              />

              <FormField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
                required
              />

              <FormField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                required
              />

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+250788123456"
                error={errors.phone}
                required
              />

              <FormField
                label="District"
                name="district"
                type="select"
                value={formData.district}
                onChange={handleChange}
                options={districts}
                placeholder="Select district"
                error={errors.district}
              />

              <FormField
                label="Preferred Language"
                name="preferred_language"
                type="select"
                value={formData.preferred_language}
                onChange={handleChange}
                options={languageOptions}
                error={errors.preferred_language}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Account Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Active account</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_approved"
                      checked={formData.is_approved}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600">Approved account</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Password fields for new users */}
            {!user && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required={!user}
                />

                <FormField
                  label="Confirm Password"
                  name="password_confirm"
                  type="password"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  error={errors.password_confirm}
                  required={!user}
                />
              </div>
            )}

            {/* Password reset for existing users */}
            {user && (
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Password</h4>
                    <p className="text-sm text-gray-500">Leave blank to keep current password</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Implement password reset functionality
                      alert('Password reset email would be sent');
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Send Reset Email
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="New Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Leave blank to keep current"
                  />

                  <FormField
                    label="Confirm New Password"
                    name="password_confirm"
                    type="password"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    error={errors.password_confirm}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {submitting && <LoadingSpinner size="small" />}
                <span className="ml-2">{user ? 'Update User' : 'Create User'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;