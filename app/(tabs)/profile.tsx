import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Edit3, 
  Settings, 
  Activity, 
  Video, 
  Target, 
  Ruler, 
  Bell, 
  Calendar, 
  Globe 
} from 'lucide-react-native';

interface UserProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

interface ProfileStats {
  totalRuns: number;
  totalDistance: number;
  totalDuration: number;
  totalVideos: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useSettings();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalRuns: 0,
    totalDistance: 0,
    totalDuration: 0,
    totalVideos: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
        setUsername(data.username || '');
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || 'runner',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(newProfile);
          setUsername(newProfile.username || '');
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data: runs, error } = await supabase
        .from('runs')
        .select('distance, duration, video_url')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching stats:', error);
        return;
      }

      const totalRuns = runs?.length || 0;
      const totalDistance = runs?.reduce((sum, run) => sum + run.distance, 0) || 0;
      const totalDuration = runs?.reduce((sum, run) => sum + run.duration, 0) || 0;
      const totalVideos = runs?.filter(run => run.video_url).length || 0;

      setStats({
        totalRuns,
        totalDistance,
        totalDuration,
        totalVideos,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          username: username.trim(),
        })
        .eq('id', user.id);

      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        console.error('Error updating profile:', error);
      } else {
        setProfile({ ...profile, username: username.trim() });
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (distance: number): string => {
    return `${distance.toFixed(1)}km`;
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ],
    );
  };

  const handleDistanceUnitChange = () => {
    const newUnit = settings.distanceUnit === 'km' ? 'miles' : 'km';
    const newPaceUnit = newUnit === 'km' ? 'min/km' : 'min/mile';
    updateSettings({ 
      distanceUnit: newUnit,
      paceUnit: newPaceUnit 
    });
  };

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please sign in to view your profile</Text>
      </View>
    );
  }

  if (settingsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <User size={48} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User size={48} color="#6B7280" />
          </View>
        </View>

        <View style={styles.profileInfo}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.usernameInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                autoCapitalize="none"
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    setUsername(profile?.username || '');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editButton, styles.saveButton]}
                  onPress={updateProfile}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>
                    {loading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.profileDisplay}>
              <View style={styles.usernameContainer}>
                <Text style={styles.username}>
                  {profile?.username || 'Runner'}
                </Text>
                <TouchableOpacity
                  style={styles.editIcon}
                  onPress={() => setIsEditing(true)}
                >
                  <Edit3 size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.email}>{user.email}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Activity size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.totalRuns}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statValue}>{formatDistance(stats.totalDistance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Settings size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{formatTime(stats.totalDuration)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statCard}>
            <Video size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.totalVideos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>
      </View>

      {/* Settings Sections */}
      
      {/* Units Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ruler size={20} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Units & Measurements</Text>
        </View>

        <TouchableOpacity style={styles.settingItem} onPress={handleDistanceUnitChange}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Distance Unit</Text>
            <Text style={styles.settingDescription}>
              Choose between kilometers and miles
            </Text>
          </View>
          <View style={styles.unitToggle}>
            <Text style={[
              styles.unitOption,
              settings.distanceUnit === 'km' && styles.unitOptionActive
            ]}>
              KM
            </Text>
            <Text style={styles.unitSeparator}>|</Text>
            <Text style={[
              styles.unitOption,
              settings.distanceUnit === 'miles' && styles.unitOptionActive
            ]}>
              MI
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Pace Display</Text>
            <Text style={styles.settingDescription}>
              Automatically matches distance unit
            </Text>
          </View>
          <Text style={styles.settingValue}>{settings.paceUnit}</Text>
        </View>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => updateSettings({
            temperatureUnit: settings.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius'
          })}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Temperature</Text>
            <Text style={styles.settingDescription}>
              Weather display preference
            </Text>
          </View>
          <View style={styles.unitToggle}>
            <Text style={[
              styles.unitOption,
              settings.temperatureUnit === 'celsius' && styles.unitOptionActive
            ]}>
              °C
            </Text>
            <Text style={styles.unitSeparator}>|</Text>
            <Text style={[
              styles.unitOption,
              settings.temperatureUnit === 'fahrenheit' && styles.unitOptionActive
            ]}>
              °F
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Calendar Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color="#10B981" />
          <Text style={styles.sectionTitle}>Calendar & Time</Text>
        </View>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => updateSettings({
            firstDayOfWeek: settings.firstDayOfWeek === 'sunday' ? 'monday' : 'sunday'
          })}
        >
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>First Day of Week</Text>
            <Text style={styles.settingDescription}>
              Calendar and weekly stats display
            </Text>
          </View>
          <Text style={styles.settingValue}>
            {settings.firstDayOfWeek === 'sunday' ? 'Sunday' : 'Monday'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={20} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Notifications</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Achievement Alerts</Text>
            <Text style={styles.settingDescription}>
              Get notified when you unlock new achievements
            </Text>
          </View>
          <Switch
            value={settings.notifications.achievements}
            onValueChange={() => handleNotificationChange('achievements')}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={settings.notifications.achievements ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Workout Reminders</Text>
            <Text style={styles.settingDescription}>
              Daily reminders to stay active
            </Text>
          </View>
          <Switch
            value={settings.notifications.workoutReminders}
            onValueChange={() => handleNotificationChange('workoutReminders')}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={settings.notifications.workoutReminders ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Weekly Reports</Text>
            <Text style={styles.settingDescription}>
              Summary of your weekly progress
            </Text>
          </View>
          <Switch
            value={settings.notifications.weeklyReports}
            onValueChange={() => handleNotificationChange('weeklyReports')}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={settings.notifications.weeklyReports ? '#FFFFFF' : '#9CA3AF'}
          />
        </View>
      </View>

      {/* Data Sources Info */}
      <View style={styles.infoSection}>
        <Globe size={20} color="#6B7280" />
        <Text style={styles.infoTitle}>Data Sources</Text>
        <Text style={styles.infoText}>
          RunReel imports detailed metrics from Apple Health and Google Fit, including:
        </Text>
        <View style={styles.metricsList}>
          <Text style={styles.metricsItem}>• Distance, pace, and split times</Text>
          <Text style={styles.metricsItem}>• Heart rate zones and variability</Text>
          <Text style={styles.metricsItem}>• Elevation gain and route data</Text>
          <Text style={styles.metricsItem}>• Cadence and stride length</Text>
          <Text style={styles.metricsItem}>• Calories and active energy</Text>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
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
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  profileContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    width: '100%',
  },
  profileDisplay: {
    alignItems: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  editIcon: {
    marginLeft: 8,
    padding: 4,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  editContainer: {
    width: '100%',
  },
  usernameInput: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
    textAlign: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
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
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  unitOption: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unitOptionActive: {
    color: '#3B82F6',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  unitSeparator: {
    fontSize: 14,
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  metricsList: {
    marginLeft: 8,
  },
  metricsItem: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});