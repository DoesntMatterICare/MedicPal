import "dotenv/config";
import baseConfig from "./app.json";

export default {
  ...baseConfig.expo,
  extra: {
    backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
  },
};