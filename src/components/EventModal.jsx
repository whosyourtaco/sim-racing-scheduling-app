import React from 'react';
import { formatDateTime, getRSVPText } from '../utils/formatters.js';

function EventModal({ event, isOpen, onClose, currentUser, rsvpData, teamMembers, updateRSVP }) {
  if (!isOpen || !event) return null;

  const eventDate = new Date(event.start_time);
  const userRSVP = rsvpData[event.id] && rsvpData[event.id][currentUser];

  const handleRSVPClick = (status) => {
    updateRSVP(event.id, currentUser, status);
  };

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="modal" onClick={handleBackdropClick}>
      <div className="modal-backdrop"></div>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{event.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="event-details">
            <div className="detail-row">
              <span className="detail-label">Series:</span>
              <span>{event.series}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Track:</span>
              <span>{event.track}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span>{formatDateTime(eventDate)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span>{event.duration} hours</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Classes:</span>
              <span>{event.classes.join(', ')}</span>
            </div>
          </div>

          <div className="rsvp-section">
            <h4>Your RSVP Status</h4>
            <div className="rsvp-buttons">
              <button
                className={`btn rsvp-btn rsvp-available ${userRSVP === 'available' ? 'active' : ''}`}
                onClick={() => handleRSVPClick('available')}
              >
                Available
              </button>
              <button
                className={`btn rsvp-btn rsvp-maybe ${userRSVP === 'maybe' ? 'active' : ''}`}
                onClick={() => handleRSVPClick('maybe')}
              >
                Maybe
              </button>
              <button
                className={`btn rsvp-btn rsvp-unavailable ${userRSVP === 'unavailable' ? 'active' : ''}`}
                onClick={() => handleRSVPClick('unavailable')}
              >
                Unavailable
              </button>
            </div>
          </div>

          <div className="team-responses">
            <h4>Team Responses</h4>
            <div className="team-responses-grid">
              {teamMembers.map(member => {
                const status = rsvpData[event.id] && rsvpData[event.id][member];
                const isCurrentUser = member === currentUser;

                return (
                  <div key={member} className={`team-response ${isCurrentUser ? 'current-user' : ''}`}>
                    <span className="response-name">
                      {member}{isCurrentUser ? ' (You)' : ''}
                    </span>
                    <span className={`response-status rsvp-indicator ${status || 'none'}`}>
                      {getRSVPText(status)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventModal;