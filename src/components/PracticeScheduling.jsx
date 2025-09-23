import React, { useState, useMemo } from 'react';
import { formatDate } from '../utils/formatters.js';

function PracticeScheduling({ events, currentUser, teamMembers, practiceData, updatePracticeAvailability, rsvpData }) {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [viewMode, setViewMode] = useState('selection'); // 'selection', 'availability', 'results'
  const [userAvailability, setUserAvailability] = useState({});

  // Get upcoming events where user has RSVP'd as "available"
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(event => {
        // Must be future event
        if (new Date(event.start_time) <= now) return false;

        // Must have RSVP'd as "available"
        const userRsvp = rsvpData[event.id] && rsvpData[event.id][currentUser];
        return userRsvp === 'available';
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(0, 10); // Show next 10 events
  }, [events, rsvpData, currentUser]);

  const selectedEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  // Generate practice dates (2 weeks before event)
  const practiceDates = useMemo(() => {
    if (!selectedEvent) return [];

    const eventDate = new Date(selectedEvent.start_time);
    const dates = [];

    // Generate 14 days before the event
    for (let i = 13; i >= 0; i--) {
      const date = new Date(eventDate);
      date.setDate(eventDate.getDate() - i);
      dates.push(date);
    }

    return dates;
  }, [selectedEvent]);

  // Time slots with GMT times converted to user's timezone
  const timeSlots = useMemo(() => {
    return [
      {
        id: 'aussie',
        name: 'Aussie Friendly',
        gmtTime: '11:00',
        description: 'Morning AEDT / Late Evening Americas'
      },
      {
        id: 'eu',
        name: 'EU Friendly',
        gmtTime: '16:00',
        description: 'Afternoon EU / Morning Americas'
      }
    ];
  }, []);

  // Convert GMT time to user's local time
  const getLocalTime = (gmtTime) => {
    const today = new Date();
    const gmtDateTime = new Date(`${today.toDateString()} ${gmtTime} GMT`);
    return gmtDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Calculate aggregated availability for results view
  const aggregatedResults = useMemo(() => {
    if (!selectedEventId || !practiceData[selectedEventId]) return [];

    const results = [];
    const eventPracticeData = practiceData[selectedEventId];

    practiceDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0];

      timeSlots.forEach(slot => {
        const slotKey = `${dateKey}_${slot.id}`;
        const availableMembers = teamMembers.filter(member =>
          eventPracticeData[member] && eventPracticeData[member][slotKey]
        );

        results.push({
          date,
          dateKey,
          slot,
          slotKey,
          availableCount: availableMembers.length,
          availableMembers,
          percentage: Math.round((availableMembers.length / teamMembers.length) * 100)
        });
      });
    });

    // Sort by attendance (highest first), then by date
    return results.sort((a, b) => {
      if (b.availableCount !== a.availableCount) {
        return b.availableCount - a.availableCount;
      }
      return a.date - b.date;
    });
  }, [selectedEventId, practiceData, practiceDates, timeSlots, teamMembers]);

  const handleEventSelect = (eventId) => {
    setSelectedEventId(eventId);
    setViewMode('availability');

    // Load existing user availability for this event
    if (practiceData[eventId] && practiceData[eventId][currentUser]) {
      setUserAvailability(practiceData[eventId][currentUser]);
    } else {
      setUserAvailability({});
    }
  };

  const handleAvailabilityToggle = (dateKey, slotId) => {
    const slotKey = `${dateKey}_${slotId}`;
    const newAvailability = {
      ...userAvailability,
      [slotKey]: !userAvailability[slotKey]
    };

    setUserAvailability(newAvailability);
  };

  const handleSubmitAvailability = async () => {
    if (!selectedEventId) return;

    await updatePracticeAvailability(selectedEventId, currentUser, userAvailability);
    setViewMode('results');
  };

  const resetSelection = () => {
    setSelectedEventId('');
    setViewMode('selection');
    setUserAvailability({});
  };

  if (viewMode === 'selection') {
    return (
      <div className="view-header">
        <h2>Practice Session Scheduling</h2>
        <p className="view-description">
          Schedule practice sessions for events you're attending. Only events where you've RSVP'd as "Available" are shown.
        </p>

        {upcomingEvents.length === 0 ? (
          <div className="no-available-events">
            <div className="no-events-content">
              <h3>No Events Available for Practice Scheduling</h3>
              <p>
                You haven't RSVP'd as "Available" for any upcoming events.
                Visit the <strong>Upcoming Events</strong> tab to RSVP for events you want to attend.
              </p>
              <p className="note">
                Once you RSVP as "Available" for an event, it will appear here for practice scheduling.
              </p>
            </div>
          </div>
        ) : (
          <div className="event-selection-grid">
            {upcomingEvents.map(event => (
            <div
              key={event.id}
              className="event-selection-card"
              onClick={() => handleEventSelect(event.id)}
            >
              <div className="event-selection-header">
                <h3 className="event-selection-name">{event.name}</h3>
                <span className={`event-type-badge ${event.type}`}>
                  {event.type === 'special' ? 'Special' : 'GET'}
                </span>
              </div>
              <div className="event-selection-meta">
                <div className="event-selection-date">
                  {formatDate(new Date(event.start_time))}
                </div>
                <div className="event-selection-classes">
                  {event.classes.join(', ')}
                </div>
              </div>
              <div className="event-selection-action">
                <span className="action-text">Schedule Practice →</span>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === 'availability') {
    return (
      <div className="view-header">
        <div className="practice-header">
          <button className="btn btn--outline" onClick={resetSelection}>
            ← Back to Events
          </button>
          <div className="practice-event-info">
            <h2>Practice Availability</h2>
            <p className="selected-event-name">{selectedEvent?.name}</p>
            <p className="practice-period">
              2 weeks prior: {formatDate(practiceDates[0])} - {formatDate(practiceDates[practiceDates.length - 1])}
            </p>
          </div>
        </div>

        <div className="time-slots-legend">
          <h3>Time Slots</h3>
          <div className="time-slots-info">
            {timeSlots.map(slot => (
              <div key={slot.id} className="time-slot-info">
                <strong>{slot.name}</strong>
                <span className="time-display">
                  {getLocalTime(slot.gmtTime)} (your time)
                </span>
                <span className="time-description">{slot.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="availability-grid">
          <div className="availability-header">
            <div className="date-header">Date</div>
            {timeSlots.map(slot => (
              <div key={slot.id} className="slot-header">
                {slot.name}
              </div>
            ))}
          </div>

          {practiceDates.map(date => {
            const dateKey = date.toISOString().split('T')[0];
            return (
              <div key={dateKey} className="availability-row">
                <div className="date-cell">
                  <div className="date-main">{formatDate(date)}</div>
                  <div className="date-day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                </div>

                {timeSlots.map(slot => {
                  const slotKey = `${dateKey}_${slot.id}`;
                  const isAvailable = userAvailability[slotKey];

                  return (
                    <div key={slot.id} className="availability-cell">
                      <button
                        className={`availability-toggle ${isAvailable ? 'available' : 'unavailable'}`}
                        onClick={() => handleAvailabilityToggle(dateKey, slot.id)}
                      >
                        {isAvailable ? '✓ Available' : 'Not Available'}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="availability-actions">
          <button
            className="btn btn--primary"
            onClick={handleSubmitAvailability}
          >
            Submit Availability
          </button>
          <button
            className="btn btn--outline"
            onClick={() => setViewMode('results')}
          >
            View Team Results
          </button>
        </div>
      </div>
    );
  }

  if (viewMode === 'results') {
    return (
      <div className="view-header">
        <div className="practice-header">
          <button className="btn btn--outline" onClick={resetSelection}>
            ← Back to Events
          </button>
          <div className="practice-event-info">
            <h2>Team Practice Availability</h2>
            <p className="selected-event-name">{selectedEvent?.name}</p>
          </div>
        </div>

        <div className="results-actions">
          <button
            className="btn btn--secondary"
            onClick={() => setViewMode('availability')}
          >
            Update My Availability
          </button>
        </div>

        <div className="results-grid">
          {aggregatedResults.length === 0 ? (
            <div className="no-results">
              <p>No availability data yet. Be the first to submit your availability!</p>
            </div>
          ) : (
            <div className="results-list">
              {aggregatedResults.map(result => (
                <div key={result.slotKey} className="result-item">
                  <div className="result-header">
                    <div className="result-date-info">
                      <span className="result-date">{formatDate(result.date)}</span>
                      <span className="result-day">{result.date.toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    </div>
                    <div className="result-slot-info">
                      <span className="result-slot">{result.slot.name}</span>
                      <span className="result-time">{getLocalTime(result.slot.gmtTime)}</span>
                    </div>
                    <div className="result-attendance">
                      <span className="attendance-count">
                        {result.availableCount}/{teamMembers.length}
                      </span>
                      <span className="attendance-percentage">
                        {result.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="result-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${result.percentage}%` }}
                      />
                    </div>
                  </div>

                  {result.availableMembers.length > 0 && (
                    <div className="result-members">
                      <span className="members-label">Available:</span>
                      <div className="members-list">
                        {result.availableMembers.map(member => (
                          <span
                            key={member}
                            className={`member-tag ${member === currentUser ? 'current-user' : ''}`}
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default PracticeScheduling;