// Application state
let events = [];
let teamMembers = [];
let currentUser = null;
let rsvpData = {};
let currentEventId = null;
let isAuthenticated = false;

// Sample team members - only used if no registered users exist
const sampleTeamMembers = [
    'Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Thompson',
    'David Kim', 'Lisa Wang', 'James Wilson', 'Rachel Green',
    'Tom Martinez', 'Jessica Lee'
];

// Close modal function - define early for global access
function closeModal() {
    document.getElementById('event-modal').classList.add('hidden');
    currentEventId = null;
}

// Close auth modal function
function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

// Show auth modal function
function showAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    // Reset form fields
    document.getElementById('login-name').value = '';
    document.getElementById('register-name').value = '';
}

// Open event modal function - define early for global access
function openEventModal(eventId) {
    // Check if user is authenticated
    if (!isAuthenticated) {
        showAuthModal();
        return;
    }
    
    currentEventId = eventId;
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const eventDate = new Date(event.start_time);
    
    // Populate modal content
    document.getElementById('modal-event-name').textContent = event.name;
    document.getElementById('modal-series').textContent = event.series;
    document.getElementById('modal-track').textContent = event.track;
    document.getElementById('modal-date').textContent = formatDateTime(eventDate);
    document.getElementById('modal-duration').textContent = `${event.duration} hours`;
    document.getElementById('modal-classes').textContent = event.classes.join(', ');
    
    // Update RSVP buttons
    const userRSVP = rsvpData[eventId][currentUser];
    updateRSVPButtons(userRSVP);
    
    // Render team responses
    renderModalTeamResponses();
    
    // Show modal
    document.getElementById('event-modal').classList.remove('hidden');
}

// Show specific view function - define early for global access
function showView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadEvents();
    loadUserData();
    initializeTeam();
    initializeRSVPData();
    renderEvents();
    renderTeamStatus();
    setupEventListeners();
    updateAuthUI();
});

// Load events data
async function loadEvents() {
    const response = await fetch('events_data.json');
    events = await response.json();
}

// Load user data from localStorage
function loadUserData() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        isAuthenticated = true;
    }
    
    // Load registered team members
    const savedTeamMembers = localStorage.getItem('teamMembers');
    if (savedTeamMembers) {
        teamMembers = JSON.parse(savedTeamMembers);
    }
    
    // Load saved RSVP data
    const savedRSVPData = localStorage.getItem('rsvpData');
    if (savedRSVPData) {
        rsvpData = JSON.parse(savedRSVPData);
    }
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('currentUser', currentUser);
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    localStorage.setItem('rsvpData', JSON.stringify(rsvpData));
}

// Initialize team members
function initializeTeam() {
    // Only use sample team members if no team members exist
    if (!teamMembers || teamMembers.length === 0) {
        teamMembers = [...sampleTeamMembers];
    }
}

// Initialize RSVP data
function initializeRSVPData() {
    // Only initialize RSVP data if it doesn't exist
    if (!rsvpData || Object.keys(rsvpData).length === 0) {
        rsvpData = {};
        events.forEach(event => {
            rsvpData[event.id] = {};
            teamMembers.forEach(member => {
                // Randomly assign RSVP status for simulation
                const statuses = ['available', 'maybe', 'unavailable', null];
                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                rsvpData[event.id][member] = randomStatus;
            });
        });
    }
    
    // Ensure all events and team members are covered in RSVP data
    events.forEach(event => {
        if (!rsvpData[event.id]) {
            rsvpData[event.id] = {};
        }
        
        teamMembers.forEach(member => {
            if (rsvpData[event.id][member] === undefined) {
                rsvpData[event.id][member] = null;
            }
        });
    });
}

