import React, { useState, useMemo } from 'react';
import { formatDate, getRSVPText } from '../utils/formatters.js';

function TeamView({ events, teamMembers, rsvpData, currentUser }) {
  const [sortBy, setSortBy] = useState('date');

  // Calculate team statistics
  const totalEvents = events.length;

  let totalAvailability = 0;
  let totalResponses = 0;

  events.forEach(event => {
    if (!rsvpData[event.id]) return;

    teamMembers.forEach(member => {
      const status = rsvpData[event.id][member];
      if (status === 'available') {
        totalAvailability += 1;
      }
      if (status) {
        totalResponses += 1;
      }
    });
  });

  const avgAvailability = totalResponses > 0 ? Math.round((totalAvailability / totalResponses) * 100) : 0;

  // Sort events based on selected criteria
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(a.start_time) - new Date(b.start_time);
      } else if (sortBy === 'availability') {
        // Count available people for each event
        const aAvailable = teamMembers.filter(member =>
          rsvpData[a.id] && rsvpData[a.id][member] === 'available'
        ).length;
        const bAvailable = teamMembers.filter(member =>
          rsvpData[b.id] && rsvpData[b.id][member] === 'available'
        ).length;
        return bAvailable - aAvailable; // Descending order
      }
      return 0;
    });
  }, [events, sortBy, teamMembers, rsvpData]);

  return (
    <div className="view-header">
      <h2>Team Status Overview</h2>
      <div className="sort-controls">
        <label htmlFor="sort-select" className="sort-label">Sort by:</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="form-control sort-select"
        >
          <option value="date">Date</option>
          <option value="availability">Available People (Most First)</option>
        </select>
      </div>
      <div className="team-stats">
        <div className="stat-card">
          <span className="stat-number">{totalEvents}</span>
          <span className="stat-label">Total Events</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{avgAvailability}%</span>
          <span className="stat-label">Avg. Availability</span>
        </div>
      </div>
      <div className="team-grid">
        {sortedEvents.map(event => {
          const eventDate = new Date(event.start_time);

          return (
            <div key={event.id} className="team-event-row">
              <div className="team-event-header">
                <span className="team-event-name">{event.name}</span>
                <span className="team-event-date">{formatDate(eventDate)}</span>
              </div>
              <div className="team-members">
                {teamMembers.map(member => {
                  const status = rsvpData[event.id] && rsvpData[event.id][member];
                  const isCurrentUser = member === currentUser;

                  return (
                    <div key={member} className={`team-member ${isCurrentUser ? 'current-user' : ''}`}>
                      <span className="member-name">
                        {member}{isCurrentUser ? ' (You)' : ''}
                      </span>
                      <span className={`member-rsvp rsvp-indicator ${status || 'none'}`}>
                        {getRSVPText(status)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamView;