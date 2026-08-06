# MedicPal Product Requirements Document

## Problem Statement
MedicPal is a mobile health mediator that helps people photograph medicine labels, safely extract visible label details, and create reliable local and Google Calendar reminders. It is not a doctor replacement. One universally clear interface must serve busy professionals, older adults, colorblind users, and users who benefit from spoken assistance—without separate modes.

## Architecture
- **Mobile:** Expo SDK 54, React Native, TypeScript, Expo Router, safe-area-aware three-tab navigation.
- **Local source of truth:** Expo SQLite on iOS/Android; AsyncStorage fallback for web preview. Medicines, schedules, Calendar IDs, notification IDs, and offline Calendar operations are persisted locally.
- **Backend:** FastAPI scan proxy. The Gemini key remains server-side, images are validated, and Gemini returns strict nullable JSON.
- **Integrations:** Gemini 2.5 Flash label extraction, custom Google OAuth with Calendar scope, Google Calendar REST API, Expo Notifications, Expo Camera, Image Manipulator, Speech, Haptics, and Google user profile access.
- **Offline behavior:** Medicine viewing/editing and local storage work offline. Calendar operations queue when offline. Gemini requires connectivity.

## User Personas
1. **Busy professional:** Needs scan-to-reminder completion with minimal taps and no manual configuration.
2. **Older or low-confidence user:** Needs large text, 60dp+ targets, plain language, persistent navigation, and spoken feedback.
3. **Accessibility-first user:** Needs blue/orange status cues, icon-plus-text controls, adjustable text, high contrast, and 10 supported Indian languages.
4. **Caregiver-connected user:** Needs visible emergency calling and Calendar records that can be shared through Google Calendar.

## Core Requirements (Static)
- Exactly three tabs: Home, Scan, Settings; emergency caregiver call on main tabs except camera.
- First-launch language selection and compulsory Google sign-in.
- Camera-first label capture, contextual permission flow, 1024px JPEG compression, animated reading state, and strict non-hallucination behavior.
- AI confirmation before saving; rule-based reminder times; manual entry only after explicit user choice.
- SQLite medicine storage, local daily notifications, Calendar event creation/deletion, stored event IDs, and offline operation queue.
- Dashboard medicine cards, taken status, expiry states, medicine detail controls, spoken confirmations, reminder alarm, snooze, and deletion confirmation sheet.
- Settings for text size, contrast, TTS, language, caregiver number, and data-clearing sign-out.
- Strict MedicPal palette, minimum 18sp body text, minimum 60dp actions, safe areas, haptics, and no user-mode toggle.

## Implemented

### 2026-08-06 — Initial Complete Build
- Built language selector for English plus nine Indian languages, Google-only login setup state, accessible three-tab shell, dashboard, settings, emergency call, and universal visual system.
- Built contextual camera permission flow, full-screen camera, flash, keep-awake, 1024px/0.8 image processing, animated Gemini reading, retry, safe nullable extraction, confirmation, and explicit manual-entry fallback.
- Built native SQLite medicine CRUD, web-preview persistence fallback, schedule parser, local alarms, notification-tap reminder screen, taken/snooze actions, TTS, haptics, and adjustable text settings.
- Built Google Calendar recurring event creation/deletion, persisted event IDs, offline create/delete queue, launch-time queue synchronization, and graceful local-first behavior.
- Secured Gemini behind FastAPI with strict JSON schema, low temperature, input validation, upstream retry protection, and no key exposure to the mobile bundle.
- Added camera/notification permissions, OAuth environment placeholders, test credentials notes, backend tests, and mobile screenshot validation.

### 2026-08-06 — Google Web OAuth Configuration
- Configured the supplied Google Web OAuth client ID for browser-preview sign-in.
- Android and iOS OAuth client IDs remain pending for native sign-in validation.

## Prioritized Backlog

### P0 — Required Before Google Sign-In Testing
- Add valid Google Web, Android, and iOS OAuth client IDs to the existing frontend environment placeholders.
- Configure authorized redirect URIs and consent-screen test users in Google Cloud.
- Validate real-device Google login, Calendar create/delete, token expiry behavior, and Calendar queue recovery.

### P1 — Product Hardening
- Translate every secondary sentence and error message; core navigation and medicine terms already support all 10 languages.
- Add local notification attachment support where each OS permits medicine images.
- Add explicit Calendar reauthorization UX when an access token expires or Calendar permission is revoked.
- Add device-level SQLite migration and notification rescheduling tests.

### P2 — Enhancements
- Add caregiver-friendly Calendar sharing guidance without adding a separate app mode.
- Add adherence history and a simple weekly taken/missed summary.
- Add optional voice capture guidance and label-edge quality checks before upload.

## Next Tasks
1. Receive and configure Google OAuth client IDs.
2. Complete real-device sign-in and Calendar integration validation.
3. Run accessibility checks with large system text and VoiceOver/TalkBack.
4. Expand complete UI translation coverage for all 10 languages.