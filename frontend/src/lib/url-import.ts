/**
 * URL Import Utility
 * Fetches job posting data from URLs and extracts relevant information
 */

import TurndownService from "turndown";
import { createClient } from "@/lib/supabase/client";

const turndown = new TurndownService({ headingStyle: "atx", bulletListMarker: "-" });

/**
 * Extracted job data from URL
 */
export interface ExtractedJobData {
  position?: string;
  companyName?: string;
  locations?: string[];
  workType?: "remote" | "hybrid" | "onsite";
  employmentType?: "full-time" | "part-time" | "contract" | "internship";
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobDescription?: string;
  jobUrl: string;
  source?: string;
}

/**
 * Common job board patterns for extraction
 */
interface JobBoardPattern {
  domain: string;
  name: string;
  selectors: {
    title?: string[];
    company?: string[];
    location?: string[];
    salary?: string[];
    description?: string[];
    employmentType?: string[];
    workType?: string[];
  };
}

/**
 * Known job board patterns
 */
const JOB_BOARD_PATTERNS: JobBoardPattern[] = [
  {
    domain: "github.careers",
    name: "GitHub",
    selectors: {
      title: ["h1", ".job-title", '[class*="title"]'],
      company: [".company-name"],
      location: ['[class*="location"]', ".location"],
      salary: ['[class*="salary"]', '[class*="compensation"]'],
      description: [".job-description", '[class*="description"]', "#job-description"],
    },
  },
  {
    domain: "icims.com",
    name: "iCIMS",
    selectors: {
      title: ["h1", ".iCIMS_Header", ".job-title"],
      company: [".iCIMS_CompanyName", ".company-name"],
      location: [".iCIMS_JobLocation", ".location"],
      description: [".iCIMS_JobContent", ".job-description"],
    },
  },
  {
    domain: "linkedin.com",
    name: "LinkedIn",
    selectors: {
      title: [".top-card-layout__title", ".job-details-jobs-unified-top-card__job-title", "h1"],
      company: [
        ".topcard__org-name-link",
        ".job-details-jobs-unified-top-card__company-name",
        ".topcard__flavor",
      ],
      location: [".topcard__flavor--bullet", ".job-details-jobs-unified-top-card__bullet"],
      description: [".description__text", ".jobs-description__content"],
    },
  },
  {
    domain: "indeed.com",
    name: "Indeed",
    selectors: {
      title: [
        ".jobsearch-JobInfoHeader-title",
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        "h1",
      ],
      company: [
        ".jobsearch-CompanyInfoContainer",
        '[data-testid="inlineHeader-companyName"]',
        ".companyName",
      ],
      location: [
        ".jobsearch-JobInfoHeader-subtitle",
        '[data-testid="job-location"]',
        ".companyLocation",
      ],
      salary: ['[data-testid="attribute_snippet_testid"]', ".salary-snippet-container"],
      description: ["#jobDescriptionText", ".jobsearch-jobDescriptionText"],
    },
  },
  {
    domain: "glassdoor.com",
    name: "Glassdoor",
    selectors: {
      title: [".job-title", '[data-test="job-title"]', "h1"],
      company: [".employer-name", '[data-test="employer-name"]'],
      location: [".location", '[data-test="emp-location"]'],
      salary: [".salary-estimate", '[data-test="detailSalary"]'],
      description: [".jobDescriptionContent", '[data-test="description"]'],
    },
  },
  {
    domain: "greenhouse.io", // in-url: gh_jid
    name: "Greenhouse",
    selectors: {
      title: [".app-title", ".job-title", "h1"],
      company: [".company-name", ".heading"],
      location: [".location", ".job-location"],
      description: ["#content", ".job-description", "#job_description"],
      salary: [".content-pay-transparency .pay-range"],
      employmentType: [".job-component-list-employment_type span"],
      workType: [".job-component-workplace-type span"],
    },
  },
  {
    domain: "lever.co",
    name: "Lever",
    selectors: {
      title: [".posting-headline h2", ".posting-title"],
      company: [".main-header-logo img[alt]", ".company-name"],
      location: [".location", ".posting-categories .sort-by-time"],
      description: [".posting-page .section-wrapper", ".posting-description"],
    },
  },
  {
    domain: "workday.com",
    name: "Workday",
    selectors: {
      title: ['[data-automation-id="jobPostingHeader"]', ".job-title", "h1"],
      company: [".css-1h9qwzj", ".company-name"],
      location: ['[data-automation-id="locations"]', ".location"],
      description: ['[data-automation-id="jobPostingDescription"]', ".job-description"],
    },
  },
  {
    domain: "monster.com",
    name: "Monster",
    selectors: {
      title: [".job-title", "h1"],
      company: [".company-name", ".company"],
      location: [".location", ".job-location"],
      description: ["#JobDescription", ".job-description"],
    },
  },
  {
    domain: "ziprecruiter.com",
    name: "ZipRecruiter",
    selectors: {
      title: [".job_title", "h1"],
      company: [".hiring_company", ".company_name"],
      location: [".location", ".job_location"],
      description: [".jobDescriptionSection", ".job_description"],
    },
  },
];

