import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { CheckCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { capturePayPalOrder } from '../paymentApi';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BottomNav from '../components/BottomNav';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const orderId = searchParams.get('token');
  const [state, setState] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (orderId) {
      console.log('🔵 PaymentSuccess mounted with orderId:', orderId);
      console.log('🔵 About to call capturePayPalOrder...');
      
      // Capture the order
      capturePayPalOrder(orderId)
        .then((payment) => {
          console.log('✅ Payment captured successfully:', payment);
          
          // Get pending booking data from localStorage
          const pendingBookingJson = localStorage.getItem('pendingPayPalBooking');
          console.log('🔍 Looking for pending booking in localStorage:', pendingBookingJson ? 'Found' : 'Not found');
          if (pendingBookingJson) {
            const bookingData = JSON.parse(pendingBookingJson);
            console.log('📋 Creating booking with payment:', bookingData);
            
            // Create the booking now that payment is confirmed
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
            const token = localStorage.getItem('authToken');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            // Add payment status as 'paid' for PayPal bookings
            const bookingDataWithPaymentStatus = {
              ...bookingData,
              paymentStatus: 'paid'
            };

            return fetch(`${backendUrl}/api/booking`, {
              method: 'POST',
              headers,
              body: JSON.stringify(bookingDataWithPaymentStatus),
            }).then(async resp => {
              const responseData = await resp.json();
              if (resp.ok) {
                console.log('✅ Booking created successfully after payment:', responseData);
                // Clear pending booking from storage
                localStorage.removeItem('pendingPayPalBooking');
                setState('success');
                // Redirect to my-bookings after 3 seconds
                setTimeout(() => {
                  navigate('/my-bookings');
                }, 3000);
              } else {
                console.error('❌ Failed to create booking:', responseData);
                throw new Error(responseData.message || 'Failed to create booking after payment');
              }
            });
          } else {
            console.warn('⚠️ No pending booking data found');
            setState('success');
            setTimeout(() => {
              navigate('/my-bookings');
            }, 3000);
          }
        })
        .catch((err) => {
          console.error('❌ Error in payment flow:', err);
          setState('error');
          setError(err instanceof Error ? err.message : 'Failed to process payment');
        });
    } else {
      console.log('⚠️ No orderId found in URL');
      setState('error');
      setError('No payment order ID found. Please try again.');
    }
  }, [orderId, navigate]);

  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);

  const handleNavClick = () => {
    setSalonDropdownOpen(false);
    setProductsDropdownOpen(false);
  };

  return (
    <div
      className="payment-page"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fff6f8 0%, #fff1f3 100%)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <Link to="/">
              <img src={logoImg} alt="Ruaa Beauty logo" />
            </Link>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '600px',
            backgroundColor: 'white',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {state === 'processing' && (
            <>
              <Loader
                className="w-16 h-16"
                style={{
                  margin: '0 auto 20px',
                  color: '#ff6fa3',
                  animation: 'spin 2s linear infinite',
                }}
              />
              <h1 style={{ color: '#333', marginBottom: '16px', fontSize: '28px' }}>
                Processing Payment
              </h1>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px' }}>
                Please wait while we confirm your payment...
              </p>
              <p style={{ color: '#999', fontSize: '14px' }}>
                Order ID: <code>{orderId}</code>
              </p>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle
                className="w-16 h-16"
                style={{
                  margin: '0 auto 20px',
                  color: '#4caf50',
                }}
              />
              <h1 style={{ color: '#333', marginBottom: '16px', fontSize: '28px' }}>
                Payment Successful! ✨
              </h1>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px' }}>
                Your booking has been confirmed and payment has been processed.
              </p>
              <div
                style={{
                  backgroundColor: '#f0f7ff',
                  border: '2px solid #4caf50',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}
              >
                <p style={{ margin: '0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
                  Order ID: {orderId}
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px' }}>
                  A confirmation email has been sent to you.
                </p>
              </div>
              <p style={{ color: '#999', fontSize: '14px', marginBottom: '24px' }}>
                Redirecting to your bookings in 3 seconds...
              </p>
              <Link
                to="/my-bookings"
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#45a049')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4caf50')}
              >
                View My Bookings
              </Link>
            </>
          )}

          {state === 'error' && (
            <>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 20px',
                  backgroundColor: '#ff6fa3',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                }}
              >
                ✕
              </div>
              <h1 style={{ color: '#333', marginBottom: '16px', fontSize: '28px' }}>
                Payment Failed
              </h1>
              <p style={{ color: '#666', fontSize: '16px', marginBottom: '24px' }}>
                {error || 'An error occurred while processing your payment.'}
              </p>
              <div
                style={{
                  backgroundColor: '#fff3cd',
                  border: '2px solid #ff9800',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left',
                }}
              >
                <p style={{ margin: '0', color: '#d84315', fontSize: '14px', fontWeight: '600' }}>
                  What can you do?
                </p>
                <ul style={{ margin: '8px 0 0 0', color: '#666', fontSize: '14px', paddingLeft: '20px' }}>
                  <li>Check your internet connection</li>
                  <li>Verify your PayPal account has sufficient funds</li>
                  <li>Try again or contact support</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/book')}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#ff6fa3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ff5a8f')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ff6fa3')}
                >
                  Try Again
                </button>
                <Link
                  to="/"
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#e0e0e0',
                    color: '#333',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    transition: 'background-color 0.3s',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d0d0d0')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                >
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <BottomNav />

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
