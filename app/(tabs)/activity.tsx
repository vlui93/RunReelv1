import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useHealthData } from '@/hooks/useHealthData';
import { useAchievements } from '@/hooks/useAchievements';
import { Activity, Calendar, Clock, Target, Video, Smartphone, RefreshCw } from 'lucide-react-native';

export default function ActivityScreen() {
  const { 
    importedWorkouts, 
    getConnectedSources, 
    getWorkoutStats, 
    syncWorkoutData, 
    isSyncing,
    refreshData 
  } = useHealthData();
  const { stats: achievementStats } = useAchievements();
  
  const [refreshing, setRefreshing] = useState(false);
  const connectedSources = getConnectedSources();
  const workoutStats = getWorkoutStats();

  const onRefresh = () => {
    setRefreshing(true);
    refreshData().finally(() => setRefreshing(false));
  };

  const handleSync = async () => {
    try {
      await syncWorkoutData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatPace = (pace: number): string => {
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return `${(distance / 1000).toFixed(2)}km`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (connectedSources.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
        </View>
        <View style={styles.emptyState}>
          <Smartphone size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Health Data Connected</Text>
          <Text style={styles.emptyStateSubtitle}>
            Connect Apple Health or Google Fit to see your workout activity here
          </Text>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.connectButtonText}>Connect Health Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }


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
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw size={16} color={isSyncing ? "#9CA3AF" : "#3B82F6"} />
          <Text style={[styles.syncButtonText, isSyncing && styles.syncButtonTextDisabled]}>
            {isSyncing ? 'Syncing...' : 'Sync'}
                    </Text>
        </TouchableOpacity>
      </View>

      {/* Connected Sources */}
      <View style={styles.sourcesContainer}>
        <Text style={styles.sectionTitle}>Connected Sources</Text>
        <View style={styles.sourcesList}>
          {connectedSources.map((source) => (
            <View key={source.id} style={styles.sourceCard}>
              <View style={styles.sourceIcon}>
                <Smartphone size={20} color="#10B981" />
              </View>
              <View style={styles.sourceContent}>
                <Text style={styles.sourceName}>
                  {source.source_type === 'apple_health' ? 'Apple Health' : 
                   source.source_type === 'google_fit' ? 'Google Fit' : 'Manual'}
                </Text>
                <Text style={styles.sourceStatus}>
                  Last sync: {source.last_sync_at ? 
                    new Date(source.last_sync_at).toLocaleDateString() : 'Never'}
                </Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>Connected</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>All Time Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Activity size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{workoutStats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statValue}>{workoutStats.totalDistance.toFixed(1)}km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{workoutStats.totalDuration} min</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <Video size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{achievementStats.totalAchievements}</Text>
            <Text style={styles.statLabel}>Achievements</Text>
          </View>
        </View>
      </View>

      {/* Recent Workouts */}
      <View style={styles.workoutsContainer}>
        <Text style={styles.sectionTitle}>Recent Workouts</Text>
        
        {importedWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Activity size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No workouts found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Your imported workouts will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.workoutsList}>
            {importedWorkouts.slice(0, 10).map((workout) => (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <View style={styles.workoutType}>
                    <Activity size={16} color="#6B7280" />
                    <Text style={styles.workoutTypeText}>
                      {workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)}
                    </Text>
                  </View>
                  <View style={styles.workoutDate}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.workoutDateText}>{formatDate(workout.start_time)}</Text>
                  </View>
                </View>
                
                <View style={styles.workoutStats}>
                  <View style={styles.workoutStat}>
                    <Text style={styles.workoutStatValue}>{formatDistance(workout.distance)}</Text>
                    <Text style={styles.workoutStatLabel}>Distance</Text>
                  </View>
                  <View style={styles.workoutStat}>
                    <Text style={styles.workoutStatValue}>{formatTime(workout.duration)}</Text>
                    <Text style={styles.workoutStatLabel}>Time</Text>
                  </View>
                  <View style={styles.workoutStat}>
                    <Text style={styles.workoutStatValue}>
                      {workout.pace_avg ? formatPace(workout.pace_avg) : '--:--'}
                    </Text>
                    <Text style={styles.workoutStatLabel}>Pace</Text>
                  </View>
                  <View style={styles.workoutStat}>
                    <Text style={styles.workoutStatValue}>{workout.calories || 0}</Text>
                    <Text style={styles.workoutStatLabel}>Calories</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  syncButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginLeft: 6,
  },
  syncButtonTextDisabled: {
    color: '#6B7280',
  },
  sourcesContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sourcesList: {
    gap: 8,
  },
  sourceCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sourceContent: {
    flex: 1,
  },
  sourceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  sourceStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  connectButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  workoutsContainer: {
    marginHorizontal: 24,
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
  workoutsList: {
    gap: 16,
  },
  workoutCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  workoutDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutDateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  workoutStat: {
    alignItems: 'center',
  },
  workoutStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  workoutStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});