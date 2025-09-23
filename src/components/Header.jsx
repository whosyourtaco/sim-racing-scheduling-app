import React from 'react';
import MainNavigation from "./MainNavigation.jsx";

function Header({currentView, setCurrentView, isAuthenticated, currentUser, signOut, showAuthModal, refreshAppData}) {
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
            <div className="header-content justify-between">
                <h1 className="header-title">
                    <span className="racing-icon">🏁</span>
                    <span className="header-title-text">iRacing Team RSVP</span>
                </h1>
                <div className="header-actions">
                    <button
                        className="btn btn--outline btn--compact"
                        id="refresh-button"
                        onClick={handleRefresh}
                        aria-label="Refresh data"
                    >
                        <span className="btn-icon">↻</span>
                        <span className="btn-text">Refresh</span>
                    </button>
                    <button
                        className="btn btn--outline btn--compact"
                        id="auth-button"
                        onClick={isAuthenticated ? signOut : showAuthModal}
                        aria-label={isAuthenticated ? `Sign out ${currentUser}` : 'Sign in'}
                    >
                        <span className="btn-icon">{isAuthenticated ? '👤' : '🔑'}</span>
                        <span className="btn-text">
              {isAuthenticated ? `${currentUser}` : 'Sign In'}
            </span>
                    </button>
                </div>
            </div>
        </header>
    )
        ;
}

export default Header;