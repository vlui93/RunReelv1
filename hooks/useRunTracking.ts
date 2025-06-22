import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface RunStats {
  distance: number; // km
  duration: number; // seconds
  currentPace: number; // min/km
  averagePace: number; // min/km
  calories: number;
}

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export function useRunTracking() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<RunStats>({
    distance: 0,
    duration: 0,
    currentPace: 0,
    averagePace: 0,
    calories: 0,
  });
  const [routeData, setRouteData] = useState<LocationPoint[]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  const startTimeRef = useRef<number>(0);
  const pausedTimeAccumRef = useRef<number>(0);
  const lastPauseTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Request location permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasLocationPermission(status === 'granted');
    })();
  }, []);

  // Haversine formula for distance in km
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  // Estimate calories (can be made user-dependent in future)
  const calculateCalories = useCallback((distance: number): number => {
    const avgWeight = 70; // kg
    return Math.round(0.8 * avgWeight * distance);
  }, []);

  // Updates stats every second
  const updateStats = useCallback(() => {
    if (routeData.length < 2) return;

    let totalDistance = 0;
    for (let i = 1; i < routeData.length; i++) {
      const prev = routeData[i - 1];
      const curr = routeData[i];
      totalDistance += calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }

    const now = Date.now();
    const elapsedTime =
      Math.floor((now - startTimeRef.current - pausedTimeAccumRef.current) / 1000);

    // Average pace (min/km)
    const averagePace = totalDistance > 0 ? elapsedTime / 60 / totalDistance : 0;

    // Current pace (last 1km or last 5 minutes, whichever is shorter)
    let currentPace = 0;
    if (routeData.length > 1) {
      const windowMs = 5 * 60 * 1000; // 5 min
      let recentDistance = 0;
      let i = routeData.length - 1;
      while (
        i > 0 &&
        (routeData[routeData.length - 1].timestamp - routeData[i - 1].timestamp) <
          windowMs &&
        recentDistance < 1
      ) {
        const prev = routeData[i - 1];
        const curr = routeData[i];
        recentDistance += calculateDistance(
          prev.latitude,
          prev.longitude,
          curr.latitude,
          curr.longitude
        );
        i--;
      }
      const recentTime =
        routeData[routeData.length - 1].timestamp - routeData[i].timestamp;
      if (recentDistance > 0) {
        currentPace = (recentTime / 1000 / 60) / recentDistance;
      }
    }

    setStats({
      distance: totalDistance,
      duration: elapsedTime,
      currentPace,
      averagePace,
      calories: calculateCalories(totalDistance),
    });
  }, [routeData, calculateDistance, calculateCalories]);

  // Helper to safely remove the location subscription
  const removeLocationSubscription = useCallback(() => {
    const sub = locationSubscriptionRef.current;
    if (sub && typeof sub.remove === 'function') {
      sub.remove();
      locationSubscriptionRef.current = null;
    }
  }, []);

  // Start a new run
  const startRun = useCallback(async () => {
    if (!hasLocationPermission || !user) return;

    setIsRunning(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeAccumRef.current = 0;
    lastPauseTimeRef.current = 0;
    setRouteData([]);
    setStats({
      distance: 0,
      duration: 0,
      currentPace: 0,
      averagePace: 0,
      calories: 0,
    });

    // Start location tracking
    locationSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 5,
      },
      (location) => {
        const newPoint: LocationPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: Date.now(),
        };
        setRouteData((prev) => [...prev, newPoint]);
      }
    );

    // Start timer
    intervalRef.current = setInterval(updateStats, 1000);
  }, [hasLocationPermission, user, updateStats]);

  // Pause the run
  const pauseRun = useCallback(() => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
    lastPauseTimeRef.current = Date.now();

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    removeLocationSubscription();
  }, [isRunning, isPaused, removeLocationSubscription]);

  // Resume the run
  const resumeRun = useCallback(async () => {
    if (!isPaused) return;
    setIsPaused(false);
    if (lastPauseTimeRef.current) {
      pausedTimeAccumRef.current += Date.now() - lastPauseTimeRef.current;
      lastPauseTimeRef.current = 0;
    }

    // Resume location tracking
    locationSubscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 5,
      },
      (location) => {
        const newPoint: LocationPoint = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: Date.now(),
        };
        setRouteData((prev) => [...prev, newPoint]);
      }
    );

    // Resume timer
    intervalRef.current = setInterval(updateStats, 1000);
  }, [isPaused, updateStats]);

  // Stop the run and save to database
  const stopRun = useCallback(async () => {
    if (!isRunning || !user) return;

    setIsRunning(false);
    setIsPaused(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    removeLocationSubscription();

    // Return run data for the modal to handle saving
    return {
      distance: stats.distance,
      duration: stats.duration,
      averagePace: stats.averagePace,
      calories: stats.calories,
      routeData: routeData,
    };
  }, [isRunning, user, stats, routeData, removeLocationSubscription]);

  // Save run with additional data from modal
  const saveRun = useCallback(async (additionalData: {
    effortLevel: string;
    mood: number;
  }) => {
    if (!user || stats.distance === 0) return null;

    const { data, error } = await supabase
      .from('runs')
      .insert({
        user_id: user.id,
        distance: stats.distance,
        duration: stats.duration,
        average_pace: stats.averagePace,
        calories: stats.calories,
        route_data: routeData,
        effort_level: additionalData.effortLevel,
        mood_rating: additionalData.mood,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving run:', error);
      return null;
    }

    return data;
  }, [user, stats, routeData]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format pace as MM:SS per km
  const formatPace = (pace: number): string => {
    if (!isFinite(pace) || pace <= 0) return '--';
    const minutes = Math.floor(pace);
    const seconds = Math.floor((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format distance with appropriate decimals
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${(distance * 1000).toFixed(0)}m`;
    }
    return `${distance.toFixed(2)}km`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      removeLocationSubscription();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
  };
}