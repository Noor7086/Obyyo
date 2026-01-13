import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { predictionService } from '../../services/predictionService';
import { Purchase, Prediction, LotteryType } from '../../types';
import toast from 'react-hot-toast';
import { Modal, Button } from 'react-bootstrap';

interface PurchaseWithPrediction extends Purchase {
  prediction: Prediction;
}

const MyPredictions: React.FC = () => {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed' | 'expired'>('all');
  const [purchases, setPurchases] = useState<PurchaseWithPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithPrediction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [predictionDetails, setPredictionDetails] = useState<Prediction | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyPurchases();
    }
  }, [user]);

  const fetchMyPurchases = async () => {
    try {
      setLoading(true);
      const fetchedPurchases = await predictionService.getMyPurchases(1, 100);
      setPurchases(fetchedPurchases as PurchaseWithPrediction[]);
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      toast.error(error.message || 'Failed to fetch your predictions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (purchase: PurchaseWithPrediction) => {
    if (!purchase.prediction || !purchase.prediction.id || !purchase.prediction.lotteryType) {
      toast.error('Prediction data is incomplete. Cannot load details.');
      return;
    }

    try {
      setSelectedPurchase(purchase);
      setLoadingDetails(true);
      const details = await predictionService.getPredictionDetails(
        purchase.prediction.lotteryType,
        purchase.prediction.id
      );
      setPredictionDetails(details);
      setShowDetailsModal(true);
    } catch (error: any) {
      console.error('Error fetching prediction details:', error);
      toast.error(error.message || 'Failed to load prediction details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const getPredictionStatus = (purchase: PurchaseWithPrediction): 'active' | 'completed' | 'expired' => {
    if (!purchase.prediction || !purchase.prediction.drawDate) {
      return 'active';
    }

    const drawDate = new Date(purchase.prediction.drawDate);
    const now = new Date();

    if (drawDate < now) {
      return 'completed';
    } else if (drawDate.toDateString() === now.toDateString()) {
      return 'active';
    } else {
      return 'active';
    }
  };

  const filteredPurchases = selectedFilter === 'all'
    ? purchases.filter(p => p.prediction) // Filter out purchases with null predictions
    : purchases.filter(purchase => purchase.prediction && getPredictionStatus(purchase) === selectedFilter);

  const getLotteryIcon = (lotteryType: string): string => {
    const iconMap: { [key: string]: string } = {
      'powerball': '⚡',
      'megamillion': '💰',
      'lottoamerica': '🇺🇸',
      'gopher5': '🎯',
      'pick3': '🎲'
    };
    return iconMap[lotteryType.toLowerCase()] || '🎰';
  };

  // Helper function to calculate viable numbers from non-viable numbers
  const calculateViableFromNonViable = (lotteryType: LotteryType, nonViableMain: number[], nonViableBonus: number[] = []): any => {
    // NOTE: User requested to show "Non Viable Numbers" in the UI section labeled "Non Viable"
    // Previously, this calculated "Viable" (Total - NonViable). 
    // Now, we simply return the NonViable numbers directly so they are displayed.

    if (lotteryType === 'powerball' || lotteryType === 'megamillion' || lotteryType === 'lottoamerica') {
      return { whiteBalls: nonViableMain, redBalls: nonViableBonus };
    } else {
      return nonViableMain;
    }
  };

  const formatViableNumbers = (prediction: Prediction) => {
    // First, try to use viableNumbers from backend (preferred)
    if (prediction.viableNumbers) {
      if (Array.isArray(prediction.viableNumbers)) {
        const viable = prediction.viableNumbers.filter(n => n != null);
        if (viable.length > 0) {
          return viable;
        }
      } else if (typeof prediction.viableNumbers === 'object' && prediction.viableNumbers !== null) {
        const obj = prediction.viableNumbers as { whiteBalls?: number[]; redBalls?: number[] };
        const whiteBalls = Array.isArray(obj.whiteBalls) ? obj.whiteBalls.filter(n => n != null) : [];
        const redBalls = Array.isArray(obj.redBalls) ? obj.redBalls.filter(n => n != null) : [];
        if (whiteBalls.length > 0 || redBalls.length > 0) {
          return { whiteBalls, redBalls };
        }
      }
    }

    // Fallback: Calculate viable numbers from non-viable numbers if viableNumbers is empty or missing
    if (prediction.lotteryType === 'powerball' || prediction.lotteryType === 'megamillion' || prediction.lotteryType === 'lottoamerica') {
      // Double selection lotteries
      if (prediction.nonViableNumbers && typeof prediction.nonViableNumbers === 'object' && !Array.isArray(prediction.nonViableNumbers)) {
        const obj = prediction.nonViableNumbers as { whiteBalls?: number[]; redBalls?: number[] };
        const nonViableWhite = Array.isArray(obj.whiteBalls) ? obj.whiteBalls.filter(n => n != null) : [];
        const nonViableRed = Array.isArray(obj.redBalls) ? obj.redBalls.filter(n => n != null) : [];
        if (nonViableWhite.length > 0 || nonViableRed.length > 0) {
          return calculateViableFromNonViable(prediction.lotteryType, nonViableWhite, nonViableRed);
        }
      }
    } else if (prediction.lotteryType === 'gopher5') {
      // Single selection - check nonViableNumbersSingle
      const nonViableSingle = (prediction as any).nonViableNumbersSingle || [];
      if (Array.isArray(nonViableSingle) && nonViableSingle.length > 0) {
        const filtered = nonViableSingle.filter((n: any) => n != null);
        if (filtered.length > 0) {
          return calculateViableFromNonViable(prediction.lotteryType, filtered);
        }
      }
    } else if (prediction.lotteryType === 'pick3') {
      // Pick 3 - check nonViableNumbersPick3
      const nonViablePick3 = (prediction as any).nonViableNumbersPick3 || [];
      if (Array.isArray(nonViablePick3) && nonViablePick3.length > 0) {
        const filtered = nonViablePick3.filter((n: any) => n != null);
        if (filtered.length > 0) {
          return calculateViableFromNonViable(prediction.lotteryType, filtered);
        }
      }
    }

    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge bg-primary">Active</span>;
      case 'completed':
        return <span className="badge bg-success">Completed</span>;
      case 'expired':
        return <span className="badge bg-secondary">Expired</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getAccuracyColor = (accuracy: number | null) => {
    if (accuracy === null) return 'text-muted';
    if (accuracy >= 90) return 'text-success';
    if (accuracy >= 80) return 'text-warning';
    return 'text-danger';
  };

  if (!user) {
    return (
      <div className="container py-5 mt-5">
        <div className="row">
          <div className="col-lg-6 mx-auto">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center">
                <i className="bi bi-person-x fs-1 text-muted mb-3"></i>
                <h4 className="fw-bold mb-3">Login Required</h4>
                <p className="text-muted mb-4">
                  Please log in to view your prediction history and track your success rate.
                </p>
                <div className="d-flex gap-3 justify-content-center">
                  <a href="/login" className="btn btn-primary">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Login
                  </a>
                  <a href="/register" className="btn btn-outline-primary">
                    <i className="bi bi-person-plus me-2"></i>
                    Sign Up
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h1 className="display-5 fw-bold gradient-text">My Predictions</h1>
              <p className="lead text-muted">Track your prediction history and success rate</p>
            </div>
            <div className="text-end">
              <div className="card bg-primary text-white">
                <div className="card-body p-3 text-center">
                  <h6 className="fw-bold mb-1">Total Purchases</h6>
                  <h4 className="fw-bold mb-0">{purchases.filter(p => p.prediction).length}</h4>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-graph-up text-primary fs-3 mb-2"></i>
                  <h5 className="fw-bold">Total Predictions</h5>
                  <h3 className="fw-bold text-primary">{purchases.filter(p => p.prediction).length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-check-circle text-success fs-3 mb-2"></i>
                  <h5 className="fw-bold">Completed</h5>
                  <h3 className="fw-bold text-success">{purchases.filter(p => p.prediction && getPredictionStatus(p) === 'completed').length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-clock text-warning fs-3 mb-2"></i>
                  <h5 className="fw-bold">Active</h5>
                  <h3 className="fw-bold text-warning">{purchases.filter(p => p.prediction && getPredictionStatus(p) === 'active').length}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center">
                  <i className="bi bi-trophy text-info fs-3 mb-2"></i>
                  <h5 className="fw-bold">Total Spent</h5>
                  <h3 className="fw-bold text-info">${purchases.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-funnel me-2"></i>
                Filter Predictions
              </h5>
              <div className="d-flex flex-wrap gap-2">
                {([
                  { id: 'all' as const, name: 'All Predictions', icon: '📊' },
                  { id: 'active' as const, name: 'Active', icon: '⏰' },
                  { id: 'completed' as const, name: 'Completed', icon: '✅' }
                ] as const).map((filter) => (
                  <button
                    key={filter.id}
                    className={`btn ${selectedFilter === filter.id ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setSelectedFilter(filter.id)}
                  >
                    <span className="me-2">{filter.icon}</span>
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Predictions List */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading predictions...</span>
              </div>
              <p className="mt-3 text-muted">Loading your predictions...</p>
            </div>
          ) : (
            <div className="row g-4">
              {filteredPurchases.map((purchase) => {
                if (!purchase.prediction) {
                  return null; // Skip purchases without prediction data
                }

                const prediction = purchase.prediction;
                const status = getPredictionStatus(purchase);

                return (
                  <div key={purchase.id} className="col-12">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body p-4">
                        <div className="row align-items-center">
                          <div className="col-md-2 text-center">
                            <span className="fs-1">{getLotteryIcon(prediction.lotteryType)}</span>
                            <div className="mt-2">
                              {getStatusBadge(status)}
                            </div>
                          </div>
                          <div className="col-md-10">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <h5 className="fw-bold mb-1">{prediction.lotteryDisplayName}</h5>
                                <div className="small text-muted">
                                  {purchase.paymentStatus === 'trial' || purchase.isTrialView ? 'Viewed' : 'Purchased'}: {new Date(purchase.createdAt).toLocaleDateString()} •
                                  Draw: {new Date(prediction.drawDate).toLocaleDateString()} at {prediction.drawTime}
                                </div>
                                <div className="small text-muted">
                                  {purchase.paymentStatus === 'trial' || purchase.isTrialView ? (
                                    <span className="text-success">
                                      <i className="bi bi-gift me-1"></i>
                                      Free Trial View
                                    </span>
                                  ) : (
                                    <>Amount: ${purchase.amount?.toFixed(2) || prediction.price?.toFixed(2) || '0.00'}</>
                                  )}
                                </div>
                              </div>
                              <div className="text-end">
                                {purchase.paymentStatus === 'trial' || purchase.isTrialView ? (
                                  <span className="badge bg-success fs-6 mb-2">
                                    <i className="bi bi-gift me-1"></i>
                                    Free Trial
                                  </span>
                                ) : (
                                  <div className="badge bg-info fs-6">${prediction.price?.toFixed(2) || '0.00'}</div>
                                )}
                                {prediction.accuracy && (
                                  <div className={`small fw-bold ${getAccuracyColor(prediction.accuracy)}`}>
                                    {prediction.accuracy}% Accuracy
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Viable Numbers Preview */}
                            {(() => {
                              const viableData = formatViableNumbers(prediction);
                              const isDoubleType = viableData && typeof viableData === 'object' && !Array.isArray(viableData);

                              if (!viableData) {
                                return null;
                              }

                              if (isDoubleType) {
                                const whiteBalls = (viableData as any).whiteBalls || [];
                                const redBalls = (viableData as any).redBalls || [];
                                return (
                                  <div className="mb-3">
                                    <h6 className="fw-bold text-success mb-2">
                                      <i className="bi bi-check-circle me-2"></i>
                                      Non Viable Numbers
                                    </h6>
                                    {whiteBalls.length > 0 && (
                                      <div className="mb-2">
                                        <small className="text-muted d-block mb-1">White Balls ({whiteBalls.length}):</small>
                                        <div className="d-flex flex-wrap gap-1">
                                          {whiteBalls.slice(0, 15).map((num: number) => (
                                            <span key={num} className="badge bg-success">{num}</span>
                                          ))}
                                          {whiteBalls.length > 15 && (
                                            <span className="badge bg-secondary">+{whiteBalls.length - 15} more</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {redBalls.length > 0 && (
                                      <div>
                                        <small className="text-muted d-block mb-1">Red Balls ({redBalls.length}):</small>
                                        <div className="d-flex flex-wrap gap-1">
                                          {redBalls.map((num: number) => (
                                            <span key={num} className="badge bg-success">{num}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              } else if (Array.isArray(viableData) && viableData.length > 0) {
                                return (
                                  <div className="mb-3">
                                    <h6 className="fw-bold text-success mb-2">
                                      <i className="bi bi-check-circle me-2"></i>
                                      Non Viable Numbers ({viableData.length})
                                    </h6>
                                    <div className="d-flex flex-wrap gap-1">
                                      {viableData.slice(0, 15).map((num: number) => (
                                        <span key={num} className="badge bg-success">{num}</span>
                                      ))}
                                      {viableData.length > 15 && (
                                        <span className="badge bg-secondary">+{viableData.length - 15} more</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {prediction.notes && (
                              <div className="alert alert-info mb-3">
                                <small>{prediction.notes}</small>
                              </div>
                            )}

                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleViewDetails(purchase)}
                              >
                                <i className="bi bi-eye me-1"></i>
                                View Full Details
                              </button>
                              <div className="small text-muted align-self-center ms-auto">
                                Downloads: {purchase.downloadCount || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPurchases.length === 0 && (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
              <h5 className="fw-bold mb-3">No Predictions Found</h5>
              <p className="text-muted mb-4">
                {selectedFilter === 'all'
                  ? "You haven't purchased any predictions yet."
                  : `No ${selectedFilter} predictions found.`
                }
              </p>
              <a href="/predictions" className="btn btn-primary">
                <i className="bi bi-cart me-2"></i>
                Browse Predictions
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Prediction Details Modal */}
      <Modal
        show={showDetailsModal}
        onHide={() => {
          setShowDetailsModal(false);
          setPredictionDetails(null);
          setSelectedPurchase(null);
        }}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-check-circle me-2"></i>
            Prediction Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetails ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading prediction details...</span>
              </div>
              <p className="mt-3 text-muted">Loading your prediction...</p>
            </div>
          ) : predictionDetails ? (
            <div>
              <div className="text-center mb-4">
                <h4 className="fw-bold">{predictionDetails.lotteryDisplayName}</h4>
                <p className="text-muted mb-2">
                  <i className="bi bi-calendar me-2"></i>
                  Draw Date: <strong>{new Date(predictionDetails.drawDate).toLocaleDateString()} at {predictionDetails.drawTime}</strong>
                </p>
                {selectedPurchase && (
                  <p className="text-muted">
                    Purchased: {new Date(selectedPurchase.createdAt).toLocaleDateString()} •
                    Amount: <strong>${selectedPurchase.amount?.toFixed(2) || predictionDetails.price?.toFixed(2)}</strong>
                  </p>
                )}
              </div>

              <div className="alert alert-success mb-4">
                <h5 className="alert-heading">
                  <i className="bi bi-check-circle me-2"></i>
                  Non Viable Numbers
                </h5>
                <p className="mb-0">
                  These numbers have been identified as least likely to appear in the upcoming draw.
                </p>
              </div>

              {(() => {
                const viableData = formatViableNumbers(predictionDetails);
                const isDouble = viableData && typeof viableData === 'object' && !Array.isArray(viableData);

                if (isDouble && viableData) {
                  const whiteBalls = (viableData as any).whiteBalls || [];
                  const redBalls = (viableData as any).redBalls || [];
                  return (
                    <div className="mb-4">
                      {whiteBalls.length > 0 && (
                        <div className="mb-3">
                          <h6 className="fw-bold text-success mb-3">
                            <i className="bi bi-circle-fill me-2"></i>
                            Recommended White Balls ({whiteBalls.length} numbers):
                          </h6>
                          <div className="d-flex flex-wrap gap-2">
                            {whiteBalls.map((num: number) => (
                              <span key={num} className="badge bg-success p-3" style={{ fontSize: '1.1rem', minWidth: '50px' }}>
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {redBalls.length > 0 && (
                        <div>
                          <h6 className="fw-bold text-success mb-3">
                            <i className="bi bi-circle-fill me-2"></i>
                            Recommended Red Ball ({redBalls.length} numbers):
                          </h6>
                          <div className="d-flex flex-wrap gap-2">
                            {redBalls.map((num: number) => (
                              <span key={num} className="badge bg-success p-3" style={{ fontSize: '1.1rem', minWidth: '50px' }}>
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {whiteBalls.length === 0 && redBalls.length === 0 && (
                        <div className="alert alert-warning">No viable numbers available for this prediction.</div>
                      )}
                    </div>
                  );
                } else if (Array.isArray(viableData) && viableData.length > 0) {
                  return (
                    <div className="mb-4">
                      <h6 className="fw-bold text-success mb-3">
                        <i className="bi bi-list-ul me-2"></i>
                        Recommended Numbers ({viableData.length} numbers):
                      </h6>
                      <div className="d-flex flex-wrap gap-2">
                        {viableData.map((num: number) => (
                          <span key={num} className="badge bg-success p-3" style={{ fontSize: '1.1rem', minWidth: '50px' }}>
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return <div className="alert alert-warning">No viable numbers available for this prediction.</div>;
              })()}

              {predictionDetails.notes && (
                <div className="alert alert-info mt-4">
                  <h6 className="fw-bold mb-2">
                    <i className="bi bi-info-circle me-2"></i>
                    Additional Notes:
                  </h6>
                  <p className="mb-0">{predictionDetails.notes}</p>
                </div>
              )}

              <div className="mt-4 p-3 bg-light rounded">
                <div className="row text-center">
                  <div className="col-4">
                    <small className="text-muted d-block">Downloads</small>
                    <strong>{selectedPurchase?.downloadCount || predictionDetails.downloadCount || 0}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Purchase Date</small>
                    <strong>{selectedPurchase ? new Date(selectedPurchase.createdAt).toLocaleDateString() : 'N/A'}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Amount</small>
                    <strong>${selectedPurchase?.amount?.toFixed(2) || predictionDetails.price?.toFixed(2) || '0.00'}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No prediction details available.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={() => {
              setShowDetailsModal(false);
              setPredictionDetails(null);
              setSelectedPurchase(null);
            }}
          >
            <i className="bi bi-check me-2"></i>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyPredictions;

