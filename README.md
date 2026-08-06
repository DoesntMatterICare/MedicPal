## MedicPal Tech Stack

### Mobile Frontend
- **Expo SDK 54**
- **React Native 0.81**
- **React 19**
- **TypeScript**
- **Expo Router** for file-based navigation
- **React Native StyleSheet** for styling
- **React Native Reanimated** for animations
- **Lucide React Native** and Expo vector icons

### Device Features
- **Expo Camera** — photograph medicine packaging
- **Expo Image Picker** — upload boxes, bottles, blister strips, or prescriptions
- **Expo Image Manipulator** — resize/compress images before analysis
- **Expo Notifications** — local medicine reminders
- **Expo Speech** — text-to-speech accessibility
- **Expo Haptics** — button feedback
- **Expo Keep Awake** — camera workflow
- **NetInfo** — connectivity detection

### Data and Offline Support
- **Expo SQLite** — primary medicine database on Android/iOS
- **AsyncStorage** — profile, language, settings, pending scans, and web-preview fallback
- Offline queue for pending Google Calendar operations

### Backend
- **Python**
- **FastAPI**
- **Pydantic**
- **Uvicorn**
- **Requests** for external API communication
- Environment variables through **python-dotenv**

### AI
- **Google Gemini 2.5 Flash**
- Gemini API is called through the FastAPI backend, keeping the API key out of the mobile application
- Strict JSON schema and low-temperature extraction
- Safety rule requiring visible printed text; it does not identify loose tablets by appearance

### Authentication and Calendar
- **Google OAuth 2.0**
- **Expo AuthSession**
- **Expo Web Browser**
- Google Calendar REST API with `calendar.events` permission
- Web and Android OAuth clients configured; iOS client remains pending

### Internationalization and Accessibility
- **i18next**
- **react-i18next**
- Ten Indian language options
- Adjustable text size, high contrast, TTS, safe areas, large controls, and icon-plus-text actions

### Testing
- **Pytest** for backend APIs
- **Playwright-based mobile browser testing**
- TypeScript compiler, ESLint, and Python linting

One implementation difference from the original specification: the current UI uses React Native `StyleSheet` rather than NativeWind. The development-only login bypass is also a **MOCKED** local profile and does not include Google Calendar access.
