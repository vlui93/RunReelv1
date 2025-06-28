import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useHealthData } from '@/hooks/useHealthData';
import { useAchievements } from '@/hooks/useAchievements';
import { useManualActivities } from '@/hooks/useManualActivities';
import { Activity, Calendar, Clock, Target, Video, Smartphone, RefreshCw, Plus } from 'lucide-react-native';

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
  const { activities: manualActivities, fetchActivities } = useManualActivities();
  
  const [refreshing, setRefreshing] = useState(false);
  const connectedSources = getConnectedSources();
  const workoutStats = getWorkoutStats();
  const hasAnyActivities = importedWorkouts.length > 0 || manualActivities.length > 0;

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([refreshData(), fetchActivities()]).finally(() => setRefreshing(false));
  };

  const handleSync = async () => {
    try {
      await syncWorkoutData();
      await fetchActivities();
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

  // Combine and sort all activities
  const allActivities = [
    ...importedWorkouts.map(workout => ({
      ...workout,
      type: 'imported' as const,
      activity_name: `${workout.workout_type.charAt(0).toUpperCase() + workout.workout_type.slice(1)} Workout`,
      activity_date: workout.start_time,
      display_date: workout.start_time,
    })),
    ...manualActivities.map(activity => ({
      ...activity,
      type: 'manual' as const,
      display_date: `${activity.activity_date}T${activity.start_time}`,
    }))
  ].sort((a, b) => new Date(b.display_date).getTime() - new Date(a.display_date).getTime());

  if (!hasAnyActivities && connectedSources.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
        </View>
        <View style={styles.emptyState}>
          <Smartphone size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Activities Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Connect health apps or add activities manually to get started
          </Text>
          <View style={styles.emptyStateButtons}>
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.connectButtonText}>Connect Health Data</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.connectButton, styles.manualButton]}
              onPress={() => router.push('/manual-entry')}
            >
              <Plus size={16} color="#3B82F6" />
              <Text style={[styles.connectButtonText, styles.manualButtonText]}>Add Manually</Text>
            </TouchableOpacity>
          </View>
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
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/manual-entry')}
          >
            <Plus size={16} color="#3B82F6" />
          </TouchableOpacity>
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
      </View>

      {/* Connected Sources */}
      {connectedSources.length > 0 && (
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
      )}

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>All Time Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Activity size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{allActivities.length}</Text>
            <Text style={styles.statLabel}>Activities</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statValue}>
              {(workoutStats.totalDistance + 
                manualActivities.reduce((sum, a) => sum + (a.distance_km || 0), 0)).toFixed(1)}km
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Clock size={24} color="#F59E0B" />
            <Text style={styles.statValue}>
              {workoutStats.totalDuration + 
               Math.floor(manualActivities.reduce((sum, a) => sum + a.duration_seconds, 0) / 60)} min
            </Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <Video size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>
              {manualActivities.filter(a => a.video_generated).length}
            </Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.activitiesContainer}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        
        {allActivities.length === 0 ? (
          <View style={styles.emptyState}>
            <Activity size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateTitle}>No activities found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Your activities will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {allActivities.slice(0, 20).map((activity) => (
              <TouchableOpacity 
                key={`${activity.type}-${activity.id}`} 
                style={styles.activityCard}
                onPress={() => router.push({
                  pathname: '/activity-details',
                  params: { 
                    activityId: activity.id, 
                    activityType: activity.type 
                  }
                })}
                activeOpacity={0.7}
              >
                <View style={styles.activityHeader}>
                  <View style={styles.activityType}>
                    <Activity size={16} color="#6B7280" />
                    <Text style={styles.activityTypeText}>
                      {activity.type === 'manual' 
                        ? activity.activity_type 
                        : activity.workout_type?.charAt(0).toUpperCase() + activity.workout_type?.slice(1)
                      }
                    </Text>
                    {activity.type === 'manual' && (
                      <View style={styles.manualBadge}>
                        <Text style={styles.manualBadgeText}>Manual</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.activityDate}>
                    <Calendar size={16} color="#6B7280" />
                    <Text style={styles.activityDateText}>
                      {formatDate(activity.type === 'manual' ? activity.activity_date : activity.start_time)}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.activityName}>
                  {activity.type === 'manual' ? activity.activity_name : activity.activity_name}
                </Text>
                
                <View style={styles.activityStats}>
                  <View style={styles.activityStat}>
                    <Text style={styles.activityStatValue}>
                      {activity.distance_km || activity.distance 
                        ? formatDistance((activity.distance_km || activity.distance) * 1000) 
                        : '--'}
                    </Text>
                    <Text style={styles.activityStatLabel}>Distance</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <Text style={styles.activityStatValue}>
                      {formatTime(activity.duration_seconds || activity.duration)}
                    </Text>
                    <Text style={styles.activityStatLabel}>Time</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <Text style={styles.activityStatValue}>
                      {(() => {
                        // Use stored pace if available
                        if (activity.pace_avg) return formatPace(activity.pace_avg);
                        
                        // Calculate pace for distance-based activities
                        const distance = activity.distance_km || activity.distance;
                        const duration = activity.duration_seconds || activity.duration;
                        
                        if (distance && duration && distance > 0) {
                          const paceMinPerKm = (duration / 60) / distance;
                          return formatPace(paceMinPerKm);
                        }
                        
                        return '--:--';
                      })()}
                    </Text>
                    <Text style={styles.activityStatLabel}>Pace</Text>
                  </View>
                  <View style={styles.activityStat}>
                    <Text style={styles.activityStatValue}>
                      {activity.calories_burned || activity.calories || 0}
                    </Text>
                    <Text style={styles.activityStatLabel}>Calories</Text>
                  </View>
                </View>
                
                {activity.type === 'manual' && activity.video_generated && (
                  <View style={styles.videoIndicator}>
                    <Video size={16} color="#8B5CF6" />
                    <Text style={styles.videoIndicatorText}>Video Generated</Text>
                  </View>
                )}
              </TouchableOpacity>
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
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
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
  emptyStateButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  manualButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#3B82F6',
    marginLeft: 6,
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
  activitiesContainer: {
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
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 6,
  },
  manualBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  manualBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F1',
  },
  activityDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDateText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityStat: {
    alignItems: 'center',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  activityStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  videoIndicatorText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 6,
  },
});