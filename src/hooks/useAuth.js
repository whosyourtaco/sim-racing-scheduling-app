import { useState, useEffect } from 'react';
import {
  saveTeamMembersToFirebase,
  saveRSVPDataToFirebase,
  refreshData,
  removeListeners,
  checkUsernameExists,
  getUserAccountFromFirebase,
  createUserAccount,
  migrateUserToSecureAccount
} from '../firebase/database.js';
import { saveEncryptedUser, loadEncryptedUser, clearEncryptedUser } from '../utils/encryption.js';
import { hashPassword, verifyPassword, validatePassword, sanitizeUsername } from '../utils/auth.js';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [requiresMigration, setRequiresMigration] = useState(false);

  useEffect(() => {
    // Check if user is already logged in from encrypted localStorage
    const savedUserData = loadEncryptedUser();
    if (savedUserData && savedUserData.username && savedUserData.sessionToken) {
      // Verify session is still valid (within 7 days)
      const loginTime = new Date(savedUserData.loginTime);
      const now = new Date();
      const daysDifference = (now - loginTime) / (1000 * 60 * 60 * 24);

      if (daysDifference <= 7) {
        setCurrentUser(savedUserData.username);
        setIsAuthenticated(true);
      } else {
        // Session expired, clear it
        clearEncryptedUser();
      }
    }
  }, []);

  const registerUser = async (username, password, teamMembers, setTeamMembers, events, rsvpData, setRsvpData) => {
    try {
      // Validate inputs
      const sanitizedUsername = sanitizeUsername(username);
      if (!sanitizedUsername) {
        return { success: false, error: 'Please enter a valid username' };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }

      // Check if username already exists in secure accounts
      const accountExists = await checkUsernameExists(sanitizedUsername);
      if (accountExists) {
        return { success: false, error: 'Username already exists. Please choose a different username or sign in.' };
      }

      // Check if this is a legacy user (exists in teamMembers but not in userAccounts)
      const isLegacyUser = teamMembers.includes(sanitizedUsername);

      // Hash password
      const { hash, salt } = await hashPassword(password);

      // Create user account
      let accountResult;
      if (isLegacyUser) {
        // Migrate existing user
        accountResult = { success: await migrateUserToSecureAccount(sanitizedUsername, hash, salt) };
      } else {
        // Create new user account
        accountResult = await createUserAccount(sanitizedUsername, hash, salt);

        if (accountResult.success) {
          // Add to team members
          const newTeamMembers = [...teamMembers, sanitizedUsername];
          setTeamMembers(newTeamMembers);

          // Initialize RSVP data
          const newRsvpData = { ...rsvpData };
          events.forEach(event => {
            if (!newRsvpData[event.id]) {
              newRsvpData[event.id] = {};
            }
            newRsvpData[event.id][sanitizedUsername] = null;
          });
          setRsvpData(newRsvpData);

          // Save to Firebase
          await saveTeamMembersToFirebase(newTeamMembers);
          await saveRSVPDataToFirebase(newRsvpData);
        }
      }

      if (!accountResult.success) {
        return { success: false, error: accountResult.error || 'Failed to create account' };
      }

      // Sign in the user
      return await signInUser(sanitizedUsername, password, teamMembers, setTeamMembers, setRsvpData);

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  const signInUser = async (username, password, teamMembers, setTeamMembers, setRsvpData) => {
    try {
      // Validate inputs
      const sanitizedUsername = sanitizeUsername(username);
      if (!sanitizedUsername) {
        return { success: false, error: 'Please enter a valid username' };
      }

      if (!password) {
        return { success: false, error: 'Please enter your password' };
      }

      // Check if user has a secure account
      const userAccount = await getUserAccountFromFirebase(sanitizedUsername);
      if (!userAccount) {
        // Check if this is a legacy user that needs migration
        if (teamMembers.includes(sanitizedUsername)) {
          setRequiresMigration(true);
          return { success: false, error: 'migration_required', username: sanitizedUsername };
        } else {
          return { success: false, error: 'Username not found. Please register first.' };
        }
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, userAccount.passwordHash, userAccount.salt);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid password. Please try again.' };
      }

      // Generate session token
      const { generateSessionToken } = await import('../utils/auth.js');
      const sessionToken = generateSessionToken();

      // Set as current user
      setCurrentUser(sanitizedUsername);
      setIsAuthenticated(true);
      setRequiresMigration(false);

      // Save encrypted session data
      saveEncryptedUser({
        username: sanitizedUsername,
        sessionToken,
        loginTime: new Date().toISOString()
      });

      // Refresh data from Firebase to get latest data
      try {
        const data = await refreshData();
        if (data) {
          setTeamMembers(data.teamMembers);
          setRsvpData(data.rsvpData);
        }
      } catch (error) {
        console.error("Error refreshing data during sign in:", error);
      }

      return { success: true };

    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Sign in failed. Please try again.' };
    }
  };

  // Legacy support function for existing users
  const checkUserMigrationStatus = async (username) => {
    try {
      const userAccount = await getUserAccountFromFirebase(username);
      return {
        hasAccount: !!userAccount,
        isLegacyUser: userAccount?.isLegacyUser || false
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return { hasAccount: false, isLegacyUser: false };
    }
  };

  const signOut = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setRequiresMigration(false);

    // Clear encrypted user data from localStorage
    clearEncryptedUser();

    // Also remove any legacy unencrypted data
    localStorage.removeItem('currentUser');

    // Remove Firebase listeners to prevent updates while signed out
    removeListeners();
  };

  // Migration function for legacy users
  const migrateLegacyUser = async (username, password) => {
    try {
      const sanitizedUsername = sanitizeUsername(username);
      if (!sanitizedUsername) {
        return { success: false, error: 'Please enter a valid username' };
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }

      // Hash password
      const { hash, salt } = await hashPassword(password);

      // Migrate user account
      const success = await migrateUserToSecureAccount(sanitizedUsername, hash, salt);
      if (!success) {
        return { success: false, error: 'Migration failed. Please try again.' };
      }

      setRequiresMigration(false);
      return { success: true };

    } catch (error) {
      console.error('Migration error:', error);
      return { success: false, error: 'Migration failed. Please try again.' };
    }
  };

  return {
    currentUser,
    isAuthenticated,
    requiresMigration,
    registerUser,
    signIn: signInUser,
    signOut,
    checkUserMigrationStatus,
    migrateLegacyUser
  };
}