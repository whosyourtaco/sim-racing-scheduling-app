import React from 'react';

function MainNavigation({ currentView, setCurrentView }) {
  return (
    <nav className="main-navigation">
      <div className="nav-content">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentView === 'calendar' ? 'active' : ''}`}
            onClick={() => setCurrentView('calendar')}
          >
            <span className="nav-tab-icon">📅</span>
            <span className="nav-tab-text">Upcoming Events</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'team' ? 'active' : ''}`}
            onClick={() => setCurrentView('team')}
          >
            <span className="nav-tab-icon">👥</span>
            <span className="nav-tab-text">Team Status</span>
          </button>
          <button
            className={`nav-tab ${currentView === 'practice' ? 'active' : ''}`}
            onClick={() => setCurrentView('practice')}
          >
            <span className="nav-tab-icon">🏃</span>
            <span className="nav-tab-text">Practice Scheduling</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default MainNavigation;