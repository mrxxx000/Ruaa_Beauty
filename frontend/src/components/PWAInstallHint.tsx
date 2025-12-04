import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PWAInstallHintProps {
  position?: 'top' | 'bottom' | 'corner';
  autoHideAfter?: number; // milliseconds, 0 = never auto-hide
}

export const PWAInstallHint: React.FC<PWAInstallHintProps> = ({ 
  position = 'bottom', 
  autoHideAfter = 0 
}) => {
  const { t, i18n } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if it's mobile
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show hint after 3 seconds on first visit
      setTimeout(() => {
        if (!localStorage.getItem('PWAHintDismissed')) {
          setIsVisible(true);
          
          // Auto-hide after specified time
          if (autoHideAfter > 0) {
            setTimeout(() => setIsVisible(false), autoHideAfter);
          }
        }
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', checkMobile);
    };
  }, [autoHideAfter]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsVisible(false);
      localStorage.setItem('PWAHintDismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('PWAHintDismissed', 'true');
  };

  if (!isVisible || !isMobile || !deferredPrompt) {
    return null;
  }

  // Position styles
  const positionStyles = {
    top: {
      top: 0,
      left: 0,
      right: 0,
      animation: 'slideDown 0.3s ease-out',
    },
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      animation: 'slideUp 0.3s ease-out',
    },
    corner: {
      bottom: 20,
      right: 20,
      animation: 'fadeIn 0.3s ease-out',
    },
  };

  if (position === 'corner') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 999,
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '16px',
            maxWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* Animated phone icon */}
          <div
            style={{
              flexShrink: 0,
              fontSize: '2rem',
              animation: 'bounce 2s infinite',
            }}
          >
            📱
          </div>

          <div style={{ flex: 1 }}>
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#1f2937',
              }}
            >
              {t('pwa.installTitle') || 'Install App'}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#6b7280',
              }}
            >
              {t('pwa.installHint') || 'Quick access to booking'}
            </p>
          </div>

          <button
            onClick={handleInstall}
            style={{
              backgroundColor: '#ff6fa3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background-color 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff5a8f')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff6fa3')}
          >
            <Download size={14} />
          </button>

          <button
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#4b5563')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
          >
            <X size={16} />
          </button>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-8px);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Banner style for top/bottom
  return (
    <div
      style={{
        position: 'fixed',
        ...(position === 'top'
          ? { top: 0, left: 0, right: 0 }
          : { bottom: 0, left: 0, right: 0 }),
        backgroundColor: 'white',
        borderTop: position === 'bottom' ? '1px solid #f3f4f6' : 'none',
        borderBottom: position === 'top' ? '1px solid #f3f4f6' : 'none',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: 999,
        animation: position === 'top' ? 'slideDown 0.3s ease-out' : 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          maxWidth: '100%',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Animated phone icon */}
          <div
            style={{
              fontSize: '1.5rem',
              animation: 'bounce 2s infinite',
              flexShrink: 0,
            }}
          >
            📱
          </div>

          <div>
            <p
              style={{
                margin: '0 0 2px 0',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#1f2937',
              }}
            >
              {t('pwa.installTitle') || 'Install Ruaa Beauty App'}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#6b7280',
              }}
            >
              {t('pwa.installBannerHint') || 'Fast booking access from your home screen'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleInstall}
            style={{
              backgroundColor: '#ff6fa3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff5a8f')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff6fa3')}
          >
            {t('pwa.install') || 'Install'}
          </button>

          <button
            onClick={handleDismiss}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#4b5563',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          >
            {t('pwa.dismiss') || 'Dismiss'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PWAInstallHint;
