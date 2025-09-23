import React from 'react';
import { formatDate, getRSVPText } from '../utils/formatters.js';

function TeamView({ events, teamMembers, rsvpData, currentUser }) {
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

  return (
    <div className="view-header">
      <h2>Team Status Overview</h2>
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
        {events.map(event => {
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