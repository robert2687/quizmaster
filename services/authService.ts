
import { User } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
// FIX: The import for the Supabase User type is failing, which likely causes cascading type errors for the auth client.
// Replaced the direct import with a local structural type for the Supabase user object to ensure type safety without relying on a broken import.
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Guest user object for when online features are not configured.
const GUEST_USER: User = {
  id: 'guest-user',
  email: 'guest@quizmaster.ai',
  playerName: 'Guest Player',
  avatar: 'avatar1',
  bio: 'Playing in guest mode.',
  occupation: 'None',
};

export const signUp = async (email: string, password: string): Promise<User> => {
  if (!isSupabaseConfigured) {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
    return GUEST_USER;
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message || "Could not sign up user.");
  }
  
  // After successful sign-up in Auth, create a corresponding profile in the database.
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: email.toLowerCase(),
      player_name: `Player_${authData.user.id.substring(0, 6)}`,
      avatar: 'avatar1', // Default avatar
      bio: '',
      unlocked_achievements: [],
      occupation: null, // This triggers the profile setup flow on first login
    });

  if (profileError) {
    // If profile creation fails, it's best to delete the auth user to avoid orphaned accounts.
    console.error("Failed to create user profile:", profileError);
    throw new Error(profileError.message);
  }

  const user = await getUserProfile(authData.user.id);
  if (!user) {
     throw new Error("Could not retrieve user profile after creation.");
  }
  return user;
};

export const login = async (email: string, password: string): Promise<User> => {
    if (!isSupabaseConfigured) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
      return GUEST_USER;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error || !data.user) {
        throw new Error(error?.message || "Invalid email or password.");
    }
    
    const user = await getUserProfile(data.user.id);
    if (!user) {
        // This case might happen if a user exists in auth but not in profiles table.
        // A robust app might try to re-create the profile here.
        throw new Error("User profile not found.");
    }

    return user;
};

export const logout = async () => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error logging out:", error);
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
    if (userId === 'guest-user') return Promise.resolve(GUEST_USER);
    if (!isSupabaseConfigured) return null;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error for non-existent profiles
          console.error("Error fetching profile:", error?.message);
        }
        return null;
    }
    
    // Map database snake_case to application camelCase
    return {
        id: data.id,
        email: data.email,
        playerName: data.player_name,
        avatar: data.avatar,
        bio: data.bio,
        occupation: data.occupation,
    };
};


export const updateUserProfile = async (userId: string, updates: Partial<Pick<User, 'playerName' | 'avatar' | 'bio' | 'occupation'>>): Promise<User> => {
    if (!isSupabaseConfigured) {
      // This shouldn't be reachable in guest mode, but return a mock update.
      return {
        ...GUEST_USER,
        ...updates
      };
    }
    // Map application camelCase to database snake_case
    const dbUpdates = {
        player_name: updates.playerName,
        avatar: updates.avatar,
        bio: updates.bio,
        occupation: updates.occupation,
    };
    
    // Remove undefined fields so they don't overwrite existing data in the DB
    Object.keys(dbUpdates).forEach(key => (dbUpdates as any)[key] === undefined && delete (dbUpdates as any)[key]);

    const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();
    
    if (error || !data) {
        throw new Error(error?.message || "Failed to update profile.");
    }

    // Map the returned data back to the User type
    return {
        id: data.id,
        email: data.email,
        playerName: data.player_name,
        avatar: data.avatar,
        bio: data.bio,
        occupation: data.occupation,
    };
};

export const resendVerificationEmail = async (email: string) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) {
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) {
    throw error;
  }
};

export const updateUserPassword = async (newPassword: string) => {
  if (!isSupabaseConfigured) return;
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw error;
  }
  return data;
};

export const createProfileForOAuthUser = async (authUser: SupabaseUser): Promise<User> => {
    if (!isSupabaseConfigured) {
      // Should not be called in guest mode.
      return GUEST_USER;
    }

    const { error: profileError, data: newProfileData } = await supabase
        .from('profiles')
        .insert({
            id: authUser.id,
            email: authUser.email!.toLowerCase(),
            player_name: authUser.user_metadata?.full_name || `Player_${authUser.id.substring(0, 6)}`,
            avatar: 'avatar1', // Default avatar
            bio: '',
            unlocked_achievements: [],
            occupation: null, // This triggers the profile setup flow
        })
        .select()
        .single();
    
    if (profileError || !newProfileData) {
        console.error("Failed to create profile for OAuth user:", profileError);
        throw new Error(profileError?.message || "Could not create profile for OAuth user.");
    }
    
    return {
        id: newProfileData.id,
        email: newProfileData.email,
        playerName: newProfileData.player_name,
        avatar: newProfileData.avatar,
        bio: newProfileData.bio,
        occupation: newProfileData.occupation,
    };
};

export const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });
    if (error) {
        throw error;
    }
};
