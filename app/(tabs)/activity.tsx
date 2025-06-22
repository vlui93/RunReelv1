import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Activity, Calendar, Clock, Target, Video } from 'lucide-react-native';

interface Run {
  id: string;
  distance: number;
  duration: number;
  average_pace: number;
  calories: number;
  video_url: string | null;
  created_at: string;
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRuns = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('runs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching runs:', error);
      } else {
        setRuns(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRuns();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(2)}km`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateTotalStats = () => {
    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
    const totalCalories = runs.reduce((sum, run) => sum + (run.calories || 0), 0);
    const videosCount = runs.filter(run => run.video_url).length;

    return {
      totalDistance,
      totalDuration,
      totalCalories,
      videosCount,
      runsCount: runs.length,
    };
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please sign in to view your activity</Text>
      </View>
    );
  }

  const stats = calculateTotalStats();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Track your running progress</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>All Time Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Activity size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.runsCount}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{formatTime(stats.totalDuration)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <Video size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.videosCount}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>
      </View>

      {/* Recent Runs */}
      <View style={styles.runsContainer}>
        <Text style={styles.sectionTitle}>Recent Runs</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your runs...</Text>
          </View>
        ) : runs.length === 0 ? (
          <View style={styles.emptyState}>
            <Activity size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No runs yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start your first run to see your activity here
            </Text>
          </View>
        ) : (
          <View style={styles.runsList}>
            {runs.map((run) => (
              <View key={run.id} style={styles.runCard}>
                <View style={styles.runHeader}>
                  <View style={styles.runDate}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.runDateText}>{formatDate(run.created_at)}</Text>
                  </View>
                  {run.video_url && (
                    <View style={styles.videoIndicator}>
                      <Video size={16} color="#8B5CF6" />
                    </View>
                  )}
                </View>
                
                <View style={styles.runStats}>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{formatDistance(run.distance)}</Text>
                    <Text style={styles.runStatLabel}>Distance</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{formatTime(run.duration)}</Text>
                    <Text style={styles.runStatLabel}>Time</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>
                      {run.average_pace ? formatPace(run.average_pace) : '--:--'}
                    </Text>
                    <Text style={styles.runStatLabel}>Pace</Text>
                  </View>
                  <View style={styles.runStat}>
                    <Text style={styles.runStatValue}>{run.calories || 0}</Text>
                    <Text style={styles.runStatLabel}>Calories</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  summaryContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  runsContainer: {
    marginHorizontal: 24,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  runsList: {
    gap: 16,
  },
  runCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  runDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  runDateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  videoIndicator: {
    backgroundColor: '#F3F4F6',
    padding: 6,
    borderRadius: 6,
  },
  runStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  runStat: {
    alignItems: 'center',
  },
  runStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  runStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});