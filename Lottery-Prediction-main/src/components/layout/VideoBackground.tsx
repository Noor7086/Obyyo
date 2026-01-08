import React, { useRef, useEffect, useState } from 'react';

interface VideoBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const VideoBackground: React.FC<VideoBackgroundProps> = ({ children, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(true);
  
  // Force fallback to show since we don't have a real video
  useEffect(() => {
    setShowFallback(true);
    setVideoLoaded(false);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', () => {
        setVideoLoaded(true);
        setShowFallback(false);
      });
      
      video.addEventListener('error', () => {
        console.log('Video failed to load, using fallback');
        setVideoLoaded(false);
        setShowFallback(true);
      });
      
      // Ensure video plays on mobile devices
      video.addEventListener('canplay', () => {
        video.play().catch(console.log);
      });
      
      // Fallback timeout - if video doesn't load within 3 seconds, show fallback
      const fallbackTimeout = setTimeout(() => {
        if (!videoLoaded) {
          console.log('Video loading timeout, showing fallback');
          setVideoLoaded(false);
          setShowFallback(true);
        }
      }, 3000);
      
      return () => clearTimeout(fallbackTimeout);
    }
  }, [videoLoaded]);

  return (
    <div className={`video-background-container ${className}`}>
      {/* Video Background */}
      <div className="video-background">
        <video
          ref={videoRef}
          className={`video-element ${videoLoaded ? 'loaded' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
        </video>
        
        {/* Fallback background - visible when video doesn't load */}
        {showFallback && (
          <div className="fallback-background">
            <div className="data-visualization-background">
              <div className="bg-image"></div>
              <div className="animated-overlay">
                <div className="floating-numbers">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className="floating-number" style={{
                      '--delay': `${Math.random() * 15}s`,
                      '--duration': `${12 + Math.random() * 18}s`,
                      '--x': `${Math.random() * 100}%`,
                      '--y': `${Math.random() * 100}%`,
                      '--size': `${Math.random() * 0.8 + 0.6}rem`,
                    } as React.CSSProperties}>
                      {Math.floor(Math.random() * 99) + 1}
                    </div>
                  ))}
                </div>
                <div className="data-particles">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="data-particle" style={{
                      '--delay': `${Math.random() * 20}s`,
                      '--duration': `${8 + Math.random() * 15}s`,
                      '--x': `${Math.random() * 100}%`,
                      '--y': `${Math.random() * 100}%`,
                    } as React.CSSProperties}></div>
                  ))}
                </div>
                
                {/* Lottery symbols overlay */}
                <div className="lottery-symbols">
                  {[...Array(15)].map((_, i) => (
                    <div key={i} className="lottery-symbol" style={{
                      '--delay': `${Math.random() * 25}s`,
                      '--duration': `${15 + Math.random() * 20}s`,
                      '--x': `${Math.random() * 100}%`,
                      '--y': `${Math.random() * 100}%`,
                      '--size': `${Math.random() * 0.5 + 0.3}rem`,
                    } as React.CSSProperties}>
                      {['💰', '🎯', '⭐', '💎', '🏆'][Math.floor(Math.random() * 5)]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overlay for better text readability */}
      <div className="video-overlay">
        <div className="overlay-gradient"></div>
        <div className="overlay-pattern"></div>
      </div>

      {/* Content */}
      <div className="video-content">
        {children}
      </div>
    </div>
  );
};

export default VideoBackground;
