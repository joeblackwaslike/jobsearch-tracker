export interface JobData {
  company: string;
  position: string;
  url: string;
}

export interface Adapter {
  /** All hostnames this adapter handles (exact match against location.hostname). */
  hosts: string[];
  /**
   * Extract job data from the current page DOM.
   * Returns null if the page is not a job detail page (e.g. a list page).
   */
  extract(): JobData | null;
  /**
   * Return the element to inject the Track button adjacent to.
   * Returns null if the target hasn't rendered yet (caller will retry via MutationObserver).
   */
  getInjectTarget(): Element | null;
}
