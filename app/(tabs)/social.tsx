import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Trophy, 
  Target,
  Calendar,
  TrendingUp
} from 'lucide-react-native';

interface SocialPost {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  activity: {
    type: string;
    distance: number;
    duration: number;
    date: string;
  };
  achievement?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const mockPosts: SocialPost[] = [
  {
    id: '1',
    user: {
      name: 'Sarah Johnson',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    activity: {
      type: 'Running',
      distance: 5.2,
      duration: 1800,
      date: '2024-01-15'
    },
    achievement: 'Personal Best 5K!',
    likes: 24,
    comments: 8,
    isLiked: false
  },
  {
    id: '2',
    user: {
      name: 'Mike Chen',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    activity: {
      type: 'Cycling',
      distance: 25.8,
      duration: 3600,
      date: '2024-01-14'
    },
    likes: 18,
    comments: 5,
    isLiked: true
  },
  {
    id: '3',
    user: {
      name: 'Emma Rodriguez',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    activity: {
      type: 'Walking',
      distance: 3.1,
      duration: 2100,
      date: '2024-01-14'
    },
    achievement: '7-day streak!',
    likes: 31,
    comments: 12,
    isLiked: false
  }
];

export default function SocialTab() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>(mockPosts);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1
            }
          : post
      )
    );
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Users size={64} color="#9CA3AF" />
        <Text style={styles.authTitle}>Join the community</Text>
        <Text style={styles.authSubtitle}>
          Sign in to see what your friends are up to and share your achievements
        </Text>
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
        <Text style={styles.title}>Social Feed</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView 
        style={styles.feed}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <Image source={{ uri: post.user.avatar }} style={styles.userAvatar} />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{post.user.name}</Text>
                <View style={styles.postMeta}>
                  <Calendar size={14} color="#9CA3AF" />
                  <Text style={styles.postDate}>{formatDate(post.activity.date)}</Text>
                </View>
              </View>
            </View>

            {/* Activity Content */}
            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <View style={styles.activityTypeContainer}>
                  <Target size={20} color="#3B82F6" />
                  <Text style={styles.activityType}>{post.activity.type}</Text>
                </View>
                {post.achievement && (
                  <View style={styles.achievementBadge}>
                    <Trophy size={16} color="#F59E0B" />
                    <Text style={styles.achievementText}>{post.achievement}</Text>
                  </View>
                )}
              </View>

              <View style={styles.activityStats}>
                <View style={styles.activityStat}>
                  <TrendingUp size={16} color="#10B981" />
                  <Text style={styles.activityStatText}>
                    {post.activity.distance.toFixed(1)}km
                  </Text>
                </View>
                <View style={styles.activityStat}>
                  <Text style={styles.activityStatText}>
                    {formatTime(post.activity.duration)}
                  </Text>
                </View>
              </View>

              {/* Mock Activity Image */}
              <Image 
                source={{ 
                  uri: post.activity.type === 'Running' 
                    ? 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg?auto=compress&cs=tinysrgb&w=800'
                    : post.activity.type === 'Cycling'
                    ? 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800'
                    : 'https://images.pexels.com/photos/1571939/pexels-photo-1571939.jpeg?auto=compress&cs=tinysrgb&w=800'
                }}
                style={styles.activityImage}
              />
            </View>

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLike(post.id)}
              >
                <Heart 
                  size={20} 
                  color={post.isLiked ? "#EF4444" : "#6B7280"}
                  fill={post.isLiked ? "#EF4444" : "none"}
                />
                <Text style={[
                  styles.actionText,
                  post.isLiked && styles.actionTextActive
                ]}>
                  {post.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={20} color="#6B7280" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Share2 size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Coming Soon Notice */}
        <View style={styles.comingSoonCard}>
          <Users size={48} color="#9CA3AF" />
          <Text style={styles.comingSoonTitle}>More Social Features Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            We're working on adding friend connections, challenges, and group activities.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  authContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  authButton: {
    backgroundColor: '#3B82F6',
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
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  shareButton: {
    padding: 8,
  },
  feed: {
    flex: 1,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  postDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  activityContent: {
    paddingHorizontal: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 4,
  },
  activityStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  activityStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 4,
  },
  activityImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  actionTextActive: {
    color: '#EF4444',
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});