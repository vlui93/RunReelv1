import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { enhancedTavusService } from '@/services/enhancedTavusService';
import { useAuth } from './useAuth';

interface ActivityData {
  id: string;
  activity_type: string;
  activity_name: string;
  distance_km?: number;
  duration_seconds: number;
  calories_burned?: number;
  average_heart_rate?: number;
  intensity_level?: number;
  notes?: string;
}

interface VideoGenerationState {
  isGenerating: boolean;
  progress: string;
  error: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  currentStep: 'initializing' | 'processing' | 'finalizing' | 'completed' | 'failed';
}

interface VideoCustomization {
  format: 'square' | 'vertical' | 'horizontal';
  voiceType?: 'motivational' | 'encouraging' | 'calm' | 'excited' | 'proud';
  backgroundStyle?: 'running_track' | 'mountain_road' | 'nature_path' | 'confetti' | 'calendar';
  musicStyle?: 'energetic' | 'uplifting' | 'peaceful' | 'triumphant';
  includeStats?: boolean;
  includeBranding?: boolean;
}

export function useEnhancedVideoGeneration() {
  const { user } = useAuth();
  const [state, setState] = useState<VideoGenerationState>({
    isGenerating: false,
    progress: '',
    error: null,
    videoUrl: null,
    thumbnailUrl: null,
    currentStep: 'initializing'
  });

  const generateActivityVideo = async (
    activity: ActivityData,
    customization: VideoCustomization
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if Tavus is configured
    const configStatus = enhancedTavusService.getConfigStatus();
    if (!configStatus.configured) {
      setState({
        isGenerating: false,
        progress: '',
        error: configStatus.message,
        videoUrl: null,
        thumbnailUrl: null,
        currentStep: 'failed'
      });
      throw new Error(configStatus.message);
    }

    setState({
      isGenerating: true,
      progress: 'Initializing video generation...',
      error: null,
      videoUrl: null,
      thumbnailUrl: null,
      currentStep: 'initializing'
    });

    try {
      // Verify user authentication
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        throw new Error('User not authenticated');
      }

      setState(prev => ({
        ...prev,
        progress: 'Requesting video generation from Tavus...',
        currentStep: 'processing'
      }));

      // Generate video using Tavus API directly
      const result = await enhancedTavusService.generateActivityVideo(
        activity,
        customization.format,
        customization
      );

      if (result.success && result.videoUrl) {
        setState(prev => ({
          ...prev,
          progress: 'Video generation completed!',
          currentStep: 'completed'
        }));

        setState({
          isGenerating: false,
          progress: 'Video generation completed!',
          error: null,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl || null,
          currentStep: 'completed'
        });

        return {
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl,
          videoId: result.videoId
        };
      } else {
        throw new Error(result.error || 'Video generation failed - no video URL returned');
      }

    } catch (error) {
      console.error('❌ Video generation error:', error);
      
      setState({
        isGenerating: false,
        progress: '',
        error: error instanceof Error ? error.message : 'Video generation failed',
        videoUrl: null,
        thumbnailUrl: null,
        currentStep: 'failed'
      });

      throw error;
    }
  };

  const resetState = () => {
    setState({
      isGenerating: false,
      progress: '',
      error: null,
      videoUrl: null,
      thumbnailUrl: null,
      currentStep: 'initializing'
    });
  };

  const getProgressPercentage = (): number => {
    switch (state.currentStep) {
      case 'initializing':
        return 10;
      case 'processing':
        return 50;
      case 'finalizing':
        return 90;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return {
    ...state,
    generateActivityVideo,
    resetState,
    getProgressPercentage
  };
}