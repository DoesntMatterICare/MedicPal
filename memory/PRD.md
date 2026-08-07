# MedicPal Product Requirements Document

## Problem Statement
MedicPal is a local-first mobile health organizer. It helps people photograph medicine labels, create reminders, record symptoms, prepare non-diagnostic notes for clinicians, review a unified health timeline, and privately keep document photos. It is not a doctor replacement. One universally clear interface must serve busy professionals, older adults, colorblind users, and users who benefit from spoken assistance—without separate modes.

## Architecture
- **Mobile:** Expo SDK 54, React Native, TypeScript, Expo Router, safe-area-aware four-tab navigation: Home, Scan, Chat, Settings.
- **Local source of truth:** Expo SQLite on iOS/Android; AsyncStorage fallback for web preview. Medicines, symptom logs, appointments, base64 document photos, schedules, Calendar IDs, notification IDs, and offline Calendar operations are persisted locally.
- **Backend:** FastAPI AI proxy. Universal Key credentials remain server-side; medicine images and symptom requests are validated and return strict Pydantic response shapes.
- **Integrations:** GPT-5.4 medicine text extraction and symptom visit prep through Emergent Universal Key, custom Google OAuth with Calendar scope, Google Calendar REST API, Expo Notifications, Expo Camera, Image Picker/Manipulator, Speech, Haptics, and Google user profile access.
- **Offline behavior:** Medicine viewing/editing, deterministic chat matching, app FAQs, settings changes, and local storage work offline. Calendar operations queue when offline. AI label/insight features require connectivity.

## User Personas
1. **Busy professional:** Needs scan-to-reminder completion with minimal taps and no manual configuration.
2. **Older or low-confidence user:** Needs large text, 60dp+ targets, plain language, persistent navigation, and spoken feedback.
3. **Accessibility-first user:** Needs blue/orange status cues, icon-plus-text controls, adjustable text, high contrast, and 10 supported Indian languages.
4. **Caregiver-connected user:** Needs visible emergency calling and Calendar records that can be shared through Google Calendar.

## Core Requirements (Static)
- Four tabs: Home, Scan, Chat, Settings, with Chat positioned between Scan and Settings.
- First-launch language selection and compulsory Google sign-in.
- Camera-first label capture, contextual permission flow, 1024px JPEG compression, animated reading state, and strict non-hallucination behavior.
- AI confirmation before saving; rule-based reminder times; manual entry only after explicit user choice.
- SQLite medicine storage, local daily notifications, Calendar event creation/deletion, stored event IDs, and offline operation queue.
- Dashboard medicine cards, taken status, expiry states, medicine detail controls, spoken confirmations, reminder alarm, snooze, and deletion confirmation sheet.
- Settings for text size, contrast, TTS, language, caregiver number, and data-clearing sign-out.
- Strict MedicPal palette, minimum 18sp body text, minimum 60dp actions, safe areas, haptics, and no user-mode toggle.
- Dedicated screens for symptom logging, unified chronology, appointments, and private document storage while preserving the three-tab shell.
- AI symptom output must remain a neutral summary plus doctor questions, include a non-diagnostic safety notice, and escalate emergency phrases without diagnosing.
- Vault images must be compressed to base64 and stored only in the app's local device data.
- Chat must use predefined on-device intent rules, keep messages out of persistent storage, and never send chat text to an AI service.
- Chat may pause/resume reminders, dismiss visible alerts, change times, stop future notifications/Calendar events, change approved app settings, and answer MedicPal-only FAQs.
- Reminder changes require medicine selection; pause/resume/time/stop actions require confirmation and must never imply that a prescription should be stopped.

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
- Added an explicit `/auth/callback` redirect and popup-completion route for deterministic Google Web OAuth.
- Verified Google account sign-in opens with the Calendar events scope and no redirect URI mismatch.
- Android and iOS OAuth client IDs remain pending for native sign-in validation.

