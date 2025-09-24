import { database } from './config.js';
import { ref, set, get, onValue, off } from 'firebase/database';
import { v4 as uuidv4 } from 'uuid';


// Database references
const teamMembersRef = ref(database, 'teamMembers');
const rsvpDataRef = ref(database, 'rsvpData');
const practiceDataRef = ref(database, 'practiceData');
const userAccountsRef = ref(database, 'userAccounts');

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
  off(userAccountsRef);
}

// User account management functions

// Load user accounts from Firebase
export async function loadUserAccountsFromFirebase() {
  try {
    const snapshot = await get(userAccountsRef);
    const data = snapshot.val();
    return data ? data : {};
  } catch (error) {
    console.error("Error loading user accounts from Firebase:", error);
    return {};
  }
}

// Save user account to Firebase
export async function saveUserAccountToFirebase(username, accountData) {
  try {
    const userId = uuidv4();
    const userRef = ref(database, `userAccounts/${userId}`);
    await set(userRef, {...accountData, userId});
    return true;
  } catch (error) {
    console.error("Error saving user account to Firebase:", error);
    return false;
  }
}

// Get specific user account
export async function getUserAccountFromFirebase(username) {
  try {
    const userRef = ref(database, `userAccounts/${username}`);
    const snapshot = await get(userRef);
    return snapshot.val();
  } catch (error) {
    console.error("Error getting user account from Firebase:", error);
    return null;
  }
}

// Check if username exists
export async function checkUsernameExists(username) {
  try {
    const userRef = ref(database, `userAccounts/${username}`);
    const snapshot = await get(userRef);
    return snapshot.exists();
  } catch (error) {
    console.error("Error checking username existence:", error);
    return false;
  }
}

// Migrate existing user to secure account
export async function migrateUserToSecureAccount(username, passwordHash, salt) {
  try {
    const accountData = {
      username,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      migratedAt: new Date().toISOString(),
      isLegacyUser: true // Flag to identify migrated users
    };

    await saveUserAccountToFirebase(username, accountData);
    return true;
  } catch (error) {
    console.error("Error migrating user account:", error);
    return false;
  }
}

// Create new secure user account
export async function createUserAccount(username, passwordHash, salt) {
  try {
    // Check if username already exists
    const exists = await checkUsernameExists(username);
    if (exists) {
      return { success: false, error: 'Username already exists' };
    }

    const accountData = {
      username,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      isLegacyUser: false
    };

    const success = await saveUserAccountToFirebase(username, accountData);
    return { success, error: success ? null : 'Failed to create account' };
  } catch (error) {
    console.error("Error creating user account:", error);
    return { success: false, error: 'Failed to create account' };
  }
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