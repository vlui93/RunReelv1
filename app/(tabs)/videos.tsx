import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Share,
  Platform,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useVideoLibrary } from '@/hooks/useVideoLibrary';
import { Video, Play, MoreVertical, Edit3, Trash2, Share2, Search, Grid, List, X } from 'lucide-react-native';
import { VideoPlayer } from '@/components/VideoPlayer';

export default function VideosTab() {
  const { user } = useAuth();
  const { 
    videos, 
    loading, 
    refreshing, 
    fetchVideos, 
    updateVideoTitle, 
    deleteVideo, 
    getVideoStats 
  } = useVideoLibrary();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const filters = [
    { id: 'all', label: 'All Videos' },
    { id: 'running', label: 'Running' },
    { id: 'cycling', label: 'Cycling' },
    { id: 'walking', label: 'Walking' },
    { id: 'strength', label: 'Strength' },
    { id: 'recent', label: 'Recent' },
  ];

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const onRefresh = async () => {
    await fetchVideos();
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.activity_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'recent') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(video.created_at) > weekAgo;
    }
    
    return video.activity_type?.toLowerCase().includes(selectedFilter);
  });

  const handleVideoPress = (video: VideoItem) => {
    if (video.video_url) {
      router.push({
        pathname: '/video-preview',
        params: { videoUrl: video.video_url, videoId: video.id },
      });
    } else {
      Alert.alert('Video Unavailable', 'This video failed to generate or is not available.');
    }
  };

  const handleVideoOptions = (video: VideoItem) => {
    setSelectedVideo(video);
    setShowOptionsModal(true);
  };

  const handleRename = () => {
    if (selectedVideo) {
      setNewTitle(selectedVideo.activity_name);
      setShowOptionsModal(false);
      setShowRenameModal(true);
    }
  };

  const handleRenameConfirm = async () => {
    if (selectedVideo && newTitle.trim()) {
      try {
        await updateVideoTitle(selectedVideo.id, newTitle.trim());

        setShowRenameModal(false);
        setSelectedVideo(null);
        setNewTitle('');
      } catch (error) {
        Alert.alert('Error', 'Failed to rename video. Please try again.');
      }
    }
  };

  const handleDelete = () => {
    if (selectedVideo) {
      Alert.alert(
        'Delete Video',
        `Are you sure you want to delete "${selectedVideo.activity_name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteVideo(selectedVideo.id);

                setShowOptionsModal(false);
                setSelectedVideo(null);
              } catch (error) {
                Alert.alert('Error', 'Failed to delete video. Please try again.');
              }
            },
          },
        ]
      );
    }
  };

  const handleShare = async () => {
    if (selectedVideo && selectedVideo.video_url) {
      try {
        await Share.share({
          message: `Check out my achievement video: ${selectedVideo.script_content || selectedVideo.activity_name}`,
          url: selectedVideo.video_url,
        });
        setShowOptionsModal(false);
      } catch (error) {
        if (Platform.OS === 'web' && error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            Alert.alert(
              'Sharing Not Available',
              'Sharing is not available in this browser environment. You can copy the video URL manually.'
            );
            return;
          }
        }
        Alert.alert('Error', 'Unable to share video. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderVideoItem = ({ item }: { item: VideoItem }) => (
    <View style={styles.videoItem}>
      <VideoPlayer
        videoUrl={item.video_url}
        thumbnail={item.thumbnail_url}
        title={item.title}
        activityType={item.activity_type}
        onPress={() => handleVideoPress(item)}
        style={styles.videoPlayer}
      />
      
      <View style={styles.videoMeta}>
        <View style={styles.videoMetaHeader}>
          <Text style={styles.activityType}>{item.activity_type.toUpperCase()}</Text>
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => handleVideoOptions(item)}
          >
            <MoreVertical size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <Text style={styles.videoStats}>
          {item.duration ? `${Math.floor(item.duration / 60)} min • ` : ''}
          {formatDate(item.created_at)}
        </Text>
      </View>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Video size={64} color="#9CA3AF" />
        <Text style={styles.authTitle}>Sign in to view your videos</Text>
        <TouchableOpacity
          style={styles.authButton}
          onPress={() => router.push('/auth')}
        >
          <Text style={styles.authButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🎬 Your Achievement Videos</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={24} color="#6B7280" />
            ) : (
              <Grid size={24} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        {getVideoStats().totalVideos} video{getVideoStats().totalVideos !== 1 ? 's' : ''} celebrating your fitness journey
      </Text>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersList}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterButton,
                selectedFilter === filter.id && styles.filterButtonSelected,
              ]}
              onPress={() => setSelectedFilter(filter.id)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter.id && styles.filterButtonTextSelected,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Videos List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading your achievement videos...</Text>
          </View>
        ) : filteredVideos.length > 0 ? (
          <FlatList
            data={filteredVideos}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            numColumns={viewMode === 'grid' ? 1 : 1}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📹</Text>
            <Text style={styles.emptyStateTitle}>No videos yet!</Text>
            <Text style={styles.emptyStateSubtitle}>
              Complete workouts and generate AI videos to see them here
            </Text>
          </View>
        )}

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedVideo?.activity_name}</Text>
              <TouchableOpacity onPress={() => setShowOptionsModal(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              <TouchableOpacity style={styles.optionItem} onPress={handleRename}>
                <Edit3 size={20} color="#3B82F6" />
                <Text style={styles.optionText}>Rename</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem} onPress={handleShare}>
                <Share2 size={20} color="#10B981" />
                <Text style={styles.optionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
                <Trash2 size={20} color="#EF4444" />
                <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renameModal}>
            <Text style={styles.modalTitle}>Rename Video</Text>
            
            <TextInput
              style={styles.renameInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title"
              autoFocus
              maxLength={100}
            />

            <View style={styles.renameActions}>
              <TouchableOpacity
                style={[styles.renameButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.renameButton, styles.confirmButton]}
                onPress={handleRenameConfirm}
                disabled={!newTitle.trim()}
              >
                <Text style={styles.confirmButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewModeButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 12,
  },
  filtersContainer: {
    paddingVertical: 16,
  },
  filtersList: {
    paddingHorizontal: 24,
  },
  filterButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterButtonSelected: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  videoItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  videoPlayer: {
    marginBottom: 0,
  },
  videoMeta: {
    padding: 12,
  },
  videoMetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  optionsButton: {
    padding: 4,
  },
  videoStats: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionsModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  optionsList: {
    gap: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  deleteText: {
    color: '#EF4444',
  },
  renameModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  renameActions: {
    flexDirection: 'row',
    gap: 12,
  },
  renameButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});