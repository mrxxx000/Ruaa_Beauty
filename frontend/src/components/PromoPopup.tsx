import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './promo-popup.css';

interface PromoPopupProps {
  gifUrl: string;
  side?: 'left' | 'right';
  delayMs?: number;
}

export const PromoPopup: React.FC<PromoPopupProps> = ({ 
  gifUrl, 
  side = 'right',
  delayMs = 3000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if it's mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
    };

    // Check if app is installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode = 
        (window.navigator as any).standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches;
      
      setIsStandalone(isStandaloneMode);
    };

    checkMobile();
    checkStandalone();
    window.addEventListener('orientationchange', checkStandalone);

    // Only show on mobile, in browser mode (not PWA standalone), and not closed this session
    if (isMobile && !isStandalone && !sessionStorage.getItem('promoPopupClosed')) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delayMs);

      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('orientationchange', checkStandalone);
  }, [isMobile, isStandalone, delayMs]);

  const handleClose = () => {
    setIsVisible(false);
    // Mark as closed for this session only (cleared on page refresh)
    sessionStorage.setItem('promoPopupClosed', 'true');
  };

  if (!isVisible || isStandalone || !isMobile) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="promo-overlay"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div 
        className={`promo-popup promo-${side}`}
        style={{
          animation: side === 'left' 
            ? 'slideInLeft 0.5s ease-out' 
            : 'slideInRight 0.5s ease-out'
        }}
      >
        {/* Close Button */}
        <button
          className="promo-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* GIF Image */}
        <img
          src={gifUrl}
          alt="Promotion"
          className="promo-gif"
        />
      </div>
    </>
  );
};

export default PromoPopup;
