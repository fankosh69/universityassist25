import { supabase } from "@/integrations/supabase/client";

// XP Configuration
export const XP_EVENTS = {
  PROFILE_COMPLETE: 50,
  OCR_APPROVED: 100,
  WATCHLIST_3_PROGRAMS: 30,
  LANGUAGE_QUIZ: 40,
  START_APPLICATION: 80,
  SUBMIT_APPLICATION: 150,
  DAILY_LOGIN: 10,
  FIRST_PROGRAM_MATCH: 20,
} as const;

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1500, 2000, 3000, 4000, 5000
];

// Badge codes
export const BADGE_CODES = {
  PROFILE_PIONEER: 'profile_pioneer',
  DOCUMENT_DYNAMO: 'document_dynamo',
  DEADLINE_GUARDIAN: 'deadline_guardian',
  LANGUAGE_CLIMBER_B1: 'language_climber_b1',
  LANGUAGE_CLIMBER_B2: 'language_climber_b2',
  LANGUAGE_CLIMBER_C1: 'language_climber_c1',
  UNI_ASSIST_PRO: 'uni_assist_pro',
  FIRST_APPLICATION: 'first_application',
} as const;

export interface XPEvent {
  eventType: keyof typeof XP_EVENTS;
  description?: string;
}

export class GamificationService {
  /**
   * Award XP to a user for completing an action
   */
  static async awardXP(profileId: string, event: XPEvent): Promise<{ success: boolean; newLevel?: number }> {
    try {
      const xpAmount = XP_EVENTS[event.eventType];
      
      // Insert XP event
      const { error: xpError } = await supabase
        .from('xp_events')
        .insert({
          profile_id: profileId,
          event_type: event.eventType,
          xp_earned: xpAmount,
          description: event.description || event.eventType
        });

      if (xpError) throw xpError;

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('xp_points, level')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;

      const newXP = (profile.xp_points || 0) + xpAmount;
      const newLevel = this.calculateLevel(newXP);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          xp_points: newXP,
          level: newLevel,
          last_activity_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', profileId);

      if (updateError) throw updateError;

      // Check if level up happened
      const leveledUp = newLevel > (profile.level || 1);

      return { success: true, newLevel: leveledUp ? newLevel : undefined };
    } catch (error) {
      console.error('Error awarding XP:', error);
      return { success: false };
    }
  }

  /**
   * Calculate level based on XP
   */
  static calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Get XP needed for next level
   */
  static getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return 0; // Max level reached
    }
    return LEVEL_THRESHOLDS[currentLevel] - currentXP;
  }

  /**
   * Award a badge to a user
   */
  static async awardBadge(profileId: string, badgeCode: string): Promise<boolean> {
    try {
      // Award via SECURITY DEFINER RPC; direct writes to user_badges are admin-only.
      const { data, error } = await supabase.rpc('award_user_badge', {
        _badge_code: badgeCode,
      });
      if (error) throw error;
      return (data as { success?: boolean } | null)?.success === true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  }

  /**
   * Update streak
   */
  static async updateStreak(profileId: string): Promise<void> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_activity_date, streak_days')
        .eq('id', profileId)
        .single();

      if (!profile) return;

      const today = new Date().toISOString().split('T')[0];
      const lastActivity = profile.last_activity_date;

      if (lastActivity === today) {
        return; // Already updated today
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      let newStreak = 1;
      if (lastActivity === yesterdayStr) {
        // Continue streak
        newStreak = (profile.streak_days || 0) + 1;
      }

      await supabase
        .from('profiles')
        .update({
          last_activity_date: today,
          streak_days: newStreak
        })
        .eq('id', profileId);

      // Award XP for login
      if (newStreak > 1) {
        await this.awardXP(profileId, {
          eventType: 'DAILY_LOGIN',
          description: `Day ${newStreak} streak`
        });
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  /**
   * Get user gamification stats
   */
  static async getUserStats(profileId: string) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp_points, level, streak_days')
        .eq('id', profileId)
        .single();

      const { data: badges } = await supabase
        .from('user_badges')
        .select(`
          id,
          earned_at,
          badge:badges(code, title_en, icon)
        `)
        .eq('profile_id', profileId);

      const { data: recentXP } = await supabase
        .from('xp_events')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        xp: profile?.xp_points || 0,
        level: profile?.level || 1,
        streak: profile?.streak_days || 0,
        xpForNextLevel: this.getXPForNextLevel(profile?.xp_points || 0),
        badges: badges || [],
        recentXP: recentXP || []
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  }
}
