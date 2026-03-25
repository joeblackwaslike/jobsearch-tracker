import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { useAuth } from "../hooks/useAuth";

export function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const { signIn, signInWithGoogle, error } = useAuth();
  const [backendUrl, setBackendUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill backend URL if already set
  useEffect(() => {
    getStorage("backend_url").then((url) => {
      if (url) setBackendUrl(url);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (backendUrl) {
      await setStorage({ backend_url: backendUrl.replace(/\/$/, "") });
    }
    const ok = await signIn(email, password);
    setLoading(false);
    if (ok) onSuccess();
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <div className="screen-header">
        <span className="screen-title">Job Search Tracker</span>
      </div>

      <div className="field">
        <label className="label" htmlFor="auth-backend-url">
          Backend URL
        </label>
        <input
          id="auth-backend-url"
          className="input"
          type="url"
          placeholder="https://your-app.com"
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="auth-password">
          Password
        </label>
        <input
          id="auth-password"
          className="input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error === "invalid_credentials" && (
        <span className="error-msg">Invalid email or password.</span>
      )}
      {error === "no_backend_url" && (
        <span className="error-msg">Enter your backend URL first.</span>
      )}
      {error === "unknown" && (
        <span className="error-msg">Google sign-in failed. Please try again.</span>
      )}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div className="divider">or</div>

      <button
        className="btn btn-secondary"
        type="button"
        disabled={loading}
        onClick={async () => {
          if (backendUrl) await setStorage({ backend_url: backendUrl.replace(/\/$/, "") });
          setLoading(true);
          const ok = await signInWithGoogle(backendUrl || undefined);
          setLoading(false);
          if (ok) onSuccess();
        }}
      >
        <svg className="btn-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
    </form>
  );
}
