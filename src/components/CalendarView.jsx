import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import EventCard from './EventCard.jsx';

function CalendarView({ events, isAuthenticated, currentUser, rsvpData, teamMembers, openEventModal }) {
  const [filter, setFilter] = useState('special');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize Fuse for fuzzy search
  const fuse = useMemo(() => new Fuse(events, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true
  }), [events]);

  // Filter by event type
  const typeFilteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.type === filter).filter(event => new Date(event.start_time) > new Date());

  // Apply search filter
  const searchFilteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return typeFilteredEvents;
    }

    const searchResults = fuse.search(searchQuery);
    const matchedEvents = searchResults.map(result => result.item);

    // Filter matched events by current type filter
    return matchedEvents.filter(event => {
      if (filter === 'all') return true;
      return event.type === filter && new Date(event.start_time) > new Date();
    });
  }, [fuse, searchQuery, typeFilteredEvents, filter]);

  // Sort events by date
  const sortedEvents = [...searchFilteredEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

  return (
    <div className="view-header">
      <h2>Upcoming Events</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Search events by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-control search-input"
        />
      </div>
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