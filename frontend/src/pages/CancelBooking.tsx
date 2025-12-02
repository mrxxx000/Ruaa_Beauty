import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle, XCircle, Loader, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';

type CancelState = 'loading' | 'confirm' | 'cancelling' | 'success' | 'error' | 'not-found';

interface BookingInfo {
  name: string;
  email: string;
  service: string;
  date: string;
}

const CancelBooking: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<CancelState>('loading');
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [error, setError] = useState<string>('');

  const token = searchParams.get('token');

  useEffect(() => {
    // Verify token and fetch booking info
    const verifyToken = async () => {
      if (!token) {
        setState('not-found');
        setError('Invalid or missing cancellation token');
        return;
      }

      try {
        // Verify the token exists (we'll just proceed to confirm state)
        // In a real app, you might want to verify the token with backend
        setState('confirm');
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to verify booking');
      }
    };

    verifyToken();
  }, [token]);

  const handleConfirmCancel = async () => {
    if (!token) return;

    setState('cancelling');
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/unbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        setBookingInfo(data.booking);
        setState('success');
      } else {
        const data = await response.json();
        setState('error');
        setError(data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [unsubToken] = useState(searchParams.get('token'));

  return (
    <div className="cancel-booking-page">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Link to="/">
              <img src={logoImg} alt="Ruaa Beauty logo" />
            </Link>
            <span className="brand-title">Ruaa Beauty</span>
          </div>
          <nav className="nav">
            <Link to="/">{t('nav.home')}</Link>
            
            <div className="nav-dropdown">
              <button 
                className="nav-dropdown-btn"
                onClick={() => setSalonDropdownOpen(!salonDropdownOpen)}
              >
                {t('nav.salonService')}
                <ChevronDown className="w-4 h-4" style={{ transition: 'transform 0.2s', transform: salonDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {salonDropdownOpen && (
                <div className="nav-dropdown-menu">
                  <Link to="/makeup" onClick={() => setSalonDropdownOpen(false)}>
                    {t('nav.makeup')}
                  </Link>
                  <Link to="/mehendi" onClick={() => setSalonDropdownOpen(false)}>
                    {t('nav.mehendi')}
                  </Link>
                </div>
              )}
            </div>

            <div className="nav-dropdown">
              <button 
                className="nav-dropdown-btn"
                onClick={() => setProductsDropdownOpen(!productsDropdownOpen)}
              >
                {t('nav.products')}
                <ChevronDown className="w-4 h-4" style={{ transition: 'transform 0.2s', transform: productsDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
              </button>
              {productsDropdownOpen && (
                <div className="nav-dropdown-menu">
                  <Link to="/lashes" onClick={() => setProductsDropdownOpen(false)}>
                    {t('nav.lashes')}
                  </Link>
                </div>
              )}
            </div>
            
            <Link to="/book">{t('nav.book')}</Link>
            <Link to="/contact">{t('nav.contact')}</Link>
            <Link to="/reviews">{t('nav.reviews')}</Link>
          </nav>
          <AuthModal />
        </div>
      </header>

      <div className="lang-switcher-container">
        <LanguageSwitcher />
      </div>

      <section
        className="min-h-screen py-16 px-4 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #fff6f8 0%, #fff1f3 100%)' }}
      >
      <div className="w-full max-w-md">
        {/* Loading State */}
        {state === 'loading' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-lg text-muted-foreground">{t('cancelBooking.loading') || 'Loading booking information...'}</p>
          </div>
        )}

        {/* Confirmation State */}
        {state === 'confirm' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-4 text-foreground">
              {t('cancelBooking.confirmTitle') || 'Cancel Your Booking?'}
            </h1>
            <p className="text-center text-muted-foreground mb-8 text-lg">
              {t('cancelBooking.confirmMessage') || 'Are you sure you want to cancel your booking? This action cannot be undone.'}
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleConfirmCancel}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg active:scale-95"
              >
                {t('cancelBooking.yesCancel') || 'Yes, Cancel Booking'}
              </button>
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl transition-all duration-300 hover:shadow-lg active:scale-95"
              >
                {t('cancelBooking.noKeep') || 'No, Keep Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Cancelling State */}
        {state === 'cancelling' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-lg text-muted-foreground">{t('cancelBooking.processing') || 'Processing cancellation...'}</p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-4 text-foreground">
              {t('cancelBooking.successTitle') || 'Booking Cancelled'}
            </h1>
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 mb-8">
              <p className="text-center text-muted-foreground mb-4">
                {t('cancelBooking.successMessage') || 'Your booking has been successfully cancelled.'}
              </p>
              <p className="text-center text-sm text-muted-foreground mb-4">
                {t('cancelBooking.emailsSent') || 'Confirmation emails have been sent to you and our admin team.'}
              </p>
              {bookingInfo && (
                <div className="space-y-2 text-sm">
                  <p><strong>{t('cancelBooking.name') || 'Name'}:</strong> {bookingInfo.name}</p>
                  <p><strong>{t('cancelBooking.email') || 'Email'}:</strong> {bookingInfo.email}</p>
                  <p><strong>{t('cancelBooking.service') || 'Service'}:</strong> {bookingInfo.service}</p>
                  <p><strong>{t('cancelBooking.date') || 'Date'}:</strong> {bookingInfo.date}</p>
                </div>
              )}
            </div>

            <button
              onClick={handleBack}
              className="w-full px-6 py-3 bg-gradient-primary text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg active:scale-95"
            >
              {t('cancelBooking.backHome') || 'Back to Home'}
            </button>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-4 text-foreground">
              {t('cancelBooking.errorTitle') || 'Cancellation Failed'}
            </h1>
            <p className="text-center text-red-600 mb-8 text-lg font-semibold">
              {error || (t('cancelBooking.errorMessage') || 'An error occurred while cancelling your booking.')}
            </p>

            <button
              onClick={handleBack}
              className="w-full px-6 py-3 bg-gradient-primary text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg active:scale-95"
            >
              {t('cancelBooking.backHome') || 'Back to Home'}
            </button>
          </div>
        )}

        {/* Not Found State */}
        {state === 'not-found' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-4 text-foreground">
              {t('cancelBooking.notFoundTitle') || 'Booking Not Found'}
            </h1>
            <p className="text-center text-muted-foreground mb-8 text-lg">
              {t('cancelBooking.notFoundMessage') || 'The cancellation link is invalid or has expired.'}
            </p>

            <button
              onClick={handleBack}
              className="w-full px-6 py-3 bg-gradient-primary text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg active:scale-95"
            >
              {t('cancelBooking.backHome') || 'Back to Home'}
            </button>
          </div>
        )}
      </div>
    </section>

    <footer className="site-footer">
      <div className="container text-center">
        <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
    </div>
  );
};

export default CancelBooking;
