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
}

const AnnouncedResults: React.FC = () => {
  const [results, setResults] = useState<RecentPredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const selectedPredictionId = searchParams.get('predictionId');
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

      const res = await apiService.get<{ success: boolean; data?: { results?: RecentPredictionRow[] } }>(
        `/admin/results/recent?limit=${TOTAL_RESULTS}`
      );
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
  }, [selectedPredictionId]);

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

  return (
    <Container className="py-4" style={{ marginTop: '4rem' }}>
      <div className="text-center mb-4">
        <h1 className="display-6 fw-bold gradient-text">Announced Results</h1>
        <p className="text-muted mb-0">
          Last {TOTAL_RESULTS} uploaded predictions.
        </p>
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
                          <span className="text-muted fw-semibold d-block mb-1">Our prediction</span>
                          {renderOurPrediction(selected.ourPrediction ?? null)}
                        </div>
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
                          <span className="text-muted fw-semibold d-block mb-1">Our prediction</span>
                          {renderOurPrediction(result.ourPrediction ?? null)}
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