/**
 * Parse salary string to extract min/max values
 */
export function parseSalary(salaryText: string): {
  min?: number;
  max?: number;
  currency?: string;
} {
  if (!salaryText) return {};

  // Currency detection (before cleaning)
  let currency = "USD";
  const lowerText = salaryText.toLowerCase();
  if (lowerText.includes("£") || lowerText.includes("gbp")) currency = "GBP";
  else if (lowerText.includes("€") || lowerText.includes("eur")) currency = "EUR";
  else if (lowerText.includes("cad") || /c\s*\$/i.test(salaryText)) currency = "CAD";
  else if (lowerText.includes("aud") || /a\s*\$/i.test(salaryText)) currency = "AUD";
  else if (lowerText.includes("usd") || salaryText.includes("$")) currency = "USD";

  // Clean the text - remove currency symbols and commas
  const cleanText = salaryText.replace(/[,$£€]/g, "").toLowerCase();

  // Try to match salary patterns like "$107,700.00 - $285,900.00" or "107700 - 285900"
  // Handle both integer and decimal formats
  const rangeMatch = cleanText.match(
    /(\d+(?:\.\d+)?)\s*(?:k)?\s*(?:-|to|–|—)\s*(?:usd\s*)?\$?\s*(\d+(?:\.\d+)?)\s*(?:k)?/i,
  );

  if (rangeMatch) {
    const parseNumber = (str: string, hasK: boolean): number => {
      const num = parseFloat(str);
      // If the number has decimals like 107700.00, it's already full amount
      // If it's like 107.7k, multiply by 1000
      if (hasK) return num * 1000;
      // If number is small (< 1000) and no 'k', might be in thousands
      return num;
    };

    const hasK1 = cleanText.slice(0, cleanText.indexOf(rangeMatch[2])).includes("k");
    const hasK2 = cleanText.slice(cleanText.indexOf(rangeMatch[2])).includes("k");

    const min = parseNumber(rangeMatch[1], hasK1);
    const max = parseNumber(rangeMatch[2], hasK2);

    // Handle annual vs hourly
    const isHourly =
      cleanText.includes("hour") || cleanText.includes("/hr") || cleanText.includes("per hr");
    const multiplier = isHourly ? 2080 : 1;

    return {
      min: Math.round(min * multiplier),
      max: Math.round(max * multiplier),
      currency,
    };
  }

  // Extract numbers as fallback
  const numbers = cleanText.match(/\d+(?:\.\d+)?(?:k)?/g);
  if (!numbers || numbers.length === 0) return {};

  const parseNumber = (str: string): number => {
    const hasK = str.toLowerCase().includes("k");
    const num = parseFloat(str.replace(/k/i, ""));
    return hasK ? num * 1000 : num;
  };

  // Handle annual vs hourly
  const isHourly =
    cleanText.includes("hour") || cleanText.includes("/hr") || cleanText.includes("per hr");
  const multiplier = isHourly ? 2080 : 1; // Convert hourly to annual (40hrs * 52 weeks)

  if (numbers.length >= 2) {
    return {
      min: Math.round(parseNumber(numbers[0]) * multiplier),
      max: Math.round(parseNumber(numbers[1]) * multiplier),
      currency,
    };
  } else if (numbers.length === 1) {
    const value = Math.round(parseNumber(numbers[0]) * multiplier);
    return { min: value, max: value, currency };
  }

  return {};
}

/**
 * Detect work type from text
 */
