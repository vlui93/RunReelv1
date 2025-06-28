import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface Achievement {
  id: string;
  workout_id: string | null;
  achievement_type: 'personal_record' | 'milestone' | 'streak' | 'first_time';
  category: 'distance' | 'duration' | 'pace' | 'consistency' | 'calories' | 'frequency';
  value: number;
  previous_value: number | null;
  description: string;
  is_processed: boolean;
  created_at: string;
  workout?: {
    workout_type: string;
    start_time: string;
    distance: number;
    duration: number;
  };
}

interface AchievementStats {
  totalAchievements: number;
  personalRecords: number;
  milestones: number;
  streaks: number;
  unprocessedCount: number;
  recentAchievements: Achievement[];
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AchievementStats>({
    totalAchievements: 0,
    personalRecords: 0,
    milestones: 0,
    streaks: 0,
    unprocessedCount: 0,
    recentAchievements: []
  });

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select(`
          *,
          workout:imported_workouts(
            workout_type,
            start_time,
            distance,
            duration
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAchievements(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (achievementData: Achievement[]) => {
    const totalAchievements = achievementData.length;
    const personalRecords = achievementData.filter(a => a.achievement_type === 'personal_record').length;
    const milestones = achievementData.filter(a => a.achievement_type === 'milestone').length;
    const streaks = achievementData.filter(a => a.achievement_type === 'streak').length;
    const unprocessedCount = achievementData.filter(a => !a.is_processed).length;
    const recentAchievements = achievementData.slice(0, 5);

    setStats({
      totalAchievements,
      personalRecords,
      milestones,
      streaks,
      unprocessedCount,
      recentAchievements
    });
  };

  const markAchievementAsProcessed = async (achievementId: string) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .update({ is_processed: true })
        .eq('id', achievementId);

      if (error) throw error;

      setAchievements(prev => 
        prev.map(achievement => 
          achievement.id === achievementId 
            ? { ...achievement, is_processed: true }
            : achievement
        )
      );

      // Recalculate stats
      const updatedAchievements = achievements.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, is_processed: true }
          : achievement
      );
      calculateStats(updatedAchievements);
    } catch (error) {
      console.error('Error marking achievement as processed:', error);
    }
  };

  const getUnprocessedAchievements = () => {
    return achievements.filter(achievement => !achievement.is_processed);
  };

  const getAchievementsByType = (type: Achievement['achievement_type']) => {
    return achievements.filter(achievement => achievement.achievement_type === type);
  };

  const getAchievementsByCategory = (category: Achievement['category']) => {
    return achievements.filter(achievement => achievement.category === category);
  };

  const getAchievementsForWorkout = (workoutId: string) => {
    return achievements.filter(achievement => achievement.workout_id === workoutId);
  };

  // Check for consistency streaks
  const checkConsistencyStreaks = async () => {
    if (!user) return;

    try {
      // Get both imported workouts and manual activities from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [workoutsResult, activitiesResult] = await Promise.all([
        supabase
          .from('imported_workouts')
          .select('start_time, workout_type')
          .eq('user_id', user.id)
          .gte('start_time', thirtyDaysAgo.toISOString())
          .order('start_time', { ascending: true }),
        supabase
          .from('manual_activities')
          .select('activity_date, start_time, activity_type')
          .eq('user_id', user.id)
          .gte('activity_date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('activity_date', { ascending: true })
      ]);

      if (workoutsResult.error) throw workoutsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      // Combine and normalize the data
      const allActivities = [
        ...(workoutsResult.data || []).map(w => ({
          date: new Date(w.start_time).toDateString(),
          type: w.workout_type
        })),
        ...(activitiesResult.data || []).map(a => ({
          date: new Date(a.activity_date).toDateString(),
          type: a.activity_type
        }))
      ];

      // Group activities by date
      const activitiesByDate = new Map<string, any[]>();
      allActivities.forEach(activity => {
        if (!activitiesByDate.has(activity.date)) {
          activitiesByDate.set(activity.date, []);
        }
        activitiesByDate.get(activity.date)!.push(activity);
      });

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toDateString();
        
        if (activitiesByDate.has(dateString)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Create streak achievement if significant (7, 14, 21, 30 days)
      const streakMilestones = [7, 14, 21, 30];
      for (const milestone of streakMilestones) {
        if (currentStreak >= milestone) {
          const existingStreak = achievements.find(a => 
            a.achievement_type === 'streak' && 
            a.category === 'consistency' && 
            a.value === milestone
          );

          if (!existingStreak) {
            const { error: insertError } = await supabase
              .from('achievements')
              .insert({
                user_id: user.id,
                achievement_type: 'streak',
                category: 'consistency',
                value: milestone,
                previous_value: milestone > 7 ? milestone - 7 : 0,
                description: `${milestone} day activity streak! 🔥`,
                is_processed: false
              });

            if (!insertError) {
              await fetchAchievements();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking consistency streaks:', error);
    }
  };

  // Trigger achievement detection for existing data
  const triggerAchievementDetection = async () => {
    if (!user) return;

    try {
      // Get recent imported workouts
      const { data: recentWorkouts, error: workoutsError } = await supabase
        .from('imported_workouts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (workoutsError) throw workoutsError;

      // Process each workout for achievements
      for (const workout of recentWorkouts || []) {
        await supabase.rpc('detect_achievements', {
          p_user_id: user.id,
          p_workout_id: workout.id
        });
      }

      // Get recent manual activities
      const { data: recentActivities, error: activitiesError } = await supabase
        .from('manual_activities')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (activitiesError) throw activitiesError;

      // Process each manual activity for achievements
      for (const activity of recentActivities || []) {
        await supabase.rpc('detect_manual_activity_achievements', {
          p_user_id: user.id,
          p_activity_id: activity.id
        });
      }

      // Check for consistency streaks
      await checkConsistencyStreaks();
      
      // Refresh achievements
      await fetchAchievements();
    } catch (error) {
      console.error('Error triggering achievement detection:', error);
    }
  };

  // Auto-trigger achievement detection when component mounts
  useEffect(() => {
    if (user && achievements.length === 0) {
      // Small delay to ensure other data is loaded first
      const timer = setTimeout(() => {
        triggerAchievementDetection();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const checkConsistencyStreaksOld = async () => {
    if (!user) return;

    try {
      // Get workouts from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentWorkouts, error } = await supabase
        .from('imported_workouts')
        .select('start_time, workout_type')
        .eq('user_id', user.id)
        .gte('start_time', thirtyDaysAgo.toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Group workouts by date
      const workoutsByDate = new Map<string, any[]>();
      recentWorkouts?.forEach(workout => {
        const date = new Date(workout.start_time).toDateString();
        if (!workoutsByDate.has(date)) {
          workoutsByDate.set(date, []);
        }
        workoutsByDate.get(date)!.push(workout);
      });

      // Calculate current streak
      let currentStreak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toDateString();
        
        if (workoutsByDate.has(dateString)) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Create streak achievement if significant
      if (currentStreak >= 7 && currentStreak % 7 === 0) {
        const existingStreak = achievements.find(a => 
          a.achievement_type === 'streak' && 
          a.category === 'consistency' && 
          a.value === currentStreak
        );

        if (!existingStreak) {
          const { error: insertError } = await supabase
            .from('achievements')
            .insert({
              user_id: user.id,
              achievement_type: 'streak',
              category: 'consistency',
              value: currentStreak,
              previous_value: currentStreak - 7,
              description: `${currentStreak} day workout streak! 🔥`,
              is_processed: false
            });

          if (!insertError) {
            await fetchAchievements();
          }
        }
      }
    } catch (error) {
      console.error('Error checking consistency streaks:', error);
    }
  };

  const formatAchievementValue = (achievement: Achievement): string => {
    switch (achievement.category) {
      case 'distance':
        return `${(achievement.value / 1000).toFixed(2)} km`;
      case 'duration':
        return `${Math.floor(achievement.value / 60)} min`;
      case 'pace':
        return `${achievement.value.toFixed(2)} min/km`;
      case 'calories':
        return `${Math.round(achievement.value)} cal`;
      case 'frequency':
      case 'consistency':
        return `${achievement.value} ${achievement.value === 1 ? 'day' : 'days'}`;
      default:
        return achievement.value.toString();
    }
  };

  const getAchievementIcon = (achievement: Achievement): string => {
    switch (achievement.achievement_type) {
      case 'personal_record':
        return '🏆';
      case 'milestone':
        return '🎯';
      case 'streak':
        return '🔥';
      case 'first_time':
        return '🌟';
      default:
        return '🏃‍♂️';
    }
  };

  const getAchievementColor = (achievement: Achievement): string => {
    switch (achievement.achievement_type) {
      case 'personal_record':
        return '#F59E0B'; // Gold
      case 'milestone':
        return '#3B82F6'; // Blue
      case 'streak':
        return '#EF4444'; // Red
      case 'first_time':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  return {
    achievements,
    loading,
    stats,
    fetchAchievements,
    markAchievementAsProcessed,
    getUnprocessedAchievements,
    getAchievementsByType,
    getAchievementsByCategory,
    getAchievementsForWorkout,
    checkConsistencyStreaks,
    triggerAchievementDetection,
    formatAchievementValue,
    getAchievementIcon,
    getAchievementColor
  };
}