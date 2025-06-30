// Simplified video service for demo purposes
interface ActivityData {
  id: string;
  activity_type: string;
  activity_name: string;
  distance_km?: number;
  duration_seconds: number;
  calories_burned?: number;
}

interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

class DemoVideoService {
  private readonly DEMO_VIDEO_URL = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
  private readonly DEMO_THUMBNAIL_URL = 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=400';

  async generateActivityVideo(activity: ActivityData): Promise<VideoGenerationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate occasional failure for realism
    if (Math.random() < 0.1) {
      return {
        success: false,
        error: 'Demo service simulation: Random failure for testing'
      };
    }

    return {
      success: true,
      videoUrl: this.DEMO_VIDEO_URL,
      thumbnailUrl: this.DEMO_THUMBNAIL_URL
    };
  }

  isConfigured(): boolean {
    return true; // Always configured in demo mode
  }

  getConfigStatus(): { configured: boolean, message: string } {
    return {
      configured: true,
      message: 'Demo video service is active. Replace with actual Tavus integration for production.'
    };
  }
}

export const demoVideoService = new DemoVideoService();