import { useCallback, useEffect, useState } from "react";
import { getGoogleOAuthUrl, googleExchange, signin as apiSignin } from "../../shared/api";
import { clearStorage, getStorage, setStorage } from "../../shared/storage";

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export type SignInError = "invalid_credentials" | "no_backend_url" | "unknown";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<SignInError | null>(null);

  useEffect(() => {
    getStorage("access_token").then((token) => {
      setIsAuthenticated(!!token);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const backendUrl = await getStorage("backend_url");
    if (!backendUrl) {
      setError("no_backend_url");
      return false;
    }
    const result = await apiSignin(backendUrl, email, password);
    if (!result.ok) {
      setError("invalid_credentials");
      return false;
    }
    await setStorage({ access_token: result.access_token, refresh_token: result.refresh_token });
    setIsAuthenticated(true);
    return true;
  }, []);

  const signInWithGoogle = useCallback(async (backendUrlOverride?: string) => {
    setError(null);
    const backendUrl = backendUrlOverride ?? (await getStorage("backend_url"));
    if (!backendUrl) {
      setError("no_backend_url");
      return false;
    }

    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const redirectTo = chrome.identity.getRedirectURL();

    const urlResult = await getGoogleOAuthUrl(backendUrl, redirectTo, codeChallenge);
    if (!urlResult.ok) {
      console.error("[useAuth] Failed to get Google OAuth URL:", urlResult.error);
      setError("unknown");
      return false;
    }
    console.log("[useAuth] Got OAuth URL, launching web auth flow…");

    const responseUrl = await new Promise<string | undefined>((resolve) => {
      chrome.identity.launchWebAuthFlow(
        { url: urlResult.url, interactive: true },
        (url) => {
          if (chrome.runtime.lastError) {
            console.error("[useAuth] launchWebAuthFlow error:", chrome.runtime.lastError.message);
          }
          resolve(url);
        },
      );
    });

    if (!responseUrl) {
      console.error("[useAuth] No response URL from auth flow (user cancelled or auth error)");
      setError("unknown");
      return false;
    }
    console.log("[useAuth] Got response URL:", responseUrl);

    const code = new URL(responseUrl).searchParams.get("code");
    if (!code) {
      console.error("[useAuth] No code in response URL — error params:", responseUrl);
      setError("unknown");
      return false;
    }

    const result = await googleExchange(backendUrl, code, codeVerifier);
    if (!result.ok) {
      console.error("[useAuth] Token exchange failed:", result.error);
      setError("unknown");
      return false;
    }

    await setStorage({ access_token: result.access_token, refresh_token: result.refresh_token });
    setIsAuthenticated(true);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    await clearStorage("auth");
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, loading, error, signIn, signInWithGoogle, signOut };
}
