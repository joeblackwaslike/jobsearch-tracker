#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["python-dotenv", "httpx", "rich", "playwright"]
# ///
"""
Zero-tier contact search test script.

Tests free contact-finding strategies against a real company without spending
paid API credits. Mirrors what the production contact_research task will do
when no paid provider is configured.

Usage:
    # All strategies (default)
    python scripts/test-contact-search.py --company "Stripe" --domain "stripe.com"

    # Skip a strategy
    python scripts/test-contact-search.py --company "Stripe" --domain "stripe.com" --no-github

    # Test LinkedIn enrichment (costs 1 Prospeo credit)
    python scripts/test-contact-search.py --company "Stripe" --domain "stripe.com" \\
        --linkedin "https://www.linkedin.com/in/someone-at-stripe/"

    # Just one strategy
    python scripts/test-contact-search.py --company "Stripe" --domain "stripe.com" \\
        --no-teampage --no-patterns --no-linkedin-enrich

Input (from a job application record):
    --company   company.name
    --domain    derived from company.links.website (strip https://, drop path)
    --position  application.position (optional, improves GitHub bio filtering)
    --linkedin  a LinkedIn profile URL you found manually (optional)

API keys (loaded from supabase/.env, then environment):
    GITHUB_PERSONAL_ACCESS_TOKEN  GitHub personal access token (optional but recommended)
    HUNTER_API_KEY                Hunter.io free key — reveals domain email pattern (no credits consumed)
    ZEROBOUNCE_API_KEY            Free tier: 100 verifications/month — validates generated emails
    PROSPEO_API_KEY               Prospeo free key — LinkedIn enrichment (1 credit per lookup)

One-time setup (downloads ~130MB Chromium):
    python -m playwright install chromium
"""

import argparse
import json
import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright
from rich.console import Console
from rich.table import Table

# Load from supabase/.env first, then fall through to environment
load_dotenv(dotenv_path=Path(__file__).parent.parent / "supabase" / ".env", override=False)

console = Console()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

GITHUB_TOKEN = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY")
ZEROBOUNCE_API_KEY = os.getenv("ZEROBOUNCE_API_KEY")
PROSPEO_API_KEY = os.getenv("PROSPEO_API_KEY")

# Titles that suggest a relevant engineering contact
ENGINEERING_TITLES = [
    "engineer", "engineering", "cto", "vp of eng", "vp eng",
    "director of eng", "head of eng", "tech lead", "technical lead",
    "software", "developer", "backend", "frontend", "fullstack",
    "platform", "infrastructure", "sre", "devops", "architect",
    "manager", "principal",
]

# Email format patterns to try when no Hunter pattern is available
FALLBACK_PATTERNS = [
    "{first}",
    "{first}.{last}",
    "{first}{last}",
    "{f}{last}",
    "{first}_{last}",
]

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
LINKEDIN_RE = re.compile(r"https?://(?:www\.)?linkedin\.com/in/[\w\-]+")

CONFIDENCE_ICON = {
    "high": "[green]●[/green]",
    "medium": "[yellow]●[/yellow]",
    "low": "[orange3]●[/orange3]",
    "unverified": "[dim]●[/dim]",
}

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


@dataclass
class Contact:
    name: str
    email: Optional[str] = None
    title: Optional[str] = None
    linkedin_url: Optional[str] = None
    source: str = ""
    confidence: str = "unverified"  # high | medium | low | unverified
    notes: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def header(title: str) -> None:
    console.rule(f"[bold]{title}[/bold]")


def print_contact(c: Contact) -> None:
    icon = CONFIDENCE_ICON.get(c.confidence, "●")
    console.print(f"  {icon} [bold]{c.name}[/bold]", end="")
    if c.title:
        console.print(f"  [dim]{c.title[:70]}[/dim]", end="")
    console.print()
    if c.email:
        console.print(f"      email:      {c.email}")
    if c.linkedin_url:
        console.print(f"      linkedin:   {c.linkedin_url}")
    console.print(f"      source:     {c.source}")
    console.print(f"      confidence: {c.confidence}")
    if c.notes:
        console.print(f"      notes:      [dim]{c.notes}[/dim]")


def is_engineering_title(text: Optional[str]) -> bool:
    if not text:
        return False
    lower = text.lower()
    return any(t in lower for t in ENGINEERING_TITLES)


