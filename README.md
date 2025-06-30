# RunReel App - Simplified Demo

A fitness tracking app that demonstrates manual activity logging and placeholder video generation functionality.

## 🚀 Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Setup (Optional):** Replace dummy API keys in `.env` with your actual credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_TAVUS_API_KEY=your_tavus_api_key
EXPO_PUBLIC_TAVUS_REPLICA_ID=your_tavus_replica_id
```

## 📱 Features

- **Manual Activity Tracking** - Log workouts with details like distance, duration, and calories
- **User Authentication** - Sign up and sign in functionality (requires Supabase setup)
- **Demo Video Generation** - Placeholder video generation to demonstrate the concept
- **Responsive Design** - Works on web, iOS, and Android
- **Tab Navigation** - Clean navigation between Home, Activity, Videos, and Profile

## 🛠 Demo Mode

The app runs in demo mode by default with:
- Placeholder API keys for immediate functionality
- Mock video generation service
- Sample data and responses

## 🔧 Production Setup

To convert to a production app:

1. **Setup Supabase:**
   - Create a Supabase project at https://supabase.com
   - Run the database migration from `supabase/migrations/`
   - Update `.env` with your actual Supabase credentials

2. **Setup Tavus (Optional):**
   - Create account at https://tavus.io
   - Add your API key and replica ID to `.env`
   - Replace `demoVideoService` with the original `enhancedTavusService`

3. **Enable Authentication:**
   - Configure authentication providers in Supabase
   - Set up proper RLS policies

## 📁 Project Structure

```
app/                    # Expo Router pages
├── (tabs)/            # Tab navigation screens
├── _layout.tsx        # Root layout
└── auth.tsx           # Authentication screen

components/             # Reusable components
hooks/                 # Custom React hooks
services/              # API and external services
lib/                   # Configuration and utilities
```

## 🎨 Styling

- Uses React Native StyleSheet
- No external CSS frameworks
- Responsive design principles
- Clean, modern UI components

## 📱 Platform Support

- **Web** - Primary platform, fully functional
- **iOS/Android** - Full functionality with native builds
- **Cross-platform** - Shared codebase with platform-specific optimizations

## 🔄 Development

```bash
# Clean install
npm run clean

# Reset project
npm run reset

# Start development server
npm run dev
```

## 🚀 Deployment

```bash
# Build for web
npm run build:web
```

## 📝 Notes

- This is a simplified, production-ready starting point
- All complex integrations have been replaced with demos
- Real API integrations can be added by replacing the demo services
- Database schema is included but requires Supabase setup