// Update authentication UI
function updateAuthUI() {
    const authButton = document.getElementById('auth-button');
    
    if (isAuthenticated && currentUser) {
        authButton.textContent = `Sign Out (${currentUser})`;
        authButton.onclick = function() {
            signOut();
        };
    } else {
        authButton.textContent = 'Sign In';
        authButton.onclick = function() {
            showAuthModal();
        };
    }
}

// Register a new user
function registerUser(name) {
    if (!name || name.trim() === '') {
        alert('Please enter your name');
        return;
    }
    
    // Check if name already exists
    if (teamMembers.includes(name)) {
        alert('This name is already registered. Please use a different name or sign in.');
        return;
    }
    
    // Add user to team members
    teamMembers.push(name);
    
    // Add user to RSVP data
    events.forEach(event => {
        if (!rsvpData[event.id]) {
            rsvpData[event.id] = {};
        }
        rsvpData[event.id][name] = null;
    });
    
    // Set as current user
    currentUser = name;
    isAuthenticated = true;
    
    // Save data
    saveUserData();
    
    // Update UI
    updateAuthUI();
    closeAuthModal();
    
    // Refresh views
    renderEvents();
    renderTeamStatus();
}

// Sign in existing user
function signIn(name) {
    if (!name || name.trim() === '') {
        alert('Please enter your name');
        return;
    }
    
    // Check if name exists
    if (!teamMembers.includes(name)) {
        alert('This name is not registered. Please register first.');
        return;
    }
    
    // Set as current user
    currentUser = name;
    isAuthenticated = true;
    
    // Save data
    saveUserData();
    
    // Update UI
    updateAuthUI();
    closeAuthModal();
    
    // Refresh views
    renderEvents();
    renderTeamStatus();
}

// Sign out
function signOut() {
    currentUser = null;
    isAuthenticated = false;
    
    // Remove from localStorage
    localStorage.removeItem('currentUser');
    
    // Update UI
    updateAuthUI();
    
    // Refresh views
    renderEvents();
    renderTeamStatus();
}

// Switch auth tabs
function switchAuthTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.auth-tab-btn[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.auth-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderEvents(this.dataset.filter);
        });
    });

    // RSVP buttons in modal
    document.querySelectorAll('.rsvp-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const status = this.dataset.status;
            updateRSVP(currentEventId, currentUser, status);
            updateRSVPButtons(status);
            renderModalTeamResponses();
            renderEvents();
            renderTeamStatus();
            saveUserData(); // Save RSVP data
        });
    });

    // Auth tab buttons
    document.querySelectorAll('.auth-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchAuthTab(this.dataset.tab);
        });
    });
    
    // Register button
    document.getElementById('register-btn').addEventListener('click', function() {
        const name = document.getElementById('register-name').value.trim();
        registerUser(name);
    });
    
    // Login button
    document.getElementById('login-btn').addEventListener('click', function() {
        const name = document.getElementById('login-name').value.trim();
        signIn(name);
    });

    // Event modal close button
    document.querySelector('#event-modal .modal-close').addEventListener('click', closeModal);
    
    // Auth modal close button
    document.querySelector('#auth-modal .modal-close').addEventListener('click', closeAuthModal);

    // Close modals when clicking backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop')) {
            if (e.target.closest('#event-modal')) {
                closeModal();
            } else if (e.target.closest('#auth-modal')) {
                closeAuthModal();
            }
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeAuthModal();
        }
    });
}

