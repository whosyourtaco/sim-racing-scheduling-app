import { database } from './config.js';
import { ref, set, get, onValue, off } from 'firebase/database';

// Database references
const teamMembersRef = ref(database, 'teamMembers');
const rsvpDataRef = ref(database, 'rsvpData');
const practiceDataRef = ref(database, 'practiceData');

// Load team members from Firebase
export async function loadTeamMembersFromFirebase() {
  try {
    const snapshot = await get(teamMembersRef);
    const data = snapshot.val();
    return data ? data : [];
  } catch (error) {
    console.error("Error loading team members from Firebase:", error);
    // Fallback to localStorage if Firebase fails
    const savedTeamMembers = localStorage.getItem('teamMembers');
    return savedTeamMembers ? JSON.parse(savedTeamMembers) : [];
  }
}

// Load RSVP data from Firebase
export async function loadRSVPDataFromFirebase() {
  try {
    const snapshot = await get(rsvpDataRef);
    const data = snapshot.val();
    return data ? data : {};
  } catch (error) {
    console.error("Error loading RSVP data from Firebase:", error);
    // Fallback to localStorage if Firebase fails
    const savedRSVPData = localStorage.getItem('rsvpData');
    return savedRSVPData ? JSON.parse(savedRSVPData) : {};
  }
}

// Load practice data from Firebase
export async function loadPracticeDataFromFirebase() {
  try {
    const snapshot = await get(practiceDataRef);
    const data = snapshot.val();
    return data ? data : {};
  } catch (error) {
    console.error("Error loading practice data from Firebase:", error);
    // Fallback to encrypted localStorage if Firebase fails
    const { decryptData } = await import('../utils/encryption.js');
    const encryptedData = localStorage.getItem('practiceData');
    return decryptData(encryptedData) || {};
  }
}

// Save team members to Firebase
export async function saveTeamMembersToFirebase(teamMembers) {
  try {
    await set(teamMembersRef, teamMembers);
    // Also save to localStorage as backup
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    return true;
  } catch (error) {
    console.error("Error saving team members to Firebase:", error);
    // Still save to localStorage even if Firebase fails
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    return false;
  }
}

// Save RSVP data to Firebase
export async function saveRSVPDataToFirebase(rsvpData) {
  try {
    await set(rsvpDataRef, rsvpData);
    // Also save to localStorage as backup
    localStorage.setItem('rsvpData', JSON.stringify(rsvpData));
    return true;
  } catch (error) {
    console.error("Error saving RSVP data to Firebase:", error);
    // Still save to localStorage even if Firebase fails
    localStorage.setItem('rsvpData', JSON.stringify(rsvpData));
    return false;
  }
}

// Save practice data to Firebase
export async function savePracticeDataToFirebase(practiceData) {
  try {
    await set(practiceDataRef, practiceData);
    // Also save encrypted to localStorage as backup
    const { encryptData } = await import('../utils/encryption.js');
    const encrypted = encryptData(practiceData);
    localStorage.setItem('practiceData', encrypted);
    return true;
  } catch (error) {
    console.error("Error saving practice data to Firebase:", error);
    // Still save encrypted to localStorage even if Firebase fails
    const { encryptData } = await import('../utils/encryption.js');
    const encrypted = encryptData(practiceData);
    localStorage.setItem('practiceData', encrypted);
    return false;
  }
}

// Set up real-time listeners for team members
export function setupTeamMembersListener(callback) {
  onValue(teamMembersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
}

// Set up real-time listeners for RSVP data
export function setupRSVPDataListener(callback) {
  onValue(rsvpDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
}

// Set up real-time listeners for practice data
export function setupPracticeDataListener(callback) {
  onValue(practiceDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
}

// Remove listeners when they're no longer needed
export function removeListeners() {
  off(teamMembersRef);
  off(rsvpDataRef);
  off(practiceDataRef);
}

// Manual refresh function to force data reload
export async function refreshData() {
  try {
    const teamMembers = await loadTeamMembersFromFirebase();
    const rsvpData = await loadRSVPDataFromFirebase();
    const practiceData = await loadPracticeDataFromFirebase();
    return { teamMembers, rsvpData, practiceData };
  } catch (error) {
    console.error("Error refreshing data:", error);
    return null;
  }
}