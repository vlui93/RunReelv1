import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Modal } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useHealthData } from '@/hooks/useHealthData';
import { useAchievements } from '@/hooks/useAchievements';
import { useManualActivities } from '@/hooks/useManualActivities';
import { useMockDataGenerator } from '@/hooks/useMockDataGenerator';
import { useApiUsage } from '@/hooks/useApiUsage';
import { Play, Activity, Target, Trophy, Smartphone, Zap, Users, Video, Plus, Database, TestTube } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user } = useAuth();
  const { getConnectedSources, getWorkoutStats, connectAppleHealth, connectGoogleFit, isConnecting } = useHealthData();
  const { stats: achievementStats } = useAchievements();
  const { getActivityStats } = useManualActivities();
  const { generateMockData, clearMockData, generating, progress } = useMockDataGenerator();
  const { limits } = useApiUsage();
  const [showMockDataModal, setShowMockDataModal] = useState(false);

  const connectedSources = getConnectedSources();
  const workoutStats = getWorkoutStats();
  const manualStats = getActivityStats();
  const hasConnectedSources = connectedSources.length > 0;
  const hasManualActivities = manualStats.totalActivities > 0;

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

  const handleGenerateMockData = async () => {
    try {
      await generateMockData();
      setShowMockDataModal(false);
      Alert.alert('Success', 'Mock data generated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to generate mock data');
    }
  };

  const handleClearMockData = async () => {
    try {
      await clearMockData();
      setShowMockDataModal(false);
      Alert.alert('Success', 'Mock data cleared successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear mock data');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>
            {hasConnectedSources || hasManualActivities ? 'Your fitness journey continues' : 'Get started with your fitness tracking'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/profile')} 
          style={styles.profileButton}
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* API Usage Limits */}
      {(hasConnectedSources || hasManualActivities) && (
        <View style={styles.apiLimitsCard}>
          <View style={styles.apiLimitsHeader}>
            <TestTube size={20} color="#8B5CF6" />
            <Text style={styles.apiLimitsTitle}>Video Generation Limit</Text>
          </View>
          <Text style={styles.apiLimitsText}>
            {limits.remainingCount} of {limits.maxVideoGenerations} videos remaining
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(limits.currentCount / limits.maxVideoGenerations) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

      {/* Health Data Connection */}
      {!hasConnectedSources && !hasManualActivities && (
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
            
            <View style={styles.orDivider}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>
            
            <TouchableOpacity 
              style={[styles.connectButton, styles.manualButton]}
              onPress={() => router.push('/manual-entry')}
            >
              <Plus size={16} color="#8B5CF6" />
              <Text style={[styles.connectButtonText, styles.manualButtonText]}>
                Add Activity Manually
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Manual Entry Quick Action */}
      {(hasConnectedSources || hasManualActivities) && (
        <TouchableOpacity 
          style={styles.manualEntryCard}
          onPress={() => router.push('/manual-entry')}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.manualEntryGradient}
          >
            <Plus size={24} color="#FFFFFF" />
            <Text style={styles.manualEntryTitle}>Add Manual Activity</Text>
            <Text style={styles.manualEntrySubtitle}>
              Track workouts not captured by health apps
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      {(hasConnectedSources || hasManualActivities) && (
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
                {workoutStats.totalWorkouts + manualStats.totalActivities} total
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
      {(hasConnectedSources || hasManualActivities) && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Activity size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{workoutStats.totalWorkouts + manualStats.totalActivities}</Text>
              <Text style={styles.statLabel}>Activities</Text>
            </View>
            <View style={styles.statCard}>
              <Target size={24} color="#10B981" />
              <Text style={styles.statValue}>{(workoutStats.totalDistance + manualStats.totalDistance).toFixed(1)}km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Trophy size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{achievementStats.totalAchievements}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
            <View style={styles.statCard}>
              <Video size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{manualStats.videosGenerated}</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Achievements */}
      {(hasConnectedSources || hasManualActivities) && achievementStats.recentAchievements.length > 0 && (
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

      {/* Mock Data Generator */}
      {(hasConnectedSources || hasManualActivities) && (
        <TouchableOpacity
          style={styles.mockDataCard}
          onPress={() => setShowMockDataModal(true)}
        >
          <LinearGradient
            colors={['#6366F1', '#4F46E5']}
            style={styles.mockDataGradient}
          >
            <Database size={24} color="#FFFFFF" />
            <Text style={styles.mockDataTitle}>Testing Tools</Text>
            <Text style={styles.mockDataSubtitle}>
              Generate mock data for testing video generation
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Mock Data Modal */}
      <Modal
        visible={showMockDataModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMockDataModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Testing Tools</Text>
            <Text style={styles.modalDescription}>
              Generate realistic mock fitness data for testing the video generation system.
            </Text>
            
            {generating && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Generating mock data... {Math.round(progress)}%</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.generateButton]}
                onPress={handleGenerateMockData}
                disabled={generating}
              >
                <Text style={styles.modalButtonText}>
                  {generating ? 'Generating...' : 'Generate Mock Data'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={handleClearMockData}
                disabled={generating}
              >
                <Text style={styles.modalButtonText}>Clear Mock Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMockDataModal(false)}
                disabled={generating}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  apiLimitsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  apiLimitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  apiLimitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  apiLimitsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 2,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  orText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  manualButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#8B5CF6',
    marginLeft: 8,
  },
  manualEntryCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  manualEntryGradient: {
    padding: 16,
    alignItems: 'center',
  },
  manualEntryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  manualEntrySubtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 4,
    textAlign: 'center',
  },
  mockDataCard: {
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
  mockDataGradient: {
    padding: 16,
    alignItems: 'center',
  },
  mockDataTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  mockDataSubtitle: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  generateButton: {
    backgroundColor: '#3B82F6',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#6B7280',
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