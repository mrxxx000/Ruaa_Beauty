import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/reset-password.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const resetToken = searchParams.get('token');
    if (!resetToken) {
      setTokenValid(false);
      setValidatingToken(false);
      setError('No reset token provided. Please use the link from your email.');
      return;
    }
    setToken(resetToken);
    setValidatingToken(false);
  }, [searchParams]);

  const validatePassword = () => {
    if (!newPassword.trim()) {
      setError('Password cannot be empty');
      return false;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resetToken: token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred while resetting your password. Please try again.');
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card error-card">
          <h2>❌ Invalid Reset Link</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Go Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-card success-card">
          <h2>✅ Password Reset Successfully!</h2>
          <p>Your password has been reset. Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <h1>🔐 Reset Your Password</h1>
        <p className="subtitle">Enter your new password below</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleResetPassword}>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="Confirm your new password"
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="reset-button" disabled={loading}>
            {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
          </button>
        </form>

        <div className="password-hints">
          <p>🔒 Password requirements:</p>
          <ul>
            <li>At least 6 characters long</li>
            <li>Must match the confirmation password</li>
            <li>Must be different from your current password</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
