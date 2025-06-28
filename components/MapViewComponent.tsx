import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MapPin } from 'lucide-react-native';

interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface MapViewComponentProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  routeData: LocationPoint[];
  isRunning: boolean;
  isPaused: boolean;
  style?: any;
}

export default function MapViewComponent({
  region,
  routeData,
  isRunning,
  isPaused,
  style
}: MapViewComponentProps) {
  // For now, show a placeholder on all platforms since react-native-maps
  // requires additional native setup that's not available in Expo managed workflow
  return (
    <View style={[styles.mapPlaceholder, style]}>
      <MapPin size={48} color="#6B7280" />
      <Text style={styles.mapPlaceholderText}>
        {Platform.OS === 'web' 
          ? 'Map view available on mobile devices' 
          : 'GPS tracking active'
        }
      </Text>
      {routeData.length > 0 && (
        <View style={styles.routeInfo}>
          <Text style={styles.routeInfoText}>
            Route points recorded: {routeData.length}
          </Text>
          {isRunning && (
            <View style={[styles.statusIndicator, isPaused ? styles.pausedIndicator : styles.activeIndicator]}>
              <Text style={styles.statusText}>
                {isPaused ? 'Paused' : 'Recording'}
              </Text>
            </View>
          )}
        </View>
      )}
      {Platform.OS !== 'web' && (
        <Text style={styles.upgradeText}>
          Full map visualization coming soon
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  routeInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  activeIndicator: {
    backgroundColor: '#DCFCE7',
  },
  pausedIndicator: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  upgradeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    fontStyle: 'italic',
  },
});