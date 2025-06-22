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
  // Only load react-native-maps on native platforms
  if (Platform.OS !== 'web') {
    try {
      const MapView = require('react-native-maps').default;
      const { Marker, Polyline } = require('react-native-maps');

      return (
        <MapView
          style={style}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          followsUserLocation={isRunning && !isPaused}
        >
          {/* Current position marker */}
          {routeData.length > 0 && (
            <Marker
              coordinate={{
                latitude: routeData[routeData.length - 1].latitude,
                longitude: routeData[routeData.length - 1].longitude,
              }}
              title="Current Position"
            />
          )}
          
          {/* Route polyline */}
          {routeData.length > 1 && (
            <Polyline
              coordinates={routeData.map(point => ({
                latitude: point.latitude,
                longitude: point.longitude,
              }))}
              strokeColor="#3B82F6"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </MapView>
      );
    } catch (error) {
      console.warn('Failed to load react-native-maps:', error);
      return <WebMapFallback routeData={routeData} />;
    }
  }

  // Web fallback
  return <WebMapFallback routeData={routeData} />;
}

function WebMapFallback({ routeData }: { routeData: LocationPoint[] }) {
  return (
    <View style={styles.mapPlaceholder}>
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