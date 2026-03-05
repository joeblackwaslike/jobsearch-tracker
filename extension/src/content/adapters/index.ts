import { ashbyAdapter } from "./ashby";
import { blindAdapter } from "./blind";
import { builtinAdapter } from "./builtin";
import { diceAdapter } from "./dice";
import { githubAdapter } from "./github";
import { googleJobsAdapter } from "./google";
import { greenhouseAdapter } from "./greenhouse";
import { indeedAdapter } from "./indeed";
import { levelsAdapter } from "./levels";
import { leverAdapter } from "./lever";
import { linkedInAdapter } from "./linkedin";
import { welcomeToTheJungleAdapter } from "./welcometothejungle";
import { wellfoundAdapter } from "./wellfound";
import { workAtAStartupAdapter } from "./workatastartup";
import { workdayAdapter } from "./workday";
import { ziprecruiterAdapter } from "./ziprecruiter";
import type { Adapter } from "./types";

const adapters: Adapter[] = [
  linkedInAdapter,
  indeedAdapter,
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  wellfoundAdapter,
  builtinAdapter,
  diceAdapter,
  levelsAdapter,
  ziprecruiterAdapter,
  githubAdapter,
  googleJobsAdapter,
  blindAdapter,
  welcomeToTheJungleAdapter,
  workAtAStartupAdapter,
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

export { adapters, workdayAdapter, greenhouseAdapter, ashbyAdapter };
export type { Adapter };
