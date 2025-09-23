import React, {useState, useEffect} from 'react';
import Header from './components/Header.jsx';
import MainNavigation from './components/MainNavigation.jsx';
import CalendarView from './components/CalendarView.jsx';
import TeamView from './components/TeamView.jsx';
import PracticeScheduling from './components/PracticeScheduling.jsx';
import EventModal from './components/EventModal.jsx';
import SecureAuthModal from './components/SecureAuthModal.jsx';
import {useAuth} from './hooks/useAuth.js';
import {useAppData} from './hooks/useAppData.js';
import './style.css';

function App() {
    const [currentView, setCurrentView] = useState('calendar');
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);
    const [authenticationChecked, setAuthenticationChecked] = useState(false);
    const [practiceData, setPracticeData] = useState(() => {
        const saved = localStorage.getItem('practiceData');
        return saved ? JSON.parse(saved) : {};
    });

    const {
        currentUser,
        isAuthenticated,
        requiresMigration,
        registerUser,
        signIn,
        signOut,
        checkUserMigrationStatus,
        migrateLegacyUser
    } = useAuth();

    const {
        events,
        teamMembers,
        setTeamMembers,
        rsvpData,
        setRsvpData,
        loading,
        refreshAppData,
        updateRSVP
    } = useAppData();

    const currentEvent = currentEventId ? events.find(e => e.id === currentEventId) : null;

    const openEventModal = (eventId) => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            setAuthModalOpen(true);
            return;
        }

        setCurrentEventId(eventId);
        setEventModalOpen(true);
    };

    const closeEventModal = () => {
        setEventModalOpen(false);
        setCurrentEventId(null);
    };

    const showAuthModal = () => {
        setAuthModalOpen(true);
    };

    const closeAuthModal = () => {
        // Only allow closing if user is authenticated
        if (isAuthenticated) {
            setAuthModalOpen(false);
        }
    };

    const handleSignOut = () => {
        signOut();
        closeEventModal();
        // Clear practice data on sign out for privacy
        setPracticeData({});
        localStorage.removeItem('practiceData');
        // Force authentication modal to open after sign out
        setAuthModalOpen(true);
    };

    const handleUpdateRSVP = async (eventId, member, status) => {
        if (!isAuthenticated || !member) {
            return;
        }

        await updateRSVP(eventId, member, status);
    };

    const updatePracticeAvailability = async (eventId, member, availability) => {
        if (!isAuthenticated || !member) {
            return;
        }

        const newPracticeData = {
            ...practiceData,
            [eventId]: {
                ...practiceData[eventId],
                [member]: availability
            }
        };

        setPracticeData(newPracticeData);

        // Save to localStorage
        localStorage.setItem('practiceData', JSON.stringify(newPracticeData));

        // TODO: Save to Firebase/database
        console.log(`Practice availability updated for ${member} on event ${eventId}:`, availability);
    };

    // Force authentication on app load
    useEffect(() => {
        if (!loading) {
            setAuthenticationChecked(true);
            if (!isAuthenticated) {
                setAuthModalOpen(true);
            }
        }
    }, [isAuthenticated, loading]);

    // Close modals with Escape key
    useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                closeEventModal();
                // Only allow closing auth modal if authentication is not required
                if (isAuthenticated) {
                    closeAuthModal();
                }
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isAuthenticated]);

    if (loading) {
        return (
            <div className="container">
                <div style={{textAlign: 'center', padding: '2rem'}}>
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="app">
            <Header
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
                signOut={handleSignOut}
                showAuthModal={showAuthModal}
                refreshAppData={refreshAppData}
            />

            <header className="header">
                <div className="header-content gap-4 justify-center">
                    <MainNavigation
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                    />
                </div>
            </header>

                <main className="main-content">
                    {currentView === 'calendar' && (
                        <div className="view active">
                            <CalendarView
                                events={events}
                                isAuthenticated={isAuthenticated}
                                currentUser={currentUser}
                                rsvpData={rsvpData}
                                teamMembers={teamMembers}
                                openEventModal={openEventModal}
                            />
                        </div>
                    )}

                    {currentView === 'team' && (
                        <div className="view active">
                            <TeamView
                                events={events}
                                teamMembers={teamMembers}
                                rsvpData={rsvpData}
                                currentUser={currentUser}
                            />
                        </div>
                    )}

                    {currentView === 'practice' && (
                        <div className="view active">
                            <PracticeScheduling
                                events={events}
                                currentUser={currentUser}
                                teamMembers={teamMembers}
                                practiceData={practiceData}
                                updatePracticeAvailability={updatePracticeAvailability}
                                rsvpData={rsvpData}
                            />
                        </div>
                    )}
                </main>

                <EventModal
                    event={currentEvent}
                    isOpen={eventModalOpen}
                    onClose={closeEventModal}
                    currentUser={currentUser}
                    rsvpData={rsvpData}
                    teamMembers={teamMembers}
                    updateRSVP={handleUpdateRSVP}
                />

                <SecureAuthModal
                    isOpen={authModalOpen}
                    onClose={closeAuthModal}
                    registerUser={registerUser}
                    signIn={signIn}
                    migrateLegacyUser={migrateLegacyUser}
                    teamMembers={teamMembers}
                    setTeamMembers={setTeamMembers}
                    events={events}
                    rsvpData={rsvpData}
                    setRsvpData={setRsvpData}
                    isRequired={!isAuthenticated}
                    requiresMigration={requiresMigration}
                />
        </div>
);
}

export default App;