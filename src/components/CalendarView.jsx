import React, { useState } from 'react';
import EventCard from './EventCard.jsx';

function CalendarView({ events, isAuthenticated, currentUser, rsvpData, teamMembers, openEventModal }) {
  const [filter, setFilter] = useState('special');

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter).filter(event => new Date(event.start_time) > new Date());

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div className="view-header">
      <h2>Upcoming Events</h2>
      <div className="event-filters">
        <button
          className={`filter-btn ${filter === 'special' ? 'active' : ''}`}
          onClick={() => setFilter('special')}
        >
          Special Events
        </button>
        <button
          className={`filter-btn ${filter === 'get' ? 'active' : ''}`}
          onClick={() => setFilter('get')}
        >
          GET Series
        </button>
      </div>
      <div className="events-grid">
        {sortedEvents.map(event => (
          <EventCard
            key={event.id}
            event={event}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            rsvpData={rsvpData}
            teamMembers={teamMembers}
            openEventModal={openEventModal}
          />
        ))}
      </div>
    </div>
  );
}

export default CalendarView;