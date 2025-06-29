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
  elapsedTime: number;
  estimatedTimeRemaining: number;
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
    currentStep: 'initializing',
    elapsedTime: 0,
    estimatedTimeRemaining: 180 // 3 minutes default estimate
  });

  const startTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update elapsed time and progress messages
  const updateProgress = useCallback(() => {
    if (!state.isGenerating) return;

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const remaining = Math.max(0, state.estimatedTimeRemaining - elapsed);

    setState(prev => ({
      ...prev,
      elapsedTime: elapsed,
      estimatedTimeRemaining: remaining,
      progress: getProgressMessage(elapsed, prev.currentStep)
    }));
  }, [state.isGenerating, state.estimatedTimeRemaining]);

  const getProgressMessage = (elapsedSeconds: number, step: string): string => {
    if (step === 'initializing') {
      return 'Initializing video generation...';
    } else if (step === 'processing') {
      if (elapsedSeconds < 30) {
        return 'Processing your achievement data...';
      } else if (elapsedSeconds < 90) {
        return 'AI is creating your personalized video...';
      } else if (elapsedSeconds < 180) {
        return 'Almost ready! Finalizing your video...';
      } else {
        return 'Taking longer than usual, please wait...';
      }
    } else if (step === 'finalizing') {
      return 'Finalizing your video...';
    } else if (step === 'completed') {
      return 'Video generation completed!';
    } else {
      return 'Processing...';
    }
  };

  // Start progress tracking
  useEffect(() => {
    if (state.isGenerating) {
      startTimeRef.current = Date.now();
      progressIntervalRef.current = setInterval(updateProgress, 1000);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [state.isGenerating, updateProgress]);

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
          progress: 'Requesting video generation from Tavus...',
          currentStep: 'completed'
        }));

        setState({
          isGenerating: false,
          progress: 'Video generation completed!',
          error: null,
          videoUrl: result.videoUrl,
          thumbnailUrl: result.thumbnailUrl || null,
          currentStep: 'completed',
          elapsedTime: result.total_time || 0,
          estimatedTimeRemaining: 0
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
        progress: 'Initializing video generation...',
        error: this.getEnhancedErrorMessage(error),
        videoUrl: null,
        thumbnailUrl: null,
        currentStep: 'failed',
        elapsedTime: 0,
        estimatedTimeRemaining: 0,
        elapsedTime: 0,
        estimatedTimeRemaining: 180
      });

      throw error;
    }
  };

  const getEnhancedErrorMessage = (error: any): string => {
    const errorMessage = error instanceof Error ? error.message : 'Video generation failed';
    
    if (errorMessage.includes('timeout')) {
      return 'Video generation is taking longer than expected. This sometimes happens during peak usage. You can try again or check back later.';
    } else if (errorMessage.includes('API key')) {
      return 'Video service configuration issue. Please contact support.';
    } else if (errorMessage.includes('replica')) {
      return 'Video avatar not ready. Please try again in a few minutes.';
    } else {
      return errorMessage;
    }
  };

  const generateAchievementVideo = async (
    achievement: any,
    customization: VideoCustomization
  ) => {
    // Convert achievement to activity format for compatibility
    const activityData: ActivityData = {
      id: achievement.id,
      activity_type: achievement.workout?.workout_type || 'activity',
      activity_name: achievement.description,
      duration_seconds: achievement.workout?.duration || 0,
      distance_km: achievement.workout?.distance ? achievement.workout.distance / 1000 : undefined,
      calories_burned: achievement.workout?.calories,
      average_heart_rate: achievement.workout?.heart_rate_avg,
      intensity_level: undefined,
      notes: `Achievement: ${achievement.description}`
    };

    return generateActivityVideo(activityData, customization);
  };

  const resetState = () => {
    setState({
      isGenerating: false,
      progress: '',
      error: null,
      videoUrl: null,
      thumbnailUrl: null,
      currentStep: 'initializing',
      elapsedTime: 0,
      estimatedTimeRemaining: 180
    });

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const getProgressPercentage = (): number => {
    if (state.currentStep === 'completed') return 100;
    if (state.currentStep === 'failed') return 0;
    
    // Calculate progress based on elapsed time and estimated duration
    const maxEstimatedTime = 180; // 3 minutes
    const timeProgress = Math.min((state.elapsedTime / maxEstimatedTime) * 100, 95);
    
    switch (state.currentStep) {
      case 'initializing':
        return Math.max(10, timeProgress * 0.2);
      case 'processing':
        return Math.max(20, timeProgress * 0.8);
      case 'finalizing':
        return Math.max(85, timeProgress);
      default:
        return timeProgress;
    }
  };

  const formatElapsedTime = (): string => {
    const minutes = Math.floor(state.elapsedTime / 60);
    const seconds = state.elapsedTime % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatEstimatedTimeRemaining = (): string => {
    if (state.estimatedTimeRemaining <= 0) return 'Almost done...';
    const minutes = Math.floor(state.estimatedTimeRemaining / 60);
    const seconds = state.estimatedTimeRemaining % 60;
    return `~${minutes}:${seconds.toString().padStart(2, '0')} remaining`;
  };

  return {
    ...state,
    generateActivityVideo,
    generateAchievementVideo,
    resetState,
    getProgressPercentage,
    formatElapsedTime,
    formatEstimatedTimeRemaining
  };
}