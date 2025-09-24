import React from 'react';
import { NavLink } from 'react-router-dom';

function MainNavigation() {
  return (
    <nav className="main-navigation">
      <div className="nav-content">
        <div className="nav-tabs">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-tab-icon">📅</span>
            <span className="nav-tab-text">Upcoming Events</span>
          </NavLink>
          <NavLink
            to="/team"
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-tab-icon">👥</span>
            <span className="nav-tab-text">Team Status</span>
          </NavLink>
          <NavLink
            to="/practice"
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            <span className="nav-tab-icon">🏃</span>
            <span className="nav-tab-text">Practice Scheduling</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default MainNavigation;