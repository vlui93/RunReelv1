interface VideoGenerationRequest {
  achievementId: string;
  templateId?: string;
  format: 'square' | 'vertical' | 'horizontal';
  customization?: {
    voiceType?: 'motivational' | 'encouraging' | 'calm' | 'excited' | 'proud';
    backgroundStyle?: 'running_track' | 'mountain_road' | 'nature_path' | 'confetti' | 'calendar';
    musicStyle?: 'energetic' | 'uplifting' | 'peaceful' | 'triumphant';
    includeStats?: boolean;
    includeBranding?: boolean;
  };
}

interface Achievement {
  id: string;
  achievement_type: 'personal_record' | 'milestone' | 'streak' | 'first_time';
  category: 'distance' | 'duration' | 'pace' | 'consistency' | 'calories' | 'frequency';
  value: number;
  previous_value: number | null;
  description: string;
  workout?: {
    workout_type: string;
    start_time: string;
    distance: number;
    duration: number;
  };
}

interface TavusResponse {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  preview_url?: string;
  thumbnail_url?: string;
}

class EnhancedTavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';

  constructor() {
    this.apiKey = process.env.EXPO_PUBLIC_TAVUS_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ TAVUS API KEY MISSING: Please set EXPO_PUBLIC_TAVUS_API_KEY in your environment variables');
    }
  }

  private generateAchievementScript(achievement: Achievement): string {
    const { achievement_type, category, value, previous_value, description, workout } = achievement;
    
    const scripts = {
      personal_record: {
        distance: [
          `Incredible achievement! You just set a new personal record by completing ${(value / 1000).toFixed(2)} kilometers! Your previous best was ${previous_value ? (previous_value / 1000).toFixed(2) : '0'} km. You're absolutely crushing your fitness goals!`,
          `What a phenomenal run! You've just smashed your distance record with an amazing ${(value / 1000).toFixed(2)}km performance. That's ${previous_value ? ((value - previous_value) / 1000).toFixed(2) : value / 1000}km further than your previous best. Your dedication is truly inspiring!`,
          `Outstanding performance! You've just achieved a new distance milestone of ${(value / 1000).toFixed(2)} kilometers. This represents incredible progress from your previous record. Keep pushing those boundaries!`
        ],
        duration: [
          `Remarkable endurance! You just completed your longest workout ever - ${Math.floor(value / 60)} minutes of pure determination! Your previous best was ${previous_value ? Math.floor(previous_value / 60) : 0} minutes. You're building incredible stamina!`,
          `What an amazing display of persistence! ${Math.floor(value / 60)} minutes of continuous effort shows your incredible commitment to fitness. You've just set a new personal record for workout duration!`,
          `Exceptional dedication! Your ${Math.floor(value / 60)}-minute workout is your longest yet, proving that your endurance is reaching new heights. This is what commitment looks like!`
        ],
        pace: [
          `Lightning fast! You just achieved your best pace ever at ${value.toFixed(2)} minutes per kilometer! Your speed and efficiency are reaching new levels. This is the result of all your hard training!`,
          `Incredible speed! Your new pace record of ${value.toFixed(2)} min/km shows how much your fitness has improved. You're getting faster and stronger with every run!`,
          `Blazing performance! ${value.toFixed(2)} minutes per kilometer - that's your fastest pace yet! Your training is clearly paying off in spectacular fashion!`
        ]
      },
      milestone: {
        distance: [
          `Congratulations on reaching this incredible milestone! ${(value / 1000).toFixed(0)}km completed - this is a major achievement that shows your dedication and perseverance. You should be incredibly proud!`,
          `What a momentous achievement! Completing ${(value / 1000).toFixed(0)} kilometers is no small feat. This milestone represents hours of training, dedication, and pure determination. Celebrate this victory!`,
          `Milestone unlocked! ${(value / 1000).toFixed(0)}km is a significant distance that many people never achieve. You've just proven that with commitment and persistence, anything is possible!`
        ]
      },
      first_time: [
        `Welcome to your fitness journey! Completing your first ${workout?.workout_type || 'workout'} is a huge step towards a healthier, stronger you. Every expert was once a beginner - you've just taken that crucial first step!`,
        `Congratulations on your first ${workout?.workout_type || 'workout'}! This is the beginning of something amazing. You've just proven to yourself that you can do anything you set your mind to!`,
        `First ${workout?.workout_type || 'workout'} complete! This is a moment to celebrate - you've just started a journey that will transform your health, confidence, and life. Here's to many more achievements ahead!`
      ],
      streak: [
        `Incredible consistency! ${value} days in a row of staying committed to your fitness goals. This streak shows your dedication and discipline. You're building habits that will last a lifetime!`,
        `${value} days strong! Your consistency is absolutely inspiring. This streak proves that you have the determination to achieve anything you set your mind to. Keep this momentum going!`,
        `Streak master! ${value} consecutive days of fitness commitment is no accident - it's the result of discipline, planning, and pure determination. You're setting an amazing example!`
      ]
    };

    // Select appropriate script based on achievement type and category
    let scriptArray: string[];
    
    if (achievement_type === 'personal_record' && scripts.personal_record[category as keyof typeof scripts.personal_record]) {
      scriptArray = scripts.personal_record[category as keyof typeof scripts.personal_record] as string[];
    } else if (achievement_type === 'milestone' && scripts.milestone[category as keyof typeof scripts.milestone]) {
      scriptArray = scripts.milestone[category as keyof typeof scripts.milestone] as string[];
    } else if (achievement_type === 'first_time') {
      scriptArray = scripts.first_time;
    } else if (achievement_type === 'streak') {
      scriptArray = scripts.streak;
    } else {
      // Fallback to description
      return `Amazing achievement! ${description} Your dedication to fitness is truly inspiring. Keep up the incredible work!`;
    }

    // Return a random script from the appropriate array
    return scriptArray[Math.floor(Math.random() * scriptArray.length)];
  }

  private getVideoConfig(format: string, customization?: VideoGenerationRequest['customization']) {
    const baseConfig = {
      square: { width: 1080, height: 1080, aspect_ratio: '1:1' },
      vertical: { width: 1080, height: 1920, aspect_ratio: '9:16' },
      horizontal: { width: 1920, height: 1080, aspect_ratio: '16:9' }
    };

    return {
      ...baseConfig[format as keyof typeof baseConfig],
      voice_type: customization?.voiceType || 'motivational',
      background_style: customization?.backgroundStyle || 'running_track',
      music_style: customization?.musicStyle || 'energetic',
      include_stats: customization?.includeStats !== false,
      include_branding: customization?.includeBranding !== false
    };
  }

  async generateAchievementVideo(
    achievement: Achievement, 
    format: 'square' | 'vertical' | 'horizontal' = 'square',
    templateId?: string
  ): Promise<TavusResponse> {
    if (!this.apiKey) {
      throw new Error('Tavus API key is missing. Please set EXPO_PUBLIC_TAVUS_API_KEY in your environment variables.');
    }

    try {
      const script = this.generateAchievementScript(achievement);
      const videoConfig = this.getVideoConfig(format);
      
      const payload = {
        replica_id: 'default-replica', // In production, this would be user-specific
        script: script,
        video_name: `achievement_${achievement.id}_${Date.now()}`,
        callback_url: null,
        ...videoConfig
      };

      console.log('🎬 Generating video with Tavus API...', { 
        achievementType: achievement.achievement_type,
        format,
        scriptLength: script.length 
      });

      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Tavus API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tavus video generation started:', data);
      
      return {
        video_id: data.video_id,
        status: data.status || 'pending',
        video_url: data.download_url,
        preview_url: data.hosted_url,
        thumbnail_url: data.thumbnail_url
      };
    } catch (error) {
      console.error('❌ Error generating achievement video:', error);
      throw error;
    }
  }

  async getVideoStatus(videoId: string): Promise<TavusResponse> {
    if (!this.apiKey) {
      throw new Error('Tavus API key is missing. Please set EXPO_PUBLIC_TAVUS_API_KEY in your environment variables.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      return {
        video_id: data.video_id,
        status: data.status,
        video_url: data.download_url,
        preview_url: data.hosted_url,
        thumbnail_url: data.thumbnail_url
      };
    } catch (error) {
      console.error('❌ Error checking video status:', error);
      throw error;
    }
  }

  async pollVideoCompletion(
    videoId: string, 
    maxAttempts: number = 30,
    intervalMs: number = 3000
  ): Promise<TavusResponse> {
    console.log(`🔄 Polling video completion for ${videoId}...`);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getVideoStatus(videoId);
        
        console.log(`📊 Poll attempt ${attempt + 1}/${maxAttempts}: ${status.status}`);
        
        if (status.status === 'completed' || status.status === 'failed') {
          console.log(`🎯 Video generation ${status.status}:`, status);
          return status;
        }

        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      } catch (error) {
        console.error(`❌ Polling attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Video generation timeout - exceeded maximum polling attempts');
  }

  // Batch video generation for multiple achievements
  async generateBatchVideos(
    achievements: Achievement[],
    format: 'square' | 'vertical' | 'horizontal' = 'square'
  ): Promise<{ success: TavusResponse[], failed: { achievement: Achievement, error: string }[] }> {
    if (!this.apiKey) {
      throw new Error('Tavus API key is missing. Please set EXPO_PUBLIC_TAVUS_API_KEY in your environment variables.');
    }

    const success: TavusResponse[] = [];
    const failed: { achievement: Achievement, error: string }[] = [];

    console.log(`🎬 Starting batch video generation for ${achievements.length} achievements...`);

    for (const achievement of achievements) {
      try {
        const result = await this.generateAchievementVideo(achievement, format);
        success.push(result);
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        failed.push({
          achievement,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Batch generation complete: ${success.length} success, ${failed.length} failed`);
    return { success, failed };
  }

  // Get available video templates
  async getVideoTemplates(): Promise<any[]> {
    if (!this.apiKey) {
      console.warn('⚠️ Tavus API key missing - cannot fetch templates');
      return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/templates`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching video templates:', error);
      return [];
    }
  }

  // Check if API key is configured
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  // Get configuration status for debugging
  getConfigStatus(): { configured: boolean, message: string } {
    if (!this.apiKey) {
      return {
        configured: false,
        message: 'Tavus API key is missing. Please set EXPO_PUBLIC_TAVUS_API_KEY in your .env file.'
      };
    }
    
    return {
      configured: true,
      message: 'Tavus API is properly configured.'
    };
  }
}

export const enhancedTavusService = new EnhancedTavusService();