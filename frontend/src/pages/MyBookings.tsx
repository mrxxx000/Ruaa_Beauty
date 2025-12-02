import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Calendar, MapPin, Clock, Phone, AlertCircle, Loader, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '../styles/App.css';
import logoImg from '../WhatsApp Image 2025-11-10 at 18.10.38.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import AuthModal from '../components/AuthModal';

interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string;
  service: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  notes?: string;
  total_price?: number;
  created_at?: string;
  status?: string;
}

const MyBookings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<string | null>(null);
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');

    if (!token || !user) {
      setError('Please login to view your bookings');
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const userObj = JSON.parse(user);
      // If user is admin, redirect to admin dashboard
      if (userObj.role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }
    } catch (err) {
      console.error('Failed to parse user:', err);
    }

    setIsAuthenticated(true);
    fetchBookings();
  }, [navigate]);

  // Listen for logout event and refresh UI immediately
  useEffect(() => {
    const handleLogout = () => {
      setIsAuthenticated(false);
      setBookings([]);
      setError('Please login to view your bookings');
    };

    const handleLogin = () => {
      setIsAuthenticated(true);
      setError('');
      fetchBookings();
    };

    window.addEventListener('userLogout', handleLogout);
    window.addEventListener('userLogin', handleLogin);

    return () => {
      window.removeEventListener('userLogout', handleLogout);
      window.removeEventListener('userLogin', handleLogin);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const user = localStorage.getItem('currentUser');

      if (!user) {
        throw new Error('User not found');
      }

      const userData = JSON.parse(user);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
      //const backendUrl = 'http://localhost:10000';

      const response = await fetch(`${backendUrl}/api/booking/my-bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentUser');
          return;
        }
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem('authToken');
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
      //const backendUrl = 'http://localhost:10000';

      const response = await fetch(`${backendUrl}/api/booking/cancel/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Not authorized to cancel this booking');
        }
        throw new Error('Failed to cancel booking');
      }

      // Remove booking from list
      setBookings(bookings.filter(b => b.id !== bookingId));
      setShowCancelConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cancelling booking');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="home-landing">
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand">
            <img src={logoImg} alt="Ruaa Beauty logo" />
            <span className="brand-title">Ruaa Beauty</span>
          </div>
          <nav className="nav">
            <Link to="/" className="">{t('nav.home')}</Link>
            
            <div className="nav-dropdown">
              <button 
                className="nav-dropdown-btn"
                onClick={() => setSalonDropdownOpen(!salonDropdownOpen)}
              >
                Salon Services
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
                Products
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
            
            <Link to="/book" className="">{t('nav.book')}</Link>
            <Link to="/contact" className="">{t('nav.contact')}</Link>
            <Link to="/reviews" className="">{t('nav.reviews')}</Link>
          </nav>
          <AuthModal />
        </div>
      </header>

      <div className="lang-switcher-container">
        <LanguageSwitcher />
      </div>

      <main>
        <section style={{ padding: '60px 0', minHeight: '70vh' }}>
          <div className="container">
            <h1 style={{ color: '#ff6fa3', marginBottom: '32px', textAlign: 'center' }}>My Bookings</h1>

            {!isAuthenticated ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f9f9f9',
                borderRadius: '12px',
              }}>
                <AlertCircle className="w-12 h-12" style={{ color: '#ff6fa3', margin: '0 auto 16px' }} />
                <h2 style={{ color: '#333', marginBottom: '16px' }}>Please Login</h2>
                <p style={{ color: '#666', marginBottom: '24px' }}>You need to be logged in to view your bookings</p>
                <Link 
                  to="/"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#ff6fa3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                  }}
                >
                  Go to Home
                </Link>
              </div>
            ) : loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Loader className="w-8 h-8" style={{ color: '#ff6fa3', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#666', marginTop: '16px' }}>Loading your bookings...</p>
              </div>
            ) : error ? (
              <div style={{
                padding: '16px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <AlertCircle className="w-5 h-5" style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            ) : bookings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                backgroundColor: '#f9f9f9',
                borderRadius: '12px',
              }}>
                <Calendar className="w-12 h-12" style={{ color: '#ccc', margin: '0 auto 16px' }} />
                <h2 style={{ color: '#333', marginBottom: '8px' }}>No Bookings Yet</h2>
                <p style={{ color: '#666', marginBottom: '24px' }}>You haven't made any bookings yet.</p>
                <Link 
                  to="/book"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#ff6fa3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                  }}
                >
                  Book a Service
                </Link>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={() => setBookingFilter('all')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: bookingFilter === 'all' ? '#ff6fa3' : '#f3f4f6',
                      color: bookingFilter === 'all' ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('pending')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: bookingFilter === 'pending' ? '#ff6fa3' : '#f3f4f6',
                      color: bookingFilter === 'pending' ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Pending ({bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('completed')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: bookingFilter === 'completed' ? '#ff6fa3' : '#f3f4f6',
                      color: bookingFilter === 'completed' ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Done ({bookings.filter(b => b.status === 'completed').length})
                  </button>
                  <button
                    onClick={() => setBookingFilter('cancelled')}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      background: bookingFilter === 'cancelled' ? '#ff6fa3' : '#f3f4f6',
                      color: bookingFilter === 'cancelled' ? '#fff' : '#374151',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
                  </button>
                  
                  {/* New Booking Button */}
                  <Link
                    to="/book"
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#4CAF50',
                      color: '#fff',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease',
                      marginLeft: 'auto',
                      display: 'inline-block',
                    }}
                  >
                    + New Booking
                  </Link>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                  {bookings
                    .filter(booking => {
                      if (bookingFilter === 'pending') return booking.status !== 'completed' && booking.status !== 'cancelled';
                      if (bookingFilter === 'completed') return booking.status === 'completed';
                      if (bookingFilter === 'cancelled') return booking.status === 'cancelled';
                      return true;
                    })
                    .map((booking) => (
                      <div
                        key={booking.id}
                        style={{
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          borderLeft: booking.status === 'completed' ? '4px solid #2ed573' : booking.status === 'cancelled' ? '4px solid #f87171' : '4px solid #ff6fa3',
                          opacity: (booking.status === 'completed' || booking.status === 'cancelled') ? 0.85 : 1,
                          filter: booking.status === 'cancelled' ? 'blur(0.5px)' : 'none',
                          pointerEvents: booking.status === 'cancelled' ? 'none' : 'auto',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h3 style={{ color: '#333', marginBottom: '0', fontSize: '1.1rem', margin: 0 }}>
                            {booking.service.replace('-', ' ').toUpperCase()}
                          </h3>
                          {booking.status === 'completed' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2ed573', fontWeight: '600', fontSize: '0.9rem' }}>
                              <Check className="w-5 h-5" />
                              Done
                            </div>
                          )}
                          {booking.status === 'cancelled' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: '600', fontSize: '0.9rem' }}>
                              <AlertCircle className="w-5 h-5" />
                              Cancelled
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                          {/* Left column */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666' }}>
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666' }}>
                              <Clock className="w-4 h-4" />
                              <span>{booking.time}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#666' }}>
                              <MapPin className="w-4 h-4" />
                              <span>{booking.location}</span>
                            </div>

                            {booking.address && (
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#666', marginLeft: '20px', fontSize: '0.9rem' }}>
                                <span style={{ marginTop: '2px' }}>📍</span>
                                <span>{booking.address}</span>
                              </div>
                            )}
                          </div>

                      {/* Right column */}
                      <div>
                        <h4 style={{ color: '#333', marginBottom: '12px', fontSize: '0.95rem', fontWeight: '600' }}>Contact Details</h4>

                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9rem' }}>
                          <strong>Name:</strong> {booking.name}
                        </p>

                        <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9rem' }}>
                          <strong>Email:</strong> {booking.email}
                        </p>

                        {booking.phone && (
                          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone className="w-4 h-4" />
                            <strong>Phone:</strong> {booking.phone}
                          </p>
                        )}

                        {booking.total_price && (
                          <p style={{ margin: '0', color: '#ff6fa3', fontSize: '1rem', fontWeight: '600' }}>
                            Total: {booking.total_price} Kr
                          </p>
                        )}
                      </div>
                    </div>

                    {booking.notes && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        borderLeft: '3px solid #ff9800',
                      }}>
                        <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '0.85rem', fontWeight: '600' }}>Notes</p>
                        <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>{booking.notes}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <button
                          onClick={() => setShowCancelConfirm(booking.id)}
                          disabled={cancellingId === booking.id}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: cancellingId === booking.id ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            opacity: cancellingId === booking.id ? 0.7 : 1,
                          }}
                        >
                          {cancellingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                        </button>
                      )}
                    </div>

                    {/* Cancellation Confirmation Modal */}
                    {showCancelConfirm === booking.id && (
                      <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                      }}
                        onClick={() => setShowCancelConfirm(null)}
                      >
                        <div style={{
                          backgroundColor: 'white',
                          borderRadius: '12px',
                          padding: '32px',
                          maxWidth: '400px',
                          width: '90%',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                          textAlign: 'center',
                        }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertCircle className="w-12 h-12" style={{ color: '#ff6fa3', margin: '0 auto 16px' }} />
                          <h3 style={{ color: '#333', marginBottom: '16px' }}>Cancel Booking?</h3>
                          <p style={{ color: '#666', marginBottom: '24px', lineHeight: '1.5' }}>
                            Are you sure you want to cancel your booking for <strong>{booking.service}</strong> on <strong>{booking.date}</strong>?
                          </p>

                          <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                              onClick={() => setShowCancelConfirm(null)}
                              style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: '#f0f0f0',
                                color: '#333',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                            >
                              Keep Booking
                            </button>
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              style={{
                                flex: 1,
                                padding: '12px',
                                backgroundColor: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                              }}
                            >
                              Cancel Booking
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container text-center">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
};

export default MyBookings;
