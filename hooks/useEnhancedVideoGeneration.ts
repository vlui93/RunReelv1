import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { enhancedTavusService } from '@/services/enhancedTavusService';
import { useAuth } from './useAuth';

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

  const generateAchievementVideo = async (
    achievement: Achievement,
    customization: VideoCustomization,
    templateId?: string
  ) => {
    if (!user) return;

    setState({
      isGenerating: true,
      progress: 'Initializing video generation...',
      error: null,
      videoUrl: null,
      thumbnailUrl: null,
      currentStep: 'initializing'
    });

    try {
      // Create video generation record
      const { data: videoGeneration, error: insertError } = await supabase
        .from('video_generations')
        .insert({
          run_id: null, // For achievement videos, we don't have a run_id
          achievement_id: achievement.id,
          template_id: templateId,
          status: 'pending',
          video_format: customization.format,
          generation_config: customization
        })
        .select()
        .single();

      if (insertError) {
        throw new Error('Failed to create video generation record');
      }

      setState(prev => ({
        ...prev,
        progress: 'Requesting video generation from Tavus...',
        currentStep: 'processing'
      }));

      // Generate video using enhanced Tavus service
      const videoRequest = {
        achievementId: achievement.id,
        templateId: templateId,
        format: customization.format,
        customization: {
          voiceType: customization.voiceType,
          backgroundStyle: customization.backgroundStyle,
          musicStyle: customization.musicStyle,
          includeStats: customization.includeStats,
          includeBranding: customization.includeBranding
        }
      };

      const tavusResponse = await enhancedTavusService.generateAchievementVideo(
        achievement,
        videoRequest
      );

      // Update video generation record with Tavus job ID
      await supabase
        .from('video_generations')
        .update({
          tavus_job_id: tavusResponse.video_id,
          status: 'processing',
        })
        .eq('id', videoGeneration.id);

      setState(prev => ({
        ...prev,
        progress: 'Video is being processed by AI...',
      }));

      // Poll for completion
      const completedVideo = await enhancedTavusService.pollVideoCompletion(
        tavusResponse.video_id,
        30, // max attempts
        3000 // 3 second intervals
      );

      if (completedVideo.status === 'completed' && completedVideo.video_url) {
        setState(prev => ({
          ...prev,
          progress: 'Finalizing video...',
          currentStep: 'finalizing'
        }));

        // Update records with final video URL
        await supabase
          .from('video_generations')
          .update({
            status: 'completed',
            video_url: completedVideo.video_url,
          })
          .eq('id', videoGeneration.id);

        // Mark achievement as processed
        await supabase
          .from('achievements')
          .update({ is_processed: true })
          .eq('id', achievement.id);

        setState({
          isGenerating: false,
          progress: 'Video generation completed!',
          error: null,
          videoUrl: completedVideo.video_url,
          thumbnailUrl: completedVideo.thumbnail_url || null,
          currentStep: 'completed'
        });

        return {
          videoUrl: completedVideo.video_url,
          thumbnailUrl: completedVideo.thumbnail_url,
          videoId: videoGeneration.id
        };
      } else {
        throw new Error('Video generation failed');
      }

    } catch (error) {
      console.error('Video generation error:', error);
      
      setState({
        isGenerating: false,
        progress: '',
        error: error instanceof Error ? error.message : 'Video generation failed',
        videoUrl: null,
        thumbnailUrl: null,
        currentStep: 'failed'
      });

      // Update video generation record with error
      await supabase
        .from('video_generations')
        .update({
          status: 'failed',
        })
        .eq('achievement_id', achievement.id)
        .eq('status', 'processing');

      throw error;
    }
  };

  const generateBatchVideos = async (
    achievements: Achievement[],
    format: 'square' | 'vertical' | 'horizontal' = 'square'
  ) => {
    if (!user || achievements.length === 0) return;

    setState({
      isGenerating: true,
      progress: `Generating ${achievements.length} videos...`,
      error: null,
      videoUrl: null,
      thumbnailUrl: null,
      currentStep: 'processing'
    });

    try {
      const results = await enhancedTavusService.generateBatchVideos(achievements, format);
      
      // Update database records for successful generations
      for (const success of results.success) {
        const achievement = achievements.find(a => a.id === success.video_id);
        if (achievement) {
          await supabase
            .from('video_generations')
            .insert({
              achievement_id: achievement.id,
              tavus_job_id: success.video_id,
              status: 'processing',
              video_format: format,
              generation_config: { format }
            });
        }
      }

      setState({
        isGenerating: false,
        progress: `Generated ${results.success.length} videos successfully`,
        error: results.failed.length > 0 ? `${results.failed.length} videos failed` : null,
        videoUrl: null,
        thumbnailUrl: null,
        currentStep: 'completed'
      });

      return results;
    } catch (error) {
      setState({
        isGenerating: false,
        progress: '',
        error: error instanceof Error ? error.message : 'Batch generation failed',
        videoUrl: null,
        thumbnailUrl: null,
        currentStep: 'failed'
      });

      throw error;
    }
  };

  const getVideoTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('video_templates')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching video templates:', error);
      return [];
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
    generateAchievementVideo,
    generateBatchVideos,
    getVideoTemplates,
    resetState,
    getProgressPercentage
  };
}