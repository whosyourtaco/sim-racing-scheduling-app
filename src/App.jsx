import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import MainNavigation from './components/MainNavigation.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import PracticePage from './pages/PracticePage.jsx';
import EventModal from './components/EventModal.jsx';
import SecureAuthModal from './components/SecureAuthModal.jsx';
import {useAuth} from './hooks/useAuth.js';
import {useAppData} from './hooks/useAppData.js';
import './style.css';

function App() {
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [currentEventId, setCurrentEventId] = useState(null);

    const {
        currentUser,
        isAuthenticated,
        requiresMigration,
        registerUser,
        signIn,
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
        setAuthModalOpen(false);
    };

    const handleUpdateRSVP = async (eventId, member, status) => {
        if (!isAuthenticated || !member) {
            return;
        }

        await updateRSVP(eventId, member, status);
    };

    // updatePracticeAvailability is now provided by useAppData hook

    // Force authentication on app load
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            setAuthModalOpen(true);
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
        <Router basename="/sim-racing-scheduling-app">
            <div className="app">
                <Header
                    isAuthenticated={isAuthenticated}
                    currentUser={currentUser}
                    showAuthModal={showAuthModal}
                    refreshAppData={refreshAppData}
                />

                <header className="header">
                    <div className="header-content gap-4 justify-center">
                        <MainNavigation />
                    </div>
                </header>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<CalendarPage openEventModal={openEventModal} />} />
                        <Route path="/team" element={<TeamPage />} />
                        <Route path="/practice" element={<PracticePage />} />
                    </Routes>
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
        </Router>
    );
}

export default App;