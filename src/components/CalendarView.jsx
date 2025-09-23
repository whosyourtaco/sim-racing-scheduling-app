import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import EventCard from './EventCard.jsx';

function CalendarView({ events, isAuthenticated, currentUser, rsvpData, teamMembers, openEventModal }) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Initialize Fuse for fuzzy search
  const fuse = useMemo(() => new Fuse(events, {
    keys: ['name'],
    threshold: 0.3,
    includeScore: true
  }), [events]);

  // Extract unique values for filters
  const uniqueClasses = useMemo(() => {
    const classes = new Set();
    events.forEach(event => {
      event.classes.forEach(cls => classes.add(cls));
    });
    return Array.from(classes).sort();
  }, [events]);

  const uniqueDurations = useMemo(() => {
    const durations = new Set(events.map(event => event.duration));
    return Array.from(durations).sort((a, b) => a - b);
  }, [events]);


  // Apply comprehensive filtering
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Date filter (upcoming events)
    if (dateRange !== 'all') {
      const now = new Date();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const oneMonth = 30 * 24 * 60 * 60 * 1000;

      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_time);
        switch (dateRange) {
          case 'upcoming':
            return eventDate > now;
          case 'week':
            return eventDate > now && eventDate <= new Date(now.getTime() + oneWeek);
          case 'month':
            return eventDate > now && eventDate <= new Date(now.getTime() + oneMonth);
          default:
            return true;
        }
      });
    } else {
      // Default: only show future events
      filtered = filtered.filter(event => new Date(event.start_time) > new Date());
    }

    // Type filter
    if (filter !== 'all') {
      filtered = filtered.filter(event => event.type === filter);
    }

    // Class filter
    if (classFilter !== 'all') {
      filtered = filtered.filter(event => event.classes.includes(classFilter));
    }

    // Duration filter
    if (durationFilter !== 'all') {
      filtered = filtered.filter(event => event.duration === parseInt(durationFilter));
    }

    // Search filter
    if (searchQuery.trim()) {
      const searchResults = fuse.search(searchQuery);
      const matchedEventIds = new Set(searchResults.map(result => result.item.id));
      filtered = filtered.filter(event => matchedEventIds.has(event.id));
    }

    return filtered;
  }, [events, filter, classFilter, durationFilter, dateRange, searchQuery, fuse]);

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

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
      <div className="filters-section">
        <div className="event-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Events
          </button>
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

        <div className="advanced-filters">
          <div className="filter-group">
            <label htmlFor="class-filter" className="filter-label">Class:</label>
            <select
              id="class-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="form-control filter-select"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="duration-filter" className="filter-label">Duration:</label>
            <select
              id="duration-filter"
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="form-control filter-select"
            >
              <option value="all">All Durations</option>
              {uniqueDurations.map(duration => (
                <option key={duration} value={duration}>{duration}h</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="date-filter" className="filter-label">Timeframe:</label>
            <select
              id="date-filter"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-control filter-select"
            >
              <option value="all">All Upcoming</option>
              <option value="week">Next 7 Days</option>
              <option value="month">Next 30 Days</option>
            </select>
          </div>

          <button
            className="btn btn--outline filter-clear-btn"
            onClick={() => {
              setFilter('special');
              setClassFilter('all');
              setDurationFilter('all');
              setDateRange('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </button>
        </div>
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