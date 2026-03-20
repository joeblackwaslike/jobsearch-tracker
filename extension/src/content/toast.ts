import type { JobData } from "./adapters/types";

const TOAST_ID = "jst-toast-container";
const AUTO_DISMISS_MS = 10000;

const CSS = `
  :host {
    all: initial;
  }
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 320px;
    padding: 16px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
    font-family: system-ui, -apple-system, sans-serif;
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .toast.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .toast.fade-out {
    opacity: 0;
    transform: translateY(12px);
  }
  .icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    background: #dcfce7;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    line-height: 1;
  }
  .body {
    flex: 1;
    min-width: 0;
  }
  .label {
    font-size: 12px;
    font-weight: 600;
    color: #16a34a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .position {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .company {
    font-size: 13px;
    color: #64748b;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .progress {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: #16a34a;
    border-radius: 0 0 12px 12px;
    width: 100%;
    transform-origin: left;
    animation: shrink ${AUTO_DISMISS_MS}ms linear forwards;
  }
  @keyframes shrink {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }
  .close {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 16px;
    color: #94a3b8;
    line-height: 1;
    margin-top: -2px;
  }
  .close:hover {
    color: #475569;
  }
`;

export function showTrackedToast(jobData: JobData): void {
  document.getElementById(TOAST_ID)?.remove();

  const container = document.createElement("div");
  container.id = TOAST_ID;
  container.style.cssText =
    "position:fixed;bottom:0;right:0;z-index:2147483647;pointer-events:none;";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = CSS;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.pointerEvents = "auto";
  toast.innerHTML = `
    <div class="icon">✓</div>
    <div class="body">
      <div class="label">Application Tracked</div>
      <div class="position" title="${escHtml(jobData.position)}">${escHtml(jobData.position)}</div>
      <div class="company">${escHtml(jobData.company)}</div>
    </div>
    <button class="close" aria-label="Dismiss">✕</button>
    <div class="progress"></div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("visible"));
  });

  const timer = setTimeout(dismiss, AUTO_DISMISS_MS);

  shadow.querySelector(".close")?.addEventListener("click", () => {
    clearTimeout(timer);
    dismiss();
  });

  function dismiss() {
    toast.classList.add("fade-out");
    toast.classList.remove("visible");
    setTimeout(() => container.remove(), 300);
  }
}

export function showTrackErrorToast(): void {
  document.getElementById(TOAST_ID)?.remove();

  const container = document.createElement("div");
  container.id = TOAST_ID;
  container.style.cssText =
    "position:fixed;bottom:0;right:0;z-index:2147483647;pointer-events:none;";
  document.body.appendChild(container);

  const shadow = container.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = CSS.replace("#dcfce7", "#fee2e2")
    .replace("#16a34a", "#dc2626")
    .replace("linear forwards", "linear forwards; display:none");

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.pointerEvents = "auto";
  toast.innerHTML = `
    <div class="icon" style="background:#fee2e2">✕</div>
    <div class="body">
      <div class="label" style="color:#dc2626">Tracking Failed</div>
      <div class="position" style="font-weight:500;color:#475569">Could not save your application.</div>
      <div class="company">Check your extension settings.</div>
    </div>
    <button class="close" aria-label="Dismiss">✕</button>
  `;

  shadow.appendChild(style);
  shadow.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add("visible"));
  });

  const timer = setTimeout(dismiss, 6000);
  shadow.querySelector(".close")?.addEventListener("click", () => {
    clearTimeout(timer);
    dismiss();
  });

  function dismiss() {
    toast.classList.add("fade-out");
    setTimeout(() => container.remove(), 300);
  }
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
