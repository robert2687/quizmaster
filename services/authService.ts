import { User } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const onlineFeaturesUnavailableError = "Online features are not configured. Please contact the administrator.";

const checkSupabaseConfigOrThrow = () => {
  if (!isSupabaseConfigured) {
    throw new Error(onlineFeaturesUnavailableError);
  }
};

export const signUp = async (playerName: string, email: string, password: string): Promise<User> => {
  checkSupabaseConfigOrThrow();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        player_name: playerName,
      },
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
      player_name: playerName,
      avatar: 'avatar1', // Default avatar
      bio: '',
      unlocked_achievements: [],
    });

  if (profileError) {
    // If profile creation fails, it's best to delete the auth user to avoid orphaned accounts.
    // This requires admin privileges and is complex to do from the client.
    // For now, we'll log the error. In a real app, this would be a server-side transaction or cleanup job.
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
    checkSupabaseConfigOrThrow();
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
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        console.error("Error fetching profile:", error?.message);
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
    checkSupabaseConfigOrThrow();
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

export const sendPasswordResetEmail = async (email: string) => {
  checkSupabaseConfigOrThrow();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) {
    throw error;
  }
};

export const updateUserPassword = async (newPassword: string) => {
  checkSupabaseConfigOrThrow();
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw error;
  }
  return data;
};