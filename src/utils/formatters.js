// Format date
export function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time only
export function formatTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date and time
export function formatDateTime(date) {
  return date.toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Get RSVP text
export function getRSVPText(status) {
  switch (status) {
    case 'available': return 'Available';
    case 'maybe': return 'Maybe';
    case 'unavailable': return 'Unavailable';
    default: return 'No Response';
  }
}

// Get team availability summary
export function getTeamAvailability(eventId, rsvpData, teamMembers) {
  const responses = rsvpData[eventId] || {};
  const available = Object.values(responses).filter(status => status === 'available').length;

  return `${available}/${teamMembers.length} available`;
}