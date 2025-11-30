import React, { useState } from 'react';
import { LogIn, LogOut, User, Eye, EyeOff } from 'lucide-react';
import '../styles/App.css';

const AuthModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);

  // Load user from localStorage on mount
  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate fields
    if (isLogin && !email) {
      setError('Email is required');
      return;
    }
    if (!isLogin && (!name || !email)) {
      setError('Name and email are required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      //const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';
      const backendUrl ='http://localhost:10000';

      const body = isLogin 
        ? { email, password }
        : { name, email, password, phone_number: phone || null };

      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Authentication failed');
        return;
      }

      // Save token and user
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setCurrentUser(data.user);

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setShowPassword(false);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <div className="auth-modal-container">
      {currentUser ? (
        <div className="user-info-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#ff6fa3', borderRadius: '8px', color: 'white' }}>
          <User className="w-5 h-5" />
          <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Hey {currentUser.name}</span>
          <button
            onClick={handleLogout}
            style={{
              marginLeft: '8px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => setIsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#ff6fa3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}
          >
            <LogIn className="w-5 h-5" />
            Login
          </button>

          {isOpen && (
            <div
              style={{
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
              onClick={() => setIsOpen(false)}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  maxWidth: '400px',
                  width: '90%',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ marginBottom: '24px', color: '#ff6fa3', textAlign: 'center' }}>
                  {isLogin ? 'Login' : 'Register'}
                </h2>

                {error && (
                  <div style={{ backgroundColor: '#fee', color: '#c33', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {!isLogin && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                        Phone Number <span style={{ color: '#999', fontSize: '0.85rem' }}>(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isLogin ? 'Enter password' : 'Enter password (min. 8 characters)'}
                        style={{
                          width: '100%',
                          padding: '10px 40px 10px 10px',
                          border: '2px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b6b6b',
                        }}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {!isLogin && password && (
                      <p style={{
                        marginTop: '6px',
                        fontSize: '0.75rem',
                        color: password.length >= 8 ? '#4caf50' : '#ff9800',
                      }}>
                        {password.length >= 8 ? '✓ Password is strong' : `⚠ At least 8 characters (${password.length}/8)`}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (!isLogin && password.length < 8)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#ff6fa3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '1rem',
                      cursor: (loading || (!isLogin && password.length < 8)) ? 'not-allowed' : 'pointer',
                      opacity: (loading || (!isLogin && password.length < 8)) ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
                  </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6fa3',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                    }}
                  >
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>

                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '10px',
                    backgroundColor: '#f0f0f0',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#333',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showLogoutConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={cancelLogout}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '350px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '16px', color: '#ff6fa3', fontSize: '1.3rem' }}>
              Confirm Logout
            </h2>

            <p style={{ marginBottom: '24px', color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Are you sure you want to log out?
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={cancelLogout}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#ff6fa3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthModal;
