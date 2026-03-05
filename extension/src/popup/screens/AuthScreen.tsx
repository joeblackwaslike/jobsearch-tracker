import { useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { useAuth } from "../hooks/useAuth";

export function AuthScreen() {
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
    await signIn(email, password);
    setLoading(false);
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <div className="screen-header">
        <span className="screen-title">Job Search Tracker</span>
      </div>

      <div className="field">
        <label className="label">Backend URL</label>
        <input
          className="input"
          type="url"
          placeholder="https://your-app.com"
          value={backendUrl}
          onChange={(e) => setBackendUrl(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="field">
        <label className="label">Password</label>
        <input
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
