import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Spinner, Button } from 'react-bootstrap';
import { apiService } from '../../services/api';

const TOTAL_RESULTS = 5;

const LOTTERY_NAMES: Record<string, { name: string; icon: string }> = {
  powerball: { name: 'Powerball', icon: '⚡' },
  megamillion: { name: 'Mega Millions', icon: '💰' },
  lottoamerica: { name: 'Lotto America', icon: '🇺🇸' },
  gopher5: { name: 'Gopher 5', icon: '🎯' },
  pick3: { name: 'Pick 3', icon: '🎲' }
};

type OurPrediction = { whiteBalls?: number[]; redBalls?: number[] } | number[] | null;

interface Result {
  _id: string;
  lotteryType: string;
  drawDate: string;
  winningNumbers?: {
    whiteBalls?: number[];
    redBalls?: number[];
  };
  winningNumbersSingle?: number[];
  winningNumbersPick3?: number[];
  jackpot?: number;
  ourPrediction?: OurPrediction;
}

const AnnouncedResults: React.FC = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  const hasWinningNumbers = (result: Result) => {
    const w = result.winningNumbers?.whiteBalls?.length ?? 0;
    const r = result.winningNumbers?.redBalls?.length ?? 0;
    const s = (result.winningNumbersSingle?.length ?? 0);
    const p = (result.winningNumbersPick3?.length ?? 0);
    return w > 0 || r > 0 || s > 0 || p > 0;
  };

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiService.get<{ success: boolean; data?: { results?: Result[] } }>(
        `/admin/results/recent?limit=${TOTAL_RESULTS}`
      );
      const raw = res?.data?.results ?? [];
      setResults(raw.filter(hasWinningNumbers));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const renderNumbers = (
    whiteBalls?: number[],
    redBalls?: number[],
    single?: number[],
    pick3?: number[]
  ) => {
    if (whiteBalls?.length) {
      return (
        <div className="d-flex flex-wrap align-items-center gap-2">
          {whiteBalls.map((n, i) => (
            <span key={i} className="badge bg-primary px-2 py-1">{n}</span>
          ))}
          {redBalls?.length ? (
            <>
              <span className="text-muted small">+</span>
              {redBalls.map((n, i) => (
                <span key={i} className="badge bg-danger px-2 py-1">{n}</span>
              ))}
            </>
          ) : null}
        </div>
      );
    }
    if (single?.length) {
      return (
        <div className="d-flex flex-wrap gap-2">
          {single.map((n, i) => (
            <span key={i} className="badge bg-primary px-2 py-1">{n}</span>
          ))}
        </div>
      );
    }
    if (pick3?.length) {
      return (
        <div className="d-flex flex-wrap gap-2">
          {pick3.map((n, i) => (
            <span key={i} className="badge bg-primary px-2 py-1">{n}</span>
          ))}
        </div>
      );
    }
    return <span className="text-muted small">—</span>;
  };

  const renderOurPrediction = (ourPrediction: OurPrediction) => {
    if (!ourPrediction) return <span className="text-muted small">—</span>;
    if (Array.isArray(ourPrediction)) {
      return (
        <div className="d-flex flex-wrap gap-2">
          {ourPrediction.map((n, i) => (
            <span key={i} className="badge bg-secondary px-2 py-1">{n}</span>
          ))}
        </div>
      );
    }
    const w = ourPrediction.whiteBalls ?? [];
    const r = ourPrediction.redBalls ?? [];
    return (
      <div className="d-flex flex-wrap align-items-center gap-2">
        {w.map((n, i) => (
          <span key={i} className="badge bg-secondary px-2 py-1">{n}</span>
        ))}
        {r.length ? (
          <>
            <span className="text-muted small">+</span>
            {r.map((n, i) => (
              <span key={i} className="badge bg-dark px-2 py-1">{n}</span>
            ))}
          </>
        ) : null}
      </div>
    );
  };

  const renderWinningNumbers = (result: Result) => {
    return renderNumbers(
      result.winningNumbers?.whiteBalls,
      result.winningNumbers?.redBalls,
      result.winningNumbersSingle,
      result.winningNumbersPick3
    );
  };

  return (
    <Container className="py-4" style={{ marginTop: '4rem' }}>
      <div className="text-center mb-4">
        <h1 className="display-6 fw-bold gradient-text">Announced Results</h1>
        <p className="text-muted mb-0">
          Last {TOTAL_RESULTS} announced results. Shown only when a result has been added for an uploaded prediction — our prediction from that upload, result from what you added.
        </p>
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
            {results.length === 0 ? (
              <p className="text-muted mb-0 p-4 text-center">No results announced yet.</p>
            ) : (
              <ul className="list-unstyled mb-0">
                {results.map((result, idx) => {
                  const { name, icon } = getLotteryLabel(result.lotteryType);
                  return (
                    <li
                      key={result._id}
                      className={`px-4 py-4 ${idx < results.length - 1 ? 'border-bottom' : ''}`}
                      style={idx < results.length - 1 ? { borderColor: 'var(--bs-border-color)' } : undefined}
                    >
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                        <span className="fw-medium text-muted small">
                          {formatDrawDate(result.drawDate)}
                        </span>
                        <span className="badge bg-light text-dark">
                          {icon} {name}
                        </span>
                        {result.jackpot != null && result.jackpot > 0 && (
                          <span className="badge bg-success">${(result.jackpot / 1e6).toFixed(1)}M</span>
                        )}
                      </div>
                      <div className="row g-2 small">
                        <div className="col-12 col-md-6">
                          <span className="text-muted fw-semibold d-block mb-1">Our prediction</span>
                          {renderOurPrediction(result.ourPrediction ?? null)}
                        </div>
                        <div className="col-12 col-md-6">
                          <span className="text-muted fw-semibold d-block mb-1">Result</span>
                          {renderWinningNumbers(result)}
                        </div>
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
