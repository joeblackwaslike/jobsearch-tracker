import { aijobsAdapter } from "./aijobs";
import { ashbyAdapter } from "./ashby";
import { blindAdapter } from "./blind";
import { builtinAdapter } from "./builtin";
import { diceAdapter } from "./dice";
import { githubAdapter } from "./github";
import { githubCareersAdapter } from "./github-careers";
import { googleJobsAdapter } from "./google";
import { greenhouseAdapter } from "./greenhouse";
import { greenhouseCareersAdapter } from "./greenhouse-careers";
import { hackerNewsAdapter } from "./hackernews";
import { indeedAdapter } from "./indeed";
import { levelsAdapter } from "./levels";
import { leverAdapter } from "./lever";
import { linkedInAdapter } from "./linkedin";
import { startupJobsAdapter } from "./startupjobs";
import type { Adapter } from "./types";
import { welcomeToTheJungleAdapter } from "./welcometothejungle";
import { wellfoundAdapter } from "./wellfound";
import { workableAdapter } from "./workable";
import { workAtAStartupAdapter } from "./workatastartup";
import { workdayAdapter } from "./workday";
import { ycombinatorAdapter } from "./ycombinator";
import { ziprecruiterAdapter } from "./ziprecruiter";

const adapters: Adapter[] = [
  linkedInAdapter,
  indeedAdapter,
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  workableAdapter,
  wellfoundAdapter,
  builtinAdapter,
  diceAdapter,
  levelsAdapter,
  ziprecruiterAdapter,
  githubAdapter,
  githubCareersAdapter,
  googleJobsAdapter,
  blindAdapter,
  welcomeToTheJungleAdapter,
  workAtAStartupAdapter,
  hackerNewsAdapter,
  ycombinatorAdapter,
  aijobsAdapter,
  startupJobsAdapter,
];

/** Look up the adapter for the current hostname. Returns null if unsupported. */
export function findAdapter(hostname: string): Adapter | null {
  // Exact host match
  const exact = adapters.find((a) => a.hosts.includes(hostname));
  if (exact) return exact;

  // Workday: any *.myworkdayjobs.com subdomain
  if (hostname.endsWith(".myworkdayjobs.com")) return workdayAdapter;

  return null;
}

export function findAdapterByUrlParams(): Adapter | null {
  const params = new URLSearchParams(location.search);
  // gh_jid on a non-greenhouse.io domain = Greenhouse hosted career site (whitelabel)
  if (params.has("gh_jid")) return greenhouseCareersAdapter;
  if (params.has("ashby_jid")) return ashbyAdapter;
  return null;
}

export {
  adapters,
  workdayAdapter,
  greenhouseAdapter,
  ashbyAdapter,
  greenhouseCareersAdapter,
  workableAdapter,
};
export type { Adapter };
