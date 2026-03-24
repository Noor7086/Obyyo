import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Spinner, Button } from 'react-bootstrap';
import { apiService } from '../../services/api';
import { useSearchParams, Link } from 'react-router-dom';

const TOTAL_RESULTS = 5;

const LOTTERY_NAMES: Record<string, { name: string; icon: string }> = {
  powerball: { name: 'Powerball', icon: '⚡' },
  megamillion: { name: 'Mega Millions', icon: '💰' },
  lottoamerica: { name: 'Lotto America', icon: '🇺🇸' },
  gopher5: { name: 'Gopher 5', icon: '🎯' },
  pick3: { name: 'Pick 3', icon: '🎲' }
};

type OurPrediction = { whiteBalls?: number[]; redBalls?: number[] } | number[] | null;

interface RecentPredictionRow {
  predictionId: string;
  lotteryType: string;
  lotteryDisplayName?: string;
  drawDate: string;
  drawTime?: string;
  drawDateTimeMs?: number | null;
  ourPrediction?: OurPrediction;
  actualResult?: {
    winningNumbers?: { whiteBalls?: number[]; redBalls?: number[] };
    winningNumbersSingle?: number[];
    winningNumbersPick3?: number[];
  } | null;
}

const AnnouncedResults: React.FC = () => {
  const [results, setResults] = useState<RecentPredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const selectedPredictionId = searchParams.get('predictionId');
  const selectedLotteryType = searchParams.get('lottery');
  const [selected, setSelected] = useState<RecentPredictionRow | null>(null);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      // If a prediction is selected, fetch just that one
      if (selectedPredictionId) {
        const res = await apiService.get<{ success: boolean; data?: { prediction?: RecentPredictionRow } }>(
          `/admin/results/prediction/${selectedPredictionId}`
        );
        const p = res?.data?.prediction ?? null;
        setSelected(p);
        setResults([]);
        return;
      }

      let url = `/admin/results/recent?limit=${TOTAL_RESULTS}`;
      if (selectedLotteryType) {
        url += `&lotteryType=${selectedLotteryType}`;
      }

      const res = await apiService.get<{ success: boolean; data?: { results?: RecentPredictionRow[] } }>(url);
      const raw = res?.data?.results ?? [];
      const now = Date.now();
      setResults(raw.filter(r => (typeof r.drawDateTimeMs !== 'number') || r.drawDateTimeMs <= now));
      setSelected(null);
    } catch {
      setResults([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }, [selectedPredictionId, selectedLotteryType]);

  // Initial load + refetch when user comes back to this tab (so admin changes/removals show)
  useEffect(() => {
    fetchRecent();
  }, [fetchRecent]);

  useEffect(() => {
    const onFocus = () => fetchRecent();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchRecent]);

  const formatDrawDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getLotteryLabel = (lotteryType: string) => {
    const key = (lotteryType || '').toLowerCase();
    return LOTTERY_NAMES[key] || { name: lotteryType, icon: '🎰' };
  };

  const getActualWinningNumbers = (actualResult: any, lotteryType: string) => {
    if (!actualResult) return null;
    const lt = (lotteryType || '').toLowerCase();
    
    if (lt === 'gopher5') {
      return actualResult.winningNumbersSingle && actualResult.winningNumbersSingle.length > 0 
        ? actualResult.winningNumbersSingle : null;
    }
    if (lt === 'pick3') {
      return actualResult.winningNumbersPick3 && actualResult.winningNumbersPick3.length > 0 
        ? actualResult.winningNumbersPick3 : null;
    }
    
    // For powerball, megamillion, lottoamerica
    if (actualResult.winningNumbers && 
        ((actualResult.winningNumbers.whiteBalls && actualResult.winningNumbers.whiteBalls.length > 0) || 
         (actualResult.winningNumbers.redBalls && actualResult.winningNumbers.redBalls.length > 0))) {
      return actualResult.winningNumbers;
    }
    
    return null;
  };

  const hasValidPrediction = (pred: OurPrediction | null | undefined): boolean => {
    if (!pred) return false;
    if (Array.isArray(pred)) return pred.length > 0;
    return (pred.whiteBalls && pred.whiteBalls.length > 0) || (pred.redBalls && pred.redBalls.length > 0) ? true : false;
  };

  const calculateAccuracy = (ourPrediction: OurPrediction | null | undefined, actualResult: any, lotteryType: string): number | null => {
    if (!ourPrediction || !actualResult || !hasValidPrediction(ourPrediction)) return null;

    let totalPredicted = 0;
    let mistakes = 0;
    let totalDrawn = 0;

    const isDoubleSelection = ['powerball', 'megamillion', 'lottoamerica'].includes(lotteryType.toLowerCase());

    if (isDoubleSelection) {
      const predWhite = (ourPrediction as any).whiteBalls || [];
      const predRed = (ourPrediction as any).redBalls || [];
      
      const actObj = getActualWinningNumbers(actualResult, lotteryType) || { whiteBalls: [], redBalls: [] };
      const actWhite = (actObj as any).whiteBalls || [];
      const actRed = (actObj as any).redBalls || [];

      totalPredicted = predWhite.length + predRed.length;
      totalDrawn = actWhite.length + actRed.length;
      
      if (totalPredicted === 0) return null;

      predWhite.forEach((num: number) => { if (actWhite.includes(num)) mistakes++; });
      predRed.forEach((num: number) => { if (actRed.includes(num)) mistakes++; });
    } else {
      const predArr = Array.isArray(ourPrediction) ? ourPrediction : [];
      const actArr = getActualWinningNumbers(actualResult, lotteryType) || [];

      totalPredicted = predArr.length;
      totalDrawn = Array.isArray(actArr) ? actArr.length : 0;
      
      if (totalPredicted === 0) return null;

      predArr.forEach((num: number) => { if (Array.isArray(actArr) && actArr.includes(num)) mistakes++; });
    }

    if (totalPredicted === 0) return null;

    // Use the max of total drawn numbers and total predicted numbers
    // This perfectly matches the requested formula:
    // 1 mistake out of 10 predicted -> 90% (base = 10)
    // 1 mistake out of 2 predicted against 5 drawn -> 80% (base = 5)
    const baseTotal = Math.max(totalPredicted, totalDrawn);
    if (baseTotal === 0) return 0;

    const correct = baseTotal - mistakes;
    return Math.max(0, Math.round((correct / baseTotal) * 100));
  };

  const renderOurPrediction = (ourPrediction: OurPrediction, lotteryType: string = '') => {
    if (!ourPrediction) return <span className="text-muted small">—</span>;
    
    const lt = (lotteryType || '').toLowerCase();
    
    let wLabel = 'Balls';
    let rLabel = 'Balls';

    if (lt === 'powerball') {
      rLabel = 'Powerballs';
    } else if (lt === 'lottoamerica') {
      rLabel = 'Star Balls';
    } else if (lt === 'megamillion') {
      rLabel = 'Mega Balls';
    }

    const isSpecial = ['powerball', 'megamillion', 'lottoamerica'].includes(lt);

    const wClass = 'bg-danger rounded-circle shadow-sm';
    const rClass = isSpecial ? 'bg-primary rounded-circle shadow-sm' : 'bg-danger rounded-circle shadow-sm';
    
    const ballStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      fontSize: '0.9rem',
      fontWeight: 'bold' as const,
      lineHeight: 1
    };

    if (Array.isArray(ourPrediction)) {
      return (
        <div>
          <span className="text-muted fw-bold d-block mb-1 text-center" style={{ fontSize: '0.75rem' }}>Balls</span>
          <div className="d-flex flex-wrap gap-2">
            {ourPrediction.map((n, i) => (
              <span key={i} className={`badge ${wClass}`} style={ballStyle}>{n}</span>
            ))}
          </div>
        </div>
      );
    }
    const w = ourPrediction.whiteBalls ?? [];
    const r = ourPrediction.redBalls ?? [];
    return (
      <div className="d-flex flex-wrap align-items-end gap-3">
        {w.length > 0 && (
          <div>
            <span className="text-muted fw-bold d-block mb-1 text-center" style={{ fontSize: '0.75rem' }}>{wLabel}</span>
            <div className="d-flex flex-wrap gap-2">
              {w.map((n, i) => (
                <span key={`w-${i}`} className={`badge ${wClass}`} style={ballStyle}>{n}</span>
              ))}
            </div>
          </div>
        )}
        {r.length > 0 && (
          <>
            <div className="d-flex align-items-center" style={{ height: '32px' }}>
              <span className="text-muted small fw-bold">+</span>
            </div>
            <div>
              <span className="text-muted fw-bold d-block mb-1 text-center" style={{ fontSize: '0.75rem' }}>{rLabel}</span>
              <div className="d-flex flex-wrap gap-2">
                {r.map((n, i) => (
                  <span key={`r-${i}`} className={`badge ${rClass}`} style={ballStyle}>{n}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Container className="py-4" style={{ marginTop: '4rem' }}>
      <div className="text-center mb-4">
        <h1 className="display-6 fw-bold gradient-text">
          {selectedLotteryType 
            ? `Past Predictions for ${LOTTERY_NAMES[selectedLotteryType.toLowerCase()]?.name || selectedLotteryType}` 
            : 'Past Predictions'}
        </h1>
        <div className="mt-4 mb-4 text-start p-4 rounded mx-auto text-muted" style={{ maxWidth: '800px', fontSize: '1.05rem', lineHeight: '1.6', backgroundColor: '#f8f9fa' }}>
          <p className="mb-3">
            The difficulties of winning in any lottery draw lies in the number of balls in the concern lottery pot/drum or machine. The more the balls, the lower the odds of winning. While the fewer the balls, the higher the odds of winning.
          </p>
          <p className="mb-3">
            Obyyo’s mission is to identify balls which based on analysis stand a lower probability of being drawn in the next draw of any lottery, thereby reducing the total number of balls in the lottery pot, and increasing the odds of winning.
          </p>
          <p className="mb-0 fw-medium text-dark">
            Here are the last 5 predictions of numbers which were determined to have a lower probability of being drawn on the concern lottery and date.
          </p>
        </div>
        {selectedPredictionId && (
          <div className="mt-2">
            <Link to="/announced-results" className="small text-decoration-none">
              <i className="bi bi-arrow-left me-1" />
              Back to list
            </Link>
          </div>
        )}
        <Button
          variant="outline-primary"
          size="sm"
          className="mt-2"
          onClick={() => fetchRecent()}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p className="mt-2 text-muted">Loading results...</p>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <Card.Body className="p-0">
            {selected ? (
              <ul className="list-unstyled mb-0">
                {(() => {
                  const { name, icon } = getLotteryLabel(selected.lotteryType);
                  const drawTimeLabel = selected.drawTime ? ` at ${selected.drawTime}` : '';
                  return (
                    <li key={selected.predictionId} className="px-4 py-4">
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                        <span className="fw-medium text-muted small">
                          {formatDrawDate(selected.drawDate)}{drawTimeLabel}
                        </span>
                        <span className="badge bg-light text-dark">
                          {icon} {name}
                        </span>
                      </div>
                      <div className="row g-2 small">
                        <div className="col-12">
                          <span className="text-muted fw-semibold d-block mb-1">Our predictions for numbers to avoid</span>
                          {renderOurPrediction(selected.ourPrediction ?? null, selected.lotteryType)}
                        </div>
                        {selected.actualResult && hasValidPrediction(getActualWinningNumbers(selected.actualResult, selected.lotteryType)) && (
                          <div className="col-12 mt-3 pt-3 border-top">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted fw-semibold d-block">Result</span>
                              {(() => {
                                const acc = calculateAccuracy(selected.ourPrediction, selected.actualResult, selected.lotteryType);
                                if (acc !== null) {
                                  return (
                                    <span className="badge bg-success">
                                      <i className="bi bi-bullseye me-1"></i>
                                      Accuracy: {acc}%
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            {renderOurPrediction(
                              getActualWinningNumbers(selected.actualResult, selected.lotteryType),
                              selected.lotteryType
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })()}
              </ul>
            ) : results.length === 0 ? (
              <p className="text-muted mb-0 p-4 text-center">No predictions found yet.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {results.map((result, idx) => {
                  const { name, icon } = getLotteryLabel(result.lotteryType);
                  const drawTimeLabel = result.drawTime ? ` at ${result.drawTime}` : '';
                  return (
                    <li
                      key={result.predictionId}
                      className={`px-4 py-4 ${idx < results.length - 1 ? 'border-bottom' : ''}`}
                      style={idx < results.length - 1 ? { borderColor: 'var(--bs-border-color)' } : undefined}
                    >
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                        <span className="fw-medium text-muted small">
                          {formatDrawDate(result.drawDate)}{drawTimeLabel}
                        </span>
                        <span className="badge bg-light text-dark">
                          {icon} {name}
                        </span>
                      </div>
                      <div className="row g-2 small">
                        <div className="col-12">
                          <span className="text-muted fw-semibold d-block mb-1">Our predictions for numbers to avoid</span>
                          {renderOurPrediction(result.ourPrediction ?? null, result.lotteryType)}
                        </div>
                        {result.actualResult && hasValidPrediction(getActualWinningNumbers(result.actualResult, result.lotteryType)) && (
                          <div className="col-12 mt-3 pt-3 border-top">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted fw-semibold d-block">Result</span>
                              {(() => {
                                const acc = calculateAccuracy(result.ourPrediction, result.actualResult, result.lotteryType);
                                if (acc !== null) {
                                  return (
                                    <span className="badge bg-success">
                                      <i className="bi bi-bullseye me-1"></i>
                                      Accuracy: {acc}%
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            {renderOurPrediction(
                              getActualWinningNumbers(result.actualResult, result.lotteryType),
                              result.lotteryType
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default AnnouncedResults;
