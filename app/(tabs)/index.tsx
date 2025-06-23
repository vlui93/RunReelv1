import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHealthData } from '@/hooks/useHealthData';
import { useAchievements } from '@/hooks/useAchievements';
import { Play, Activity, Target, Trophy, Smartphone, Zap, Users, Video } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user } = useAuth();
  const { getConnectedSources, getWorkoutStats, connectAppleHealth, connectGoogleFit, isConnecting } = useHealthData();
  const { stats: achievementStats } = useAchievements();

  const connectedSources = getConnectedSources();
  const workoutStats = getWorkoutStats();
  const hasConnectedSources = connectedSources.length > 0;

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authContainer}>
          <Video size={64} color="#3B82F6" />
          <Text style={styles.title}>RunReel</Text>
          <Text style={styles.subtitle}>
            Transform your fitness data into personalized AI-generated achievement videos
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Smartphone size={20} color="#10B981" />
              <Text style={styles.featureText}>Import from Apple Health & Google Fit</Text>
            </View>
            <View style={styles.featureItem}>
              <Zap size={20} color="#F59E0B" />
              <Text style={styles.featureText}>AI-powered achievement videos</Text>
            </View>
            <View style={styles.featureItem}>
              <Users size={20} color="#8B5CF6" />
              <Text style={styles.featureText}>Share your success stories</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.authButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleConnectHealth = async () => {
    if (Platform.OS === 'ios') {
      const success = await connectAppleHealth();
      if (success) {
        Alert.alert('Success', 'Apple Health connected successfully!');
      }
    } else if (Platform.OS === 'android') {
      const success = await connectGoogleFit();
      if (success) {
        Alert.alert('Success', 'Google Fit connected successfully!');
      }
    } else {
      Alert.alert('Info', 'Health data import is available on mobile devices');
    }
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>
            {hasConnectedSources ? 'Your fitness journey continues' : 'Connect your health data to get started'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={styles.profileButton}
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Health Data Connection */}
      {!hasConnectedSources && (
        <View style={styles.connectionCard}>
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.connectionGradient}
          >
            <Smartphone size={32} color="#FFFFFF" />
            <Text style={styles.connectionTitle}>Connect Your Health Data</Text>
            <Text style={styles.connectionSubtitle}>
              Import workouts from Apple Health or Google Fit to start creating achievement videos
            </Text>
            <TouchableOpacity 
              style={styles.connectButton}
              onPress={handleConnectHealth}
              disabled={isConnecting}
            >
              <Text style={styles.connectButtonText}>
                {isConnecting ? 'Connecting...' : 'Connect Health App'}
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Quick Actions */}
      {hasConnectedSources && (
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/activity')}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.quickActionGradient}
            >
              <Activity size={28} color="#FFFFFF" />
              <Text style={styles.quickActionTitle}>View Workouts</Text>
              <Text style={styles.quickActionSubtitle}>
                {workoutStats.totalWorkouts} imported
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => router.push('/achievements')}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.quickActionGradient}
            >
              <Trophy size={28} color="#FFFFFF" />
              <Text style={styles.quickActionTitle}>Achievements</Text>
              <Text style={styles.quickActionSubtitle}>
                {achievementStats.unprocessedCount} new
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Overview */}
      {hasConnectedSources && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
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
              <Trophy size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{achievementStats.totalAchievements}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statCard}>
              <Video size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{achievementStats.totalAchievements - achievementStats.unprocessedCount}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Achievements */}
      {hasConnectedSources && achievementStats.recentAchievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          {achievementStats.recentAchievements.slice(0, 3).map((achievement) => (
            <View key={achievement.id} style={styles.achievementCard}>
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>
                  {achievement.achievement_type === 'personal_record' ? '🏆' :
                   achievement.achievement_type === 'milestone' ? '🎯' :
                   achievement.achievement_type === 'streak' ? '🔥' : '🌟'}
                </Text>
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>{achievement.description}</Text>
                <Text style={styles.achievementDate}>
                  {new Date(achievement.created_at).toLocaleDateString()}
                </Text>
              </View>
              {!achievement.is_processed && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Manual Run Tracking (Legacy) */}
      {hasConnectedSources && (
        <TouchableOpacity 
          style={styles.legacyRunCard}
          onPress={() => router.push('/(tabs)/navigate')}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.legacyRunGradient}
          >
            <View style={styles.legacyRunContent}>
              <Play size={28} color="#FFFFFF" />
              <View style={styles.legacyRunText}>
                <Text style={styles.legacyRunTitle}>Manual Run Tracking</Text>
                <Text style={styles.legacyRunSubtitle}>Track a run manually with GPS</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
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
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featureList: {
    marginBottom: 32,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  featureText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  authButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  userName: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  connectionCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  connectionGradient: {
    padding: 32,
    alignItems: 'center',
  },
  connectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
  },
  connectionSubtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  quickActionsContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickActionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#E5E7EB',
    marginTop: 4,
  },
  achievementsSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  achievementCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  achievementDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  legacyRunCard: {
    marginHorizontal: 24,
    marginBottom: 32,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  legacyRunGradient: {
    padding: 20,
  },
  legacyRunContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legacyRunText: {
    marginLeft: 16,
  },
  legacyRunTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legacyRunSubtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 2,
  },
  statsSection: {
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
});