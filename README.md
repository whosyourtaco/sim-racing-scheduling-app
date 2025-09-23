# iRacing Team RSVP - React Application

A fully-fledged React application for managing iRacing team event RSVPs, converted from the original vanilla HTML/CSS/JavaScript implementation.

## Features

- 🏁 Event calendar with Special Events and GET Series filters
- 👥 Team status overview with statistics
- ✅ RSVP system (Available/Maybe/Unavailable)
- 🔐 User authentication (Sign in/Register)
- 🔄 Real-time data synchronization with Firebase
- 📱 Responsive design for all devices
- 🎨 Dark/Light mode support

## Tech Stack

- **Frontend**: React 18 + Vite
- **Database**: Firebase Realtime Database
- **Styling**: CSS with custom design system
- **State Management**: React Hooks (useState, useEffect)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Copy the environment variables template:
   ```bash
   cp .env.example .env.local
   ```

2. Replace the values in `.env.local` with your Firebase configuration.

### 3. Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com/
2. Enable Realtime Database
3. Set up database rules (for development, you can use test mode)
4. Get your configuration from Project Settings > General > Your apps

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### 5. Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.jsx      # Navigation header
│   ├── CalendarView.jsx # Events calendar
│   ├── TeamView.jsx    # Team status overview
│   ├── EventCard.jsx   # Individual event cards
│   ├── EventModal.jsx  # Event details modal
│   └── AuthModal.jsx   # Authentication modal
├── firebase/           # Firebase configuration
│   ├── config.js      # Firebase app initialization
│   └── database.js    # Database operations
├── hooks/             # Custom React hooks
│   ├── useAuth.js     # Authentication logic
│   └── useAppData.js  # Data management
├── utils/             # Utility functions
│   └── formatters.js  # Date/time formatting
├── App.jsx            # Main application component
├── main.jsx          # Application entry point
└── style.css         # Styles (unchanged from original)
```

## Key Differences from Original

1. **Environment Variables**: Firebase configuration now uses environment variables for security
2. **React Components**: HTML structure converted to reusable React components
3. **Hooks-based State**: Application state managed with React hooks instead of global variables
4. **Modern Firebase SDK**: Updated to use Firebase v9+ modular SDK
5. **Vite Build System**: Fast development and optimized production builds

## Security Features

- Firebase credentials are stored in environment variables
- No sensitive data committed to repository
- `.env.local` is git-ignored by default

## GitHub Pages Deployment

### 2. Enable GitHub Pages

1. Go to **Settings** > **Pages**
2. Under "Source", select **GitHub Actions**
3. The deployment workflow is already configured in `.github/workflows/deploy.yml`

### 3. Deploy

1. Push your code to the `main` branch
2. The GitHub Action will automatically build and deploy your app
3. Your app will be available at `https://yourusername.github.io/your-repo-name/`

### 4. Troubleshooting

If you see "undefined" values in the Firebase config:

1. **Check repository secrets**: Ensure all `VITE_FIREBASE_*` secrets are set correctly
2. **Check secret names**: They must match exactly (case-sensitive)
3. **Re-run deployment**: Go to Actions tab and re-run the failed workflow
4. **Check browser console**: Look for Firebase configuration debug logs

**Important**: Only add secrets to repository secrets, NOT environment variables in GitHub settings. The workflow specifically reads from `secrets.*`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Lazy loading for optimal bundle size
- Real-time updates without page refreshes
- Local storage fallback for offline functionality
- Optimized re-renders with React hooks

## Contributing

The application maintains the exact same functionality and styles as the original implementation while providing the benefits of a modern React architecture.