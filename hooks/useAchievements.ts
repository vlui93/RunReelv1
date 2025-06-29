import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface Achievement {
  id: string;
  achievement_type: 'personal_record' | 'milestone' | 'streak' | 'first_time';
  category: 'distance' | 'duration' | 'pace' | 'consistency' | 'calories' | 'frequency';
  value: number;
  description: string;
  is_processed: boolean;
  created_at: string;
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
    } else {
      setAchievements([]);
      setStats({
        totalAchievements: 0,
        personalRecords: 0,
        milestones: 0,
        streaks: 0,
        unprocessedCount: 0,
        recentAchievements: []
      });
      setLoading(false);
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAchievements(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      // Fall back to mock data if database fails
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          achievement_type: 'first_time',
          category: 'frequency',
          value: 1,
          description: 'First run completed!',
          is_processed: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          achievement_type: 'milestone',
          category: 'distance',
          value: 5000,
          description: 'First 5K completed! 🎉',
          is_processed: true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setAchievements(mockAchievements);
      calculateStats(mockAchievements);
    } finally {
      setLoading(false);
    }
  };

  const markAchievementAsProcessed = async (achievementId: string) => {
    try {
      const { error } = await supabase
        .from('achievements')
        .update({ is_processed: true })
        .eq('id', achievementId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setAchievements(prev => prev.map(a => 
        a.id === achievementId ? { ...a, is_processed: true } : a
      ));
      
      // Recalculate stats
      const updatedAchievements = achievements.map(a => 
        a.id === achievementId ? { ...a, is_processed: true } : a
      );
      calculateStats(updatedAchievements);
    } catch (error) {
      console.error('Error marking achievement as processed:', error);
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

  return {
    achievements,
    loading,
    stats,
    markAchievementAsProcessed,
    fetchAchievements,
  };
}