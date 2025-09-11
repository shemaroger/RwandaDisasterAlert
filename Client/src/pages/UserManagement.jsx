import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiPlus, FiEdit, FiX, FiDownload, FiRefreshCw,
  FiUserCheck, FiUserX, FiUser, FiAlertCircle, FiInfo,
  FiChevronDown, FiChevronUp, FiLock, FiMail, FiPhone, 
  FiCalendar, FiCheck, FiTrash2, FiSettings, FiFilter,
  FiChevronLeft, FiChevronRight, FiMoreHorizontal, FiSave
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const UserManagement = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const abortControllerRef = useRef();
  const searchTimeoutRef = useRef();
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    is_approved: '',
    search: '',
    district: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState({});
  const [newRoleForBulk, setNewRoleForBulk] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 20
  });

  // Rwanda districts for filter
  const RWANDA_DISTRICTS = [
    'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi',
    'Gisagara', 'Huye', 'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro',
    'Kirehe', 'Muhanga', 'Musanze', 'Ngoma', 'Ngororero', 'Nyabihu',
    'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
    'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
  ];

  // Compute role stats
  const roleStats = users.reduce((acc, u) => {
    const key = u?.role || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Fetch users with enhanced error handling
  const fetchUsers = useCallback(async (page = 1, showLoadingState = true) => {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );

      const params = {
        ...cleanFilters,
        page,
        page_size: pagination.pageSize
      };

      const response = await apiService.getUsers(params);
      
      if (response?.results) {
        setUsers(response.results);
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          totalPages: Math.ceil(response.count / pagination.pageSize),
          totalCount: response.count
        }));
      } else if (Array.isArray(response)) {
        setUsers(response);
        setPagination(prev => ({
          ...prev,
          currentPage: 1,
          totalPages: 1,
          totalCount: response.length
        }));
      } else {
        setUsers([]);
      }
    } catch (err) {
      if (err.message !== 'Request cancelled') {
        const errorMessage = err.message || 'Failed to fetch users';
        setError(errorMessage);
        if (showLoadingState) {
          toast.error(`Error: ${errorMessage}`);
        }
      }
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  }, [filters, pagination.pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced filter handling
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'search') {
      setSearchTerm(value);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      is_active: '',
      is_approved: '',
      search: '',
      district: ''
    });
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '') || searchTerm !== '';

  // Enhanced user actions with loading states
  const handleUserAction = async (userId, action, additionalData = {}) => {
    try {
      setActionLoading(prev => ({ ...prev, [`${userId}-${action}`]: true }));
      let successMessage = '';
      
      switch (action) {
        case 'approve':
          await apiService.approveUser(userId);
          successMessage = 'User approved successfully';
          break;
          
        case 'activate':
          await apiService.activateUser(userId);
          successMessage = 'User activated successfully';
          break;
          
        case 'deactivate':
          await apiService.deactivateUser(userId);
          successMessage = 'User deactivated successfully';
          break;
          
        case 'reset_password': {
          const password = additionalData.password;
          if (!password) {
            const newPassword = prompt('Enter new password (minimum 8 characters):');
            if (!newPassword) return;
            if (newPassword.length < 8) {
              toast.error('Password must be at least 8 characters long');
              return;
            }
            const confirmPassword = prompt('Confirm new password:');
            if (newPassword !== confirmPassword) {
              toast.error('Passwords do not match.');
              return;
            }
            await apiService.setUserPassword(userId, newPassword);
          } else {
            await apiService.setUserPassword(userId, password);
          }
          successMessage = 'Password updated successfully';
          break;
        }
        
        case 'change_role':
          await apiService.updateUser(userId, { role: additionalData.role });
          successMessage = `Role changed to ${additionalData.role} successfully`;
          break;
          
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await apiService.deleteUser(userId);
            successMessage = 'User deleted successfully';
          } else {
            return;
          }
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      toast.success(successMessage);
      await fetchUsers(pagination.currentPage, false);
      
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [`${userId}-${action}`]: false }));
    }
  };

  // Enhanced bulk operations
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      toast.warning('Please select users and an action');
      return;
    }

    setActionToConfirm({
      type: bulkAction === 'role_change' ? 'bulk_role_change' : 'bulk_action',
      users: selectedUsers,
      action: bulkAction,
    });
    setShowConfirmModal(true);
  };

  const confirmBulkAction = async () => {
    try {
      setLoading(true);
      let result;
      let successMessage = '';

      switch (actionToConfirm.action) {
        case 'approve':
          result = await apiService.bulkApproveUsers(actionToConfirm.users);
          successMessage = `${result.length} users approved successfully`;
          break;
          
        case 'activate':
          result = await apiService.bulkUpdateUsers(actionToConfirm.users, { is_active: true });
          successMessage = `${result.successful} users activated successfully`;
          if (result.failed > 0) {
            toast.warning(`${result.failed} users failed to activate`);
          }
          break;
          
        case 'deactivate':
          result = await apiService.bulkUpdateUsers(actionToConfirm.users, { is_active: false });
          successMessage = `${result.successful} users deactivated successfully`;
          if (result.failed > 0) {
            toast.warning(`${result.failed} users failed to deactivate`);
          }
          break;
          
        case 'role_change':
          if (!newRoleForBulk) {
            toast.error('Please select a role for bulk change');
            setLoading(false);
            return;
          }
          result = await apiService.bulkRoleChange(actionToConfirm.users, newRoleForBulk);
          successMessage = `${result.successful} user roles updated successfully`;
          if (result.failed > 0) {
            toast.warning(`${result.failed} users failed to update`);
          }
          break;
          
        case 'delete':
          if (!window.confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
            setLoading(false);
            return;
          }
          result = await Promise.allSettled(
            actionToConfirm.users.map(id => apiService.deleteUser(id))
          );
          const successfulDeletes = result.filter(r => r.status === 'fulfilled').length;
          const failedDeletes = result.filter(r => r.status === 'rejected').length;
          successMessage = `${successfulDeletes} users deleted successfully`;
          if (failedDeletes > 0) {
            toast.warning(`${failedDeletes} users failed to delete`);
          }
          break;
          
        default:
          throw new Error(`Unknown bulk action: ${actionToConfirm.action}`);
      }

      if (successMessage) {
        toast.success(successMessage);
      }
      
      await fetchUsers(pagination.currentPage, false);
      setSelectedUsers([]);
      setBulkAction('');
      setNewRoleForBulk('');
      setShowConfirmModal(false);
      setActionToConfirm({});
      
    } catch (err) {
      console.error('Bulk action error:', err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const handleExport = async (format = 'csv') => {
    try {
      const blob = await apiService.exportUsers(format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export completed successfully');
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  // Selection management
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsersSelection = () => {
    if (selectedUsers.length === users.length && users.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchUsers(newPage);
    }
  };

  // Modal handlers
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEditUser = async (userId) => {
    try {
      setModalLoading(true);
      const userData = await apiService.getUserById(userId);
      setSelectedUser(userData);
      setShowEditModal(true);
    } catch (err) {
      toast.error(`Error loading user: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      setModalLoading(true);
      const userData = await apiService.getUserById(userId);
      setSelectedUser(userData);
      setShowViewModal(true);
    } catch (err) {
      toast.error(`Error loading user: ${err.message}`);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedUser(null);
  };

  // Utility functions
  const getRoleDisplayName = (role) => {
    if (!role) return 'Unknown';
    switch (role) {
      case 'admin': return 'Administrator';
      case 'operator': return 'Operator';
      case 'citizen': return 'Citizen';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    if (!role) return 'bg-gray-100 text-gray-800';
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'operator': return 'bg-yellow-100 text-yellow-800';
      case 'citizen': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive) =>
    isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

  const toggleUserDetails = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const canPerformAction = () => true;

  // Render user row
  const renderUserRow = (userItem) => {
    if (!userItem) return null;

    const isExpanded = expandedUserId === userItem.id;

    return (
      <React.Fragment key={userItem.id}>
        <tr className={`hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}>
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="checkbox"
              checked={selectedUsers.includes(userItem.id)}
              onChange={() => toggleUserSelection(userItem.id)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10">
                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <FiUser className="text-gray-600" />
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {userItem.full_name || `${userItem.first_name || ''} ${userItem.last_name || ''}`.trim() || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">{userItem.email}</div>
              </div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
              {getRoleDisplayName(userItem.role)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {userItem.district || 'Not specified'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(userItem.is_active)}`}>
              {userItem.is_active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {userItem.is_approved ? 
              <span className="text-green-600"><FiCheck /></span> : 
              <span className="text-red-600"><FiX /></span>
            }
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {userItem.created_at ? new Date(userItem.created_at).toLocaleDateString() : 'Unknown'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => handleViewUser(userItem.id)}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="View Details"
              >
                <FiInfo />
              </button>

              <button
                onClick={() => handleEditUser(userItem.id)}
                className="text-blue-600 hover:text-blue-900 transition-colors"
                title="Edit"
              >
                <FiEdit />
              </button>

              {!userItem.is_approved && (
                <button
                  onClick={() => handleUserAction(userItem.id, 'approve')}
                  disabled={actionLoading[`${userItem.id}-approve`]}
                  className="text-green-600 hover:text-green-900 disabled:opacity-50 transition-colors"
                  title="Approve"
                >
                  {actionLoading[`${userItem.id}-approve`] ? 
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div> :
                    <FiUserCheck />
                  }
                </button>
              )}

              <button
                onClick={() => handleUserAction(userItem.id, userItem.is_active ? 'deactivate' : 'activate')}
                disabled={actionLoading[`${userItem.id}-${userItem.is_active ? 'deactivate' : 'activate'}`]}
                className={`hover:opacity-80 disabled:opacity-50 transition-colors ${
                  userItem.is_active ? 'text-red-600' : 'text-green-600'
                }`}
                title={userItem.is_active ? 'Deactivate' : 'Activate'}
              >
                {actionLoading[`${userItem.id}-${userItem.is_active ? 'deactivate' : 'activate'}`] ? 
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> :
                  userItem.is_active ? <FiUserX /> : <FiUserCheck />
                }
              </button>

              <button
                onClick={() => handleUserAction(userItem.id, 'reset_password')}
                disabled={actionLoading[`${userItem.id}-reset_password`]}
                className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50 transition-colors"
                title="Reset Password"
              >
                {actionLoading[`${userItem.id}-reset_password`] ? 
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div> :
                  <FiLock />
                }
              </button>

              <button
                onClick={() => handleUserAction(userItem.id, 'delete')}
                disabled={actionLoading[`${userItem.id}-delete`]}
                className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors"
                title="Delete User"
              >
                {actionLoading[`${userItem.id}-delete`] ? 
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div> :
                  <FiTrash2 />
                }
              </button>
            </div>
          </td>
        </tr>
      </React.Fragment>
    );
  };

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertCircle className="text-red-600 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-6">User information is not available. Please log in again.</p>
          <button
            onClick={onLogout}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm Action</h3>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setActionToConfirm({});
                  setNewRoleForBulk('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <FiAlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <p className="text-center text-gray-700 mb-4">
                Are you sure you want to {actionToConfirm.action?.replace('_', ' ')} {selectedUsers.length} user(s)?
              </p>

              {actionToConfirm.type === 'bulk_role_change' && (
                <div className="mt-4">
                  <label htmlFor="newRole" className="block text-sm font-medium text-gray-700 mb-1">
                    Select New Role
                  </label>
                  <select
                    id="newRole"
                    value={newRoleForBulk}
                    onChange={(e) => setNewRoleForBulk(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Administrator</option>
                    <option value="operator">Operator</option>
                    <option value="citizen">Citizen</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setActionToConfirm({});
                  setNewRoleForBulk('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <CreateUserModal 
        isOpen={showCreateModal}
        onClose={closeModals}
        onSuccess={() => {
          closeModals();
          fetchUsers(pagination.currentPage, false);
        }}
        districts={RWANDA_DISTRICTS}
      />

      {/* Edit User Modal */}
      <EditUserModal 
        isOpen={showEditModal}
        onClose={closeModals}
        user={selectedUser}
        onSuccess={() => {
          closeModals();
          fetchUsers(pagination.currentPage, false);
        }}
        districts={RWANDA_DISTRICTS}
      />

      {/* View User Modal */}
      <ViewUserModal 
        isOpen={showViewModal}
        onClose={closeModals}
        user={selectedUser}
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">
              Manage system users and their permissions • {pagination.totalCount} total users
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => fetchUsers(pagination.currentPage, false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <FiRefreshCw className="mr-2 h-4 w-4" /> Refresh
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <FiDownload className="mr-2 h-4 w-4" /> Export
            </button>
            {canPerformAction() && (
              <button
                onClick={handleCreateUser}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <FiPlus className="mr-2 h-4 w-4" /> New User
              </button>
            )}
          </div>
        </div>

        {/* Role Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{pagination.totalCount}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Administrators</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">{roleStats.admin || 0}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Operators</dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">{roleStats.operator || 0}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Citizens</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">{roleStats.citizen || 0}</dd>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FiFilter className="mr-2" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Active
                </span>
              )}
            </h3>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-900 transition-colors"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>
          </div>
          
          {showFilters && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="search"
                      id="search"
                      value={searchTerm}
                      onChange={handleFilterChange}
                      className="focus:ring-red-500 focus:border-red-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      placeholder="Name or email..."
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Administrator</option>
                    <option value="operator">Operator</option>
                    <option value="citizen">Citizen</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="is_active"
                    name="is_active"
                    value={filters.is_active}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="is_approved" className="block text-sm font-medium text-gray-700 mb-1">
                    Approval
                  </label>
                  <select
                    id="is_approved"
                    name="is_approved"
                    value={filters.is_approved}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Approvals</option>
                    <option value="true">Approved</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    id="district"
                    name="district"
                    value={filters.district}
                    onChange={handleFilterChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
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

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Clear selection
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
                >
                  <option value="">Choose bulk action...</option>
                  <option value="approve">Approve Users</option>
                  <option value="activate">Activate Users</option>
                  <option value="deactivate">Deactivate Users</option>
                  <option value="role_change">Change Role</option>
                  <option value="delete">Delete Users</option>
                </select>
                
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || selectedUsers.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Apply Action
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length > 0 && selectedUsers.length === users.length && users.length > 0}
                      onChange={toggleAllUsersSelection}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    District
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-2"></div>
                        <span className="text-sm text-gray-500">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiAlertCircle className="h-8 w-8 text-red-500 mb-2" />
                        <span className="text-sm text-red-600">{error}</span>
                        <button
                          onClick={() => fetchUsers(pagination.currentPage)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FiInfo className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">No users found matching your criteria</span>
                        {hasActiveFilters && (
                          <button
                            onClick={clearFilters}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map(renderUserRow)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {((pagination.currentPage - 1) * pagination.pageSize) + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.totalCount}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.currentPage
                              ? 'z-10 bg-red-50 border-red-500 text-red-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Create User Modal Component
const CreateUserModal = ({ isOpen, onClose, onSuccess, districts }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'citizen',
    district: '',
    preferred_language: 'rw',
    is_active: true,
    is_approved: true,
    accepted_terms: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.password2) newErrors.password2 = 'Passwords do not match';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await apiService.createUser(formData);
      toast.success('User created successfully');
      onSuccess();
      setFormData({
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'citizen',
        district: '',
        preferred_language: 'rw',
        is_active: true,
        is_approved: true,
        accepted_terms: true
      });
    } catch (err) {
      toast.error(`Error creating user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="citizen">Citizen</option>
                <option value="operator">Operator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.password2 ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.password2 && <p className="text-red-500 text-xs mt-1">{errors.password2}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="+250..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Language
              </label>
              <select
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="rw">Kinyarwanda</option>
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_approved"
                checked={formData.is_approved}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Approved</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <FiSave className="mr-2 h-4 w-4" />
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ isOpen, onClose, user, onSuccess, districts }) => {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'citizen',
    district: '',
    preferred_language: 'rw',
    is_active: true,
    is_approved: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'citizen',
        district: user.district || '',
        preferred_language: user.preferred_language || 'rw',
        is_active: user.is_active !== undefined ? user.is_active : true,
        is_approved: user.is_approved !== undefined ? user.is_approved : true
      });
    }
  }, [user]);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.first_name) newErrors.first_name = 'First name is required';
    if (!formData.last_name) newErrors.last_name = 'Last name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await apiService.updateUser(user.id, formData);
      toast.success('User updated successfully');
      onSuccess();
    } catch (err) {
      toast.error(`Error updating user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="citizen">Citizen</option>
                <option value="operator">Operator</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="+250..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select District</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Language
              </label>
              <select
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="rw">Kinyarwanda</option>
                <option value="en">English</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Active</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_approved"
                checked={formData.is_approved}
                onChange={handleChange}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Approved</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
              <FiSave className="mr-2 h-4 w-4" />
              Update User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// View User Modal Component
const ViewUserModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'operator': return 'Operator';
      case 'citizen': return 'Citizen';
      default: return role;
    }
  };

  const getLanguageDisplayName = (lang) => {
    switch (lang) {
      case 'rw': return 'Kinyarwanda';
      case 'en': return 'English';
      case 'fr': return 'French';
      default: return lang;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">User Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* User Avatar and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <FiUser className="text-gray-600 h-8 w-8" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900">
                {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}
              </h4>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role === 'operator' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getRoleDisplayName(user.role)}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
                {user.is_approved ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Approved
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Pending Approval
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiMail className="mr-2 h-4 w-4" />
                Contact Information
              </h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="ml-2 text-gray-900">{user.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="ml-2 text-gray-900">{user.phone || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-gray-500">District:</span>
                  <span className="ml-2 text-gray-900">{user.district || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Preferred Language:</span>
                  <span className="ml-2 text-gray-900">{getLanguageDisplayName(user.preferred_language)}</span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FiSettings className="mr-2 h-4 w-4" />
                Account Details
              </h5>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">User ID:</span>
                  <span className="ml-2 text-gray-900 font-mono">{user.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Role:</span>
                  <span className="ml-2 text-gray-900">{getRoleDisplayName(user.role)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-gray-900">{user.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Approval:</span>
                  <span className="ml-2 text-gray-900">{user.is_approved ? 'Approved' : 'Pending'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Information */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <FiCalendar className="mr-2 h-4 w-4" />
              Activity Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <div className="text-gray-900">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {user.created_at ? new Date(user.created_at).toLocaleTimeString() : ''}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Last Login:</span>
                <div className="text-gray-900">
                  {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                </div>
                <div className="text-xs text-gray-500">
                  {user.last_login ? new Date(user.last_login).toLocaleTimeString() : ''}
                </div>
              </div>
              <div>
                <span className="text-gray-500">Last Seen:</span>
                <div className="text-gray-900">
                  {user.last_seen ? new Date(user.last_seen).toLocaleDateString() : 'Unknown'}
                </div>
                <div className="text-xs text-gray-500">
                  {user.last_seen ? new Date(user.last_seen).toLocaleTimeString() : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {user.terms_accepted_at && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <FiCheck className="mr-2 h-4 w-4" />
                Terms & Conditions
              </h5>
              <div className="text-sm text-gray-600">
                Accepted on {new Date(user.terms_accepted_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;