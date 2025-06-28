import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

// Apple HealthKit types (for iOS)
interface HealthKitWorkout {
  uuid: string;
  activityType: string;
  startDate: string;
  endDate: string;
  duration: number;
  distance?: number;
  calories?: number;
  metadata?: any;
}

// Google Fit types (for Android)
interface GoogleFitSession {
  id: string;
  activityType: number;
  startTimeMillis: number;
  endTimeMillis: number;
  description?: string;
}

interface GoogleFitDataPoint {
  dataTypeName: string;
  value: number;
  startTimeNanos: number;
  endTimeNanos: number;
}

interface HealthDataSource {
  id: string;
  source_type: 'apple_health' | 'google_fit' | 'manual';
  is_connected: boolean;
  last_sync_at: string | null;
  sync_status: 'pending' | 'syncing' | 'completed' | 'failed';
  permissions_granted: any;
}

interface ImportedWorkout {
  id: string;
  external_id: string;
  workout_type: string;
  start_time: string;
  end_time: string;
  distance: number;
  duration: number;
  calories: number;
  heart_rate_avg?: number;
  heart_rate_max?: number;
  pace_avg?: number;
  elevation_gain?: number;
  route_data?: any;
  metadata: any;
}

export function useHealthData() {
  const { user } = useAuth();
  const [healthSources, setHealthSources] = useState<HealthDataSource[]>([]);
  const [importedWorkouts, setImportedWorkouts] = useState<ImportedWorkout[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  // Initialize health data sources
  useEffect(() => {
    if (user) {
      initializeHealthSources();
      fetchImportedWorkouts();
    }
  }, [user]);

  const initializeHealthSources = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('health_data_sources')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setHealthSources(data || []);

      // Create default sources if they don't exist
      const existingTypes = data?.map(source => source.source_type) || [];
      
      if (Platform.OS === 'ios' && !existingTypes.includes('apple_health')) {
        await createHealthSource('apple_health');
      }
      
      if (Platform.OS === 'android' && !existingTypes.includes('google_fit')) {
        await createHealthSource('google_fit');
      }
      
      if (!existingTypes.includes('manual')) {
        await createHealthSource('manual');
      }
    } catch (error) {
      console.error('Error initializing health sources:', error);
    }
  };

  const createHealthSource = async (sourceType: 'apple_health' | 'google_fit' | 'manual') => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('health_data_sources')
        .insert({
          user_id: user.id,
          source_type: sourceType,
          is_connected: false,
          sync_status: 'pending',
          permissions_granted: {},
        })
        .select()
        .single();

      if (error) throw error;

      setHealthSources(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating health source:', error);
      return null;
    }
  };

  const fetchImportedWorkouts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('imported_workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50);

      if (error) throw error;

      setImportedWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching imported workouts:', error);
    }
  };

  // Apple Health integration
  const connectAppleHealth = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple Health is only available on iOS devices');
      return false;
    }

    setIsConnecting(true);
    
    try {
      // In a real implementation, you would use rn-apple-healthkit here
      // For now, we'll simulate the connection
      
      // Simulated permissions request
      const permissions = {
        read: [
          'Steps',
          'DistanceWalkingRunning',
          'ActiveEnergyBurned',
          'HeartRate',
          'Workout'
        ]
      };

      // Simulate permission grant (in real app, this would be actual HealthKit)
      const granted = await new Promise(resolve => {
        Alert.alert(
          'Apple Health Access',
          'Grant access to read workout data from Apple Health?',
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Allow', onPress: () => resolve(true) }
          ]
        );
      });

      if (!granted) {
        setIsConnecting(false);
        return false;
      }

      // Update health source
      const source = healthSources.find(s => s.source_type === 'apple_health');
      if (source) {
        await updateHealthSource(source.id, {
          is_connected: true,
          permissions_granted: permissions,
          sync_status: 'completed'
        });
      }

      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error('Error connecting to Apple Health:', error);
      setIsConnecting(false);
      return false;
    }
  };

  // Google Fit integration
  const connectGoogleFit = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Error', 'Google Fit is only available on Android devices');
      return false;
    }

    setIsConnecting(true);
    
    try {
      // In a real implementation, you would use react-native-google-fit here
      // For now, we'll simulate the connection
      
      const scopes = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.body.read',
        'https://www.googleapis.com/auth/fitness.location.read'
      ];

      // Simulate OAuth flow
      const granted = await new Promise(resolve => {
        Alert.alert(
          'Google Fit Access',
          'Grant access to read fitness data from Google Fit?',
          [
            { text: 'Cancel', onPress: () => resolve(false) },
            { text: 'Allow', onPress: () => resolve(true) }
          ]
        );
      });

      if (!granted) {
        setIsConnecting(false);
        return false;
      }

      // Update health source
      const source = healthSources.find(s => s.source_type === 'google_fit');
      if (source) {
        await updateHealthSource(source.id, {
          is_connected: true,
          permissions_granted: { scopes },
          sync_status: 'completed'
        });
      }

      setIsConnecting(false);
      return true;
    } catch (error) {
      console.error('Error connecting to Google Fit:', error);
      setIsConnecting(false);
      return false;
    }
  };

  const updateHealthSource = async (sourceId: string, updates: Partial<HealthDataSource>) => {
    try {
      const { data, error } = await supabase
        .from('health_data_sources')
        .update(updates)
        .eq('id', sourceId)
        .select()
        .single();

      if (error) throw error;

      setHealthSources(prev => 
        prev.map(source => source.id === sourceId ? data : source)
      );

      return data;
    } catch (error) {
      console.error('Error updating health source:', error);
      return null;
    }
  };

  // Sync workout data
  const syncWorkoutData = async (sourceType?: 'apple_health' | 'google_fit') => {
    if (!user) return;

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      const sourcesToSync = sourceType 
        ? healthSources.filter(s => s.source_type === sourceType && s.is_connected)
        : healthSources.filter(s => s.is_connected);

      for (let i = 0; i < sourcesToSync.length; i++) {
        const source = sourcesToSync[i];
        setSyncProgress((i / sourcesToSync.length) * 100);

        await updateHealthSource(source.id, { sync_status: 'syncing' });

        if (source.source_type === 'apple_health') {
          await syncAppleHealthData(source);
        } else if (source.source_type === 'google_fit') {
          await syncGoogleFitData(source);
        }

        await updateHealthSource(source.id, { 
          sync_status: 'completed',
          last_sync_at: new Date().toISOString()
        });
      }

      setSyncProgress(100);
      setLastSyncTime(new Date());
      await fetchImportedWorkouts();
    } catch (error) {
      console.error('Error syncing workout data:', error);
      Alert.alert('Sync Error', 'Failed to sync workout data. Please try again.');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  const syncAppleHealthData = async (source: HealthDataSource) => {
    // In a real implementation, this would use rn-apple-healthkit
    // For now, we'll create some sample data
    
    const sampleWorkouts = [
      {
        uuid: 'apple-workout-1',
        activityType: 'Running',
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        duration: 1800, // 30 minutes
        distance: 5000, // 5km
        calories: 300,
      },
      {
        uuid: 'apple-workout-2',
        activityType: 'Walking',
        startDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 48 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        duration: 2700, // 45 minutes
        distance: 3000, // 3km
        calories: 150,
      }
    ];

    for (const workout of sampleWorkouts) {
      await importWorkout(source.id, {
        external_id: workout.uuid,
        workout_type: workout.activityType.toLowerCase(),
        start_time: workout.startDate,
        end_time: workout.endDate,
        distance: workout.distance || 0,
        duration: workout.duration,
        calories: workout.calories || 0,
        pace_avg: workout.distance ? (workout.duration / 60) / (workout.distance / 1000) : 0,
        metadata: { source: 'apple_health', raw_data: workout }
      });
    }
    
    // Trigger achievement detection after importing workouts
    await detectAchievementsForUser();
  };

  const syncGoogleFitData = async (source: HealthDataSource) => {
    // In a real implementation, this would use react-native-google-fit
    // For now, we'll create some sample data
    
    const sampleSessions = [
      {
        id: 'google-session-1',
        activityType: 8, // Running
        startTimeMillis: Date.now() - 24 * 60 * 60 * 1000,
        endTimeMillis: Date.now() - 24 * 60 * 60 * 1000 + 25 * 60 * 1000,
        description: 'Morning run'
      }
    ];

    for (const session of sampleSessions) {
      const duration = Math.floor((session.endTimeMillis - session.startTimeMillis) / 1000);
      
      await importWorkout(source.id, {
        external_id: session.id,
        workout_type: 'running',
        start_time: new Date(session.startTimeMillis).toISOString(),
        end_time: new Date(session.endTimeMillis).toISOString(),
        distance: 4000, // Sample distance
        duration: duration,
        calories: 250,
        pace_avg: duration / 60 / 4, // Sample pace
        metadata: { source: 'google_fit', raw_data: session }
      });
    }
    
    // Trigger achievement detection after importing workouts
    await detectAchievementsForUser();
  };

  const importWorkout = async (sourceId: string, workoutData: Omit<ImportedWorkout, 'id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('imported_workouts')
        .upsert({
          user_id: user.id,
          source_id: sourceId,
          ...workoutData
        }, {
          onConflict: 'source_id,external_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error importing workout:', error);
      return null;
    }
  };

  const detectAchievementsForUser = async () => {
    if (!user) return;

    try {
      // Call the achievement detection function for all recent workouts
      const { data: recentWorkouts, error } = await supabase
        .from('imported_workouts')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Process each workout for achievements
      for (const workout of recentWorkouts || []) {
        await supabase.rpc('detect_achievements', {
          p_user_id: user.id,
          p_workout_id: workout.id
        });
      }
    } catch (error) {
      console.error('Error detecting achievements:', error);
    }
  };

  // Auto-sync functionality
  const setupAutoSync = useCallback(async () => {
    const lastAutoSync = await AsyncStorage.getItem('lastAutoSync');
    const now = Date.now();
    const sixHours = 6 * 60 * 60 * 1000;

    if (!lastAutoSync || (now - parseInt(lastAutoSync)) > sixHours) {
      await syncWorkoutData();
      await AsyncStorage.setItem('lastAutoSync', now.toString());
    }
  }, [user, healthSources]);

  // Set up auto-sync when app becomes active
  useEffect(() => {
    if (user && healthSources.some(s => s.is_connected)) {
      setupAutoSync();
    }
  }, [user, healthSources, setupAutoSync]);

  const disconnectHealthSource = async (sourceType: 'apple_health' | 'google_fit') => {
    const source = healthSources.find(s => s.source_type === sourceType);
    if (!source) return;

    try {
      await updateHealthSource(source.id, {
        is_connected: false,
        permissions_granted: {},
        sync_status: 'pending'
      });

      Alert.alert('Disconnected', `${sourceType === 'apple_health' ? 'Apple Health' : 'Google Fit'} has been disconnected.`);
    } catch (error) {
      console.error('Error disconnecting health source:', error);
      Alert.alert('Error', 'Failed to disconnect health source.');
    }
  };

  const getConnectedSources = () => {
    return healthSources.filter(source => source.is_connected);
  };

  const getWorkoutStats = () => {
    const totalWorkouts = importedWorkouts.length;
    const totalDistance = importedWorkouts.reduce((sum, workout) => sum + (workout.distance || 0), 0);
    const totalDuration = importedWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
    const totalCalories = importedWorkouts.reduce((sum, workout) => sum + (workout.calories || 0), 0);

    return {
      totalWorkouts,
      totalDistance: totalDistance / 1000, // Convert to km
      totalDuration: Math.floor(totalDuration / 60), // Convert to minutes
      totalCalories,
      averagePace: totalDistance > 0 ? (totalDuration / 60) / (totalDistance / 1000) : 0
    };
  };

  return {
    healthSources,
    importedWorkouts,
    isConnecting,
    isSyncing,
    syncProgress,
    lastSyncTime,
    connectAppleHealth,
    connectGoogleFit,
    syncWorkoutData,
    disconnectHealthSource,
    getConnectedSources,
    getWorkoutStats,
    refreshData: fetchImportedWorkouts
  };
}