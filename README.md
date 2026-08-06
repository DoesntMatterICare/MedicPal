# MediPal

A mobile health app built with Expo (SDK 54), developed on the Emergent platform.

## Tech Stack

- **Framework**: Expo SDK 54 (React Native)
- **Auth**: `expo-auth-session` with Google OAuth
- **AI**: Google Gemini API
- **Build/Dev platform**: Emergent

## Project Identifiers

- **Android package name**: `com.emergent.medicpalhealth.k7ztqx`
- **iOS bundle identifier**: `com.emergent.medicpalhealth.k7ztqx`
- **Preview URL**: `https://medicpal-health.preview.emergentagent.com`

## Environment Variables / API Keys

| Key | Purpose | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API access | Free tier, from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| Google OAuth Web Client ID | Browser-based login flow | Created in Google Cloud Console (MediPal project) |
| Google OAuth Web Client Secret | Pairs with Web Client ID | **Do not commit to source control** |
| Google OAuth Android Client ID | Native Android sign-in | Tied to package name + debug/production SHA-1 |
| Google OAuth iOS Client ID | Native iOS sign-in | *Pending — not yet created* |

Never hardcode these values in client-side code or commit them to git. Store them as environment variables or in Emergent's secrets/config settings.

## Google Cloud Console Setup

Project: **MediPal** (`medipal-504721`)

### Web Client (browser preview / login)
- **Authorized JavaScript origin**: `https://medicpal-health.preview.emergentagent.com`
- **Authorized redirect URIs**:
  - `https://medicpal-health.preview.emergentagent.com/auth/callback`
  - `https://medicpal-health.preview.emergentagent.com`

### Android Client (native sign-in)
- **Package name**: `com.emergent.medicpalhealth.k7ztqx`
- **SHA-1 (debug/local testing)**: `2C:89:CF:FD:66:0E:69:58:F8:19:D6:FC:82:B6:E6:DD:44:67:6B:C2`
- ⚠️ This is a **debug-only** fingerprint. A separate Android client with the **production signing SHA-1** must be created before release (get this from EAS or the Play Console after generating a production build).

### iOS Client (native sign-in)
- **Bundle ID**: `com.emergent.medicpalhealth.k7ztqx`
- Status: not yet created — required before testing Google Sign-In on iOS.

## Known Limitations

- **Google Sign-In does not work in Expo Go.** Expo Go uses its own app identity (package/signing certificate), which doesn't match the registered Android/iOS OAuth clients, and it cannot register MediPal's custom redirect scheme (`medicpal://`). Google blocks the request with `Error 400: invalid_request`.
- Expo SDK 54 has removed the legacy `auth.expo.io` proxy (`useProxy`) from `expo-auth-session`, so that workaround is no longer available.
- **To test native Google Sign-In**, you must run a development or production build via EAS (not Expo Go).
- Native features (camera, notifications, audio) also require a real device build — they don't function fully in the browser preview or Expo Go.

## Testing Without Login

While native OAuth is untestable in Expo Go, a temporary dev-only bypass (mock logged-in session) can be added to navigate past the login screen and test the rest of the app. Remove this before any production deployment.

## Deployment

Via Emergent: **Publish (top right) → Deploy your app → Generate iOS and Android builds.**

After generating a production build:
1. Retrieve the production signing SHA-1 (Android) from EAS/Play Console.
2. Create a new Android OAuth client in Google Cloud Console using the production SHA-1.
3. Create the iOS OAuth client if not already done.
4. Update Emergent's environment config with the new client IDs.

## Notes

- All OAuth clients live under the **MediPal** Google Cloud project — do not use the `virtual-workshop-lab` project (a separate, unrelated project).
- Inactive OAuth clients in Google Cloud Console are subject to deletion after 6 months of inactivity (recoverable within 30 days).

