# RunReel

A fitness tracking app with AI-powered achievement videos using Tavus.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_TAVUS_API_KEY=your_tavus_api_key
```

### 2. Tavus API Key Setup

To enable video generation features, you need to:

1. **Sign up for Tavus**: Visit [https://tavus.io](https://tavus.io) and create an account
2. **Get your API key**: Navigate to your Tavus dashboard and copy your API key
3. **Add to environment**: Set `EXPO_PUBLIC_TAVUS_API_KEY` in your `.env` file

**Important**: Without the Tavus API key, video generation features will not work and you'll see error messages about missing API configuration.

### 3. Running the App

```bash
npm install
npm run dev
```

## Features

- 🏃‍♂️ Manual activity tracking
- 📊 Achievement detection system
- 🎬 AI-powered video generation with Tavus
- 📱 Health data import (Apple Health, Google Fit)
- 📈 Progress tracking and analytics

## Video Generation

This app uses **Tavus** exclusively for AI video generation. The system:

- Generates personalized achievement videos
- Supports multiple video formats (square, vertical, horizontal)
- Creates motivational scripts based on your achievements
- Tracks video generation status and progress

Make sure your Tavus API key is properly configured to use these features.