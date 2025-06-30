import { useState } from 'react';
import { demoVideoService } from '@/services/demoVideoService';

interface ActivityData {
  id: string;
  activity_type: string;
  activity_name: string;
  distance_km?: number;
  duration_seconds: number;
  calories_burned?: number;
}

export function useSimpleVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const generateVideo = async (activity: ActivityData) => {
    setIsGenerating(true);
    setProgress('Generating demo video...');
    setError(null);

    try {
      const result = await demoVideoService.generateActivityVideo(activity);
      
      if (result.success) {
        setProgress('Video generated successfully!');
        return result;
      } else {
        throw new Error(result.error || 'Video generation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const resetState = () => {
    setIsGenerating(false);
    setProgress('');
    setError(null);
  };

  return {
    isGenerating,
    progress,
    error,
    generateVideo,
    resetState
  };
}