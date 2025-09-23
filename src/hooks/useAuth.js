import { useState, useEffect } from 'react';
import { saveTeamMembersToFirebase, saveRSVPDataToFirebase, refreshData, removeListeners } from '../firebase/database.js';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const registerUser = async (name, teamMembers, setTeamMembers, events, rsvpData, setRsvpData) => {
    if (!name || name.trim() === '') {
      alert('Please enter your name');
      return false;
    }

    // Check if name already exists
    if (teamMembers.includes(name)) {
      alert('This name is already registered. Please use a different name or sign in.');
      return false;
    }

    // Add user to team members
    const newTeamMembers = [...teamMembers, name];
    setTeamMembers(newTeamMembers);

    // Add user to RSVP data
    const newRsvpData = { ...rsvpData };
    events.forEach(event => {
      if (!newRsvpData[event.id]) {
        newRsvpData[event.id] = {};
      }
      newRsvpData[event.id][name] = null;
    });
    setRsvpData(newRsvpData);

    // Set as current user
    setCurrentUser(name);
    setIsAuthenticated(true);

    // Save data to Firebase
    try {
      await saveTeamMembersToFirebase(newTeamMembers);
      await saveRSVPDataToFirebase(newRsvpData);
      console.log(`User ${name} registered and data synchronized to Firebase`);
    } catch (error) {
      console.error("Error saving user registration to Firebase:", error);
      alert("Your registration was saved locally but couldn't be synchronized. Please try refreshing later.");
    }

    return true;
  };

  const signIn = async (name, teamMembers, setTeamMembers, setRsvpData) => {
    if (!name || name.trim() === '') {
      alert('Please enter your name');
      return false;
    }

    // Check if name exists
    if (!teamMembers.includes(name)) {
      alert('This name is not registered. Please register first.');
      return false;
    }

    // Set as current user
    setCurrentUser(name);
    setIsAuthenticated(true);

    // Save current user to localStorage (user-specific)
    localStorage.setItem('currentUser', name);

    // Refresh data from Firebase to get latest team and RSVP data
    try {
      const data = await refreshData();
      if (data) {
        setTeamMembers(data.teamMembers);
        setRsvpData(data.rsvpData);
      }
    } catch (error) {
      console.error("Error refreshing data during sign in:", error);
    }

    return true;
  };

  const signOut = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);

    // Remove from localStorage
    localStorage.removeItem('currentUser');

    // Remove Firebase listeners to prevent updates while signed out
    removeListeners();
  };

  return {
    currentUser,
    isAuthenticated,
    registerUser,
    signIn,
    signOut
  };
}