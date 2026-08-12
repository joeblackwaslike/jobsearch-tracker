import type { JobData } from "./adapters/types";

export const BUTTON_ID = "jst-track-btn";

const BUTTON_STYLES: Partial<CSSStyleDeclaration> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 16px",
  marginLeft: "8px",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  border: "none",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: "600",
  fontFamily: "system-ui, -apple-system, sans-serif",
  cursor: "pointer",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
  lineHeight: "1.4",
  transition: "background-color 0.15s ease",
  zIndex: "9999",
};

type ButtonState = "idle" | "loading" | "success" | "duplicate" | "expired" | "error";

export function injectTrackButton(
  target: Element,
  jobData: JobData,
  onClick: (data: JobData) => void,
): HTMLButtonElement | null {
  if (document.getElementById(BUTTON_ID)) return null;

  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.textContent = "Track";
  Object.assign(btn.style, BUTTON_STYLES);

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(jobData);
  });

  btn.addEventListener("mouseenter", () => {
    if (btn.dataset.state === "idle" || !btn.dataset.state) {
      btn.style.backgroundColor = "#1d4ed8";
    }
  });
  btn.addEventListener("mouseleave", () => {
    if (btn.dataset.state === "idle" || !btn.dataset.state) {
      btn.style.backgroundColor = "#2563eb";
    }
  });

  target.insertAdjacentElement("afterend", btn);
  return btn;
}

export function setButtonState(state: ButtonState, message?: string): void {
  const btn = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!btn) return;

  btn.dataset.state = state;

  const labels: Record<ButtonState, string> = {
    idle: "Track",
    loading: "Tracking…",
    success: "Tracked ✓",
    duplicate: "Already tracked",
    expired: "Sign in again",
    error: message ?? "Failed — retry?",
  };

  const colors: Record<ButtonState, string> = {
    idle: "#2563eb",
    loading: "#6b7280",
    success: "#16a34a",
    duplicate: "#6b7280",
    expired: "#dc2626",
    error: "#dc2626",
  };

  btn.textContent = labels[state];
  btn.style.backgroundColor = colors[state];
  btn.disabled = state === "loading" || state === "success" || state === "duplicate";
}

export function removeTrackButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}
