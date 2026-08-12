export interface JobData {
  company: string;
  position: string;
  url: string;
}

export interface Adapter {
  /** All hostnames this adapter handles (exact match against location.hostname). */
  hosts: string[];
  /** Human-readable board name for intent attribution (e.g. "Builtin", "Levels.fyi"). */
  source?: string;
  /**
   * Extract job data from the current page DOM.
   * Returns null if the page is not a job detail page (e.g. a list page).
   */
  extract(): JobData | null;
  /**
   * Return the element to inject the Track button adjacent to.
   * Returns null if the target hasn't rendered yet (caller will retry via MutationObserver).
   * Not required if watchForSubmission or watchForIntent is implemented.
   */
  getInjectTarget?(): Element | null;
  /**
   * Optional: instead of a Track button, watch for the native application form to be
   * submitted. Call onSubmit with the captured job data when submission is confirmed.
   * Returns a cleanup function to stop watching.
   */
  watchForSubmission?(onSubmit: (jobData: JobData) => void): () => void;
  /**
   * Optional: for aggregator boards that redirect to an external ATS.
   * Called once on a job detail page to store intent; the ATS adapter fires TRACK later.
   * Call onIntent with extracted job data; the infrastructure stores a PendingIntent.
   * Returns a cleanup function to stop watching.
   */
  watchForIntent?(onIntent: (jobData: JobData) => void): () => void;
}
