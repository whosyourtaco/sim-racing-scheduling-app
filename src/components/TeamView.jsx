import React, { useState, useMemo } from 'react';
import { formatDate, getRSVPText } from '../utils/formatters.js';

function TeamView({ events, teamMembers, rsvpData, currentUser }) {
  const [sortBy, setSortBy] = useState('date');
  const [showAggregated, setShowAggregated] = useState(true);
  const [responseFilter, setResponseFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [attendanceThreshold, setAttendanceThreshold] = useState('all');

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

  // Aggregation logic: group events by base name and select best session
  const processedEvents = useMemo(() => {
    if (!showAggregated) {
      return events;
    }

    // Group events by base name (remove session info)
    const eventGroups = new Map();

    events.forEach(event => {
      // Extract base event name by removing session info
      const baseName = event.name.replace(/\s*-\s*Session\s+\d+$/, '');

      if (!eventGroups.has(baseName)) {
        eventGroups.set(baseName, []);
      }
      eventGroups.get(baseName).push(event);
    });

    // For each group, select the session with highest attendance
    const aggregatedEvents = [];

    eventGroups.forEach((sessions, baseName) => {
      if (sessions.length === 1) {
        // Single session, just add it
        aggregatedEvents.push(sessions[0]);
      } else {
        // Multiple sessions, find the one with highest attendance
        let bestSession = sessions[0];
        let bestAttendance = 0;

        sessions.forEach(session => {
          const attendanceCount = teamMembers.filter(member =>
            rsvpData[session.id] && rsvpData[session.id][member] === 'available'
          ).length;

          if (attendanceCount > bestAttendance) {
            bestAttendance = attendanceCount;
            bestSession = session;
          }
        });

        aggregatedEvents.push({
          ...bestSession,
          aggregatedAttendance: bestAttendance,
          totalSessions: sessions.length
        });
      }
    });

    return aggregatedEvents;
  }, [events, showAggregated, teamMembers, rsvpData]);

  // Apply filters to processed events
  const filteredEvents = useMemo(() => {
    let filtered = processedEvents;

    // Event type filter
    if (eventTypeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === eventTypeFilter);
    }

    // Response filter (filter by current user's response)
    if (responseFilter !== 'all') {
      filtered = filtered.filter(event => {
        const userResponse = rsvpData[event.id] && rsvpData[event.id][currentUser];
        return userResponse === responseFilter;
      });
    }

    // Attendance threshold filter
    if (attendanceThreshold !== 'all') {
      filtered = filtered.filter(event => {
        const attendanceCount = teamMembers.filter(member =>
          rsvpData[event.id] && rsvpData[event.id][member] === 'available'
        ).length;

        switch (attendanceThreshold) {
          case 'low':
            return attendanceCount < teamMembers.length * 0.3;
          case 'medium':
            return attendanceCount >= teamMembers.length * 0.3 && attendanceCount < teamMembers.length * 0.7;
          case 'high':
            return attendanceCount >= teamMembers.length * 0.7;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [processedEvents, eventTypeFilter, responseFilter, attendanceThreshold, rsvpData, currentUser, teamMembers]);

  // Sort events based on selected criteria
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
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
  }, [filteredEvents, sortBy, teamMembers, rsvpData]);

  return (
    <div className="view-header">
      <h2>Team Status Overview</h2>
      <div className="team-stats-row">
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

        <div className="aggregation-controls">
          <button
            className={`btn ${showAggregated ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => setShowAggregated(!showAggregated)}
          >
            {showAggregated ? '📊 Aggregated View' : '📋 All Sessions'}
          </button>
          {showAggregated && (
            <small className="aggregation-hint">
              Showing best-attended session per event
            </small>
          )}
        </div>
      </div>

      <div className="team-controls">
        <div className="team-filters">
          <div className="filter-group">
            <label htmlFor="sort-select" className="filter-label">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control filter-select"
            >
              <option value="date">Date</option>
              <option value="availability">Available People (Most First)</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="event-type-filter" className="filter-label">Event Type:</label>
            <select
              id="event-type-filter"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="form-control filter-select"
            >
              <option value="all">All Types</option>
              <option value="special">Special Events</option>
              <option value="get">GET Series</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="response-filter" className="filter-label">My Response:</label>
            <select
              id="response-filter"
              value={responseFilter}
              onChange={(e) => setResponseFilter(e.target.value)}
              className="form-control filter-select"
            >
              <option value="all">All Events</option>
              <option value="available">Available</option>
              <option value="maybe">Maybe</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="attendance-filter" className="filter-label">Team Attendance:</label>
            <select
              id="attendance-filter"
              value={attendanceThreshold}
              onChange={(e) => setAttendanceThreshold(e.target.value)}
              className="form-control filter-select"
            >
              <option value="all">All Levels</option>
              <option value="high">High (70%+)</option>
              <option value="medium">Medium (30-70%)</option>
              <option value="low">Low (&lt;30%)</option>
            </select>
          </div>
        </div>
      </div>
      <div className="team-grid">
        {sortedEvents.map(event => {
          const eventDate = new Date(event.start_time);
          const availableCount = teamMembers.filter(member =>
            rsvpData[event.id] && rsvpData[event.id][member] === 'available'
          ).length;

          return (
            <div key={event.id} className="team-event-row">
              <div className="team-event-header">
                <div className="event-name-section">
                  <span className="team-event-name">{event.name}</span>
                  {showAggregated && event.totalSessions > 1 && (
                    <span className="session-indicator">
                      Best of {event.totalSessions} sessions
                    </span>
                  )}
                </div>
                <div className="event-meta-section">
                  <span className="team-event-date">{formatDate(eventDate)}</span>
                  <div className="attendance-summary">
                    <span className="attendance-count">
                      {availableCount}/{teamMembers.length} attending
                    </span>
                    <div className="attendance-bar">
                      <div
                        className="attendance-fill"
                        style={{
                          width: `${(availableCount / teamMembers.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
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