def github_headers() -> dict:
    h = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        h["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return h


# ---------------------------------------------------------------------------
# Strategy 1: GitHub org search
# ---------------------------------------------------------------------------


def run_github_search(
    company_name: str, domain: str, position: Optional[str] = None
) -> list[Contact]:
    header("Strategy 1: GitHub Org Search")

    if not GITHUB_TOKEN:
        console.print(
            "  [yellow]⚠[/yellow]  No GITHUB_PERSONAL_ACCESS_TOKEN — unauthenticated (60 req/hr limit). "
            "Set GITHUB_PERSONAL_ACCESS_TOKEN in your environment for 5000/hr."
        )

    # Derive org name guess from domain: stripe.com → stripe
    org_guess = domain.split(".")[0]
    contacts: list[Contact] = []
    org_login: Optional[str] = None

    with httpx.Client(timeout=10) as client:
        # Try direct org lookup first
        console.print(f"  Direct lookup: [cyan]github.com/{org_guess}[/cyan]")
        r = client.get(
            f"https://api.github.com/orgs/{org_guess}", headers=github_headers()
        )
        if r.status_code == 200:
            org_login = r.json()["login"]
            console.print(f"  [green]✓[/green] Found org: {org_login}")
        else:
            # Fall back to org search by company name
            console.print(
                f"  [dim]→ {r.status_code}[/dim] — searching for [cyan]{company_name}[/cyan]"
            )
            r2 = client.get(
                "https://api.github.com/search/users",
                params={"q": f"{company_name} type:org", "per_page": 5},
                headers=github_headers(),
            )
            if r2.status_code == 200:
                items = r2.json().get("items", [])
                if items:
                    org_login = items[0]["login"]
                    console.print(f"  [green]✓[/green] Found via search: {org_login}")
                else:
                    console.print("  [red]✗[/red] No matching org found in search")
            else:
                console.print(f"  [red]✗[/red] Search failed: {r2.status_code}")

    if not org_login:
        return []

    # Fetch public members
    with httpx.Client(timeout=15) as client:
        r = client.get(
            f"https://api.github.com/orgs/{org_login}/members",
            params={"per_page": 100},
            headers=github_headers(),
        )
        if r.status_code != 200:
            console.print(f"  [red]✗[/red] Could not fetch members: {r.status_code}")
            return []
        members = r.json()

    console.print(f"  {len(members)} public members — fetching profiles (first 30)")

    with httpx.Client(timeout=10) as client:
        for member in members[:30]:
            r = client.get(
                f"https://api.github.com/users/{member['login']}",
                headers=github_headers(),
            )
            if r.status_code != 200:
                continue
            p = r.json()
            has_email = bool(p.get("email"))
            bio = p.get("bio") or ""
            name = p.get("name") or member["login"]

            # Skip if we can't tell they're engineering-relevant and have no email
            if not has_email and not is_engineering_title(bio):
                continue

            contacts.append(
                Contact(
                    name=name,
                    email=p.get("email") or None,
                    title=bio[:80] or None,
                    source="GitHub org member",
                    confidence="high" if has_email else "medium",
                    notes=(
                        "Email publicly listed on GitHub profile"
                        if has_email
                        else "No public email — engineering title in bio"
                    ),
                )
            )

    console.print(f"\n  Found [bold]{len(contacts)}[/bold] relevant contacts")
    for c in contacts:
        print_contact(c)
    return contacts


# ---------------------------------------------------------------------------
# Strategy 2: Company team/about page scrape
# ---------------------------------------------------------------------------


def _fetch_simple(url: str) -> Optional[str]:
    """Plain HTTP GET — works for static pages, fails for JS-rendered ones."""
    try:
        r = httpx.get(
            url,
            follow_redirects=True,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0 (compatible; bot)"},
        )
        return r.text if r.status_code == 200 else None
    except Exception:
        return None


def _fetch_playwright(url: str) -> Optional[str]:
    """Fetch JS-rendered page HTML via local headless Chromium."""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(url, wait_until="networkidle", timeout=15000)
            html = page.content()
            browser.close()
            return html
    except Exception:
        return None


def run_team_page_scrape(domain: str) -> list[Contact]:
    header("Strategy 2: Team/About Page Scrape")

    candidates = [
        f"https://{domain}/about",
        f"https://{domain}/team",
        f"https://{domain}/about-us",
        f"https://{domain}/people",
        f"https://{domain}/company/team",
        f"https://{domain}/company/about",
    ]

    company_fragment = domain.split(".")[0].lower()
    contacts: list[Contact] = []

    for url in candidates:
        console.print(f"  [dim]{url}[/dim]", end=" ")

        # Try cheap plain fetch first; fall back to Playwright if content is thin
        html = _fetch_simple(url)
        method = "plain"
        if not html or len(html) < 3000:
            rendered = _fetch_playwright(url)
            if rendered and len(rendered) > (len(html) if html else 0):
                html, method = rendered, "playwright"

        if not html:
            console.print("→ [red]no response[/red]")
            continue

        console.print(f"→ [green]{len(html):,} bytes[/green] ({method})")

        # Extract emails that belong to this domain
        emails = [
            e for e in EMAIL_RE.findall(html)
            if company_fragment in e.lower()
            and not any(skip in e for skip in ["example", "noreply", "sentry", "test@"])
        ]
        # Extract LinkedIn profile URLs (deduplicated)
        linkedin_urls = list(dict.fromkeys(LINKEDIN_RE.findall(html)))

        if emails or linkedin_urls:
            console.print(
                f"    → {len(emails)} emails, {len(linkedin_urls)} LinkedIn URLs"
            )
            for email in emails:
                local = email.split("@")[0]
                pretty_name = re.sub(r"[._\-]", " ", local).title()
                contacts.append(
                    Contact(
                        name=pretty_name,
                        email=email,
                        source=f"Team page ({url})",
                        confidence="high",
                    )
                )
            for li_url in linkedin_urls:
                if not any(c.linkedin_url == li_url for c in contacts):
                    slug = li_url.rstrip("/").split("/in/")[-1]
                    pretty_name = re.sub(r"[\-_]", " ", slug).title()
                    contacts.append(
                        Contact(
                            name=pretty_name,
                            linkedin_url=li_url,
                            source=f"Team page ({url})",
                            confidence="medium",
                            notes="LinkedIn URL only — enrich to get email (1 Prospeo credit)",
                        )
                    )
            break  # found something on this page; stop trying others

    if not contacts:
        console.print("  [red]✗[/red] No contacts found on any team/about page")
    else:
        console.print(f"\n  Found [bold]{len(contacts)}[/bold] contacts")
        for c in contacts:
            print_contact(c)
    return contacts


# ---------------------------------------------------------------------------
# Strategy 3: Email pattern generation + verification
# ---------------------------------------------------------------------------


def _apply_pattern(pattern: str, first: str, last: str) -> str:
    f = first[0] if first else ""
    return pattern.replace("{first}", first).replace("{last}", last).replace("{f}", f)


def _verify_email(email: str) -> str:
    """SMTP-verify an email via ZeroBounce. Returns: valid | catch-all | invalid | unknown."""
    if not ZEROBOUNCE_API_KEY:
        return "unknown"
    try:
        r = httpx.get(
            "https://api.zerobounce.net/v2/validate",
            params={"api_key": ZEROBOUNCE_API_KEY, "email": email},
            timeout=10,
        )
        return r.json().get("status", "unknown") if r.status_code == 200 else "unknown"
    except Exception:
        return "unknown"


def run_pattern_generation(contacts: list[Contact], domain: str) -> list[Contact]:
    header("Strategy 3: Email Pattern Generation")

    # Hunter's domain search reveals the email format used (e.g. "{first}.{last}")
    # without consuming search credits — even free accounts can call this endpoint.
    detected_pattern: Optional[str] = None
    if HUNTER_API_KEY:
        console.print(
            f"  Fetching email pattern from Hunter for [cyan]{domain}[/cyan]..."
        )
        try:
            r = httpx.get(
                "https://api.hunter.io/v2/domain-search",
                params={"domain": domain, "limit": 5, "api_key": HUNTER_API_KEY},
                timeout=10,
            )
            if r.status_code == 200:
                data = r.json().get("data", {})
                detected_pattern = data.get("pattern")
                n_examples = len(data.get("emails", []))
                status = f"[bold]{detected_pattern}[/bold]" if detected_pattern else "[dim]not detected[/dim]"
                console.print(f"  Pattern: {status} ({n_examples} example emails found)")
        except Exception as e:
            console.print(f"  [yellow]Hunter lookup failed:[/yellow] {e}")
    else:
        console.print(
            "  [yellow]⚠[/yellow]  No HUNTER_API_KEY — trying all common patterns"
        )

    if not ZEROBOUNCE_API_KEY:
        console.print(
            "  [yellow]⚠[/yellow]  No ZEROBOUNCE_API_KEY — "
            "emails generated but not SMTP-verified"
        )

    patterns = [detected_pattern] if detected_pattern else FALLBACK_PATTERNS
    targets = [c for c in contacts if c.name and not c.email]

    console.print(f"  {len(targets)} contacts without an email to generate for")
    if not targets:
        console.print("  Nothing to do")
        return []

    generated: list[Contact] = []

    for contact in targets:
        parts = contact.name.strip().lower().split()
        if len(parts) < 2:
            console.print(f"  [dim]  {contact.name} — skipping (single name token)[/dim]")
            continue

        first, last = parts[0], parts[-1]
        console.print(f"\n  [bold]{contact.name}[/bold]:")

        for pattern in patterns:
            local = _apply_pattern(pattern, first, last)
            email = f"{local}@{domain}"
            status = _verify_email(email)

            if status == "valid":
                confidence, notes = "medium", "Pattern generated — SMTP verified"
                icon = CONFIDENCE_ICON["medium"]
            elif status == "catch-all":
                confidence, notes = "low", "Pattern generated — catch-all domain (unverifiable)"
                icon = CONFIDENCE_ICON["low"]
            elif status == "unknown":
                # No verifier configured — report as unverified but still useful
                confidence, notes = "unverified", "Pattern generated — not verified (no ZeroBounce key)"
                icon = CONFIDENCE_ICON["unverified"]
            else:
                # "invalid" — skip this pattern, try next
                console.print(f"    [dim]{email} → {status} (skipping)[/dim]")
                continue

            console.print(f"    {icon} {email} [{confidence}]")
            generated.append(
                Contact(
                    name=contact.name,
                    email=email,
                    title=contact.title,
                    source=f"Pattern ({pattern})",
                    confidence=confidence,
                    notes=notes,
                )
            )
            break  # first viable candidate wins; skip remaining patterns

    if generated:
        console.print(f"\n  Generated [bold]{len(generated)}[/bold] email candidates")
    return generated


# ---------------------------------------------------------------------------
# Strategy 4: LinkedIn URL enrichment (costs 1 Prospeo credit)
# ---------------------------------------------------------------------------


def run_linkedin_enrichment(linkedin_url: str) -> Optional[Contact]:
    header("Strategy 4: LinkedIn URL Enrichment  [dim](costs 1 Prospeo credit)[/dim]")
    console.print(f"  URL: [cyan]{linkedin_url}[/cyan]")

    if not PROSPEO_API_KEY:
        console.print("  [red]✗[/red] No PROSPEO_API_KEY in supabase/.env — cannot enrich")
        return None

    try:
        r = httpx.post(
            "https://api.prospeo.io/linkedin-email-finder",
            headers={"Content-Type": "application/json", "X-KEY": PROSPEO_API_KEY},
            json={"url": linkedin_url},
            timeout=20,
        )
        data = r.json()
        console.print(f"\n  Raw response:\n{json.dumps(data, indent=4)}")

        resp = data.get("response", {})
        email_obj = resp.get("email", {})
        email = email_obj.get("value")

        if not email:
            console.print("\n  [red]✗[/red] No email returned")
            return None

        verification = email_obj.get("verification", {}).get("status", "")
        confidence = "high" if verification == "VALID" else "medium"

        first = resp.get("first_name", "")
        last = resp.get("last_name", "")
        contact = Contact(
            name=f"{first} {last}".strip() or "Unknown",
            email=email,
            title=resp.get("current_job_title"),
            linkedin_url=linkedin_url,
            source="Prospeo (LinkedIn enrichment)",
            confidence=confidence,
            notes=f"Verification status: {verification}" if verification else None,
        )
        console.print()
        print_contact(contact)
        return contact

    except Exception as e:
        console.print(f"  [red]✗[/red] Error: {e}")
        return None


# ---------------------------------------------------------------------------
# Summary table
# ---------------------------------------------------------------------------


def print_summary(contacts: list[Contact]) -> None:
    header("Summary")

    if not contacts:
        console.print("  [red]No contacts found across any strategy.[/red]")
        console.print(
            "  This company may not have a public GitHub org or team page.\n"
            "  Try LinkedIn manual enrichment (--linkedin <url>) or a paid provider."
        )
        return

    table = Table(show_header=True, header_style="bold", expand=True)
    table.add_column("Name", min_width=20)
    table.add_column("Email", min_width=28)
    table.add_column("Title", min_width=25)
    table.add_column("Conf.", min_width=12)
    table.add_column("Source")

    for c in sorted(contacts, key=lambda x: ["high", "medium", "low", "unverified"].index(x.confidence)):
        icon = CONFIDENCE_ICON.get(c.confidence, "●")
        table.add_row(
            c.name,
            c.email or "[dim]—[/dim]",
            (c.title or "")[:35] or "[dim]—[/dim]",
            f"{icon} {c.confidence}",
            c.source,
        )

    console.print(table)
    console.print()

    with_email = [c for c in contacts if c.email]
    console.print(f"  Total found:  [bold]{len(contacts)}[/bold]")
    console.print(f"  With email:   [bold]{len(with_email)}[/bold]")
    console.print(f"  High:         {sum(1 for c in contacts if c.confidence == 'high')}")
    console.print(f"  Medium:       {sum(1 for c in contacts if c.confidence == 'medium')}")
    console.print(f"  Low/unverif:  {sum(1 for c in contacts if c.confidence in ('low', 'unverified'))}")
    console.print()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Zero-tier contact search — tests free strategies without paying for an API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
examples:
  %(prog)s --company "Stripe" --domain "stripe.com"
  %(prog)s --company "Stripe" --domain "stripe.com" --no-github
  %(prog)s --company "Stripe" --domain "stripe.com" --linkedin "https://linkedin.com/in/..."
  %(prog)s --company "Linear" --domain "linear.app" --position "Staff Engineer"
        """,
    )

    # Required inputs (maps directly to job application data)
    parser.add_argument("--company", required=True, metavar="NAME",
                        help="company.name from the application record")
    parser.add_argument("--domain", required=True, metavar="DOMAIN",
                        help="company domain, derived from company.links.website (e.g. stripe.com)")
    parser.add_argument("--position", metavar="TITLE",
                        help="application.position — used to improve GitHub bio filtering (optional)")

    # LinkedIn URL for enrichment strategy
    parser.add_argument("--linkedin", metavar="URL",
                        help="LinkedIn profile URL to enrich (optional, costs 1 Prospeo credit)")

    # Strategy toggles — all on by default, use --no-* to disable
    parser.add_argument("--no-github", dest="github", action="store_false", default=True,
                        help="skip GitHub org search")
    parser.add_argument("--no-teampage", dest="teampage", action="store_false", default=True,
                        help="skip team/about page scrape")
    parser.add_argument("--no-patterns", dest="patterns", action="store_false", default=True,
                        help="skip email pattern generation")
    parser.add_argument("--no-linkedin-enrich", dest="linkedin_enrich", action="store_false", default=True,
                        help="skip LinkedIn URL enrichment")

    args = parser.parse_args()

    console.print()
    console.print(f"[bold]Contact Search[/bold]: {args.company} ([cyan]{args.domain}[/cyan])")
    if args.position:
        console.print(f"Position filter:  {args.position}")
    console.print(
        f"Strategies: "
        f"github=[{'green' if args.github else 'red'}]{args.github}[/]  "
        f"teampage=[{'green' if args.teampage else 'red'}]{args.teampage}[/]  "
        f"patterns=[{'green' if args.patterns else 'red'}]{args.patterns}[/]  "
        f"linkedin-enrich=[{'green' if args.linkedin_enrich else 'red'}]{args.linkedin_enrich}[/]"
    )

    console.print()
    console.print("[dim]API keys loaded:[/dim]")
    for name, val in [
        ("GITHUB_PERSONAL_ACCESS_TOKEN", GITHUB_TOKEN),
        ("HUNTER_API_KEY", HUNTER_API_KEY),
        ("ZEROBOUNCE_API_KEY", ZEROBOUNCE_API_KEY),
        ("PROSPEO_API_KEY", PROSPEO_API_KEY),
    ]:
        status = "[green]✓[/green]" if val else "[dim]✗ not set[/dim]"
        console.print(f"  {status}  {name}")

    all_contacts: list[Contact] = []

    if args.github:
        results = run_github_search(args.company, args.domain, args.position)
        all_contacts.extend(results)

    if args.teampage:
        results = run_team_page_scrape(args.domain)
        all_contacts.extend(results)

    if args.patterns:
        generated = run_pattern_generation(all_contacts, args.domain)
        # Merge: if we generated an email for an existing contact, update in place
        for nc in generated:
            existing = next((c for c in all_contacts if c.name == nc.name and not c.email), None)
            if existing:
                existing.email = nc.email
                existing.confidence = nc.confidence
                existing.source = nc.source
                existing.notes = nc.notes
            else:
                all_contacts.append(nc)

    if args.linkedin_enrich:
        if args.linkedin:
            contact = run_linkedin_enrichment(args.linkedin)
            if contact:
                all_contacts.append(contact)
        else:
            console.print()
            console.rule("[dim]Strategy 4: LinkedIn URL Enrichment[/dim]")
            console.print(
                "  Pass [bold]--linkedin <url>[/bold] to test enrichment. "
                "Costs 1 Prospeo credit."
            )

    print_summary(all_contacts)


if __name__ == "__main__":
    main()
