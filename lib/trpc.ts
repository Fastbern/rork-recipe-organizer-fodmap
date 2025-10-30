import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { Platform } from "react-native";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

function inferDevBaseUrl(): string | null {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin;
    }
    return null;
  }
  const hostUri = Constants.expoConfig?.hostUri ?? null;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    // Common dev servers run on 8081/19000; our API is served by the same origin via reverse proxy on web.
    // Fallback to using the Metro host with HTTPS if possible.
    return `http://${host}:8081`;
  }
  return null;
}

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) return envUrl;

  const inferred = inferDevBaseUrl();
  if (inferred) return inferred;

  throw new Error(
    "No API base URL. Set EXPO_PUBLIC_RORK_API_BASE_URL or run on web preview."
  );
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
    }),
  ],
});
