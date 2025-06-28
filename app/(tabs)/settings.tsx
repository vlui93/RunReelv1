import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSettings } from '@/hooks/useSettings';
import { Settings, Globe, Bell, Calendar, Ruler, Gauge } from 'lucide-react-native';

export default function SettingsScreen() {
  const { settings, updateSettings, loading } = useSettings();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Settings size={48} color="#3B82F6" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your RunReel experience</Text>
      </View>

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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
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
});