import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleVideoGeneration } from '@/hooks/useSimpleVideoGeneration';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Target,
  Zap,
  Heart,
  TrendingUp,
  Video,
  Share2,
  Play,
  Activity,
} from 'lucide-react-native';

interface ActivityDetails {
  id: string;
  activity_type?: string;
  activity_name?: string;
  start_time: string;
  end_time?: string;
  activity_date?: string;
  distance?: number;
  distance_km?: number;
  duration: number;
  duration_seconds?: number;
  calories?: number;
  calories_burned?: number;
  average_heart_rate?: number;
  intensity_level?: number;
  notes?: string;
  weather_conditions?: string;
  video_generated?: boolean;
  video_url?: string;
}

export default function ActivityDetailsScreen() {
  const { user } = useAuth();
  const { activityId, activityType } = useLocalSearchParams<{
    activityId: string;
    activityType: 'manual' | 'imported';
  }>();

  const [activity, setActivity] = useState<ActivityDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { isGenerating, progress, error, generateVideo, resetState } = useSimpleVideoGeneration();

  useEffect(() => {
    if (activityId && activityType && user) {
      fetchActivityDetails();
    }
  }, [activityId, activityType, user]);

  const fetchActivityDetails = async () => {
    if (!user || !activityId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('manual_activities')
        .select('*')
        .eq('id', activityId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching activity details:', error);
        Alert.alert('Error', 'Failed to load activity details');
        router.back();
        return;
      }

      if (data) {
        setActivity(data);
      } else {
        Alert.alert('Error', 'Activity not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching activity details:', error);
      Alert.alert('Error', 'Failed to load activity details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!activity) return;

    try {
      resetState();
      
      const activityData = {
        id: activity.id,
        activity_type: activity.activity_type || 'running',
        activity_name: activity.activity_name || 'Workout',
        distance_km: activity.distance_km || activity.distance,
        duration_seconds: activity.duration_seconds || activity.duration || 0,
        calories_burned: activity.calories_burned || activity.calories
      };

      const result = await generateVideo(activityData);

      if (result?.videoUrl) {
        // Update activity with video URL
        await supabase
          .from('manual_activities')
          .update({
            video_url: result.videoUrl,
            video_generated: true,
          })
          .eq('id', activity.id);

        setActivity(prev => prev ? {
          ...prev,
          video_url: result.videoUrl,
          video_generated: true,
        } : null);

        Alert.alert('Success!', 'Demo video generated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate video. This is a demo - replace with real video service.');
    }
  };

  const handleShare = async () => {
    if (!activity) return;

    const shareText = `Check out my ${activity.activity_name || activity.activity_type} activity!`;

    try {
      await Share.share({
        message: shareText,
        url: activity.video_url || '',
      });
    } catch (error) {
      if (Platform.OS === 'web' && error instanceof Error && error.name === 'NotAllowedError') {
        Alert.alert('Sharing Not Available', 'Sharing is not available in this browser environment.');
        return;
      }
      Alert.alert('Error', 'Unable to share at this time.');
    }
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0s';
    
    const totalMinutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Activity size={48} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading activity details...</Text>
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Activity not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const distance = activity.distance || activity.distance_km || 0;
  const duration = activity.duration || activity.duration_seconds || 0;
  const calories = activity.calories || activity.calories_burned || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Share2 size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Activity Title */}
      <View style={styles.titleSection}>
        <Text style={styles.activityTitle}>
          {activity.activity_name || `${activity.activity_type} Workout`}
        </Text>
        <View style={styles.activityMeta}>
          <View style={styles.metaItem}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.metaText}>
              {formatDate(activity.activity_date || activity.start_time)}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Stats */}
      <View style={styles.mainStatsContainer}>
        <View style={styles.primaryStatsRow}>
          <View style={styles.primaryStatCard}>
            <Text style={styles.primaryStatValue}>{distance.toFixed(2)}km</Text>
            <Text style={styles.primaryStatLabel}>Distance</Text>
          </View>
          <View style={styles.primaryStatCard}>
            <Text style={styles.primaryStatValue}>{formatTime(duration)}</Text>
            <Text style={styles.primaryStatLabel}>Duration</Text>
          </View>
        </View>
      </View>

      {/* Secondary Stats */}
      <View style={styles.secondaryStatsContainer}>
        <View style={styles.statsGrid}>
          {calories > 0 && (
            <View style={styles.statCard}>
              <Zap size={20} color="#F59E0B" />
              <Text style={styles.statValue}>{calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          )}
          
          {activity.average_heart_rate && (
            <View style={styles.statCard}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.statValue}>{activity.average_heart_rate} bpm</Text>
              <Text style={styles.statLabel}>Avg. HR</Text>
            </View>
          )}
        </View>
      </View>

      {/* Video Section */}
      <View style={styles.videoSection}>
        <Text style={styles.sectionTitle}>Demo Achievement Video</Text>
        
        {activity.video_url ? (
          <View style={styles.videoContainer}>
            <Video size={48} color="#8B5CF6" />
            <Text style={styles.videoTitle}>Demo video ready!</Text>
            <Text style={styles.videoSubtitle}>This is a placeholder video for demo purposes</Text>
            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => Alert.alert('Demo Video', 'This would open the video player in a real app')}
            >
              <Play size={16} color="#FFFFFF" />
              <Text style={styles.videoButtonText}>View Demo Video</Text>
            </TouchableOpacity>
          </View>
        ) : isGenerating ? (
          <View style={styles.generatingContainer}>
            <Video size={48} color="#3B82F6" />
            <Text style={styles.generatingTitle}>Generating Demo Video...</Text>
            <Text style={styles.generatingProgress}>{progress}</Text>
          </View>
        ) : error ? (
          <View style={styles.errorVideoContainer}>
            <Video size={48} color="#EF4444" />
            <Text style={styles.errorVideoTitle}>Demo Generation Failed</Text>
            <Text style={styles.errorVideoText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleGenerateVideo}>
              <Text style={styles.retryButtonText}>Try Demo Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.videoPromptContainer}>
            <Video size={48} color="#6B7280" />
            <Text style={styles.videoPromptTitle}>Generate Demo Video</Text>
            <Text style={styles.videoPromptText}>
              Create a demo video for this activity (placeholder functionality)
            </Text>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateVideo}
            >
              <Video size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Demo Video</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 60,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  activityTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  mainStatsContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  primaryStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryStatCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  primaryStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  primaryStatLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  secondaryStatsContainer: {
    marginHorizontal: 24,
    marginBottom: 32,
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
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  videoSection: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  videoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  videoSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  generatingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  generatingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  generatingProgress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorVideoContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  errorVideoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 16,
  },
  errorVideoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPromptContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  videoPromptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  videoPromptText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});