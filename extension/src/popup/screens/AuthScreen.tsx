import { useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { useAuth } from "../hooks/useAuth";

export function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const { signIn, error } = useAuth();
  const [backendUrl, setBackendUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill backend URL if already set
  useState(() => {
    getStorage("backend_url").then((url) => {
      if (url) setBackendUrl(url);
    });
  });

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

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
