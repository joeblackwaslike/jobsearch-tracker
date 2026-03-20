import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../../shared/storage";
import { useAuth } from "../hooks/useAuth";

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const { signOut } = useAuth();
  const [backendUrl, setBackendUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getStorage("backend_url").then((url) => {
      if (url) setBackendUrl(url);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await setStorage({ backend_url: backendUrl.replace(/\/$/, "") });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="icon-btn" onClick={onBack} type="button">
          ← Back
        </button>
        <span className="screen-title">Settings</span>
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="field">
          <label className="label" htmlFor="backend-url">
            Backend URL
          </label>
          <input
            id="backend-url"
            className="input"
            type="url"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="https://your-app.com"
            required
          />
        </div>
        {saved && <span className="success-msg">Saved.</span>}
        <button className="btn btn-secondary" type="submit">
          Save
        </button>
      </form>

      <div className="divider" />

      <button className="btn btn-secondary" type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
