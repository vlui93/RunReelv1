# RunReel App

A fitness tracking app that generates personalized video content for your workouts and achievements.

## Features

- Manual activity tracking
- Video generation for achievements
- User profiles and authentication
- Analytics and progress tracking

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_TAVUS_API_KEY=your_tavus_api_key
EXPO_PUBLIC_TAVUS_REPLICA_ID=your_tavus_replica_id
```

3. Start the development server:
```bash
npm run dev
```

## Database Schema

The app uses Supabase with the following main tables:
- `user_profiles` - User account information
- `manual_activities` - User-logged fitness activities
- `video_generations` - Generated video content
- `achievements` - User achievements and milestones
- `video_analytics` - Video engagement tracking

## Video Generation

The app integrates with Tavus API to generate personalized videos based on user activities and achievements. Videos can be generated in multiple formats (square, vertical, horizontal) with customizable voice types and backgrounds.

## Development

This is an Expo managed workflow project using:
- Expo Router for navigation
- Supabase for backend services
- TypeScript for type safety
- React Native for cross-platform development

## Important Notes

- Without the Tavus API key, video generation will fail
- The replica must be in "Ready" status before use
- Only use the supported Tavus API fields to avoid 400 errors