import React, { useState } from 'react';

function AuthModal({ isOpen, onClose, registerUser, signIn, teamMembers, setTeamMembers, events, rsvpData, setRsvpData }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loginName, setLoginName] = useState('');
  const [registerName, setRegisterName] = useState('');

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  const handleLogin = async () => {
    const success = await signIn(loginName, teamMembers, setTeamMembers, setRsvpData);
    if (success) {
      setLoginName('');
      onClose();
    }
  };

  const handleRegister = async () => {
    const success = await registerUser(registerName, teamMembers, setTeamMembers, events, rsvpData, setRsvpData);
    if (success) {
      setRegisterName('');
      onClose();
    }
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      if (action === 'login') {
        handleLogin();
      } else {
        handleRegister();
      }
    }
  };

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-backdrop"></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>Sign In / Register</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Register
            </button>
          </div>

          {activeTab === 'login' && (
            <div className="auth-tab-content active">
              <div className="form-group">
                <label htmlFor="login-name" className="form-label">Your Name</label>
                <input
                  type="text"
                  id="login-name"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'login')}
                />
              </div>
              <button
                className="btn btn--primary btn--full-width"
                onClick={handleLogin}
              >
                Sign In
              </button>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="auth-tab-content active">
              <div className="form-group">
                <label htmlFor="register-name" className="form-label">Your Name</label>
                <input
                  type="text"
                  id="register-name"
                  className="form-control"
                  placeholder="Enter your full name"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'register')}
                />
              </div>
              <button
                className="btn btn--primary btn--full-width"
                onClick={handleRegister}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;