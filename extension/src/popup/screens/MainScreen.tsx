import { useEffect, useRef, useState } from "react";
import type { RecentJob } from "../../shared/storage";
import { getQueueCount, getStorage } from "../../shared/storage";
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
  const [queueCount, setQueueCount] = useState(0);
  const [debugLog, setDebugLog] = useState<string[] | null>(null);
  const debugRef = useRef<HTMLPreElement>(null);

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

    // Load recent jobs and queue count
    getStorage("recent_jobs").then(setRecentJobs);
    getQueueCount().then(setQueueCount);
  }, []);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    await track({ company_name: company, position, url });
  }

  function fetchDebugLog() {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: "GET_DEBUG_LOG" }, (entries: string[] | null) => {
        if (chrome.runtime.lastError) {
          setDebugLog(["(no content script on this page)"]);
          return;
        }
        setDebugLog(entries?.length ? entries : ["(log is empty)"]);
        // scroll to bottom after render
        setTimeout(() => {
          debugRef.current?.scrollTo(0, debugRef.current.scrollHeight);
        }, 0);
      });
    });
  }

  const statusMessages: Record<string, string> = {
    success: "Tracked successfully!",
    duplicate: "Already tracked.",
    expired: "Session expired — sign in again.",
    queued: "Backend offline — queued for sync.",
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

      {queueCount > 0 && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            color: "#92400e",
            marginBottom: 8,
          }}
        >
          ⚠ Backend offline — {queueCount} application{queueCount !== 1 ? "s" : ""} queued
        </div>
      )}

      <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="field">
          <label className="label" htmlFor="track-company">
            Company
          </label>
          <input
            id="track-company"
            className="input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="track-position">
            Position
          </label>
          <input
            id="track-position"
            className="input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="label" htmlFor="track-url">
            URL
          </label>
          <input
            id="track-url"
            className="input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        {status !== "idle" && status !== "loading" && (
          <span
            className={status === "success" || status === "queued" ? "success-msg" : "error-msg"}
          >
            {statusMessages[status]}
          </span>
        )}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={
            status === "loading" ||
            status === "success" ||
            status === "duplicate" ||
            status === "queued"
          }
        >
          {status === "loading" ? "Tracking…" : "Track"}
        </button>
      </form>

      {recentJobs.length > 0 && (
        <>
          <div className="divider" />
          <div>
            <div className="label" style={{ marginBottom: 8 }}>
              Recently tracked
            </div>
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

      <div className="divider" />
      <details>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: <summary> is natively interactive as part of <details> */}
        <summary
          style={{ cursor: "pointer", fontSize: 11, color: "#6b7280", userSelect: "none" }}
          onClick={() => {
            if (!debugLog) fetchDebugLog();
          }}
        >
          Debug log
        </summary>
        {debugLog !== null && (
          <div style={{ marginTop: 6, position: "relative" }}>
            <button
              type="button"
              onClick={fetchDebugLog}
              style={{
                position: "absolute",
                top: 4,
                right: 4,
                fontSize: 10,
                padding: "1px 6px",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
            <pre
              ref={debugRef}
              style={{
                fontSize: 9,
                lineHeight: 1.5,
                maxHeight: 160,
                overflowY: "auto",
                background: "#f8f8f8",
                border: "1px solid #e5e7eb",
                borderRadius: 4,
                padding: "6px 8px",
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {debugLog.join("\n")}
            </pre>
          </div>
        )}
      </details>
    </div>
  );
}
