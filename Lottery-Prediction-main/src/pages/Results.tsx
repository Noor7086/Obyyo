import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { predictionService } from '../services/predictionService';
import { apiService } from '../services/api';
import { Purchase, Prediction } from '../types';
import { Modal, Button } from 'react-bootstrap';
import toast from 'react-hot-toast';

interface PurchaseWithPrediction extends Purchase {
  prediction: Prediction;
}

interface Result {
  _id: string;
  prediction: string;
  lotteryType: string;
  drawDate: string;
  winningNumbers?: {
    whiteBalls?: number[];
    redBalls?: number[];
  };
  winningNumbersSingle?: number[];
  winningNumbersPick3?: number[];
  jackpot?: number;
  winners?: {
    jackpot: number;
    match5: number;
    match4: number;
    match3: number;
    exact: number;
    any: number;
  };
}

interface PredictionWithResult {
  purchase: PurchaseWithPrediction;
  result: Result | null;
  canShowResult: boolean;
  status: 'not-announced' | 'available' | 'pending';
}

const Results: React.FC = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictionWithResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserResults();
    }
  }, [user]);

  // Helper function to check if result can be shown
  const canShowResult = (prediction: Prediction): boolean => {
    if (!prediction.drawDate || !prediction.drawTime) {
      return false;
    }

    const now = new Date();
    const drawDate = new Date(prediction.drawDate);
    
    // Parse draw time (format: HH:MM)
    const [hours, minutes] = prediction.drawTime.split(':').map(Number);
    const drawDateTime = new Date(drawDate);
    drawDateTime.setHours(hours, minutes, 0, 0);

    // Check if draw date has passed
    if (drawDateTime > now) {
      return false; // Draw hasn't happened yet
    }

    // Check if 20 minutes have passed after draw time
    const twentyMinutesAfterDraw = new Date(drawDateTime.getTime() + 20 * 60 * 1000);
    return now >= twentyMinutesAfterDraw;
  };

  const getResultStatus = (prediction: Prediction, result: Result | null): 'not-announced' | 'available' | 'pending' => {
    if (!canShowResult(prediction)) {
      return 'pending';
    }
    if (result) {
      return 'available';
    }
    return 'not-announced';
  };

  const fetchUserResults = async () => {
    try {
      setLoading(true);
      const purchases = await predictionService.getMyPurchases(1, 100);
      
      // Get unique predictions (group by prediction ID)
      const uniquePredictions = new Map<string, PurchaseWithPrediction>();
      (purchases as PurchaseWithPrediction[]).forEach(purchase => {
        if (purchase.prediction && purchase.prediction.id) {
          const key = purchase.prediction.id;
          if (!uniquePredictions.has(key)) {
            uniquePredictions.set(key, purchase);
          }
        }
      });

      // Fetch results for each prediction
      const predictionsWithResults: PredictionWithResult[] = await Promise.all(
        Array.from(uniquePredictions.values()).map(async (purchase) => {
          const prediction = purchase.prediction;
          let result: Result | null = null;

          // Only fetch result if draw date has passed and 20 minutes have elapsed
          if (canShowResult(prediction)) {
            try {
              const response = await apiService.get(`/predictions/result/${prediction.id}`);
              const resultData = (response as any).data?.result;
              if (resultData) {
                result = resultData;
              }
            } catch (error) {
              console.error(`Error fetching result for prediction ${prediction.id}:`, error);
            }
          }

          return {
            purchase,
            result,
            canShowResult: canShowResult(prediction),
            status: getResultStatus(prediction, result)
          };
        })
      );

      // Sort by draw date (newest first)
      predictionsWithResults.sort((a, b) => {
        const dateA = new Date(a.purchase.prediction.drawDate).getTime();
        const dateB = new Date(b.purchase.prediction.drawDate).getTime();
        return dateB - dateA;
      });

      // Limit to 3 most recent
      setPredictions(predictionsWithResults.slice(0, 3));
    } catch (error: any) {
      console.error('Error fetching user results:', error);
      toast.error(error.message || 'Failed to fetch your results');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = async (predictionWithResult: PredictionWithResult) => {
    const prediction = predictionWithResult.purchase.prediction;
    
    if (predictionWithResult.result) {
      // Ensure lotteryType is included from prediction if missing in result
      const resultWithType = {
        ...predictionWithResult.result,
        lotteryType: predictionWithResult.result.lotteryType || prediction.lotteryType
      };
      setSelectedResult(resultWithType);
      setShowResultModal(true);
    } else {
      // Try to fetch result again if not available
      try {
        const response = await apiService.get(`/predictions/result/${prediction.id}`);
        const resultData = (response as any).data?.result;
        if (resultData) {
          const resultWithType = {
            ...resultData,
            lotteryType: resultData.lotteryType || prediction.lotteryType
          };
          setSelectedResult(resultWithType);
          setShowResultModal(true);
        } else {
          toast('Result not available yet', { icon: 'ℹ️' });
        }
      } catch (error) {
        console.error('Error fetching result:', error);
        toast('Result not available yet', { icon: 'ℹ️' });
      }
    }
  };

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

  const formatDrawDate = (dateString: string, timeString: string): string => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${timeString}`;
  };

  const renderWinningNumbers = (result: Result) => {
    // Debug: log the result structure
    console.log('🔍 Rendering winning numbers for result:', result);
    
    // Check for double selection lottery (Powerball, Mega Millions, Lotto America)
    if (result.winningNumbers) {
      const whiteBalls = result.winningNumbers.whiteBalls || [];
      const redBalls = result.winningNumbers.redBalls || [];
      
      if (whiteBalls.length > 0 || redBalls.length > 0) {
        return (
          <div>
            {whiteBalls.length > 0 && (
              <div className="mb-3">
                <h6 className="fw-bold mb-2">White Balls:</h6>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {whiteBalls.map((num, idx) => (
                    <span key={idx} className="badge bg-primary fs-5 px-3 py-2">{num}</span>
                  ))}
                </div>
              </div>
            )}
            {redBalls.length > 0 && (
              <div>
                <h6 className="fw-bold mb-2">
                  {result.lotteryType === 'powerball' ? 'Powerball' : 
                   result.lotteryType === 'megamillion' ? 'Mega Ball' : 'Star Ball'}:
                </h6>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {redBalls.map((num, idx) => (
                    <span key={idx} className="badge bg-warning text-dark fs-5 px-3 py-2">{num}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
    }
    
    // Check for single selection lottery (Gopher 5)
    if (result.winningNumbersSingle && Array.isArray(result.winningNumbersSingle) && result.winningNumbersSingle.length > 0) {
      return (
        <div>
          <h6 className="fw-bold mb-2">Winning Numbers:</h6>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {result.winningNumbersSingle.map((num, idx) => (
              <span key={idx} className="badge bg-primary fs-5 px-3 py-2">{num}</span>
            ))}
          </div>
        </div>
      );
    }
    
    // Check for Pick 3 lottery
    if (result.winningNumbersPick3 && Array.isArray(result.winningNumbersPick3) && result.winningNumbersPick3.length > 0) {
      return (
        <div>
          <h6 className="fw-bold mb-2">Winning Numbers:</h6>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {result.winningNumbersPick3.map((num, idx) => (
              <span key={idx} className="badge bg-primary fs-5 px-3 py-2">{num}</span>
            ))}
          </div>
        </div>
      );
    }
    
    // Fallback: No winning numbers found
    console.warn('⚠️ No winning numbers found in result:', result);
    return (
      <div className="alert alert-warning mb-0">
        <i className="bi bi-exclamation-triangle me-2"></i>
        Winning numbers not available for this result.
      </div>
    );
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
                  Please log in to view your lottery results.
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
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3 gradient-text">My Results</h1>
            <p className="lead text-muted">
              View results for your purchased predictions
            </p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Loading your results...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-5 text-center">
                <i className="bi bi-inbox fs-1 text-muted mb-3"></i>
                <h5 className="fw-bold mb-3">No Predictions Found</h5>
                <p className="text-muted mb-4">
                  You haven't purchased any predictions yet. Purchase predictions to view results here.
                </p>
                <a href="/predictions" className="btn btn-primary">
                  <i className="bi bi-cart me-2"></i>
                  Browse Predictions
                </a>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {predictions.map((predictionWithResult) => {
                const { purchase, result, status } = predictionWithResult;
                const prediction = purchase.prediction;
                
                return (
                  <div key={prediction.id} className="col-md-6 col-lg-4">
                    <div className="card h-100 border-0 shadow-sm">
                      <div className="card-body">
                        <div className="text-center mb-3">
                          <span style={{ fontSize: '3rem' }}>{getLotteryIcon(prediction.lotteryType)}</span>
                      </div>
                        <h5 className="fw-bold text-center mb-2">{prediction.lotteryDisplayName}</h5>
                        <p className="text-muted text-center small mb-3">
                          <i className="bi bi-calendar me-1"></i>
                          {formatDrawDate(prediction.drawDate, prediction.drawTime)}
                        </p>

                              <div className="mb-3">
                          {status === 'available' && result ? (
                            <div className="alert alert-success mb-0">
                              <i className="bi bi-check-circle me-2"></i>
                              <strong>Result Available</strong>
                            </div>
                          ) : status === 'pending' ? (
                            <div className="alert alert-warning mb-0">
                              <i className="bi bi-clock me-2"></i>
                              <strong>Result Not Announced</strong>
                              <br />
                              <small>Draw hasn't occurred or less than 20 minutes have passed</small>
                              </div>
                          ) : (
                            <div className="alert alert-info mb-0">
                              <i className="bi bi-info-circle me-2"></i>
                              <strong>Result Not Announced</strong>
                            </div>
                          )}
                          </div>

                        <div className="d-grid">
                          <button
                            className={`btn ${status === 'available' ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => handleViewResult(predictionWithResult)}
                            disabled={status !== 'available'}
                          >
                            <i className="bi bi-eye me-2"></i>
                            View Result
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Result Modal */}
      <Modal 
        show={showResultModal} 
        onHide={() => {
          setShowResultModal(false);
          setSelectedResult(null);
        }} 
        centered 
        size="lg"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="bi bi-trophy me-2"></i>
            Winning Numbers
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResult ? (
            <div>
              <div className="text-center mb-4">
                <h4 className="fw-bold">
                  {selectedResult.lotteryType 
                    ? selectedResult.lotteryType.charAt(0).toUpperCase() + selectedResult.lotteryType.slice(1)
                    : 'Lottery Result'}
                </h4>
                <p className="text-muted">
                  <i className="bi bi-calendar me-2"></i>
                  Draw Date: {selectedResult.drawDate ? new Date(selectedResult.drawDate).toLocaleDateString() : 'N/A'}
                </p>
          </div>

              <div className="alert alert-success mb-4">
                <h5 className="alert-heading">
                  <i className="bi bi-trophy me-2"></i>
                  Winning Numbers
                </h5>
                {renderWinningNumbers(selectedResult)}
              </div>

              {selectedResult.jackpot && (
                <div className="mb-3">
                  <h6 className="fw-bold">Jackpot:</h6>
                  <p className="fs-4 text-success fw-bold">
                    ${selectedResult.jackpot.toLocaleString()}
                  </p>
                </div>
              )}

              {selectedResult.winners && (
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">Winners:</h6>
                        <div className="row g-2">
                      {selectedResult.winners.jackpot > 0 && (
                                <div className="col-6">
                          <small className="text-muted d-block">Jackpot</small>
                          <strong>{selectedResult.winners.jackpot}</strong>
                                </div>
                              )}
                      {selectedResult.winners.match5 > 0 && (
                                <div className="col-6">
                          <small className="text-muted d-block">Match 5</small>
                          <strong>{selectedResult.winners.match5}</strong>
                                </div>
                              )}
                      {selectedResult.winners.match4 > 0 && (
                                <div className="col-6">
                          <small className="text-muted d-block">Match 4</small>
                          <strong>{selectedResult.winners.match4}</strong>
                                </div>
                              )}
                      {selectedResult.winners.match3 > 0 && (
                                <div className="col-6">
                          <small className="text-muted d-block">Match 3</small>
                          <strong>{selectedResult.winners.match3}</strong>
                                </div>
                              )}
                      {selectedResult.winners.exact > 0 && (
                                <div className="col-6">
                          <small className="text-muted d-block">Exact</small>
                          <strong>{selectedResult.winners.exact}</strong>
                                </div>
                              )}
                      {selectedResult.winners.any > 0 && (
                                <div className="col-6">
                          <small className="text-muted d-block">Any</small>
                          <strong>{selectedResult.winners.any}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No result data available.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="success" 
            onClick={() => {
              setShowResultModal(false);
              setSelectedResult(null);
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

export default Results;
