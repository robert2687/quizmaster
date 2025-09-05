
import { User } from '../types';

// In a real application, this would be a secure backend database.
const USERS_KEY = 'quizMasterUsers';
// sessionStorage is used to keep the user logged in for the duration of the browser tab.
const SESSION_KEY = 'quizMasterCurrentUserEmail';

interface StoredUser {
  email: string;
  playerName: string;
  passwordHash: string;
  avatar: string;
  bio: string;
  occupation?: string;
}

/**
 * A simple, non-secure hashing function for demonstration purposes.
 * In a real app, use a strong, salted hashing algorithm like Argon2 or bcrypt on the server.
 * @param password The password to hash.
 * @returns A pseudo-hashed string.
 */
const hashPassword = (password: string): string => {
  // This is not secure, but illustrates the concept of not storing plain text passwords.
  return btoa(password.split('').reverse().join('') + '_salty');
};

const getUsers = (): StoredUser[] => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

const saveUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const signUp = (playerName: string, email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      const normalizedEmail = email.toLowerCase();
      
      if (users.some(user => user.email === normalizedEmail)) {
        return reject(new Error("User with this email already exists."));
      }

      const newUser: StoredUser = {
        playerName,
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        avatar: 'avatar1', // Default avatar
        bio: '',           // Default empty bio
        occupation: undefined, // Set after this step
      };

      users.push(newUser);
      saveUsers(users);

      // Automatically log the user in after successful registration
      sessionStorage.setItem(SESSION_KEY, newUser.email);

      resolve({ email: newUser.email, playerName: newUser.playerName, avatar: newUser.avatar, bio: newUser.bio, occupation: newUser.occupation });
    }, 500);
  });
};

export const login = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      const normalizedEmail = email.toLowerCase();
      const user = users.find(u => u.email === normalizedEmail);

      if (user && user.passwordHash === hashPassword(password)) {
        sessionStorage.setItem(SESSION_KEY, user.email);
        resolve({ 
          email: user.email, 
          playerName: user.playerName,
          avatar: user.avatar || 'avatar1',
          bio: user.bio || '',
          occupation: user.occupation,
        });
      } else {
        reject(new Error("Invalid email or password."));
      }
    }, 500);
  });
};

export const logout = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const email = sessionStorage.getItem(SESSION_KEY);
  if (!email) {
    return null;
  }

  const users = getUsers();
  const user = users.find(u => u.email === email);
  
  if (user) {
    return { 
        email: user.email, 
        playerName: user.playerName,
        avatar: user.avatar || 'avatar1',
        bio: user.bio || '',
        occupation: user.occupation,
    };
  }
  
  // Clean up session if user is not found in storage (e.g., storage was cleared)
  logout();
  return null;
};

export const updateUserProfile = (email: string, updates: Partial<Pick<User, 'playerName' | 'avatar' | 'bio' | 'occupation'>>): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = getUsers();
            const userIndex = users.findIndex(u => u.email === email);

            if (userIndex === -1) {
                return reject(new Error("User not found."));
            }

            // Update user data
            const updatedUser = { ...users[userIndex], ...updates };
            users[userIndex] = updatedUser;
            saveUsers(users);

            resolve({
                email: updatedUser.email,
                playerName: updatedUser.playerName,
                avatar: updatedUser.avatar,
                bio: updatedUser.bio,
                occupation: updatedUser.occupation,
            });
        }, 300);
    });
};
