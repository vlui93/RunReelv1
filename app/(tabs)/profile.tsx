import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { User, Edit3, Settings, Activity, Video, Target } from 'lucide-react-native';

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

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Please sign in to view your profile</Text>
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

      {/* Settings */}
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Settings size={20} color="#6B7280" />
          <Text style={styles.settingText}>App Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <User size={20} color="#6B7280" />
          <Text style={styles.settingText}>Account Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Video size={20} color="#6B7280" />
          <Text style={styles.settingText}>Video Settings</Text>
        </TouchableOpacity>
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
    marginBottom: 24,
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
  settingsContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  settingItem: {
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
  settingText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});