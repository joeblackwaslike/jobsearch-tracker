import { useEffect, useState } from "react";
import { getStorage } from "../../shared/storage";
import type { RecentJob } from "../../shared/storage";
import { useTrack } from "../hooks/useTrack";

interface Props {
  onSettings: () => void;
}

export function MainScreen({ onSettings }: Props) {
  const { status, track } = useTrack();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [url, setUrl] = useState("");
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.url) setUrl(tab.url);
    });

    // Try to get job data from content script
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_JOB_DATA" },
        (data: { company: string; position: string } | null) => {
          if (chrome.runtime.lastError) return; // no content script on this page
          if (data) {
            setCompany(data.company);
            setPosition(data.position);
          }
        },
      );
    });

    // Load recent jobs
    getStorage("recent_jobs").then(setRecentJobs);
  }, []);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    await track({ company_name: company, position, url });
  }

  const statusMessages: Record<string, string> = {
    success: "Tracked successfully!",
    duplicate: "Already tracked.",
    expired: "Session expired — sign in again.",
    error: "Something went wrong.",
  };

  return (
    <div className="screen">
      <div className="screen-header">
        <span className="screen-title">Track Job</span>
        <button className="icon-btn" onClick={onSettings} title="Settings" type="button">
          ⚙
        </button>
      </div>

      <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="field">
          <label className="label">Company</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">Position</label>
          <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} required />
        </div>
        <div className="field">
          <label className="label">URL</label>
          <input className="input" type="url" value={url} onChange={(e) => setUrl(e.target.value)} required />
        </div>

        {status !== "idle" && status !== "loading" && (
          <span className={status === "success" ? "success-msg" : "error-msg"}>
            {statusMessages[status]}
          </span>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={status === "loading" || status === "success" || status === "duplicate"}
        >
          {status === "loading" ? "Tracking…" : "Track"}
        </button>
      </form>

      {recentJobs.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Recently tracked</div>
            <div className="recent-list">
              {recentJobs.map((job) => (
                <div className="recent-item" key={job.application_id}>
                  <div className="recent-item-title">{job.position}</div>
                  <div className="recent-item-company">{job.company}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
