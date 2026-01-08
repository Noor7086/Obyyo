import React, { useState, useEffect } from 'react';
import { Lottery } from '../../types';
import { apiService } from '../../services/api';
import AdminLayout from '../../components/layout/AdminLayout';

const AdminLotteries: React.FC = () => {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLottery, setNewLottery] = useState({
    name: '',
    code: '',
    type: 'single' as 'single' | 'double',
    description: '',
    price: 0,
    currency: 'USD',
    state: '',
    country: 'USA',
    officialWebsite: '',
    isActive: true,
    drawSchedule: [{ day: 'monday', time: '22:00' }],
    singleSelection: {
      pickCount: 5,
      totalNumbers: 47
    },
    doubleSelection: {
      whiteBalls: {
        pickCount: 5,
        totalNumbers: 69
      },
      redBalls: {
        pickCount: 1,
        totalNumbers: 26
      }
    },
    lastDrawDate: '',
    nextDrawDate: ''
  });

  useEffect(() => {
    fetchLotteries();
  }, [currentPage, searchTerm, filterStatus]);

  // Helper function to get price based on lottery name
  const getPriceByLotteryName = (lotteryName: string): number => {
    const name = lotteryName.toLowerCase().trim();
    
    if (name.includes('lotto america') || name === 'lottoamerica') {
      return 1;
    } else if (name.includes('mega million') || name === 'megamillion') {
      return 5;
    } else if (name.includes('powerball')) {
      return 2;
    } else if (name.includes('gopher') || name === 'gopher5') {
      return 1;
    } else if (name.includes('pick 3') || name === 'pick3') {
      return 1;
    }
    
    return 0; // Default price if no match
  };

  const fetchLotteries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await apiService.get(`/admin/lotteries?${params}`);
      if ((response as any).success) {
        setLotteries((response as any).data.lotteries);
        setTotalPages((response as any).data.pagination.pages);
      } else {
        setError('Failed to fetch lotteries');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch lotteries');
    } finally {
      setLoading(false);
    }
  };

  const handleLotteryAction = async (lotteryId: string, action: string) => {
    try {
      const response = await apiService.patch(`/admin/lotteries/${lotteryId}/${action}`);
      if ((response as any).success) {
        fetchLotteries();
        setShowModal(false);
        setSelectedLottery(null);
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    }
  };

  const handleCreateLottery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare lottery data based on type
      const lotteryData: any = {
        name: newLottery.name,
        code: newLottery.code.toUpperCase(),
        type: newLottery.type,
        description: newLottery.description,
        price: parseFloat(newLottery.price.toString()),
        currency: newLottery.currency,
        state: newLottery.state,
        country: newLottery.country,
        officialWebsite: newLottery.officialWebsite || undefined,
        isActive: newLottery.isActive,
        drawSchedule: newLottery.drawSchedule.map(s => ({
          day: s.day.toLowerCase(),
          time: s.time
        }))
      };

      // Add number selection based on type
      if (newLottery.type === 'single') {
        lotteryData.singleSelection = {
          pickCount: parseInt(newLottery.singleSelection.pickCount.toString()),
          totalNumbers: parseInt(newLottery.singleSelection.totalNumbers.toString())
        };
      } else {
        lotteryData.doubleSelection = {
          whiteBalls: {
            pickCount: parseInt(newLottery.doubleSelection.whiteBalls.pickCount.toString()),
            totalNumbers: parseInt(newLottery.doubleSelection.whiteBalls.totalNumbers.toString())
          },
          redBalls: {
            pickCount: parseInt(newLottery.doubleSelection.redBalls.pickCount.toString()),
            totalNumbers: parseInt(newLottery.doubleSelection.redBalls.totalNumbers.toString())
          }
        };
      }

      // Add dates if provided
      if (newLottery.lastDrawDate) {
        lotteryData.lastDrawDate = new Date(newLottery.lastDrawDate);
      }
      if (newLottery.nextDrawDate) {
        lotteryData.nextDrawDate = new Date(newLottery.nextDrawDate);
      }

      const response = await apiService.post('/admin/lotteries', lotteryData);
      if ((response as any).success) {
        setShowCreateModal(false);
        resetLotteryForm();
        fetchLotteries();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create lottery');
    }
  };

  const resetLotteryForm = () => {
    setNewLottery({
      name: '',
      code: '',
      type: 'single',
      description: '',
      price: 0,
      currency: 'USD',
      state: '',
      country: 'USA',
      officialWebsite: '',
      isActive: true,
      drawSchedule: [{ day: 'monday', time: '22:00' }],
      singleSelection: {
        pickCount: 5,
        totalNumbers: 47
      },
      doubleSelection: {
        whiteBalls: {
          pickCount: 5,
          totalNumbers: 69
        },
        redBalls: {
          pickCount: 1,
          totalNumbers: 26
        }
      },
      lastDrawDate: '',
      nextDrawDate: ''
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLotteries();
  };

  const openLotteryModal = (lottery: Lottery) => {
    setSelectedLottery(lottery);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLottery(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetLotteryForm();
  };

  const addDrawSchedule = () => {
    setNewLottery({
      ...newLottery,
      drawSchedule: [...newLottery.drawSchedule, { day: 'monday', time: '22:00' }]
    });
  };

  const removeDrawSchedule = (index: number) => {
    setNewLottery({
      ...newLottery,
      drawSchedule: newLottery.drawSchedule.filter((_, i) => i !== index)
    });
  };

  const updateDrawSchedule = (index: number, field: 'day' | 'time', value: string) => {
    const updatedSchedule = [...newLottery.drawSchedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    setNewLottery({ ...newLottery, drawSchedule: updatedSchedule });
  };

  if (loading && lotteries.length === 0) {
    return (
      <div className="container py-5 mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading lotteries...</p>
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
            <h1 className="h3 mb-0">Lottery Management</h1>
            <div>
              <button 
                className="btn btn-success me-2" 
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Lottery
              </button>
              <button className="btn btn-outline-primary" onClick={fetchLotteries}>
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-body">
              <form onSubmit={handleSearch} className="row g-3">
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search lotteries by name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <select
                    className="form-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-2">
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

      {/* Lotteries Table */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow mb-4">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Lotteries List</h6>
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
                      <th>Code</th>
                      <th>Type</th>
                      <th>Numbers</th>
                      <th>Price</th>
                      <th>State/Country</th>
                      <th>Status</th>
                      <th>Last Draw</th>
                      <th>Next Draw</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotteries.map((lottery) => (
                      <tr key={lottery.id}>
                        <td>
                          <div>
                            <strong>{lottery.name}</strong>
                            <br />
                            <small className="text-muted">{lottery.description}</small>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-info">{lottery.code}</span>
                        </td>
                        <td>
                          <span className={`badge ${lottery.type === 'single' ? 'bg-primary' : 'bg-warning'}`}>
                            {lottery.type}
                          </span>
                        </td>
                        <td>
                          {lottery.type === 'single' && lottery.singleSelection ? (
                            <small>
                              Pick {lottery.singleSelection.pickCount} from {lottery.singleSelection.totalNumbers}
                            </small>
                          ) : lottery.type === 'double' && lottery.doubleSelection ? (
                            <small>
                              {lottery.doubleSelection.whiteBalls.pickCount}/{lottery.doubleSelection.whiteBalls.totalNumbers} + {lottery.doubleSelection.redBalls.pickCount}/{lottery.doubleSelection.redBalls.totalNumbers}
                            </small>
                          ) : (
                            <small className="text-muted">N/A</small>
                          )}
                        </td>
                        <td>${lottery.price.toFixed(2)} {lottery.currency}</td>
                        <td>
                          <div>
                            {lottery.state}
                            <br />
                            <small className="text-muted">{lottery.country}</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${lottery.isActive ? 'bg-success' : 'bg-danger'}`}>
                            {lottery.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          {lottery.lastDrawDate ? 
                            new Date(lottery.lastDrawDate).toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                        <td>
                          {lottery.nextDrawDate ? 
                            new Date(lottery.nextDrawDate).toLocaleDateString() : 
                            'N/A'
                          }
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => openLotteryModal(lottery)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleLotteryAction(lottery.id, 'toggle-status')}
                          >
                            <i className="bi bi-toggle-on"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Lotteries pagination">
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

      {/* Lottery Details Modal */}
      {showModal && selectedLottery && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Lottery Details</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Basic Information</h6>
                    <p><strong>Name:</strong> {selectedLottery.name}</p>
                    <p><strong>Code:</strong> {selectedLottery.code}</p>
                    <p><strong>Type:</strong> {selectedLottery.type}</p>
                    {selectedLottery.type === 'single' && selectedLottery.singleSelection && (
                      <p><strong>Numbers:</strong> Pick {selectedLottery.singleSelection.pickCount} from {selectedLottery.singleSelection.totalNumbers}</p>
                    )}
                    {selectedLottery.type === 'double' && selectedLottery.doubleSelection && (
                      <p><strong>Numbers:</strong> Pick {selectedLottery.doubleSelection.whiteBalls.pickCount} from {selectedLottery.doubleSelection.whiteBalls.totalNumbers} (white) + Pick {selectedLottery.doubleSelection.redBalls.pickCount} from {selectedLottery.doubleSelection.redBalls.totalNumbers} (red)</p>
                    )}
                    <p><strong>Price:</strong> ${selectedLottery.price.toFixed(2)} {selectedLottery.currency}</p>
                    <p><strong>State:</strong> {selectedLottery.state}</p>
                    <p><strong>Country:</strong> {selectedLottery.country}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Status & Dates</h6>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${selectedLottery.isActive ? 'bg-success' : 'bg-danger'}`}>
                        {selectedLottery.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                    <p><strong>Last Draw:</strong> {selectedLottery.lastDrawDate ? new Date(selectedLottery.lastDrawDate).toLocaleString() : 'N/A'}</p>
                    <p><strong>Next Draw:</strong> {selectedLottery.nextDrawDate ? new Date(selectedLottery.nextDrawDate).toLocaleString() : 'N/A'}</p>
                    {selectedLottery.officialWebsite && (
                      <p><strong>Website:</strong> <a href={selectedLottery.officialWebsite} target="_blank" rel="noopener noreferrer">{selectedLottery.officialWebsite}</a></p>
                    )}
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12">
                    <h6>Description</h6>
                    <p>{selectedLottery.description}</p>
                  </div>
                </div>
                <div className="row mt-3">
                  <div className="col-12">
                    <h6>Draw Schedule</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Day</th>
                            <th>Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedLottery.drawSchedule.map((schedule, index) => (
                            <tr key={index}>
                              <td>{schedule.day}</td>
                              <td>{schedule.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => handleLotteryAction(selectedLottery.id, 'toggle-status')}
                >
                  Toggle Status
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleLotteryAction(selectedLottery.id, 'delete')}
                >
                  Delete Lottery
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Lottery Modal */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Lottery</h5>
                <button type="button" className="btn-close" onClick={closeCreateModal}></button>
              </div>
              <form onSubmit={handleCreateLottery}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newLottery.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            const autoPrice = getPriceByLotteryName(name);
                            setNewLottery({
                              ...newLottery, 
                              name: name,
                              // Always auto-set price when a known lottery is detected
                              price: autoPrice > 0 ? autoPrice : newLottery.price
                            });
                          }}
                          required
                        />
                        {newLottery.name && getPriceByLotteryName(newLottery.name) > 0 && (
                          <small className="text-success">
                            <i className="bi bi-check-circle me-1"></i>
                            Price automatically set to ${getPriceByLotteryName(newLottery.name)}
                          </small>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Code</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newLottery.code}
                          onChange={(e) => setNewLottery({...newLottery, code: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Type</label>
                        <select
                          className="form-select"
                          value={newLottery.type}
                          onChange={(e) => {
                            const newType = e.target.value as 'single' | 'double';
                            setNewLottery({
                              ...newLottery,
                              type: newType,
                              // Reset to defaults when type changes
                              singleSelection: newType === 'single' ? {
                                pickCount: 5,
                                totalNumbers: 47
                              } : newLottery.singleSelection,
                              doubleSelection: newType === 'double' ? {
                                whiteBalls: {
                                  pickCount: 5,
                                  totalNumbers: 69
                                },
                                redBalls: {
                                  pickCount: 1,
                                  totalNumbers: 26
                                }
                              } : newLottery.doubleSelection
                            });
                          }}
                          required
                        >
                          <option value="single">Single (e.g., Gopher 5, Pick 3)</option>
                          <option value="double">Double (e.g., Powerball, Mega Millions)</option>
                        </select>
                        <small className="text-muted">
                          Single: One set of numbers. Double: White balls + Red/Power ball
                        </small>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={newLottery.price}
                          onChange={(e) => setNewLottery({...newLottery, price: parseFloat(e.target.value)})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newLottery.state}
                          onChange={(e) => setNewLottery({...newLottery, state: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newLottery.country}
                          onChange={(e) => setNewLottery({...newLottery, country: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={newLottery.description}
                      onChange={(e) => setNewLottery({...newLottery, description: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Official Website</label>
                    <input
                      type="url"
                      className="form-control"
                      value={newLottery.officialWebsite}
                      onChange={(e) => setNewLottery({...newLottery, officialWebsite: e.target.value})}
                    />
                  </div>
                  {/* Number Selection Configuration */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">Number Selection Configuration</label>
                    {newLottery.type === 'single' ? (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Pick Count</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              className="form-control"
                              value={newLottery.singleSelection.pickCount}
                              onChange={(e) => setNewLottery({
                                ...newLottery,
                                singleSelection: {
                                  ...newLottery.singleSelection,
                                  pickCount: parseInt(e.target.value) || 0
                                }
                              })}
                              required
                            />
                            <small className="text-muted">Number of numbers to pick</small>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Total Numbers</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="form-control"
                              value={newLottery.singleSelection.totalNumbers}
                              onChange={(e) => setNewLottery({
                                ...newLottery,
                                singleSelection: {
                                  ...newLottery.singleSelection,
                                  totalNumbers: parseInt(e.target.value) || 0
                                }
                              })}
                              required
                            />
                            <small className="text-muted">Total numbers in the pool</small>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h6 className="mb-3">White Balls</h6>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Pick Count</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              className="form-control"
                              value={newLottery.doubleSelection.whiteBalls.pickCount}
                              onChange={(e) => setNewLottery({
                                ...newLottery,
                                doubleSelection: {
                                  ...newLottery.doubleSelection,
                                  whiteBalls: {
                                    ...newLottery.doubleSelection.whiteBalls,
                                    pickCount: parseInt(e.target.value) || 0
                                  }
                                }
                              })}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Total Numbers</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="form-control"
                              value={newLottery.doubleSelection.whiteBalls.totalNumbers}
                              onChange={(e) => setNewLottery({
                                ...newLottery,
                                doubleSelection: {
                                  ...newLottery.doubleSelection,
                                  whiteBalls: {
                                    ...newLottery.doubleSelection.whiteBalls,
                                    totalNumbers: parseInt(e.target.value) || 0
                                  }
                                }
                              })}
                              required
                            />
                          </div>
                        </div>
                        <h6 className="mb-3">Red Balls</h6>
                        <div className="row">
                          <div className="col-md-6">
                            <label className="form-label">Pick Count</label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              className="form-control"
                              value={newLottery.doubleSelection.redBalls.pickCount}
                              onChange={(e) => setNewLottery({
                                ...newLottery,
                                doubleSelection: {
                                  ...newLottery.doubleSelection,
                                  redBalls: {
                                    ...newLottery.doubleSelection.redBalls,
                                    pickCount: parseInt(e.target.value) || 0
                                  }
                                }
                              })}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Total Numbers</label>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              className="form-control"
                              value={newLottery.doubleSelection.redBalls.totalNumbers}
                              onChange={(e) => setNewLottery({
                                ...newLottery,
                                doubleSelection: {
                                  ...newLottery.doubleSelection,
                                  redBalls: {
                                    ...newLottery.doubleSelection.redBalls,
                                    totalNumbers: parseInt(e.target.value) || 0
                                  }
                                }
                              })}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Draw Dates */}
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Last Draw Date</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={newLottery.lastDrawDate}
                        onChange={(e) => setNewLottery({...newLottery, lastDrawDate: e.target.value})}
                      />
                      <small className="text-muted">Optional - Last draw date for this lottery</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Next Draw Date</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={newLottery.nextDrawDate}
                        onChange={(e) => setNewLottery({...newLottery, nextDrawDate: e.target.value})}
                      />
                      <small className="text-muted">Optional - Next scheduled draw date</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Draw Schedule</label>
                    {newLottery.drawSchedule.map((schedule, index) => (
                      <div key={index} className="row mb-2">
                        <div className="col-md-6">
                          <select
                            className="form-select"
                            value={schedule.day}
                            onChange={(e) => updateDrawSchedule(index, 'day', e.target.value)}
                          >
                            <option value="monday">Monday</option>
                            <option value="tuesday">Tuesday</option>
                            <option value="wednesday">Wednesday</option>
                            <option value="thursday">Thursday</option>
                            <option value="friday">Friday</option>
                            <option value="saturday">Saturday</option>
                            <option value="sunday">Sunday</option>
                          </select>
                        </div>
                        <div className="col-md-4">
                          <input
                            type="time"
                            className="form-control"
                            value={schedule.time}
                            onChange={(e) => updateDrawSchedule(index, 'time', e.target.value)}
                          />
                        </div>
                        <div className="col-md-2">
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => removeDrawSchedule(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={addDrawSchedule}
                    >
                      <i className="bi bi-plus me-2"></i>
                      Add Schedule
                    </button>
                  </div>

                  {/* Active Status */}
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="isActive"
                        checked={newLottery.isActive}
                        onChange={(e) => setNewLottery({...newLottery, isActive: e.target.checked})}
                      />
                      <label className="form-check-label" htmlFor="isActive">
                        Active (Lottery will be visible to users)
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeCreateModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success">
                    Create Lottery
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminLotteries;
