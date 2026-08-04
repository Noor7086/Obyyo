import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { apiService } from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast from 'react-hot-toast';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterRole !== 'all' && { role: filterRole })
      });

      const response = await apiService.get(`/admin/users?${params}`);
      if ((response as any).success) {
        // Ensure all users have proper id field (map _id to id if needed)
        const users = ((response as any).data.users || []).map((user: any) => ({
          ...user,
          id: user.id || user._id || user.userId
        }));
        setUsers(users);
        setTotalPages((response as any).data.pagination.pages);
      } else {
        setError('Failed to fetch users');
        toast.error('Failed to fetch users');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    // Validate userId before making request
    if (!userId || userId === 'undefined' || userId === 'null') {
      toast.error('Invalid user ID');
      console.error('Invalid userId:', userId);
      return;
    }

    try {
      setTogglingUserId(userId);
      setError(null);
      
      console.log('Toggling user status:', { userId, action });
      
      const response = await apiService.patch(`/admin/users/${userId}/${action}`);
      
      if ((response as any).success) {
        const message = (response as any).message || `User ${action === 'toggle-status' ? 'status updated' : action === 'delete' ? 'deleted' : 'updated'} successfully`;
        toast.success(message);
        
        // Update the user in the local state immediately for better UX
        if (action === 'toggle-status') {
          const newIsActive = (response as any).data?.isActive;
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === userId 
                ? { ...user, isActive: newIsActive !== undefined ? newIsActive : (user.isActive === undefined ? false : !user.isActive) }
                : user
            )
          );
          // Update selected user if modal is open
          if (selectedUser && selectedUser.id === userId) {
            setSelectedUser({ ...selectedUser, isActive: newIsActive !== undefined ? newIsActive : (selectedUser.isActive === undefined ? false : !selectedUser.isActive) });
          }
        } else if (action === 'delete') {
          setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
          setShowModal(false);
          setSelectedUser(null);
        }
        
        // Refresh the list to ensure consistency
        fetchUsers();
        if (action !== 'toggle-status') {
          setShowModal(false);
          setSelectedUser(null);
        }
      } else {
        const errorMessage = (response as any).message || 'Action failed';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || 'Action failed';
      setError(errorMessage);
      
      // Show more detailed error if available
      if (err.response?.data?.errors) {
        const errors = Array.isArray(err.response.data.errors) 
          ? err.response.data.errors.map((e: any) => e.message || e.msg).join(', ')
          : err.response.data.errors;
        toast.error(errors || errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const openUserModal = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  if (loading && users.length === 0) {
    return (
      <div className="container py-5 mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0">User Management</h1>
            <button className="btn btn-outline-primary" onClick={fetchUsers}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <form onSubmit={handleSearch} className="row g-3">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value as 'all' | 'user' | 'admin')}
                  >
                    <option value="all">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-search me-2"></i>
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Users List</h6>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="table-responsive">
                <table className="table table-bordered" width="100%" cellSpacing="0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Role</th>
                      <th>Lottery</th>
                      <th>Status</th>
                      <th>Wallet</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.firstName} {user.lastName}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {user.selectedLottery}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${(user.isActive === false) ? 'bg-danger' : user.isInTrial ? 'bg-warning' : 'bg-success'}`}>
                            {(user.isActive === false) ? 'Inactive' : user.isInTrial ? 'Trial' : 'Active'}
                          </span>
                        </td>
                        <td>${user.walletBalance.toFixed(2)}</td>
                        <td>{new Date(user.trialStartDate).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => openUserModal(user)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className={`btn btn-sm ${(user.isActive === false) ? 'btn-outline-success' : 'btn-outline-warning'}`}
                            onClick={() => {
                              const userId = user.id;
                              if (userId) {
                                handleUserAction(userId, 'toggle-status');
                              } else {
                                console.error('User ID not found:', user);
                                toast.error('User ID is missing');
                              }
                            }}
                            disabled={togglingUserId === user.id || !user.id}
                            title={(user.isActive === false) ? 'Activate User' : 'Deactivate User'}
                          >
                            {togglingUserId === user.id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <i className={`bi ${(user.isActive === false) ? 'bi-toggle-off' : 'bi-toggle-on'}`}></i>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Users pagination">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-dialog modal-lg" style={{ zIndex: 1205, marginTop: '60px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">User Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Personal Information</h6>
                    <p><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                    <p><strong>Email:</strong> {selectedUser.email}</p>
                    <p><strong>Phone:</strong> {selectedUser.phone}</p>
                    <p><strong>Role:</strong> 
                      <span className={`badge ms-2 ${selectedUser.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                        {selectedUser.role}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6>Account Information</h6>
                    <p><strong>Selected Lottery:</strong> {selectedUser.selectedLottery}</p>
                    <p><strong>Wallet Balance:</strong> ${selectedUser.walletBalance.toFixed(2)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${(selectedUser.isActive === false) ? 'bg-danger' : selectedUser.isInTrial ? 'bg-warning' : 'bg-success'}`}>
                        {(selectedUser.isActive === false) ? 'Inactive' : selectedUser.isInTrial ? 'Trial' : 'Active'}
                      </span>
                    </p>
                    <p><strong>Notifications:</strong> 
                      <span className={`badge ms-2 ${selectedUser.notificationsEnabled ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedUser.notificationsEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12">
                    <h6>Trial Information</h6>
                    <p><strong>Trial Start:</strong> {new Date(selectedUser.trialStartDate).toLocaleString()}</p>
                    <p><strong>Trial End:</strong> {new Date(selectedUser.trialEndDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
                <button
                  type="button"
                  className={`btn ${(selectedUser.isActive === false) ? 'btn-success' : 'btn-warning'}`}
                  onClick={() => {
                    const userId = selectedUser.id;
                    if (userId) {
                      handleUserAction(userId, 'toggle-status');
                    } else {
                      console.error('Selected user ID not found:', selectedUser);
                      toast.error('User ID is missing');
                    }
                  }}
                  disabled={togglingUserId === selectedUser.id || !selectedUser.id}
                >
                  {togglingUserId === selectedUser.id ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className={`bi me-2 ${(selectedUser.isActive === false) ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                      {(selectedUser.isActive === false) ? 'Activate User' : 'Deactivate User'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    const userId = selectedUser.id;
                    if (userId) {
                      handleUserAction(userId, 'delete');
                    } else {
                      console.error('Selected user ID not found:', selectedUser);
                      toast.error('User ID is missing');
                    }
                  }}
                  disabled={!selectedUser.id}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

