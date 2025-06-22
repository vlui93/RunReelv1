import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRunTracking } from '@/hooks/useRunTracking';
import { router } from 'expo-router';
import { Play, Pause, Square, MapPin } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PostRunModal from '@/components/PostRunModal';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function NavigateScreen() {
  const [showPostRunModal, setShowPostRunModal] = useState(false);
  const [runData, setRunData] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const {
    isRunning,
    isPaused,
    stats,
    hasLocationPermission,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
    saveRun,
    formatTime,
    formatPace,
    formatDistance,
    routeData,
  } = useRunTracking();

  const handleStartRun = async () => {
    if (!hasLocationPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions to track your run.',
        [{ text: 'OK' }]
      );
      return;
    }
    await startRun();
  };

  const handleStopRun = async () => {
    Alert.alert(
      'End Run',
      'Are you sure you want to end your run?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Run',
          style: 'destructive',
          onPress: async () => {
            const data = await stopRun();
            setRunData(data);
            setShowPostRunModal(true);
          },
        },
      ],
    );
  };

  const handlePostRunComplete = async (modalData: {
    effortLevel: 'encouraged' | 'mission_accomplished' | 'personal_best';
    mood: number;
  }) => {
    const savedRun = await saveRun(modalData);
    setShowPostRunModal(false);
    
    if (savedRun) {
      router.push({
        pathname: '/run-summary',
        params: { runId: savedRun.id }
      });
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRun();
    } else {
      pauseRun();
    }
  };

  // Update map region when route data changes
  React.useEffect(() => {
    if (routeData.length > 0) {
      const lastPoint = routeData[routeData.length - 1];
      setMapRegion(prev => ({
        ...prev,
        latitude: lastPoint.latitude,
        longitude: lastPoint.longitude,
      }));
    }
  }, [routeData]);

  if (!hasLocationPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <MapPin size={64} color="#EF4444" />
          <Text style={styles.permissionTitle}>Location Access Required</Text>
          <Text style={styles.permissionText}>
            RunReel needs access to your location to track your runs accurately.
            Please enable location permissions in your device settings.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {!isRunning ? 'Ready to Run' : isPaused ? 'Run Paused' : 'Running'}
        </Text>
        <View style={styles.statusIndicator}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: isRunning && !isPaused ? '#10B981' : '#EF4444' }
          ]} />
          <Text style={styles.statusText}>
            {!isRunning ? 'Not Active' : isPaused ? 'Paused' : 'Active'}
          </Text>
        </View>
      </View>

      {/* Map Display */}
      {Platform.OS !== 'web' && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={mapRegion}
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
        </View>
      )}

      {/* Web fallback for map */}
      {Platform.OS === 'web' && (
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
      )}

      {/* Stats Display */}
      <View style={styles.statsContainer}>
        {/* Primary Stats */}
        <View style={styles.primaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDistance(stats.distance)}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatTime(stats.duration)}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
        </View>

        {/* Secondary Stats */}
        <View style={styles.secondaryStats}>
          <View style={styles.statCard}>
            <Text style={styles.cardValue}>
              {stats.currentPace > 0 ? formatPace(stats.currentPace) : '--:--'}
            </Text>
            <Text style={styles.cardLabel}>Current Pace</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.cardValue}>
              {stats.averagePace > 0 ? formatPace(stats.averagePace) : '--:--'}
            </Text>
            <Text style={styles.cardLabel}>Avg. Pace</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.cardValue}>{stats.calories}</Text>
            <Text style={styles.cardLabel}>Calories</Text>
          </View>
        </View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStartRun}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.startButtonGradient}
            >
              <Play size={32} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Start Run</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.pauseButton]} 
              onPress={handlePauseResume}
            >
              {isPaused ? (
                <Play size={24} color="#FFFFFF" />
              ) : (
                <Pause size={24} color="#FFFFFF" />
              )}
              <Text style={styles.controlButtonText}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={handleStopRun}
            >
              <Square size={24} color="#FFFFFF" />
              <Text style={styles.controlButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tips Section */}
      {!isRunning && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Running Tips</Text>
          <Text style={styles.tipsText}>
            • Make sure your phone has enough battery
          </Text>
          <Text style={styles.tipsText}>
            • Keep your phone with you during the run
          </Text>
          <Text style={styles.tipsText}>
            • Your run data will be saved automatically
          </Text>
        </View>
      )}

      {/* Post-Run Modal */}
      <PostRunModal
        visible={showPostRunModal}
        onClose={() => setShowPostRunModal(false)}
        runData={{
          distance: runData?.distance || 0,
          duration: runData?.duration || 0,
          pace: runData?.averagePace || 0,
        }}
        onComplete={handlePostRunComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsContainer: {
    flex: 1,
    padding: 24,
  },
  primaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  controlsContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  runningControls: {
    flexDirection: 'row',
    gap: 16,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    margin: 24,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    height: 200,
    marginHorizontal: 24,
    marginBottom: 24,
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