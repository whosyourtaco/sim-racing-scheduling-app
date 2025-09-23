import React, { useState, useEffect } from 'react';
import { validatePassword } from '../utils/auth.js';

function SecureAuthModal({
  isOpen,
  onClose,
  registerUser,
  signIn,
  migrateLegacyUser,
  teamMembers,
  setTeamMembers,
  events,
  rsvpData,
  setRsvpData,
  isRequired = false,
  requiresMigration = false
}) {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationUser, setMigrationUser] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ username: '', password: '', confirmPassword: '' });
      setErrors({});
      setIsLoading(false);
      setShowMigrationModal(false);
    }
  }, [isOpen]);

  // Handle migration requirement
  useEffect(() => {
    if (requiresMigration) {
      setShowMigrationModal(true);
      setActiveTab('migrate');
    }
  }, [requiresMigration]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (!isRequired && !showMigrationModal && e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.trim().length > 50) {
      newErrors.username = 'Username must be less than 50 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (activeTab === 'register' || activeTab === 'migrate') {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]; // Show first error
      }
    }

    // Confirm password validation (only for registration)
    if (activeTab === 'register' || activeTab === 'migrate') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signIn(formData.username, formData.password, teamMembers, setTeamMembers, setRsvpData);

      if (result.success) {
        setFormData({ username: '', password: '', confirmPassword: '' });
        onClose();
      } else if (result.error === 'migration_required') {
        setMigrationUser(result.username);
        setShowMigrationModal(true);
        setActiveTab('migrate');
        setFormData(prev => ({ ...prev, username: result.username, password: '' }));
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Sign in failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await registerUser(
        formData.username,
        formData.password,
        teamMembers,
        setTeamMembers,
        events,
        rsvpData,
        setRsvpData
      );

      if (result.success) {
        setFormData({ username: '', password: '', confirmPassword: '' });
        onClose();
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigration = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await migrateLegacyUser(formData.username, formData.password);

      if (result.success) {
        // After successful migration, sign in the user
        const signInResult = await signIn(formData.username, formData.password, teamMembers, setTeamMembers, setRsvpData);
        if (signInResult.success) {
          setFormData({ username: '', password: '', confirmPassword: '' });
          setShowMigrationModal(false);
          onClose();
        } else {
          setErrors({ general: 'Migration successful, but sign in failed. Please try signing in again.' });
        }
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Migration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      if (activeTab === 'login') {
        handleLogin();
      } else if (activeTab === 'register') {
        handleRegister();
      } else if (activeTab === 'migrate') {
        handleMigration();
      }
    }
  };

  const renderMigrationModal = () => (
    <div className="migration-notice">
      <div className="migration-icon">🔒</div>
      <h4>Security Upgrade Required</h4>
      <p>
        Hi <strong>{migrationUser || formData.username}</strong>! We've upgraded our security system.
        To protect your account, please create a secure password.
      </p>
      <p className="migration-note">
        <strong>Don't worry!</strong> All your existing data (RSVPs, practice schedules) will be preserved.
      </p>
    </div>
  );

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-backdrop"></div>
      <div className="modal-content auth-modal">
        <div className="modal-header">
          <h3>
            {showMigrationModal ? 'Account Security Upgrade' :
             isRequired ? 'Authentication Required' : 'Sign In / Register'}
          </h3>
          {!isRequired && !showMigrationModal && (
            <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
          )}
        </div>

        <div className="modal-body">
          {errors.general && (
            <div className="error-message">
              {errors.general}
            </div>
          )}

          {showMigrationModal && renderMigrationModal()}

          {!showMigrationModal && (
            <div className="auth-tabs">
              <button
                className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
                disabled={isLoading}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
                disabled={isLoading}
              >
                Register
              </button>
            </div>
          )}

          <div className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Full name</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your full name"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                onKeyPress={handleKeyPress}
                className={`form-control ${errors.username ? 'error' : ''}`}
                disabled={isLoading || (showMigrationModal && migrationUser)}
                autoComplete="username"
              />
              {errors.username && <span className="field-error">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                {activeTab === 'login' ? 'Password' : 'Create Password'}
              </label>
              <input
                id="password"
                type="password"
                placeholder={activeTab === 'login' ? 'Enter your password' : 'Create a secure password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onKeyPress={handleKeyPress}
                className={`form-control ${errors.password ? 'error' : ''}`}
                disabled={isLoading}
                autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            {(activeTab === 'register' || activeTab === 'migrate') && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn--primary"
            onClick={
              activeTab === 'login' ? handleLogin :
              activeTab === 'register' ? handleRegister :
              handleMigration
            }
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' :
             activeTab === 'login' ? 'Sign In' :
             activeTab === 'register' ? 'Create Account' :
             'Upgrade Account'}
          </button>

          {!isRequired && !showMigrationModal && (
            <button
              className="btn btn--outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SecureAuthModal;