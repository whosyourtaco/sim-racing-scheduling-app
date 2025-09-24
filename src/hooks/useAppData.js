import { useState, useEffect, useCallback, useRef } from 'react';
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
  refreshData,
  removeListeners
} from '../firebase/database.js';

export function useAppData() {
  const [events, setEvents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [rsvpData, setRsvpData] = useState({});
  const [practiceData, setPracticeData] = useState({});
  const [loading, setLoading] = useState(true);

  // Track initialization status to prevent multiple initializations
  const isInitialized = useRef(false);
  const listenersSetup = useRef(false);

  // Load events data - memoized to prevent recreation
  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch('/sim-racing-scheduling-app/events_data.json');
      const eventsData = await response.json();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }, []);

  // Load user data from Firebase and localStorage - memoized
  const loadUserData = useCallback(async () => {
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
  }, []);

  // Set up real-time listeners for data changes - memoized and prevents duplicates
  const setupDataListeners = useCallback(() => {
    // Prevent setting up listeners multiple times
    if (listenersSetup.current) {
      return;
    }

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

    listenersSetup.current = true;
  }, []);

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

  // Manual refresh function for the refresh button - memoized
  const refreshAppData = useCallback(async () => {
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
  }, []);

  // Update RSVP - memoized
  const updateRSVP = useCallback(async (eventId, member, status) => {
    setRsvpData(prevRsvpData => {
      const newRsvpData = { ...prevRsvpData };
      if (!newRsvpData[eventId]) {
        newRsvpData[eventId] = {};
      }
      newRsvpData[eventId][member] = status;

      // Save to Firebase asynchronously
      saveRSVPDataToFirebase(newRsvpData).catch(error => {
        console.error("Error saving RSVP update to Firebase:", error);
        // Still save to localStorage as backup
        localStorage.setItem('rsvpData', JSON.stringify(newRsvpData));
        alert("Your RSVP was saved locally but couldn't be synchronized. Please try refreshing later.");
      });

      return newRsvpData;
    });
  }, []);

  // Update practice availability - memoized
  const updatePracticeAvailability = useCallback(async (eventId, member, availability) => {
    setPracticeData(prevPracticeData => {
      const newPracticeData = {
        ...prevPracticeData,
        [eventId]: {
          ...prevPracticeData[eventId],
          [member]: availability
        }
      };

      // Save to Firebase asynchronously
      savePracticeDataToFirebase(newPracticeData).catch(async (error) => {
        console.error("Error saving practice data to Firebase:", error);
        // Still save encrypted to localStorage as backup
        const { encryptData } = await import('../utils/encryption.js');
        const encrypted = encryptData(newPracticeData);
        localStorage.setItem('practiceData', encrypted);
        alert("Your practice availability was saved locally but couldn't be synchronized. Please try refreshing later.");
      });

      return newPracticeData;
    });
  }, []);

  // Initialize the application - prevent multiple initializations
  useEffect(() => {
    if (isInitialized.current) {
      return;
    }

    const initializeApp = async () => {
      try {
        // First load events data
        await loadEvents();

        // Then load user data from Firebase
        await loadUserData();

        // Set up listeners after data is loaded
        setupDataListeners();

        setLoading(false);
        isInitialized.current = true;
        console.log("Application initialized with Firebase synchronization");
      } catch (error) {
        console.error("Error initializing application:", error);
        alert("There was an error initializing the application. Some features may not work properly.");
        setLoading(false);
      }
    };

    initializeApp();

    // Cleanup function to remove listeners
    return () => {
      if (listenersSetup.current) {
        removeListeners();
        listenersSetup.current = false;
      }
    };
  }, [loadEvents, loadUserData, setupDataListeners]);

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