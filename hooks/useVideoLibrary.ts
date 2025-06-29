import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface VideoLibraryItem {
  id: string;
  title: string;
  thumbnail_url?: string;
  video_url: string;
  created_at: string;
  updated_at: string;
  duration?: number;
  activity_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  script_content?: string;
  tavus_job_id?: string;
  cost_estimate?: number;
  error_message?: string;
  run_id?: string;
}

export interface VideoStats {
  totalVideos: number;
  completedVideos: number;
  processingVideos: number;
  failedVideos: number;
  thisWeek: number;
  thisMonth: number;
  totalDuration: number;
}

export function useVideoLibrary() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchVideos();
    } else {
      setVideos([]);
      setLoading(false);
    }
  }, [user]);

  const fetchVideos = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      
      // Fetch videos from manual_activities where video_url exists
      const { data, error } = await supabase
        .from('manual_activities')
        .select('*')
        .eq('user_id', user.id)
        .not('video_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      // Transform manual activities to video library items
      const transformedVideos: VideoLibraryItem[] = await Promise.all(
        (data || []).map(async (item: any) => {
          return {
            id: item.id,
            title: item.activity_name || `${item.activity_type} Video`,
            video_url: item.video_url,
            status: 'completed' as const,
            created_at: item.created_at,
            updated_at: item.updated_at,
            script_content: item.script_content,
            activity_type: item.activity_type,
            duration: item.duration_seconds,
            thumbnail_url: undefined, // Will be handled by VideoPlayer component
          };
        })
      );

      setVideos(transformedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateVideoTitle = async (videoId: string, newTitle: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('manual_activities')
        .update({ activity_name: newTitle })
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, title: newTitle } : v
      ));
    } catch (error) {
      console.error('Error updating video title:', error);
      throw error;
    }
  };

  const deleteVideo = async (videoId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('manual_activities')
        .update({ video_url: null, script_content: null })
        .eq('id', videoId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh videos list
      await fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  };

  const getVideoStats = (): VideoStats => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalVideos = videos.length;
    const completedVideos = videos.filter(v => v.status === 'completed').length;
    const processingVideos = videos.filter(v => v.status === 'processing' || v.status === 'pending').length;
    const failedVideos = videos.filter(v => v.status === 'failed').length;
    
    const thisWeek = videos.filter(v => new Date(v.created_at) > weekAgo).length;
    const thisMonth = videos.filter(v => new Date(v.created_at) > monthAgo).length;
    
    const totalDuration = videos.reduce((sum, v) => sum + (v.duration || 0), 0);

    return {
      totalVideos,
      completedVideos,
      processingVideos,
      failedVideos,
      thisWeek,
      thisMonth,
      totalDuration,
    };
  };

  const getVideoById = (videoId: string): VideoLibraryItem | undefined => {
    return videos.find(v => v.id === videoId);
  };

  const getVideosByStatus = (status: VideoLibraryItem['status']): VideoLibraryItem[] => {
    return videos.filter(v => v.status === status);
  };

  const getVideosByActivityType = (activityType: string): VideoLibraryItem[] => {
    return videos.filter(v => v.activity_type?.toLowerCase() === activityType.toLowerCase());
  };

  const searchVideos = (query: string): VideoLibraryItem[] => {
    const lowercaseQuery = query.toLowerCase();
    return videos.filter(v => 
      v.title.toLowerCase().includes(lowercaseQuery) ||
      v.activity_type?.toLowerCase().includes(lowercaseQuery) ||
      v.script_content?.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    videos,
    loading,
    refreshing,
    fetchVideos,
    updateVideoTitle,
    deleteVideo,
    getVideoStats,
    getVideoById,
    getVideosByStatus,
    getVideosByActivityType,
    searchVideos,
  };
}