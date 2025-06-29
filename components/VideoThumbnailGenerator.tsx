import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Video, Play, Target, Clock, Zap, Calendar } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface VideoThumbnailGeneratorProps {
  activityType: string;
  activityName: string;
  distance?: number;
  duration: number;
  calories?: number;
  date: string;
  style?: any;
}

export default function VideoThumbnailGenerator({
  activityType,
  activityName,
  distance,
  duration,
  calories,
  date,
  style
}: VideoThumbnailGeneratorProps) {
  
  const getGradientColors = (type: string): [string, string] => {
    switch (type.toLowerCase()) {
      case 'running':
        return ['#3B82F6', '#1D4ED8']; // Blue gradient
      case 'cycling':
        return ['#10B981', '#059669']; // Green gradient
      case 'walking':
        return ['#8B5CF6', '#7C3AED']; // Purple gradient
      case 'swimming':
        return ['#06B6D4', '#0891B2']; // Cyan gradient
      case 'strength training':
        return ['#F59E0B', '#D97706']; // Orange gradient
      case 'yoga':
        return ['#EC4899', '#DB2777']; // Pink gradient
      default:
        return ['#6B7280', '#4B5563']; // Gray gradient
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'running':
        return <Target size={28} color="#FFFFFF" />;
      case 'cycling':
        return <Target size={28} color="#FFFFFF" />;
      case 'walking':
        return <Target size={28} color="#FFFFFF" />;
      case 'swimming':
        return <Target size={28} color="#FFFFFF" />;
      case 'strength training':
        return <Zap size={28} color="#FFFFFF" />;
      case 'yoga':
        return <Target size={28} color="#FFFFFF" />;
      default:
        return <Video size={28} color="#FFFFFF" />;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (km?: number): string => {
    if (!km) return '';
    return `${km.toFixed(1)}km`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const gradientColors = getGradientColors(activityType);

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={styles.patternDot} />
          <View style={[styles.patternDot, styles.patternDot2]} />
          <View style={[styles.patternDot, styles.patternDot3]} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.activityTypeContainer}>
              {getActivityIcon(activityType)}
              <Text style={styles.activityType}>{activityType}</Text>
            </View>
            <View style={styles.dateContainer}>
              <Calendar size={16} color="#FFFFFF" />
              <Text style={styles.date}>{formatDate(date)}</Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {activityName}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {distance && (
              <View style={styles.stat}>
                <Target size={16} color="#FFFFFF" />
                <Text style={styles.statText}>{formatDistance(distance)}</Text>
              </View>
            )}
            <View style={styles.stat}>
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.statText}>{formatTime(duration)}</Text>
            </View>
            {calories && (
              <View style={styles.stat}>
                <Zap size={16} color="#FFFFFF" />
                <Text style={styles.statText}>{calories} cal</Text>
              </View>
            )}
          </View>

          {/* Play Button Overlay */}
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Play size={18} color="#3B82F6" fill="#3B82F6" />
            </View>
          </View>

          {/* Video Badge */}
          <View style={styles.videoBadge}>
            <Video size={12} color="#FFFFFF" />
            <Text style={styles.videoBadgeText}>AI Video</Text>
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -20,
    right: -20,
  },
  patternDot2: {
    width: 40,
    height: 40,
    borderRadius: 20,
    top: '60%',
    left: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  patternDot3: {
    width: 80,
    height: 80,
    borderRadius: 40,
    bottom: -30,
    right: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityType: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  date: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  videoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    top: -40,
    left: -40,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -20,
    right: -20,
  },
});