### 2026-08-06 — Google Android OAuth Configuration
- Configured the supplied Android OAuth client ID for package `com.emergent.medicpalhealth.k7ztqx`.
- Local debug SHA-1 is documented for Android development testing; production signing validation remains pending.

### 2026-08-06 — Temporary Development Login Bypass
- Added a clearly labeled `Skip login (dev only)` action gated by `__DEV__` for testing non-OAuth app flows in Expo Go.
- The development profile is local-only and has no Google token, so Calendar synchronization is intentionally unavailable in this **MOCKED** flow.

### 2026-08-06 — Medicine Packaging Photo Upload
- Added gallery selection for medicine boxes, bottles, blister strips, prescriptions, and labels, with 1024px JPEG preparation before analysis.
- Added a strict safety boundary: Gemini reads visible printed text only and must not identify loose tablets from appearance.

### 2026-08-07 — Health Organizer Expansion
- Added local symptom logs with severity, duration, notes, timestamps, deletion, and GPT-5.4 visit-prep insights that never diagnose or recommend treatment.
- Added rule-based urgent escalation for emergency phrases and a fixed safety notice on every AI insight.
- Added a unified chronological timeline combining medicines, symptoms, appointments, and vault documents.
- Added appointment creation and local persistence.
- Added a private document and prescription vault with image compression, base64-only storage, categories, previews, and deletion.
- Added Home entry cards for all three features while preserving Home, Scan, and Settings tabs.
- Restored forked environment configuration and moved medicine scanning to the protected Universal Key fallback when the original Gemini key is unavailable.
- Fixed React Native Web sheets with a body portal while preserving native Modal/KeyboardAvoidingView behavior.
- Verified API safety, symptom insights, medicine scanning, appointment timeline, vault persistence, responsive mobile layout, and sign-out data clearing.

### 2026-08-07 — Deterministic MedicPal Helper
- Added a fourth Chat tab between Scan and Settings with an accessible mobile conversation layout, quick replies, free-text input, and safe confirmation sheets.
- Added fully local predefined intent matching; chat messages are session-only and never sent to the backend or an AI provider.
- Added MedicPal-only FAQs covering scanning, symptoms, timeline, vault, AI boundaries, privacy, and caregiver settings.
- Added on-device settings actions for spoken help, text sizing, and high contrast.
- Added medicine-specific pause, resume, visible-alert dismissal, time changes, and future reminder stopping.
- Reminder actions update local notifications and connected Google Calendar events while preserving medicine history and clearly separating reminder changes from medical decisions.
- When Google access is unavailable, Calendar deletion stores only event IDs in the existing offline queue and clearly tells the user that Calendar sync is unavailable; it does not make an unauthorized network request.
- Added reminder state persistence and paused/stopped status cues on medicine cards.
- Verified all deterministic chat paths, confirmation boundaries, data minimization copy, and four-tab mobile layout.

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
- Validate denied and permanently blocked photo-library permission recovery on Android and iOS devices.
- Add native date/time pickers for appointments and editable event dates.
- Add explicit confirmation sheets before deleting symptom logs or vault records.
- Add optional app-level encryption for vault images beyond the operating system sandbox.
- Validate chatbot notification dismissal and Calendar rescheduling on physical iOS and Android devices.
- Add localized chatbot phrase dictionaries for all supported app languages.

### P2 — Enhancements
- Add caregiver-friendly Calendar sharing guidance without adding a separate app mode.
- Add adherence history and a simple weekly taken/missed summary.
- Add optional voice capture guidance and label-edge quality checks before upload.
- Add timeline filters and clinician-friendly local export initiated explicitly by the user.
- Add PDF import and multi-page document support without remote storage.

## Next Tasks
1. User review of symptom, timeline, and vault workflows on a physical device.
2. Complete real-device Google sign-in and Calendar integration validation.
3. Run accessibility checks with large system text and VoiceOver/TalkBack.
4. Expand complete UI translation coverage for all 10 languages.