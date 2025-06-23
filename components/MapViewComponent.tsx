import React from 'react';
import MapView, { Marker, Polyline } from 'react-native-maps';

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
}