export function detectWorkType(text: string): "remote" | "hybrid" | "onsite" | undefined {
  const lowerText = text.toLowerCase();

  // Check for explicit remote indicators
  if (
    lowerText.includes("fully remote") ||
    lowerText.includes("100% remote") ||
    lowerText.includes("work from home") ||
    lowerText.includes("remote-first") ||
    /remote\s*:\s*yes/i.test(text) ||
    /\bremote,\s*\w/i.test(text) // "Remote, United States" pattern
  ) {
    return "remote";
  }
  if (lowerText.includes("hybrid") || lowerText.includes("flexible location")) {
    return "hybrid";
  }
  if (
    lowerText.includes("on-site") ||
    lowerText.includes("onsite") ||
    lowerText.includes("in-office") ||
    lowerText.includes("in office")
  ) {
    return "onsite";
  }
  if (lowerText.includes("remote")) {
    return "remote";
  }

  return undefined;
}

/**
 * Detect employment type from text
 * Prioritizes explicit labels like "Employment Type: Full Time" over general mentions
 */
export function detectEmploymentType(
  text: string,
): "full-time" | "part-time" | "contract" | "internship" | undefined {
  // First, check for explicit employment type labels (most reliable)
  const explicitPatterns = [
    { pattern: /employment\s*type[:\s]*(full[\s-]?time)/i, type: "full-time" as const },
    { pattern: /employment\s*type[:\s]*(part[\s-]?time)/i, type: "part-time" as const },
    { pattern: /employment\s*type[:\s]*(contract|contractor)/i, type: "contract" as const },
    { pattern: /employment\s*type[:\s]*(intern|internship)/i, type: "internship" as const },
    { pattern: /job\s*type[:\s]*(full[\s-]?time)/i, type: "full-time" as const },
    { pattern: /job\s*type[:\s]*(part[\s-]?time)/i, type: "part-time" as const },
    { pattern: /job\s*type[:\s]*(contract)/i, type: "contract" as const },
    { pattern: /job\s*type[:\s]*(intern)/i, type: "internship" as const },
  ];

  for (const { pattern, type } of explicitPatterns) {
    if (pattern.test(text)) {
      return type;
    }
  }

  // Check for position-level indicators (less reliable, but still useful)
  if (/\b(?:full[\s-]?time)\b/i.test(text) && !/internship/i.test(text.slice(0, 500))) {
    return "full-time";
  }
  if (/\b(?:part[\s-]?time)\b/i.test(text)) {
    return "part-time";
  }
  if (
    /\b(?:contract(?:or)?|freelance)\b/i.test(text) &&
    !/full[\s-]?time/i.test(text.slice(0, 500))
  ) {
    return "contract";
  }
  // Only return internship if it's clearly in the title/header area, not in qualifications
  if (/\b(?:internship|intern\b)(?!.*experience|.*qualif)/i.test(text.slice(0, 300))) {
    return "internship";
  }

  return undefined;
}

/**
 * Extract text content from HTML element
 */
function extractText(html: string, selectors: string[]): string | undefined {
  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  for (const selector of selectors) {
    try {
      const element = doc.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text) return text;
      }
    } catch {
      // Invalid selector, continue to next
    }
  }

  return undefined;
}

/**
 * Extract job data from HTML using meta tags and common patterns
 */
