import { useState, useEffect } from 'react';
import {
  loadTeamMembersFromFirebase,
  loadRSVPDataFromFirebase,
  loadPracticeDataFromFirebase,
  saveTeamMembersToFirebase,
  saveRSVPDataToFirebase,
  savePracticeDataToFirebase,
  setupTeamMembersListener,
  setupRSVPDataListener,
  setupPracticeDataListener,
  refreshData
} from '../firebase/database.js';

export function useAppData() {
  const [events, setEvents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [rsvpData, setRsvpData] = useState({});
  const [practiceData, setPracticeData] = useState({});
  const [loading, setLoading] = useState(true);

  // Load events data
  const loadEvents = async () => {
    try {
      const response = await fetch('/sim-racing-scheduling-app/events_data.json');
      const eventsData = await response.json();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Load user data from Firebase and localStorage
  const loadUserData = async () => {
    try {
      // Load registered team members from Firebase
      const firebaseTeamMembers = await loadTeamMembersFromFirebase();
      if (firebaseTeamMembers && firebaseTeamMembers.length > 0) {
        setTeamMembers(firebaseTeamMembers);
      } else {
        // Fallback to localStorage
        const savedTeamMembers = localStorage.getItem('teamMembers');
        if (savedTeamMembers) {
          const parsedMembers = JSON.parse(savedTeamMembers);
          setTeamMembers(parsedMembers);
          // Push local data to Firebase if it exists but Firebase is empty
          if (parsedMembers.length > 0) {
            await saveTeamMembersToFirebase(parsedMembers);
          }
        }
      }

      // Load saved RSVP data from Firebase
      const firebaseRSVPData = await loadRSVPDataFromFirebase();
      if (firebaseRSVPData && Object.keys(firebaseRSVPData).length > 0) {
        setRsvpData(firebaseRSVPData);
      } else {
        // Fallback to localStorage
        const savedRSVPData = localStorage.getItem('rsvpData');
        if (savedRSVPData) {
          const parsedRSVPData = JSON.parse(savedRSVPData);
          setRsvpData(parsedRSVPData);
          // Push local data to Firebase if it exists but Firebase is empty
          if (Object.keys(parsedRSVPData).length > 0) {
            await saveRSVPDataToFirebase(parsedRSVPData);
          }
        }
      }

      // Load saved practice data from Firebase
      const firebasePracticeData = await loadPracticeDataFromFirebase();
      if (firebasePracticeData && Object.keys(firebasePracticeData).length > 0) {
        setPracticeData(firebasePracticeData);
      } else {
        // Fallback to encrypted localStorage
        const { decryptData } = await import('../utils/encryption.js');
        const encryptedData = localStorage.getItem('practiceData');
        const localPracticeData = decryptData(encryptedData) || {};
        if (Object.keys(localPracticeData).length > 0) {
          setPracticeData(localPracticeData);
          // Push local data to Firebase if it exists but Firebase is empty
          await savePracticeDataToFirebase(localPracticeData);
        }
      }

      // Set up real-time listeners for data changes
      setupDataListeners();
    } catch (error) {
      console.error("Error loading user data:", error);
      // Fallback to localStorage if Firebase fails
      const savedTeamMembers = localStorage.getItem('teamMembers');
      if (savedTeamMembers) {
        setTeamMembers(JSON.parse(savedTeamMembers));
      }

      const savedRSVPData = localStorage.getItem('rsvpData');
      if (savedRSVPData) {
        setRsvpData(JSON.parse(savedRSVPData));
      }
    }
  };

  // Set up real-time listeners for data changes
  const setupDataListeners = () => {
    // Listen for team members changes
    setupTeamMembersListener((data) => {
      // Only update if the data is different
      setTeamMembers(prevMembers => {
        if (JSON.stringify(prevMembers) !== JSON.stringify(data)) {
          return data;
        }
        return prevMembers;
      });
    });

    // Listen for RSVP data changes
    setupRSVPDataListener((data) => {
      // Only update if the data is different
      setRsvpData(prevData => {
        if (JSON.stringify(prevData) !== JSON.stringify(data)) {
          return data;
        }
        return prevData;
      });
    });

    // Listen for practice data changes
    setupPracticeDataListener((data) => {
      // Only update if the data is different
      setPracticeData(prevData => {
        if (JSON.stringify(prevData) !== JSON.stringify(data)) {
          return data;
        }
        return prevData;
      });
    });
  };

  // Initialize RSVP data
  const initializeRSVPData = (eventsData, teamMembersData) => {
    setRsvpData(prevRsvpData => {
      let newRsvpData = { ...prevRsvpData };

      // Only initialize RSVP data if it doesn't exist
      if (!newRsvpData || Object.keys(newRsvpData).length === 0) {
        newRsvpData = {};
        eventsData.forEach(event => {
          newRsvpData[event.id] = {};
          teamMembersData.forEach(member => {
            // Randomly assign RSVP status for simulation
            const statuses = ['available', 'maybe', 'unavailable', null];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            newRsvpData[event.id][member] = randomStatus;
          });
        });
      }

      // Ensure all events and team members are covered in RSVP data
      eventsData.forEach(event => {
        if (!newRsvpData[event.id]) {
          newRsvpData[event.id] = {};
        }

        teamMembersData.forEach(member => {
          if (newRsvpData[event.id][member] === undefined) {
            newRsvpData[event.id][member] = null;
          }
        });
      });

      return newRsvpData;
    });
  };

  // Manual refresh function for the refresh button
  const refreshAppData = async () => {
    try {
      const data = await refreshData();
      if (data) {
        setTeamMembers(data.teamMembers);
        setRsvpData(data.rsvpData);
        setPracticeData(data.practiceData);
        return true;
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      return false;
    }
  };

  // Update RSVP
  const updateRSVP = async (eventId, member, status) => {
    const newRsvpData = { ...rsvpData };
    if (!newRsvpData[eventId]) {
      newRsvpData[eventId] = {};
    }
    newRsvpData[eventId][member] = status;
    setRsvpData(newRsvpData);

    // Save to Firebase
    try {
      await saveRSVPDataToFirebase(newRsvpData);
      console.log(`RSVP updated for ${member} to ${status} for event ${eventId} and synchronized to Firebase`);
    } catch (error) {
      console.error("Error saving RSVP update to Firebase:", error);
      // Still save to localStorage as backup
      localStorage.setItem('rsvpData', JSON.stringify(newRsvpData));
      alert("Your RSVP was saved locally but couldn't be synchronized. Please try refreshing later.");
    }
  };

  // Update practice availability
  const updatePracticeAvailability = async (eventId, member, availability) => {
    const newPracticeData = {
      ...practiceData,
      [eventId]: {
        ...practiceData[eventId],
        [member]: availability
      }
    };
    setPracticeData(newPracticeData);

    // Save to Firebase
    try {
      await savePracticeDataToFirebase(newPracticeData);
      console.log(`Practice availability updated for ${member} on event ${eventId} and synchronized to Firebase`);
    } catch (error) {
      console.error("Error saving practice data to Firebase:", error);
      // Still save encrypted to localStorage as backup
      const { encryptData } = await import('../utils/encryption.js');
      const encrypted = encryptData(newPracticeData);
      localStorage.setItem('practiceData', encrypted);
      alert("Your practice availability was saved locally but couldn't be synchronized. Please try refreshing later.");
    }
  };

  // Initialize the application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // First load events data
        await loadEvents();

        // Then load user data from Firebase
        await loadUserData();

        setLoading(false);
        console.log("Application initialized with Firebase synchronization");
      } catch (error) {
        console.error("Error initializing application:", error);
        alert("There was an error initializing the application. Some features may not work properly.");
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Initialize RSVP data when events and team members are loaded
  useEffect(() => {
    if (events.length > 0 && teamMembers.length > 0) {
      initializeRSVPData(events, teamMembers);
    }
  }, [events, teamMembers]);

  return {
    events,
    teamMembers,
    setTeamMembers,
    rsvpData,
    setRsvpData,
    practiceData,
    setPracticeData,
    loading,
    refreshAppData,
    updateRSVP,
    updatePracticeAvailability
  };
}