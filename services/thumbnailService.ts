import * as VideoThumbnails from 'expo-video-thumbnails';
import { Platform } from 'react-native';

export class ThumbnailService {
  static async generateThumbnail(videoUrl: string): Promise<string | null> {
    try {
      // Skip thumbnail generation on web platform
      if (Platform.OS === 'web') {
        console.log('📱 Thumbnail generation skipped on web platform');
        return null;
      }

      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
        time: 2000, // 2 seconds into video
        quality: 0.8,
      });
      
      console.log('✅ Thumbnail generated:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      return null;
    }
  }

  static async generateMultipleThumbnails(videoUrl: string): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        return [];
      }

      // Generate thumbnails at different timestamps for variety
      const thumbnails = await Promise.all([
        VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 }),
        VideoThumbnails.getThumbnailAsync(videoUrl, { time: 3000 }),
        VideoThumbnails.getThumbnailAsync(videoUrl, { time: 5000 })
      ]);
      
      return thumbnails.map(t => t.uri);
    } catch (error) {
      console.error('Multiple thumbnail generation failed:', error);
      return [];
    }
  }

  static generatePlaceholderThumbnail(activityType: string): string {
    // Return a placeholder based on activity type
    const placeholders = {
      'Running': '🏃‍♀️',
      'Cycling': '🚴‍♀️',
      'Walking': '🚶‍♀️',
      'Swimming': '🏊‍♀️',
      'Strength Training': '💪',
      'Yoga': '🧘‍♀️',
      'Other': '🎬'
    };
    
    return placeholders[activityType as keyof typeof placeholders] || '🎬';
  }
}