function extractFromMetaTags(html: string): Partial<ExtractedJobData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const data: Partial<ExtractedJobData> = {};

  // --- 1. JSON-LD (highest priority) ---
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const jsonData = JSON.parse(script.textContent || "");
      const jobPosting = Array.isArray(jsonData)
        ? jsonData.find((item) => item["@type"] === "JobPosting")
        : jsonData["@type"] === "JobPosting"
          ? jsonData
          : null;

      if (jobPosting) {
        data.position = jobPosting.title;
        data.companyName = jobPosting.hiringOrganization?.name;

        // jobLocation can be a single object or an array
        const jobLocations = Array.isArray(jobPosting.jobLocation)
          ? jobPosting.jobLocation
          : jobPosting.jobLocation
            ? [jobPosting.jobLocation]
            : [];
        const locationStrings = jobLocations
          .map((loc: { address?: { addressLocality?: string; addressRegion?: string } }) =>
            [loc.address?.addressLocality, loc.address?.addressRegion].filter(Boolean).join(", "),
          )
          .filter(Boolean);
        if (locationStrings.length > 0) {
          data.locations = locationStrings;
        }

        // Description: convert HTML to markdown
        if (jobPosting.description) {
          data.jobDescription = turndown.turndown(jobPosting.description);
        }

        if (jobPosting.baseSalary) {
          const salary = jobPosting.baseSalary;
          data.salaryCurrency = salary.currency;
          if (salary.value) {
            if (typeof salary.value === "object") {
              data.salaryMin = salary.value.minValue;
              data.salaryMax = salary.value.maxValue;
            } else {
              data.salaryMin = salary.value;
              data.salaryMax = salary.value;
            }
          }
        }

        if (jobPosting.employmentType) {
          const empType = Array.isArray(jobPosting.employmentType)
            ? jobPosting.employmentType[0]
            : jobPosting.employmentType;
          data.employmentType = detectEmploymentType(empType);
        }

        if (jobPosting.jobLocationType === "TELECOMMUTE") {
          data.workType = "remote";
        }

        // If we got the key fields from JSON-LD, return early
        if (data.position && data.companyName) {
          return data;
        }
      }
    } catch {
      // Invalid JSON, continue
    }
  }

  // --- 2. Open Graph / meta tags (fallback) ---
  const metaSelectors = {
    position: ['meta[property="og:title"]', 'meta[name="twitter:title"]', 'meta[name="title"]'],
    companyName: ['meta[property="og:site_name"]', 'meta[name="author"]'],
    jobDescription: [
      'meta[property="og:description"]',
      'meta[name="description"]',
      'meta[name="twitter:description"]',
    ],
  };

  for (const [field, selectors] of Object.entries(metaSelectors)) {
    if ((data as Record<string, unknown>)[field]) continue; // already set by JSON-LD
    for (const selector of selectors) {
      const meta = doc.querySelector(selector);
      const content = meta?.getAttribute("content")?.trim();
      if (content) {
        (data as Record<string, unknown>)[field] = content;
        break;
      }
    }
  }

  // Split combined "Job Title | Company" patterns (OG fallback only)
  if (data.position && !data.companyName) {
    const combinedPatterns = [
      /^(.+?)\s*\|\s*(.+?)$/,
      /^(.+?)\s+at\s+(.+?)$/i,
      /^(.+?)\s*[-–—]\s*(.+?)$/,
    ];
    for (const pattern of combinedPatterns) {
      const match = data.position.match(pattern);
      if (match) {
        const cleanTitle = match[1].trim();
        const cleanCompany = match[2].trim();
        if (cleanTitle.length > 2 && cleanCompany.length > 1) {
          data.position = cleanTitle;
          data.companyName = cleanCompany;
          break;
        }
      }
    }
  }

  // Clean "in United States" from title (OG fallback)
  if (data.position) {
    const locationInTitle = data.position.match(/^(.+?)\s+in\s+([\w\s]+?)$/i);
    if (locationInTitle) {
      const locationIndicators = [
        "united states",
        "usa",
        "uk",
        "canada",
        "remote",
        "california",
        "new york",
        "texas",
        "florida",
      ];
      if (locationIndicators.some((loc) => locationInTitle[2].toLowerCase().includes(loc))) {
        data.position = locationInTitle[1].trim();
        if (!data.locations?.length) {
          data.locations = [locationInTitle[2].trim()];
        }
      }
    }
  }

  // Page title as last resort
  if (!data.position) {
    const title = doc.querySelector("title")?.textContent?.trim();
    if (title) {
      const match = title.match(/^(.+?)\s*(?:at|@|-|–|—|\|)\s*(.+?)(?:\s*[-|]|$)/);
      if (match) {
        data.position = match[1].trim();
        if (!data.companyName) data.companyName = match[2].trim();
      } else {
        data.position = title;
      }
    }
  }

  return data;
}

/**
 * Find job board pattern for URL
 */
function findJobBoardPattern(url: string): JobBoardPattern | undefined {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return JOB_BOARD_PATTERNS.find((pattern) => hostname.includes(pattern.domain));
  } catch {
    return undefined;
  }
}

/**
 * Get source name from URL
 */
export function getSourceFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const pattern = JOB_BOARD_PATTERNS.find((p) => hostname.includes(p.domain));
    if (pattern) return pattern.name;

    // Extract domain name
    const parts = hostname.replace("www.", "").split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "Web";
  }
}

