import React from 'react';
import { formatDate, formatTime, getRSVPText, getTeamAvailability } from '../utils/formatters.js';

function EventCard({ event, isAuthenticated, currentUser, rsvpData, teamMembers, openEventModal }) {
  const eventDate = new Date(event.start_time);
  const userRSVP = isAuthenticated && rsvpData[event.id] && rsvpData[event.id][currentUser];

  return (
    <div
      className="event-card"
      onClick={() => openEventModal(event.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openEventModal(event.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${event.name} on ${formatDate(eventDate)}`}
    >
      <div className={`event-type-badge ${event.type}`}>
        {event.type === 'special' ? 'Special' : 'GET'}
      </div>
      <h3 className="event-name">{event.name}</h3>
      <p className="event-track">{event.track}</p>
      <div className="event-meta">
        <div className="event-meta-item">
          <span className="event-meta-label">Date:</span>
          <span>{formatDate(eventDate)}</span>
        </div>
        <div className="event-meta-item">
          <span className="event-meta-label">Start Time:</span>
          <span>{formatTime(eventDate)}</span>
        </div>
        <div className="event-meta-item">
          <span className="event-meta-label">Duration:</span>
          <span>{event.duration}h</span>
        </div>
        <div className="event-meta-item">
          <span className="event-meta-label">Series:</span>
          <span>{event.series}</span>
        </div>
      </div>
      <div className="event-classes">
        {event.classes.map(cls => (
          <span key={cls} className="class-badge">{cls}</span>
        ))}
      </div>
      <div className="event-rsvp-status">
        <span className={`rsvp-indicator ${userRSVP || 'none'}`}>
          {isAuthenticated ? getRSVPText(userRSVP) : 'Sign in to RSVP'}
        </span>
        <span className="team-availability">
          {getTeamAvailability(event.id, rsvpData, teamMembers)}
        </span>
      </div>
    </div>
  );
}

export default EventCard;