import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Home: React.FC = () => {
  const { user, canStartTrial } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Hero slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 4); // 4 slides total
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Update active slide based on currentSlide state
  useEffect(() => {
    const slides = document.querySelectorAll('.hero-slide');
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentSlide);
    });
  }, [currentSlide]);

  // Scroll-triggered animations for pricing and how it works sections
  useEffect(() => {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Find elements within the observed section
          const leftElements = entry.target.querySelectorAll('.fade-in-left');
          const rightElements = entry.target.querySelectorAll('.fade-in-right');
          
          leftElements.forEach(element => {
            element.classList.add('animate');
          });
          
          rightElements.forEach(element => {
            element.classList.add('animate');
          });
        }
      });
    }, observerOptions);

    // Observe both pricing and how it works sections
    const pricingSection = document.getElementById('pricing');
    const howItWorksSection = document.getElementById('how-it-works');
    
    if (pricingSection) {
      observer.observe(pricingSection);
    }
    if (howItWorksSection) {
      observer.observe(howItWorksSection);
    }

    return () => {
      if (pricingSection) {
        observer.unobserve(pricingSection);
      }
      if (howItWorksSection) {
        observer.unobserve(howItWorksSection);
      }
    };
  }, []);

  const lotteryTypes = [
    {
      type: 'gopher5',
      name: 'Gopher 5',
      state: 'Minnesota',
      description: 'Pick 5 numbers from 1-47',
      price: 1,
      icon: '🎯'
    },
    {
      type: 'pick3',
      name: 'Pick 3',
      state: 'Minnesota',
      description: 'Pick 3 numbers from 0-9',
      price: 1,
      icon: '🎲'
    },
    {
      type: 'lottoamerica',
      name: 'Lotto America',
      state: 'USA',
      description: 'Pick 5 from 52 + 1 from 10',
      price: 1,
      icon: '🎯'
    },
    {
      type: 'megamillion',
      name: 'Mega Million',
      state: 'USA',
      description: 'Pick 5 from 70 + 1 from 25',
      price: 5,
      icon: '💰'
    },
    {
      type: 'powerball',
      name: 'Powerball',
      state: 'USA',
      description: 'Pick 5 from 69 + 1 from 26',
      price: 2,
      icon: '⚡'
    }
  ];

  const features = [
    {
      icon: 'bi-target',
      title: '95%+ Accuracy Rate',
      description: 'Our advanced prediction system analyzes historical data and patterns to identify non-viable numbers with exceptional precision.',
      color: 'primary'
    },
    {
      icon: 'bi-credit-card',
      title: 'Flexible Pricing',
      description: 'Pay-per-prediction model with no hidden fees or subscriptions. Only pay for what you use, when you need it.',
      color: 'success'
    },
    {
      icon: 'bi-phone',
      title: 'Instant Notifications',
      description: 'Receive real-time alerts when new predictions are available for your selected lottery games.',
      color: 'info'
    },
    {
      icon: 'bi-shield-check',
      title: 'Bank-Level Security',
      description: 'Your personal data and payment information are protected with enterprise-grade encryption and security protocols.',
      color: 'warning'
    },
    {
      icon: 'bi-cpu',
      title: 'Smart Number Generator',
      description: 'Our advanced algorithm generates optimal number combinations from viable numbers.',
      color: 'secondary'
    },
    {
      icon: 'bi-graph-up',
      title: 'Performance Analytics',
      description: 'Track prediction accuracy, success rates, and lottery results with detailed analytics and insights.',
      color: 'danger'
    }
  ];

  /*
  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      title: 'Financial Analyst',
      location: 'Minneapolis, MN',
      text: 'Obyyo\'s prediction accuracy has been remarkable. I\'ve seen a 40% improvement in my lottery success rate since using their service. The data-driven approach is exactly what I needed.',
      rating: 5,
      avatar: 'SJ'
    },
    {
      name: 'Michael Chen',
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      text: 'The real-time notifications and analytics dashboard are game-changers. I can track my performance and make informed decisions. The ROI has been exceptional.',
      rating: 5,
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      title: 'Business Owner',
      location: 'Austin, TX',
      text: 'As a business owner, I appreciate the transparency and reliability. Obyyo has helped me optimize my lottery strategy with their advanced number generation algorithms.',
      rating: 5,
      avatar: 'ER'
    },
    {
      name: 'David Thompson',
      title: 'Investment Advisor',
      location: 'New York, NY',
      text: 'The security and professionalism of the platform is outstanding. My clients trust the service, and the results speak for themselves.',
      rating: 5,
      avatar: 'DT'
    }
  ];
  */

  return (
    <div className="home-page">
      <style>{`
        /* Swiper pagination styling */
        .swiper-pagination-custom .swiper-pagination-bullet {
          background-color: #d1d5db !important;
          opacity: 1 !important;
          width: 12px !important;
          height: 12px !important;
          margin: 0 6px !important;
          transition: all 0.3s ease !important;
        }
        
        .swiper-pagination-custom .swiper-pagination-bullet-active {
          background-color: #3b82f6 !important;
          transform: scale(1.2) !important;
        }
        
        /* Enhanced lottery card styling */
        .enhanced-lottery-card {
          cursor: pointer;
        }
        
        .enhanced-lottery-card:hover {
          transform: translateY(-8px) !important;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15), 0 10px 30px rgba(0, 0, 0, 0.1) !important;
        }
        
        .enhanced-lottery-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        
        .enhanced-lottery-card:hover::before {
          opacity: 1;
        }
        
        .lottery-emoji {
          font-size: 2.5rem;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
          transition: transform 0.3s ease;
        }
        
        .enhanced-lottery-card:hover .lottery-emoji {
          transform: scale(1.1) rotate(5deg);
        }
        
        .lottery-name-enhanced {
          font-size: 1.4rem;
          font-weight: 700;
          background: linear-gradient(135deg, #1e293b 0%, #3b82f6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
        }
        
        .lottery-state-enhanced {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }
        
        .lottery-description-enhanced {
          color: #475569;
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        
        .lottery-price-enhanced {
          font-size: 1.8rem;
          font-weight: 800;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
      {/* Snooker Balls Light Effect Background */}
      {/* <div className="snooker-balls-bg">
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
        <div className="snooker-ball"></div>
      </div> */}
      {/* New Single Column Hero Section */}
      <section id="home" className="hero-section-new">
        <div className="hero-background">
          <div className="hero-slide hero-slide-1 active"></div>
          <div className="hero-slide hero-slide-2"></div>
          <div className="hero-slide hero-slide-3"></div>
          <div className="hero-slide hero-slide-4"></div>
          <div className="hero-overlay"></div>
                    </div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-6 text-center">
              <div className="hero-content-new">
                <h1 className="hero-title-new fade-in">
                  Advanced Lottery Prediction Technology
                    </h1>
                <p className="hero-subtitle-new fade-in animate-delay-1">
                  Leverage advanced analytics and algorithms to identify non-viable numbers with 95%+ accuracy. 
                  Join over 50,000 professionals who trust Obyyo for data-driven lottery strategies.
                    </p>
                <div className="d-flex flex-wrap gap-3 justify-content-center mb-5 fade-in animate-delay-2">
                      {user ? (
                    <Link to="/dashboard" className="btn btn-primary btn-lg px-5 hover-lift">
                          <i className="bi bi-speedometer2 me-2"></i>
                      Go to Dashboard
                        </Link>
                      ) : (
                        <>
                          {canStartTrial() ? (
                        <Link to="/register" className="btn btn-primary btn-lg px-5 hover-lift">
                              <i className="bi bi-rocket-takeoff me-2"></i>
                          Start Free Trial
                            </Link>
                          ) : (
                        <Link to="/pricing" className="btn btn-primary btn-lg px-5 hover-lift">
                              <i className="bi bi-credit-card me-2"></i>
                          View Pricing
                            </Link>
                          )}
                      <Link to="/how-it-works" className="btn btn-secondary btn-lg px-4 hover-lift">
                            <i className="bi bi-question-circle me-2"></i>
                            How It Works
                          </Link>
                        </>
                      )}
                        </div>

                            </div>
                            </div>
                            </div>
        </div>
      </section>

      {/* Enhanced Lottery Types Section with Swiper */}
      <section className="py-5 enhanced-lottery-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3 text-dark">Supported Lotteries</h2>
            <p className="lead text-muted mb-4">
              Choose from our comprehensive list of lottery predictions with advanced analysis
            </p>
            
          </div>
          
          <div className="lottery-swiper-container">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20}
              slidesPerView={1}
              navigation={{
                nextEl: '.swiper-button-next-custom',
                prevEl: '.swiper-button-prev-custom',
              }}
              pagination={{
                clickable: true,
                el: '.swiper-pagination-custom',
              }}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              breakpoints={{
                640: {
                  slidesPerView: 1.1,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 1.3,
                  spaceBetween: 25,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 20,
                },
              }}
              loop={true}
              className="lottery-swiper"
            >
              {lotteryTypes.map((lottery, index) => (
                <SwiperSlide key={lottery.type}>
                  <div className="enhanced-lottery-card h-100 fade-in" style={{ 
                    animationDelay: `${index * 0.1}s`,
                    boxShadow: '0 15px 40px rgba(0, 0, 0, 0.12), 0 5px 20px rgba(0, 0, 0, 0.08)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Card Header with Gradient */}
                    <div className="card-header-gradient">
                      <div className="lottery-icon-enhanced">
                        <span className="lottery-emoji">{lottery.icon}</span>
                        <div className="icon-glow"></div>
                    </div>
                      <div className="popular-badge">
                        <i className="bi bi-star-fill"></i>
                        Popular
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div className="card-content">
                      <h4 className="lottery-name-enhanced">{lottery.name}</h4>
                      <p className="lottery-state-enhanced">
                        <i className="bi bi-geo-alt-fill me-1"></i>
                        {lottery.state}
                      </p>
                      <p className="lottery-description-enhanced">{lottery.description}</p>
                      
                    </div>
                    
                    {/* Card Footer */}
                    <div className="card-footer-enhanced">
                      <div className="price-section">
                        <span className="price-label">Starting from</span>
                        <span className="lottery-price-enhanced">${lottery.price}</span>
                        <span className="price-unit">/prediction</span>
                      </div>
                      <Link 
                        to={`/predictions?lottery=${lottery.type}`}
                        className="btn hover-lift"
                        style={{
                          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
                          border: 'none',
                          color: 'white',
                          fontWeight: '600',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '12px',
                          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <i className="bi bi-arrow-right me-2"></i>
                        Get Predictions
                        <i className="bi bi-lightning-fill ms-2"></i>
                      </Link>
                    </div>
                    
                    {/* Hover Effects */}
                    <div className="card-hover-overlay"></div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
            
            {/* Enhanced Navigation Buttons */}
            <div className="swiper-button-prev-custom enhanced-nav-btn">
              <i className="bi bi-chevron-left"></i>
            </div>
            <div className="swiper-button-next-custom enhanced-nav-btn">
              <i className="bi bi-chevron-right"></i>
            </div>
            
            {/* Enhanced Pagination */}
            <div className="swiper-pagination-custom enhanced-pagination"></div>
          </div>
          
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="py-5" style={{ backgroundColor: '#f8fafc', display: 'none' }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2 className="display-5 fw-bold mb-2 gradient-text">Why Choose Obyyo?</h2>
            <p className="lead text-muted">
              Advanced prediction technology designed to maximize your winning potential
            </p>
          </div>
          <div className="row g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <div className="feature-item-clean fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="feature-icon-clean mb-3">
                    <div className="icon-wrapper-clean d-inline-flex align-items-center justify-content-center rounded-circle"
                           style={{ 
                             width: '70px', 
                             height: '70px',
                           background: `linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)`,
                           border: '1px solid rgba(99, 102, 241, 0.15)',
                           position: 'relative',
                           overflow: 'hidden'
                           }}>
                      <i className={`${feature.icon} text-primary fs-3`} style={{ 
                        zIndex: 2,
                        position: 'relative'
                      }}></i>
                      </div>
                    </div>
                  <h5 className="fw-bold mb-2 text-dark">{feature.title}</h5>
                    <p className="text-muted lh-lg">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section */}
      <section id="how-it-works" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3 text-dark">How It Works</h2>
            <p className="lead text-muted">
              Simple steps to start improving your lottery odds
            </p>
          </div>
          <div className="row g-4 align-items-center">
            {/* How It Works Steps - Right Side */}
            <div className="col-lg-8">
              <div className="detailed-steps fade-in-right">
          <div className="row g-4 justify-content-center">
                  {/* Step 1: Free Trial */}
                  <div className="col-lg-5 col-md-6">
                    <div className="enhanced-step-item h-100" style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      boxShadow: '0 12px 35px rgba(59, 130, 246, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Background Pattern */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none'
                      }}></div>
                      
                      <div className="step-header d-flex align-items-center mb-3" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="step-number me-3 d-flex align-items-center justify-content-center rounded-circle" 
                       style={{ 
                               width: '50px', 
                               height: '50px', 
                               minWidth: '50px',
                               minHeight: '50px',
                               borderRadius: '50%',
                               background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                               color: 'white',
                               fontSize: '1.2rem',
                               fontWeight: 'bold',
                               lineHeight: '1',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               boxShadow: '0 6px 20px rgba(59, 130, 246, 0.3)',
                               position: 'relative'
                             }}>
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            borderRadius: '50%',
                            zIndex: -1,
                            opacity: 0.3,
                            animation: 'pulse 2s infinite'
                          }}></div>
                          1
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '1.1rem' }}>7-Day Free Trial</h5>
                          <p className="text-muted mb-0" style={{ fontSize: '0.8rem', fontWeight: '500' }}>User Acquisition Strategy</p>
                        </div>
                      </div>
                      <div className="step-content" style={{ position: 'relative', zIndex: 2 }}>
                        <ul className="list-unstyled mb-0" style={{ fontSize: '0.8rem' }}>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-check text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Register with phone number</span>
                          </li>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-check text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Select one lottery from available options</span>
                          </li>
                          <li className="mb-0 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-check text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Receive daily free predictions for 7 days</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Pay-Per-Use */}
                  <div className="col-lg-5 col-md-6">
                    <div className="enhanced-step-item h-100" style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(220, 38, 38, 0.1)',
                      boxShadow: '0 12px 35px rgba(220, 38, 38, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Background Pattern */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none'
                      }}></div>
                      
                      <div className="step-header d-flex align-items-center mb-3" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="step-number me-3 d-flex align-items-center justify-content-center rounded-circle" 
                             style={{ 
                               width: '50px', 
                               height: '50px', 
                               minWidth: '50px',
                               minHeight: '50px',
                               borderRadius: '50%',
                               background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                               color: 'white',
                               fontSize: '1.2rem',
                               fontWeight: 'bold',
                               lineHeight: '1',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               boxShadow: '0 6px 20px rgba(220, 38, 38, 0.3)',
                               position: 'relative'
                             }}>
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            borderRadius: '50%',
                            zIndex: -1,
                            opacity: 0.3,
                            animation: 'pulse 2s infinite'
                          }}></div>
                          2
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '1.1rem' }}>Pay-Per-Prediction</h5>
                          <p className="text-muted mb-0" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Monetization Model</p>
                        </div>
                      </div>
                      <div className="step-content" style={{ position: 'relative', zIndex: 2 }}>
                        <ul className="list-unstyled mb-0" style={{ fontSize: '0.8rem' }}>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-currency-dollar text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Cost equals one lottery line (e.g., $1 for Lotto America)</span>
                          </li>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-credit-card text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Two payment options: Pay-per-use or Preload wallet</span>
                          </li>
                          <li className="mb-0 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-shield-check text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Pricing tied to official lottery line costs</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Customer Workflow */}
                  <div className="col-lg-5 col-md-6">
                    <div className="enhanced-step-item h-100" style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(5, 150, 105, 0.1)',
                      boxShadow: '0 12px 35px rgba(5, 150, 105, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Background Pattern */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle, rgba(5, 150, 105, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none'
                      }}></div>
                      
                      <div className="step-header d-flex align-items-center mb-3" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="step-number me-3 d-flex align-items-center justify-content-center rounded-circle" 
                             style={{ 
                               width: '50px', 
                               height: '50px', 
                               minWidth: '50px',
                               minHeight: '50px',
                               borderRadius: '50%',
                               background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                               color: 'white',
                               fontSize: '1.2rem',
                               fontWeight: 'bold',
                               lineHeight: '1',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               boxShadow: '0 6px 20px rgba(5, 150, 105, 0.3)',
                               position: 'relative'
                             }}>
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                            borderRadius: '50%',
                            zIndex: -1,
                            opacity: 0.3,
                            animation: 'pulse 2s infinite'
                          }}></div>
                          3
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '1.1rem' }}>Access Predictions</h5>
                          <p className="text-muted mb-0" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Customer Workflow</p>
                        </div>
                      </div>
                      <div className="step-content" style={{ position: 'relative', zIndex: 2 }}>
                        <ul className="list-unstyled mb-0" style={{ fontSize: '0.8rem' }}>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-list-ul text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Select lottery from dropdown menu</span>
                          </li>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-file-text text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Read & accept legal disclaimer</span>
                          </li>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-credit-card text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Complete payment (balance or direct)</span>
                          </li>
                          <li className="mb-0 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-graph-up text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Access prediction instantly</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Value Proposition */}
                  <div className="col-lg-5 col-md-6">
                    <div className="enhanced-step-item h-100" style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      border: '1px solid rgba(124, 58, 237, 0.1)',
                      boxShadow: '0 12px 35px rgba(124, 58, 237, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Background Pattern */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.05) 0%, transparent 70%)',
                        borderRadius: '50%',
                        pointerEvents: 'none'
                      }}></div>
                      
                      <div className="step-header d-flex align-items-center mb-3" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="step-number me-3 d-flex align-items-center justify-content-center rounded-circle" 
                             style={{ 
                               width: '50px', 
                               height: '50px', 
                               minWidth: '50px',
                               minHeight: '50px',
                               borderRadius: '50%',
                               background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                               color: 'white',
                               fontSize: '1.2rem',
                               fontWeight: 'bold',
                               lineHeight: '1',
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               boxShadow: '0 6px 20px rgba(124, 58, 237, 0.3)',
                               position: 'relative'
                             }}>
                          <div style={{
                            position: 'absolute',
                            top: '-2px',
                            left: '-2px',
                            right: '-2px',
                            bottom: '-2px',
                            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                            borderRadius: '50%',
                            zIndex: -1,
                            opacity: 0.3,
                            animation: 'pulse 2s infinite'
                          }}></div>
                          4
                        </div>
                        <div>
                          <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '1.1rem' }}>Improve Your Odds</h5>
                          <p className="text-muted mb-0" style={{ fontSize: '0.8rem', fontWeight: '500' }}>Value Proposition</p>
                        </div>
                      </div>
                      <div className="step-content" style={{ position: 'relative', zIndex: 2 }}>
                        <ul className="list-unstyled mb-0" style={{ fontSize: '0.8rem' }}>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-exclamation-triangle text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Avoid "low vibration" numbers that waste money</span>
                          </li>
                          <li className="mb-2 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-graph-up-arrow text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Focus on higher probability number combinations</span>
                          </li>
                          <li className="mb-0 d-flex align-items-start">
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '10px',
                              flexShrink: 0,
                              marginTop: '2px'
                            }}>
                              <i className="bi bi-trophy text-white" style={{ fontSize: '0.7rem' }}></i>
                            </div>
                            <span style={{ color: '#374151', lineHeight: '1.4' }}>Maximize your lottery investment potential</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* iPhone Mockup - Left Side */}
            <div className="col-lg-4">
              <div className="iphone-mockup fade-in-left">
                <div className="iphone-frame">
                  <div className="iphone-screen">
                    <div className="how-it-works-slider">
                      <div className="how-it-works-slide active">
                        <div className="slide-icon">
                          <i className="bi bi-person-plus"></i>
                        </div>
                        <div className="slide-title">Sign Up</div>
                        <div className="slide-description">Create your free account and select your preferred lottery for a 7-day trial.</div>
                        <div className="slide-step">Step 1</div>
                      </div>
                      <div className="how-it-works-slide">
                        <div className="slide-icon">
                          <i className="bi bi-graph-up"></i>
                        </div>
                        <div className="slide-title">Get Predictions</div>
                        <div className="slide-description">Receive daily predictions showing non-viable numbers to avoid.</div>
                        <div className="slide-step">Step 2</div>
                      </div>
                      <div className="how-it-works-slide">
                        <div className="slide-icon">
                          <i className="bi bi-shuffle"></i>
                        </div>
                        <div className="slide-title">Generate Numbers</div>
                        <div className="slide-description">Use our number generator to create winning combinations from viable numbers.</div>
                        <div className="slide-step">Step 3</div>
                      </div>
                      <div className="how-it-works-slide">
                        <div className="slide-icon">
                          <i className="bi bi-trophy"></i>
                        </div>
                        <div className="slide-title">Win More</div>
                        <div className="slide-description">Play smarter with higher probability numbers and improve your winning odds.</div>
                        <div className="slide-step">Step 4</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Professional Pricing Section */}
      <section id="pricing" className="py-5" style={{ 
        paddingTop: '6rem'
      }}>
        
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="text-center mb-4" style={{ paddingTop: '3rem' }}>
            <h2 className="display-5 fw-bold mb-2 text-dark">Transparent Pricing</h2>
            <p className="lead text-muted">
              Choose the plan that fits your needs. No hidden fees, no long-term commitments.
            </p>
          </div>
          <div className="row g-4 align-items-center justify-content-center">
            {/* Starter Plan - Left Side */}
            <div className="col-lg-4 col-md-6 mb-4">
              <div className="card border-0 h-100 fade-in-right pricing-card-enhanced" style={{ 
                background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12), 0 12px 35px rgba(99, 102, 241, 0.15)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(20px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="card-body p-3 text-center">
                  <div className="plan-header mb-2">
                    <div className="plan-icon mb-2">
                      <div className="pricing-icon-enhanced" style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #3b82f6 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%)',
                          pointerEvents: 'none'
                        }}></div>
                        <i className="bi bi-lightning text-white fs-3" style={{ 
                          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
                          zIndex: 2,
                          position: 'relative'
                        }}></i>
                      </div>
                    </div>
                    <h5 className="fw-bold mb-1">Starter Plan</h5>
                    <p className="text-muted mb-0 small">Pay as you go - Simple and transparent</p>
                  </div>
                  
                  <div className="pricing mb-2">
                    <div className="pricing-badge mb-1">
                      <span className="badge bg-gradient-primary text-white px-3 py-2 rounded-pill fw-semibold">
                        Most Popular
                      </span>
                    </div>
                    <div className="d-flex align-items-baseline justify-content-center">
                      <span className="display-6 fw-bold pricing-price" style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>$1 - $5</span>
                      <span className="text-muted ms-1 small fw-semibold">/prediction</span>
                    </div>
                  </div>

                  <div className="features mb-3">
                    <div className="row g-3">
                      <div className="col-6">
                        <div className="feature-item-enhanced text-center p-2 rounded-3" style={{
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.3s ease'
                        }}>
                          <i className="bi bi-check2-circle text-success fs-5 mb-1 d-block"></i>
                          <span className="small fw-semibold">95%+ accuracy</span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="feature-item-enhanced text-center p-2 rounded-3" style={{
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.3s ease'
                        }}>
                          <i className="bi bi-check2-circle text-success fs-5 mb-1 d-block"></i>
                          <span className="small fw-semibold">All lottery types</span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="feature-item-enhanced text-center p-2 rounded-3" style={{
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.3s ease'
                        }}>
                          <i className="bi bi-check2-circle text-success fs-5 mb-1 d-block"></i>
                          <span className="small fw-semibold">Instant notifications</span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="feature-item-enhanced text-center p-2 rounded-3" style={{
                          background: 'rgba(99, 102, 241, 0.05)',
                          border: '1px solid rgba(99, 102, 241, 0.1)',
                          transition: 'all 0.3s ease'
                        }}>
                          <i className="bi bi-check2-circle text-success fs-5 mb-1 d-block"></i>
                          <span className="small fw-semibold">Number generator</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link to="/register" className="btn btn-primary w-100 rounded-pill fw-bold pricing-btn-enhanced" style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    border: 'none',
                    boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <span style={{ position: 'relative', zIndex: 2 }}>
                    <i className="bi bi-rocket-takeoff me-2"></i>
                    Get Started Now
                    </span>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                      transition: 'left 0.5s ease'
                    }}></div>
                  </Link>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

