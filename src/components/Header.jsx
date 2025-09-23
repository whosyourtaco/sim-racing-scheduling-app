import React from 'react';

function Header({ currentView, setCurrentView, isAuthenticated, currentUser, signOut, showAuthModal, refreshAppData }) {
  const handleRefresh = async () => {
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
      refreshButton.innerHTML = '⟳ Refreshing...';
      refreshButton.disabled = true;
    }

    try {
      await refreshAppData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      if (refreshButton) {
        refreshButton.innerHTML = '↻ Refresh';
        refreshButton.disabled = false;
      }
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">
          <span className="racing-icon">🏁</span>
          iRacing Team RSVP
        </h1>
        <div className="header-actions">
          <button
            className="btn btn--outline"
            id="refresh-button"
            onClick={handleRefresh}
          >
            ↻ Refresh
          </button>
          <button
            className="btn btn--outline"
            id="auth-button"
            onClick={isAuthenticated ? signOut : showAuthModal}
          >
            {isAuthenticated ? `Sign Out (${currentUser})` : 'Sign In'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;