// Render events grid
function renderEvents(filter = 'special') {
    const grid = document.getElementById('events-grid');
    const filteredEvents = filter === 'all' ? events : events.filter(event => event.type === filter).filter(event => new Date(event.start_time) > new Date());
    
    // Sort events by date
    filteredEvents.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    
    grid.innerHTML = filteredEvents.map(event => {
        const eventDate = new Date(event.start_time);
        const userRSVP = rsvpData[event.id] && rsvpData[event.id][currentUser];
        
        return `
            <div class="event-card" onclick="openEventModal('${event.id}')">
                <div class="event-type-badge ${event.type}">${event.type === 'special' ? 'Special' : 'GET'}</div>
                <h3 class="event-name">${event.name}</h3>
                <p class="event-track">${event.track}</p>
                <div class="event-meta">
                    <div class="event-meta-item">
                        <span class="event-meta-label">Date:</span>
                        <span>${formatDate(eventDate)}</span>
                    </div>
                    <div class="event-meta-item">
                        <span class="event-meta-label">Start Time:</span>
                        <span>${formatTime(eventDate)}</span>
                    </div>
                    <div class="event-meta-item">
                        <span class="event-meta-label">Duration:</span>
                        <span>${event.duration}h</span>
                    </div>
                    <div class="event-meta-item">
                        <span class="event-meta-label">Series:</span>
                        <span>${event.series}</span>
                    </div>
                </div>
                <div class="event-classes">
                    ${event.classes.map(cls => `<span class="class-badge">${cls}</span>`).join('')}
                </div>
                <div class="event-rsvp-status">
                    <span class="rsvp-indicator ${userRSVP || 'none'}">
                        ${getRSVPText(userRSVP)}
                    </span>
                    <span class="team-availability">${getTeamAvailability(event.id)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Render team status
function renderTeamStatus() {
    updateTeamStats();
    
    const grid = document.getElementById('team-grid');
    grid.innerHTML = events.map(event => {
        const eventDate = new Date(event.start_time);
        
        return `
            <div class="team-event-row">
                <div class="team-event-header">
                    <span class="team-event-name">${event.name}</span>
                    <span class="team-event-date">${formatDate(eventDate)}</span>
                </div>
                <div class="team-members">
                    ${teamMembers.map(member => {
                        const status = rsvpData[event.id][member];
                        return `
                            <div class="team-member">
                                <span class="member-name">${member}</span>
                                <span class="member-rsvp rsvp-indicator ${status || 'none'}">
                                    ${getRSVPText(status)}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Update team statistics
function updateTeamStats() {
    const totalEvents = events.length;
    document.getElementById('total-events').textContent = totalEvents;
    
    let totalAvailability = 0;
    let totalResponses = 0;
    
    events.forEach(event => {
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
    document.getElementById('avg-availability').textContent = `${avgAvailability}%`;
}

// Update RSVP buttons
function updateRSVPButtons(activeStatus) {
    document.querySelectorAll('.rsvp-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === activeStatus) {
            btn.classList.add('active');
        }
    });
}

// Render modal team responses
function renderModalTeamResponses() {
    if (!currentEventId) return;
    
    const grid = document.getElementById('modal-team-responses');
    grid.innerHTML = teamMembers.map(member => {
        const status = rsvpData[currentEventId][member];
        return `
            <div class="team-response">
                <span class="response-name">${member}</span>
                <span class="response-status rsvp-indicator ${status || 'none'}">
                    ${getRSVPText(status)}
                </span>
            </div>
        `;
    }).join('');
}

// Update RSVP
function updateRSVP(eventId, member, status) {
    if (!rsvpData[eventId]) {
        rsvpData[eventId] = {};
    }
    rsvpData[eventId][member] = status;
}

// Format date
function formatDate(date) {
    return date.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format time only
function formatTime(date) {
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date and time
function formatDateTime(date) {
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
function getRSVPText(status) {
    switch (status) {
        case 'available': return 'Available';
        case 'maybe': return 'Maybe';
        case 'unavailable': return 'Unavailable';
        default: return 'No Response';
    }
}

// Get team availability summary
function getTeamAvailability(eventId) {
    const responses = rsvpData[eventId] || {};
    const available = Object.values(responses).filter(status => status === 'available').length;
    const total = Object.values(responses).filter(status => status !== null).length;
    
    return `${available}/${teamMembers.length} available`;
}

// Make functions globally available
window.showView = showView;
window.closeModal = closeModal;
window.openEventModal = openEventModal;