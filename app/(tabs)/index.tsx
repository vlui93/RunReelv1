import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Play, Activity, Target, Trophy } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Welcome to RunReel</Text>
          <Text style={styles.subtitle}>Track your runs and create amazing AI videos of your achievements!</Text>
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.userName}>Ready for your next run?</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Start Card */}
      <TouchableOpacity 
        style={styles.quickStartCard}
        onPress={() => router.push('/(tabs)/navigate')}
      >
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          style={styles.quickStartGradient}
        >
          <View style={styles.quickStartContent}>
            <Play size={32} color="#FFFFFF" />
            <View style={styles.quickStartText}>
              <Text style={styles.quickStartTitle}>Start Run</Text>
              <Text style={styles.quickStartSubtitle}>Begin tracking your run</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Activity size={24} color="#3B82F6" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={24} color="#10B981" />
            <Text style={styles.statValue}>0.0km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statCard}>
            <Trophy size={24} color="#F59E0B" />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyState}>
          <Activity size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No runs yet</Text>
          <Text style={styles.emptyStateSubtitle}>Start your first run to see your activity here</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/activity')}
        >
          <Text style={styles.actionButtonText}>View All Runs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Edit Profile</Text>
        </TouchableOpacity>
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
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  authButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
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
  signOutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickStartCard: {
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
  quickStartGradient: {
    padding: 24,
  },
  quickStartContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickStartText: {
    marginLeft: 16,
  },
  quickStartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickStartSubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
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
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginHorizontal: 4,
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
  recentSection: {
    marginHorizontal: 24,
    marginBottom: 32,
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
  quickActions: {
    marginHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#1F2937',
  },
});