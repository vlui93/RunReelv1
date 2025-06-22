import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Share2, Users, Heart, MessageCircle, Video } from 'lucide-react-native';

export default function SocialScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Social</Text>
        <Text style={styles.subtitle}>Share your achievements with the community</Text>
      </View>

      {/* Coming Soon Section */}
      <View style={styles.comingSoonContainer}>
        <Users size={64} color="#3B82F6" />
        <Text style={styles.comingSoonTitle}>Social Features Coming Soon!</Text>
        <Text style={styles.comingSoonText}>
          Connect with other runners, share your AI-generated achievement videos, 
          and get motivated by the community.
        </Text>
      </View>

      {/* Feature Preview */}
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>What's Coming</Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Share2 size={24} color="#10B981" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Share Your Videos</Text>
              <Text style={styles.featureDescription}>
                Post your AI-generated achievement videos to inspire others
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Heart size={24} color="#EF4444" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Like & Support</Text>
              <Text style={styles.featureDescription}>
                Cheer on fellow runners and celebrate their achievements
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MessageCircle size={24} color="#8B5CF6" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Comments & Tips</Text>
              <Text style={styles.featureDescription}>
                Share running tips and encourage each other
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Video size={24} color="#F59E0B" />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Video Challenges</Text>
              <Text style={styles.featureDescription}>
                Join community challenges and compete with friends
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Placeholder Feed */}
      <View style={styles.feedContainer}>
        <Text style={styles.feedTitle}>Community Feed</Text>
        
        <View style={styles.feedPlaceholder}>
          <View style={styles.placeholderPost}>
            <View style={styles.placeholderAvatar} />
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderLine} />
              <View style={[styles.placeholderLine, { width: '70%' }]} />
            </View>
          </View>

          <View style={styles.placeholderPost}>
            <View style={styles.placeholderAvatar} />
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderLine} />
              <View style={[styles.placeholderLine, { width: '60%' }]} />
            </View>
          </View>

          <View style={styles.placeholderPost}>
            <View style={styles.placeholderAvatar} />
            <View style={styles.placeholderContent}>
              <View style={styles.placeholderLine} />
              <View style={[styles.placeholderLine, { width: '80%' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Call to Action */}
      <View style={styles.ctaContainer}>
        <Text style={styles.ctaTitle}>Get Ready!</Text>
        <Text style={styles.ctaText}>
          Start building your running history now. When social features launch, 
          you'll have amazing content to share!
        </Text>
        <TouchableOpacity style={styles.ctaButton}>
          <Text style={styles.ctaButtonText}>Start Running</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  comingSoonContainer: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  previewContainer: {
    margin: 24,
    marginTop: 0,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureList: {
    gap: 16,
  },
  featureItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featureContent: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 20,
  },
  feedContainer: {
    margin: 24,
    marginTop: 0,
  },
  feedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  feedPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  placeholderPost: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  placeholderContent: {
    marginLeft: 12,
    flex: 1,
  },
  placeholderLine: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    marginBottom: 8,
  },
  ctaContainer: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    marginTop: 0,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  ctaText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});