/**
 * Fetch and parse job posting from URL
 * Uses the fetch-job-url Supabase edge function to retrieve HTML server-side
 */
export async function fetchJobFromUrl(url: string): Promise<ExtractedJobData> {
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  const result: ExtractedJobData = {
    jobUrl: url,
    source: getSourceFromUrl(url),
  };

  try {
    const supabase = createClient();
    const { data, error: fnError } = await supabase.functions.invoke("fetch-job-url", {
      body: { url },
    });
    if (fnError || !data?.html) {
      throw fnError ?? new Error("fetch-job-url returned no HTML");
    }
    const html: string = data.html;

    // Find matching job board pattern
    const pattern = findJobBoardPattern(url);
    console.log("found pattern %O", pattern);

    // Extract from meta tags and JSON-LD first (most reliable)
    const metaData = extractFromMetaTags(html);
    console.log("found jsonLd and opoengraph data %O", metaData);
    Object.assign(result, metaData);

    // If we have a pattern, try to extract more specific data
    if (pattern) {
      if (pattern.selectors.title && !result.position) {
        result.position = extractText(html, pattern.selectors.title);
      }
      if (pattern.selectors.company && !result.companyName) {
        result.companyName = extractText(html, pattern.selectors.company);
      }
      if (pattern.selectors.location && !result.locations?.length) {
        const locationText = extractText(html, pattern.selectors.location);
        if (locationText) {
          result.locations = [locationText];
        }
      }
      if (pattern.selectors.salary) {
        const salaryText = extractText(html, pattern.selectors.salary);
        if (salaryText && !result.salaryMin) {
          const salary = parseSalary(salaryText);
          result.salaryMin = salary.min;
          result.salaryMax = salary.max;
          result.salaryCurrency = salary.currency;
        }
      }
      if (pattern.selectors.description && !result.jobDescription) {
        result.jobDescription = extractText(html, pattern.selectors.description);
      }
    }
    console.log("result after trying to extract from pattern %O", result);

    // Try generic selectors if we're still missing data
    const genericSelectors: Record<
      keyof Pick<ExtractedJobData, "position" | "companyName" | "jobDescription">,
      string[]
    > = {
      position: ["h1", ".job-title", '[class*="job-title"]', '[class*="position"]'],
      companyName: [".company-name", '[class*="company"]', '[class*="employer"]'],
      jobDescription: [".job-description", '[class*="description"]', ".content", "article"],
    };

    for (const [field, selectors] of Object.entries(genericSelectors) as [
      keyof typeof genericSelectors,
      string[],
    ][]) {
      if (!result[field]) {
        const value = extractText(html, selectors);
        if (value) {
          result[field] = value;
        }
      }
    }

    // Generic location selector (array field — handle separately)
    if (!result.locations?.length) {
      const locationText = extractText(html, [
        ".location",
        '[class*="location"]',
        '[class*="address"]',
      ]);
      if (locationText) {
        result.locations = [locationText];
      }
    }
    console.log("result after trying to extract using generic selectors %O", result);

    // Detect work type and employment type from all available text
    const fullText = [result.position, ...(result.locations ?? []), result.jobDescription, html]
      .filter(Boolean)
      .join(" ");

    if (!result.workType) {
      result.workType = detectWorkType(fullText);
    }
    if (!result.employmentType) {
      result.employmentType = detectEmploymentType(fullText);
    }

    // Try to extract salary from full HTML if not found yet
    if (!result.salaryMin) {
      // Look for common salary patterns in the HTML
      const salaryPatterns = [
        /(?:salary|compensation|pay)(?:\s*range)?[:\s]*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:-|to|–|—)\s*\$?\s*([\d,]+(?:\.\d+)?)/gi,
        /\$\s*([\d,]+(?:\.\d+)?)\s*(?:-|to|–|—)\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:\/yr|\/year|annually|per year)?/gi,
        /USD\s*\$?\s*([\d,]+(?:\.\d+)?)\s*(?:-|to|–|—)\s*USD?\s*\$?\s*([\d,]+(?:\.\d+)?)/gi,
      ];

      for (const pattern of salaryPatterns) {
        const match = pattern.exec(html);
        if (match) {
          const salaryText = match[0];
          const salary = parseSalary(salaryText);
          if (salary.min && salary.max) {
            result.salaryMin = salary.min;
            result.salaryMax = salary.max;
            result.salaryCurrency = salary.currency || "USD";
            break;
          }
        }
      }
    }
    console.log("result after trying to detect specific fields from fulltext %O", result);

    // Try to extract location from common patterns if still UNAVAILABLE or missing
    if (!result.locations?.length || result.locations?.[0]?.toUpperCase() === "UNAVAILABLE") {
      // Look for explicit location patterns in structured data
      const locationPatterns = [
        /Locations?:([\w\s,]+?)(?:Category|Job Type|Remote|Employment|$)/i,
        /in this role you can work from[:\s]*(?:Remote,?\s*)?([\w\s,]+?)(?:\.|Overview|About|$)/i,
        /(?:Remote,\s*)([\w\s]+?)(?:\s*Category|Job|$)/i,
        /work\s*location[:\s]*([\w\s,]+?)(?:\.|$)/i,
      ];

      for (const pattern of locationPatterns) {
        const match = pattern.exec(html);
        if (match?.[1]) {
          let location = match[1].trim();
          // Clean up common suffixes
          location = location
            .replace(/\s*(Category|Job Type|Remote|Employment Type).*$/i, "")
            .trim();
          if (
            location &&
            location.length > 2 &&
            location.length < 100 &&
            !/^(Category|Job|Remote|Employment)$/i.test(location)
          ) {
            result.locations = [location];
            break;
          }
        }
      }
    }

    // Post-process: Split combined position/company if they're the same or contain separators
    if (result.position) {
      // Check if position and company are the same (both got set to the combined value)
      if (result.companyName && result.position === result.companyName) {
        result.companyName = undefined; // Clear it so we can extract properly
      }

      // Split combined patterns like "Software Engineer in United States | GitHub, Inc."
      const combinedPatterns = [
        /^(.+?)\s*\|\s*(.+?)$/, // "Job Title | Company"
        /^(.+?)\s+at\s+(.+?)$/i, // "Job Title at Company"
      ];

      for (const pattern of combinedPatterns) {
        const match = result.position.match(pattern);
        if (match) {
          let [, possibleTitle, possibleCompany] = match;
          possibleTitle = possibleTitle.trim();
          possibleCompany = possibleCompany.trim();

          if (possibleTitle.length > 2 && possibleCompany.length > 1) {
            result.position = possibleTitle;
            if (!result.companyName) {
              result.companyName = possibleCompany;
            }
            break;
          }
        }
      }

      // Clean location from title like "Software Engineer in United States"
      const locationInTitle = result.position.match(/^(.+?)\s+in\s+([\w\s]+)$/i);
      if (locationInTitle) {
        const [, cleanTitle, locationPart] = locationInTitle;
        const locationIndicators = [
          "united states",
          "usa",
          "uk",
          "canada",
          "remote",
          "california",
          "new york",
          "texas",
          "florida",
          "germany",
          "india",
          "australia",
        ];
        if (locationIndicators.some((loc) => locationPart.toLowerCase().includes(loc))) {
          result.position = cleanTitle.trim();
          if (!result.locations?.length || result.locations?.[0]?.toUpperCase() === "UNAVAILABLE") {
            result.locations = [locationPart.trim()];
          }
        }
      }
    }

    // Clean up job description (remove excessive whitespace, limit length)
    if (result.jobDescription) {
      result.jobDescription = result.jobDescription.trim();
    }
    console.log("final result after postprocessing %O", result);

    return result;
  } catch (error) {
    console.error("Failed to fetch job from URL:", error);
    // Return basic data with just the URL
    return result;
  }
}

/**
 * Validate if a URL looks like a job posting
 */
export function isLikelyJobUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const hostname = urlObj.hostname.toLowerCase();

    // Check if it's a known job board
    if (JOB_BOARD_PATTERNS.some((p) => hostname.includes(p.domain))) {
      return true;
    }

    // Check for common job-related URL patterns
    const jobPatterns = [
      /\/jobs?\//,
      /\/careers?\//,
      /\/positions?\//,
      /\/openings?\//,
      /\/opportunities?\//,
      /\/hiring\//,
      /\/apply/,
      /\/vacancy/,
      /\/recruitment/,
      /\/gh_jid/,
    ];

    return jobPatterns.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}
