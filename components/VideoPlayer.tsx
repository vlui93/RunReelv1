import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Linking, 
  Platform,
  Dimensions 
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

interface VideoPlayerProps {
  videoUrl: string;
  thumbnail?: string;
  title: string;
  style?: any;
  activityType?: string;
  onPress?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoUrl, 
  thumbnail, 
  title, 
  style,
  activityType = 'Other',
  onPress
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [status, setStatus] = useState<any>({});

  const openInNativePlayer = async () => {
    if (onPress) {
      onPress();
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // For web, open in new tab
        window.open(videoUrl, '_blank');
        return;
      }

      // For mobile, try to open in native player
      const supported = await Linking.canOpenURL(videoUrl);
      if (supported) {
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert('Error', 'Cannot open video in native player');
      }
    } catch (error) {
      console.error('Failed to open video:', error);
      Alert.alert('Error', 'Failed to open video');
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getActivityEmoji = (type: string): string => {
    const emojis = {
      'Running': '🏃‍♀️',
      'Cycling': '🚴‍♀️',
      'Walking': '🚶‍♀️',
      'Swimming': '🏊‍♀️',
      'Strength Training': '💪',
      'Yoga': '🧘‍♀️',
      'Other': '🎬'
    };
    return emojis[type as keyof typeof emojis] || '🎬';
  };

  if (Platform.OS === 'web') {
    // Web version with thumbnail and click to open
    return (
      <TouchableOpacity 
        style={[styles.videoContainer, style]}
        onPress={openInNativePlayer}
        activeOpacity={0.8}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
        ) : (
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.placeholderThumbnail}
          >
            <Text style={styles.activityEmoji}>{getActivityEmoji(activityType)}</Text>
            <Text style={styles.placeholderText}>Tap to play video</Text>
          </LinearGradient>
        )}
        
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
        
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Native mobile version with actual video player
  return (
    <View style={[styles.videoContainer, style]}>
      <TouchableOpacity 
        style={styles.videoWrapper}
        onPress={() => setShowControls(!showControls)}
        activeOpacity={1}
      >
        <Video
          source={{ uri: videoUrl }}
          style={styles.video}
          useNativeControls={false}
          resizeMode={ResizeMode.COVER}
          isLooping={false}
          isMuted={isMuted}
          shouldPlay={isPlaying}
          onPlaybackStatusUpdate={setStatus}
        />
        
        {showControls && (
          <View style={styles.controlsOverlay}>
            <View style={styles.topControls}>
              <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
                {isMuted ? (
                  <VolumeX size={20} color="#FFFFFF" />
                ) : (
                  <Volume2 size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={openInNativePlayer}>
                <Maximize size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.centerPlayButton} onPress={togglePlayback}>
              <View style={styles.playButtonLarge}>
                {isPlaying ? (
                  <Pause size={24} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                  <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  videoWrapper: {
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 200,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#e0e0e0',
  },
  placeholderThumbnail: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  playButtonLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  videoInfo: {
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 20,
  },
});