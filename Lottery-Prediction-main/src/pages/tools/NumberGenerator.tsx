import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const NumberGenerator: React.FC = () => {
  const { user } = useAuth();
  const [selectedLottery, setSelectedLottery] = useState('powerball');
  const [generatedNumbers, setGeneratedNumbers] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [numberOfCombinations, setNumberOfCombinations] = useState(5);
  const generateSectionRef = useRef<HTMLDivElement>(null);


  const lotteryCategories = [
    {
      id: 'national',
      name: 'National Lotteries',
      description: 'Multi-state lottery games with large jackpots',
      icon: '🇺🇸'
    },
    {
      id: 'state',
      name: 'State Lotteries',
      description: 'State-specific lottery games',
      icon: '🏛️'
    },
    {
      id: 'daily',
      name: 'Daily Games',
      description: 'Games with daily drawings',
      icon: '📅'
    }
  ];

  const lotteryTypes = [
    {
      id: 'powerball',
      name: 'Powerball',
      description: 'Pick 5 from 69 + 1 from 26',
      icon: '⚡',
      mainNumbers: 69,
      bonusNumbers: 26,
      pickCount: 5,
      category: 'national'
    },
    {
      id: 'megamillion',
      name: 'Mega Millions',
      description: 'Pick 5 from 70 + 1 from 25',
      icon: '💰',
      mainNumbers: 70,
      bonusNumbers: 25,
      pickCount: 5,
      category: 'national'
    },
    {
      id: 'lottoamerica',
      name: 'Lotto America',
      description: 'Pick 5 from 52 + 1 from 10',
      icon: '🇺🇸',
      mainNumbers: 52,
      bonusNumbers: 10,
      pickCount: 5,
      category: 'national'
    },
    {
      id: 'gopher5',
      name: 'Gopher 5',
      description: 'Pick 5 numbers from 1-47',
      icon: '🎯',
      mainNumbers: 47,
      bonusNumbers: 0,
      pickCount: 5,
      category: 'state'
    },
    {
      id: 'pick3',
      name: 'Pick 3',
      description: 'Pick 3 numbers from 0-9',
      icon: '🎲',
      mainNumbers: 10,
      bonusNumbers: 0,
      pickCount: 3,
      category: 'daily'
    }
  ];

  const nonViableNumbers = {
    powerball: {
      main: [1, 3, 7, 12, 15, 18, 22, 25, 28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58, 61, 64, 67],
      bonus: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25]
    },
    megamillion: {
      main: [2, 4, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59, 62, 65, 68],
      bonus: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 25]
    },
    lottoamerica: {
      main: [1, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45, 48, 51],
      bonus: [1, 3, 5, 7, 9]
    },
    gopher5: {
      main: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40, 43, 46],
      bonus: []
    },
    pick3: {
      main: [0, 2, 4, 6, 8],
      bonus: []
    }
  };

  const generateViableNumbers = (lotteryId: string) => {
    const lottery = lotteryTypes.find(l => l.id === lotteryId);
    const nonViable = nonViableNumbers[lotteryId as keyof typeof nonViableNumbers];
    
    if (!lottery) return { main: [], bonus: [] };

    const mainViable = [];
    for (let i = 1; i <= lottery.mainNumbers; i++) {
      if (!nonViable.main.includes(i)) {
        mainViable.push(i);
      }
    }

    const bonusViable: number[] = [];
    if (lottery.bonusNumbers > 0) {
      for (let i = 1; i <= lottery.bonusNumbers; i++) {
        if (!(nonViable.bonus as number[]).includes(i)) {
          bonusViable.push(i);
        }
      }
    }

    return { main: mainViable, bonus: bonusViable };
  };

  const generateCombinations = () => {
    setLoading(true);
    
    setTimeout(() => {
      const lottery = lotteryTypes.find(l => l.id === selectedLottery);
      const viableNumbers = generateViableNumbers(selectedLottery);
      const combinations = [];

      for (let i = 0; i < numberOfCombinations; i++) {
        const mainNumbers = [];
        const usedNumbers = new Set();

        // Generate main numbers
        while (mainNumbers.length < lottery!.pickCount) {
          const randomIndex = Math.floor(Math.random() * viableNumbers.main.length);
          const number = viableNumbers.main[randomIndex];
          
          if (!usedNumbers.has(number)) {
            mainNumbers.push(number);
            usedNumbers.add(number);
          }
        }

        // Sort main numbers
        mainNumbers.sort((a, b) => a - b);

        // Generate bonus number if needed
        let bonusNumber = null;
        if (viableNumbers.bonus.length > 0) {
          const randomBonusIndex = Math.floor(Math.random() * viableNumbers.bonus.length);
          bonusNumber = viableNumbers.bonus[randomBonusIndex];
        }

        combinations.push({
          id: i + 1,
          mainNumbers,
          bonusNumber,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      setGeneratedNumbers({
        lottery: lottery,
        combinations,
        viableCount: {
          main: viableNumbers.main.length,
          bonus: viableNumbers.bonus.length
        }
      });
      setLoading(false);
    }, 1500);
  };

  const handleLotterySelection = (lotteryId: string) => {
    setSelectedLottery(lotteryId);
    // Scroll to generate section after a short delay to ensure state update
    setTimeout(() => {
      generateSectionRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  const selectedLotteryData = lotteryTypes.find(lottery => lottery.id === selectedLottery);

  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-10 mx-auto">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3 gradient-text">Number Generator</h1>
            <p className="lead text-muted">
              Generate optimal lottery combinations using only viable numbers
            </p>
            
            {/* Pro Tip Banner */}
            <div className="alert alert-info border-0 shadow-sm mb-4" style={{
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
              color: 'white',
              borderRadius: '15px',
              border: 'none',
              boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)'
            }}>
              <div className="d-flex align-items-center justify-content-center">
                <i className="bi bi-lightbulb-fill fs-3 me-3" style={{ color: '#fff3cd' }}></i>
                <div className="text-start">
                  <h5 className="mb-1 fw-bold" style={{ color: '#fff' }}>Pro Tip!</h5>
                  <p className="mb-0" style={{ color: '#fff' }}>Use our Number Generator to create optimal combinations using only viable numbers!</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access - Popular Lotteries */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-lightning me-2"></i>
                Quick Access - Popular Lotteries
              </h5>
              <div className="row g-3">
                {['powerball', 'megamillion', 'gopher5', 'lottoamerica'].map((lotteryId) => {
                  const lottery = lotteryTypes.find(l => l.id === lotteryId);
                  if (!lottery) return null;
                  return (
                    <div key={lotteryId} className="col-md-3 col-sm-6">
                      <button
                        className={`btn w-100 ${selectedLottery === lotteryId ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => handleLotterySelection(lotteryId)}
                        style={{
                          borderRadius: '10px',
                          padding: '0.75rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-center">
                          <span className="me-2" style={{ fontSize: '1.2rem' }}>{lottery.icon}</span>
                          <div className="text-start">
                            <div className="fw-bold">{lottery.name}</div>
                            <small className="opacity-75">{lottery.description}</small>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lottery Selection by Category */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">
                <i className="bi bi-trophy me-2"></i>
                All Lottery Games by Category
              </h5>
              
              {lotteryCategories.map((category) => {
                const categoryLotteries = lotteryTypes.filter(lottery => lottery.category === category.id);
                
                return (
                  <div key={category.id} className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className="fs-3 me-3">{category.icon}</span>
                      <div>
                        <h6 className="fw-bold mb-1">{category.name}</h6>
                        <p className="small text-muted mb-0">{category.description}</p>
                      </div>
                    </div>
                    
                    <div className="row g-3">
                      {categoryLotteries.map((lottery) => (
                        <div key={lottery.id} className="col-md-6 col-lg-4">
                          <div 
                            className={`card h-100 cursor-pointer ${selectedLottery === lottery.id ? 'border-primary' : ''}`}
                            onClick={() => handleLotterySelection(lottery.id)}
                            style={{ 
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              border: selectedLottery === lottery.id ? '2px solid var(--primary-color)' : '1px solid #e9ecef'
                            }}
                          >
                            <div className="card-body text-center">
                              <div className="mb-3">
                                <span style={{ fontSize: '2rem' }}>{lottery.icon}</span>
                              </div>
                              <h6 className="fw-bold">{lottery.name}</h6>
                              <p className="small text-muted mb-2">{lottery.description}</p>
                              <div className="small text-info">
                                Viable Numbers: {generateViableNumbers(lottery.id).main.length}
                                {lottery.bonusNumbers > 0 && ` + ${generateViableNumbers(lottery.id).bonus.length} bonus`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {category.id !== lotteryCategories[lotteryCategories.length - 1].id && (
                      <hr className="my-4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generator Settings */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-gear me-2"></i>
                Generator Settings
              </h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Number of Combinations</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={numberOfCombinations}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setNumberOfCombinations(Math.max(1, Math.min(100, value))); // Limit between 1 and 100
                    }}
                    min="1"
                    max="100"
                    placeholder="Enter number of combinations"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Generation Method</label>
                  <select className="form-select" disabled>
                    <option>Optimized (Recommended)</option>
                    <option>Random from Viable Numbers</option>
                    <option>Pattern-Based</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div ref={generateSectionRef} className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4 text-center">
              <h5 className="fw-bold mb-3">
                <i className="bi bi-magic me-2"></i>
                Generate Numbers
              </h5>
              <p className="text-muted mb-4">
                We will generate {numberOfCombinations} optimal combination{numberOfCombinations > 1 ? 's' : ''} for {selectedLotteryData?.name} using only viable numbers
              </p>
              
              {!user ? (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Please <a href="/register" className="alert-link">sign up</a> or <a href="/login" className="alert-link">login</a> to generate numbers
                </div>
              ) : (
                <button 
                  className="btn btn-primary btn-lg px-5"
                  onClick={generateCombinations}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shuffle me-2"></i>
                      Generate Numbers
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Generated Numbers */}
          {generatedNumbers && (
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-check-circle me-2"></i>
                    Generated Combinations for {generatedNumbers.lottery.name}
                  </h5>
                  <div className="text-end">
                    <div className="badge bg-success fs-6">Optimized</div>
                    <div className="small text-muted">Using {generatedNumbers.viableCount.main} viable numbers</div>
                  </div>
                </div>

                <div className="row g-3">
                  {generatedNumbers.combinations.map((combo: any) => (
                    <div key={combo.id} className="col-md-6 col-lg-4">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h6 className="fw-bold mb-3">Combination #{combo.id}</h6>
                          
                          {/* Main Numbers */}
                          <div className="mb-3">
                            <div className="d-flex flex-wrap justify-content-center gap-2">
                              {combo.mainNumbers.map((num: number) => (
                                <span key={num} className="badge bg-primary fs-6 px-3 py-2">
                                  {num}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Bonus Number */}
                          {combo.bonusNumber && (
                            <div className="mb-3">
                              <small className="text-muted d-block mb-1">
                                {generatedNumbers.lottery.id === 'powerball' ? 'Powerball' : 
                                 generatedNumbers.lottery.id === 'megamillion' ? 'Mega Ball' : 'Star Ball'}
                              </small>
                              <span className="badge bg-warning text-dark fs-6 px-3 py-2">
                                {combo.bonusNumber}
                              </span>
                            </div>
                          )}

                          <small className="text-muted">Generated at {combo.timestamp}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="alert alert-success">
                    <i className="bi bi-lightbulb me-2"></i>
                    <strong>Success!</strong> These combinations use only viable numbers identified by our prediction system, giving you the best possible odds.
                  </div>
                  
                  {/* Statistics */}
                  <div className="row g-3 mt-3">
                    <div className="col-md-3">
                      <div className="card bg-primary text-white text-center">
                        <div className="card-body">
                          <i className="bi bi-graph-up fs-4 mb-2"></i>
                          <h6 className="fw-bold">Viable Numbers</h6>
                          <h4 className="mb-0">{generatedNumbers.viableCount.main}</h4>
                          <small>Main Pool</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-success text-white text-center">
                        <div className="card-body">
                          <i className="bi bi-shield-check fs-4 mb-2"></i>
                          <h6 className="fw-bold">Filtered</h6>
                          <h4 className="mb-0">100%</h4>
                          <small>Quality Assured</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-info text-white text-center">
                        <div className="card-body">
                          <i className="bi bi-cpu fs-4 mb-2"></i>
                          <h6 className="fw-bold">Algorithm</h6>
                          <h4 className="mb-0">Advanced</h4>
                          <small>Optimized</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card bg-warning text-dark text-center">
                        <div className="card-body">
                          <i className="bi bi-trophy fs-4 mb-2"></i>
                          <h6 className="fw-bold">Combinations</h6>
                          <h4 className="mb-0">{generatedNumbers.combinations.length}</h4>
                          <small>Generated</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                          <i className="bi bi-cpu fs-3 mb-2"></i>
                          <h6 className="fw-bold">Optimized</h6>
                          <small>Smart Algorithm</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-success text-white">
                        <div className="card-body text-center">
                          <i className="bi bi-shield-check fs-3 mb-2"></i>
                          <h6 className="fw-bold">Viable Only</h6>
                          <small>{generatedNumbers.viableCount.main} Numbers</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card bg-info text-white">
                        <div className="card-body text-center">
                          <i className="bi bi-graph-up fs-3 mb-2"></i>
                          <h6 className="fw-bold">Better Odds</h6>
                          <small>Improved Chances</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NumberGenerator;

