import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  return (
    <View style={[styles.mapPlaceholder, style]}>
      <MapPin size={48} color="#6B7280" />
      <Text style={styles.mapPlaceholderText}>
        Map view available on mobile devices
      </Text>
      {routeData.length > 0 && (
        <Text style={styles.routeInfo}>
          Route points recorded: {routeData.length}
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
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  routeInfo: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});