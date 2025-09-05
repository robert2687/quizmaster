import { LeaderboardEntry, LeaderboardFilters } from '../types';
import { supabase } from './supabaseClient';

const getSeasonStartDate = (): string => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
}

/**
 * Retrieves the leaderboard from the Supabase database.
 */
export const getLeaderboard = async (filters: LeaderboardFilters): Promise<LeaderboardEntry[]> => {
  try {
    let query = supabase
        .from('leaderboard')
        .select('*')
        .order('points', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

    // Filter by season (weekly or all-time)
    if (filters.season === 'weekly') {
        query = query.gte('created_at', getSeasonStartDate());
    }

    // Filter by topic if a filter is provided
    if (filters.topic && filters.topic.trim() !== '') {
        const lowercasedTopic = filters.topic.toLowerCase();
        query = query.ilike('topic', `%${lowercasedTopic}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Map database snake_case to application camelCase
    return data.map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        playerName: entry.player_name,
        avatarId: entry.avatar_id,
        topic: entry.topic,
        points: entry.points,
        timestamp: new Date(entry.created_at).getTime(),
    }));

  } catch (e) {
    console.error("Failed to get leaderboard:", e);
    throw new Error("Could not retrieve leaderboard data.");
  }
};

/**
 * Posts a new score to the leaderboard in Supabase.
 * Only updates if the new score is a personal best for that user on that topic.
 */
export const postScore = async (newEntry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): Promise<LeaderboardEntry | null> => {
  try {
    // Check for an existing score for the same user and topic
    const { data: existing, error: selectError } = await supabase
        .from('leaderboard')
        .select('id, points')
        .eq('user_id', newEntry.userId)
        .eq('topic', newEntry.topic)
        .maybeSingle();

    if (selectError) throw selectError;

    // If existing score is higher or equal, do nothing
    if (existing && existing.points >= newEntry.points) {
        return null;
    }

    const entryToUpsert = {
        user_id: newEntry.userId,
        player_name: newEntry.playerName,
        avatar_id: newEntry.avatarId,
        topic: newEntry.topic,
        points: newEntry.points,
        // If we are updating, we should also update the timestamp
        created_at: new Date().toISOString(),
        ...(existing && { id: existing.id }) // Include id if we are updating an existing record
    };

    // Upsert the new score. This will insert or update based on the primary key (id).
    const { data, error: upsertError } = await supabase
        .from('leaderboard')
        .upsert(entryToUpsert)
        .select()
        .single();
    
    if (upsertError) throw upsertError;
    if (!data) return null;
    
    return {
        id: data.id,
        userId: data.user_id,
        playerName: data.player_name,
        avatarId: data.avatar_id,
        topic: data.topic,
        points: data.points,
        timestamp: new Date(data.created_at).getTime(),
    };

  } catch (e) {
    console.error("Failed to post score:", e);
    throw new Error("Could not submit score to the leaderboard.");
  }
};