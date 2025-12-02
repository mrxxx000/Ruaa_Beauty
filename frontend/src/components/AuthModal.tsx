import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut, User, Eye, EyeOff, X, Edit2, Check, Lock } from 'lucide-react';
import '../styles/App.css';
import { getUserProfile, updateUserProfile } from '../profileApi';

const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; name: string; email: string; phone_number?: string; role: string } | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    if (token && user) {
      const userObj = JSON.parse(user);
      setCurrentUser(userObj);
      loadFullProfile(token);
    }

    // Listen for event to open auth modal from other components
    const handleOpenAuthModal = () => {
      setIsOpen(true);
    };

    window.addEventListener('openAuthModal', handleOpenAuthModal);
    
    return () => {
      window.removeEventListener('openAuthModal', handleOpenAuthModal);
    };
  }, []);

  const loadFullProfile = async (token: string) => {
    try {
      const profile = await getUserProfile(token);
      setCurrentUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone_number: profile.phone_number || undefined,
        role: profile.role,
      });
      localStorage.setItem('currentUser', JSON.stringify({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone_number: profile.phone_number || undefined,
        role: profile.role,
      }));
    } catch (err) {
      console.error('Failed to load full profile:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

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

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      setCurrentUser(data.user);

      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setShowPassword(false);
      setIsOpen(false);

      // Dispatch custom event to notify other components about login
      const loginEvent = new CustomEvent('userLogin', {
        detail: { user: data.user, timestamp: new Date().getTime() }
      });
      window.dispatchEvent(loginEvent);

      // Redirect admin to admin dashboard immediately
      if (data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      }
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
    setShowProfileModal(false);
    
    // Dispatch custom event to notify other components about logout
    const logoutEvent = new CustomEvent('userLogout', {
      detail: { timestamp: new Date().getTime() }
    });
    window.dispatchEvent(logoutEvent);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleEditProfile = () => {
    setEditName(currentUser?.name || '');
    setEditPhone(currentUser?.phone_number || '');
    setIsEditingProfile(true);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileError('Name is required');
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setProfileError('Session expired. Please login again.');
        return;
      }

      const updatedUser = await updateUserProfile(token, editName, editPhone);
      setCurrentUser({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number || undefined,
        role: updatedUser.role,
      });
      
      localStorage.setItem('currentUser', JSON.stringify({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone_number: updatedUser.phone_number || undefined,
        role: updatedUser.role,
      }));

      // Dispatch event to notify other components that profile was updated
      const profileUpdateEvent = new CustomEvent('profileUpdated', {
        detail: {
          name: updatedUser.name,
          email: updatedUser.email,
          phone_number: updatedUser.phone_number,
        }
      });
      window.dispatchEvent(profileUpdateEvent);

      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccess('');
      }, 2000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileError('');
    setProfileSuccess('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setChangePasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setChangePasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setChangePasswordError('New password must be different from old password');
      return;
    }

    setChangingPassword(true);

    try {
      const token = localStorage.getItem('authToken');
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

      const response = await fetch(`${backendUrl}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setChangePasswordError(data.message || 'Failed to change password');
        return;
      }

      setChangePasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowChangePassword(false), 2000);
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordSuccess(false);

    if (!forgotEmail) {
      setForgotPasswordError('Email is required');
      return;
    }

    setSendingReset(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:10000';

      const response = await fetch(`${backendUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();
      setForgotPasswordSuccess(true);
      setForgotEmail('');
    } catch (err) {
      setForgotPasswordError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="auth-modal-container">
      {currentUser ? (
        <div className="user-info-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#ff6fa3', borderRadius: '8px', color: 'white' }}>
          <button
            onClick={() => setShowProfileModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.9rem',
            }}
          >
            <User className="w-5 h-5" />
            <span>{t('auth.greeting')} {currentUser.name}</span>
          </button>
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
            {t('auth.logout')}
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
            {t('auth.login')}
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
                  {isLogin ? t('authModal.title') : t('authModal.title')}
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
                        {t('authModal.fullName')}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('authModal.fullNamePlaceholder')}
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
                      {t('authModal.email')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('authModal.emailPlaceholder')}
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
                        {t('authModal.phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('authModal.phoneNumberPlaceholder')}
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
                      {t('authModal.password')}
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={isLogin ? t('authModal.passwordPlaceholder') : t('authModal.passwordMin')}
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
                    {loading ? 'Processing...' : isLogin ? t('authModal.title') : t('authModal.registerButton')}
                  </button>

                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: 'transparent',
                        color: '#ff6fa3',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {t('authModal.loginButton')}
                    </button>
                  )}
                </form>

                <p style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
                  {isLogin ? t('authModal.dontHaveAccount') + ' ' : t('authModal.alreadyHaveAccount') + ' '}
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
                    {isLogin ? t('authModal.register') : t('authModal.title')}
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
                  {t('authModal.close')}
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
              {t('auth.confirmLogout')}
            </h2>

            <p style={{ marginBottom: '24px', color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {t('auth.confirmLogoutMessage')}
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
                {t('auth.cancel')}
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
                {t('auth.logoutButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && currentUser && (
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
            zIndex: 1002,
          }}
          onClick={() => setShowProfileModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#ff6fa3', margin: 0 }}>{t('profile.title')}</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X className="w-6 h-6" style={{ color: '#333' }} />
              </button>
            </div>

            {profileError && (
              <div style={{
                backgroundColor: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.9rem',
              }}>
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div style={{
                backgroundColor: '#efe',
                color: '#3c3',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.9rem',
              }}>
                {profileSuccess}
              </div>
            )}

            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#333', margin: 0, fontSize: '1rem', fontWeight: '600' }}>{t('profile.userDetails')}</h3>
                {!isEditingProfile && (
                  <button
                    onClick={handleEditProfile}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#ff6fa3',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('profile.edit')}
                  </button>
                )}
              </div>

              {!isEditingProfile ? (
                <>
                  <div style={{ 
                    backgroundColor: '#f9f9f9', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    borderLeft: '4px solid #ff6fa3'
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.85rem' }}>{t('profile.fullName')}</p>
                    <p style={{ margin: '0', color: '#333', fontSize: '1rem', fontWeight: '600' }}>{currentUser.name}</p>
                  </div>

                  <div style={{ 
                    backgroundColor: '#f9f9f9', 
                    padding: '16px', 
                    borderRadius: '8px', 
                    marginBottom: '12px',
                    borderLeft: '4px solid #ff6fa3'
                  }}>
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.85rem' }}>{t('profile.email')}</p>
                    <p style={{ margin: '0', color: '#333', fontSize: '1rem', fontWeight: '600', wordBreak: 'break-all' }}>{currentUser.email}</p>
                  </div>

                  {currentUser.phone_number && (
                    <div style={{ 
                      backgroundColor: '#f9f9f9', 
                      padding: '16px', 
                      borderRadius: '8px', 
                      marginBottom: '12px',
                      borderLeft: '4px solid #ff6fa3'
                    }}>
                      <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.85rem' }}>{t('profile.phoneNumber')}</p>
                      <p style={{ margin: '0', color: '#333', fontSize: '1rem', fontWeight: '600' }}>{currentUser.phone_number}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
                      {t('profile.fullName')}
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter your full name"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
                      {t('profile.phoneNumber')} <span style={{ color: '#999', fontSize: '0.85rem' }}>(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#ff6fa3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: savingProfile ? 'not-allowed' : 'pointer',
                        opacity: savingProfile ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Check className="w-4 h-4" />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#f0f0f0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>{t('profile.myBookings')}</h3>
              <a 
                href="/my-bookings"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: '#ff6fa3',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                }}
              >
                {t('profile.viewMyBookings')}
              </a>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ color: '#333', marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>{t('profile.security')}</h3>
              <button
                onClick={() => setShowChangePassword(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  backgroundColor: '#ff6fa3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                }}
              >
                <Lock className="w-4 h-4" />
                 {t('profile.changePassword')}
              </button>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#f0f0f0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#333',
                fontWeight: '600',
              }}
            >
              {t('profile.close')}
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1003,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '450px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#333', margin: 0, fontSize: '1.3rem' }}>🔐 Change Password</h2>
              <button
                onClick={() => setShowChangePassword(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                ✕
              </button>
            </div>

            {changePasswordSuccess ? (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                textAlign: 'center',
              }}>
                ✅ {changePasswordSuccess}
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                {changePasswordError && (
                  <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#c33',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                    ❌ {changePasswordError}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
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
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        color: '#6b6b6b',
                      }}
                    >
                      {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)"
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
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        color: '#6b6b6b',
                      }}
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPassword && (
                    <p style={{
                      marginTop: '6px',
                      fontSize: '0.75rem',
                      color: newPassword.length >= 8 ? '#4caf50' : '#ff9800',
                    }}>
                      {newPassword.length >= 8 ? '✓ Strong password' : `⚠ At least 8 characters (${newPassword.length}/8)`}
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
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
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0',
                        color: '#6b6b6b',
                      }}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#ff6fa3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: changingPassword ? 'not-allowed' : 'pointer',
                      opacity: changingPassword ? 0.7 : 1,
                    }}
                  >
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowChangePassword(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1003,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '450px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#333', margin: 0, fontSize: '1.3rem' }}>{t('authModal.forgotPasswordTitle')}</h2>
              <button
                onClick={() => setShowForgotPassword(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                ✕
              </button>
            </div>

            {forgotPasswordSuccess ? (
              <div style={{
                backgroundColor: '#d4edda',
                color: '#155724',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#155724' }}>✅ Check Your Email</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  We've sent a password reset link to your inbox. The link expires in 1 hour.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                {forgotPasswordError && (
                  <div style={{
                    backgroundColor: '#f8d7da',
                    color: '#c33',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}>
                    ❌ {forgotPasswordError}
                  </div>
                )}

                <p style={{ color: '#666', marginBottom: '16px', fontSize: '0.95rem' }}>
                  {t('authModal.forgotPasswordDescription')}
                </p>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333' }}>
                    {t('authModal.forgotPasswordEmail')}
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={t('authModal.forgotPasswordEmailPlaceholder')}
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

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="submit"
                    disabled={sendingReset}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#ff6fa3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: sendingReset ? 'not-allowed' : 'pointer',
                      opacity: sendingReset ? 0.7 : 1,
                    }}
                  >
                    {sendingReset ? 'Sending...' : t('authModal.sendResetLink')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      backgroundColor: '#f0f0f0',
                      color: '#333',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    {t('authModal.cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthModal;
