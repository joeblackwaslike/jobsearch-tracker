import { useCallback, useEffect, useState } from "react";
import { signin as apiSignin } from "../../shared/api";
import { clearStorage, getStorage, setStorage } from "../../shared/storage";

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

  const signOut = useCallback(async () => {
    await clearStorage("auth");
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, loading, error, signIn, signOut };
}
