#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx", "rich", "typer", "jsonl"]
# ///

"""TheirStack Job Search CLI — searches for senior backend/Python roles in NYC."""

from pathlib import Path
import json
import os
from datetime import datetime

import httpx
import jsonl
import typer
from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich import box


API_KEY = os.environ.get("THEIRSTACK_API_KEY")
API_URL = "https://api.theirstack.com/v1/jobs/search"

PAYLOAD = {
    # Pagination, sort, etc
    "page": 0,
    "limit": 25,
    "order_by": [
        {"desc": True, "field": "date_posted"},
        {"desc": True, "field": "discovered_at"},
    ],
    "include_total_results": True,
    "blur_company_data": True,
    # Query
    "remote": False,
    "posted_at_max_age_days": 15,
    "min_salary_usd": 160000,
    "job_location_or": [{"id": 5128638}, {"id": 5128581}],
    "job_title_or": [
        "backend engineer",
        "senior backend engineer",
        "software engineer",
        "senior software engineer",
        "python engineer",
        "senior python engineer",
    ],
    "job_title_pattern_not": [
        ".*frontend.*",
        ".*front-end.*",
        ".*front end.*",
        ".*analytics.*",
        ".*full-stack.*",
        ".*full stack.*",
        ".*QA.*",
        ".*quality assurance.*",
        ".*Test.*",
        ".*site reliability.*",
        ".*principal.*",
        ".*devops.*",
        ".*android.*",
        ".*ios.*",
        ".*mobile.*",
        ".*machine learning.*",
        ".*data engineer.*",
        ".*data scientist.*",
        ".*staff.*",
        ".*java.*",
        ".*embedded.*",
        ".*systems.*",
        ".*compiler.*",
        ".*manager.*",
        ".*rust.*",
        ".*c\\+\\+.*",
    ],
    "job_description_pattern_is_case_insensitive": True,
    "employment_statuses_or": ["full_time", "part_time", "contract"],
}


# ---------------------------------------------------------------------------
# Formatters
# ---------------------------------------------------------------------------


def fmt_salary(min_sal: int | None, max_sal: int | None) -> str:
    if min_sal is not None and max_sal is not None:
        return f"${min_sal:,} – ${max_sal:,}"
    elif min_sal is not None:
        return f"${min_sal:,}+"
    elif max_sal is not None:
        return f"up to ${max_sal:,}"
    return "—"


def fmt_date(date_str: str | None) -> str:
    if not date_str:
        return "—"
    try:
        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        return dt.strftime("%b %d, %Y")
    except Exception:
        return date_str


# ---------------------------------------------------------------------------
# Section renderers
# ---------------------------------------------------------------------------


def render_section_rule(body: Text) -> None:
    """Append a dim horizontal rule between sections."""
    body.append("\n")
    body.append("─ " * 30, style="dim")
    body.append("\n")


def render_company_section(body: Text, company: dict) -> None:
    """Append company details to the body Text. Silently omits missing/falsy fields."""
    industry = company.get("industry") or ""
    employee_count = company.get("employee_count") or 0
    founded_year = company.get("founded_year") or 0
    linkedin_url = company.get("linkedin_url") or ""
    yc_batch = company.get("yc_batch") or ""
    is_recruiting_agency = company.get("is_recruiting_agency") or False
    funding_amount = company.get("last_funding_round_amount_readable") or ""
    funding_date_raw = company.get("last_funding_round_date") or ""

    # Line 1: industry · employee count · founded year
    line1: list[tuple[str, str]] = []
    if industry:
        line1.append(("🏢 ", ""))
        line1.append((industry, "white"))
    if employee_count:
        line1.append(("   👥 ", "dim"))
        line1.append((f"{employee_count:,} employees", "white"))
    if founded_year:
        line1.append(("   📅 ", "dim"))
        line1.append((f"Founded {founded_year}", "white"))
    if line1:
        body.append("\n")
        for text, style in line1:
            body.append(text, style=style)

    # Line 2: last funding round
    funding_date = fmt_date(funding_date_raw) if funding_date_raw else ""
    if funding_amount or funding_date:
        body.append("\n💰 ")
        body.append("Last round: ", style="dim")
        if funding_amount:
            body.append(funding_amount, style="bold green")
        if funding_date:
            body.append(f"  ({funding_date})", style="dim")

    # Line 3: LinkedIn URL
    if linkedin_url:
        body.append("\n🔗 ")
        body.append(linkedin_url, style="underline blue")

    # Line 4: badges — only shown when truthy
    badges: list[tuple[str, str]] = []
    if is_recruiting_agency:
        badges.append(("⚠ Recruiting Agency", "bold yellow"))
    if yc_batch:
        badges.append((f"[YC {yc_batch}]", "bold cyan"))
    if badges:
        body.append("\n")
        for i, (label, style) in enumerate(badges):
            if i > 0:
                body.append("   ")
            body.append(label, style=style)


def render_hiring_team_section(body: Text, team: list[dict]) -> None:
    """Append one line per hiring team member. Silently omits empty members."""
    for member in team:
        full_name = (member.get("full_name") or "").strip()
        role = (member.get("role") or "").strip()
        linkedin_url = (member.get("linkedin_url") or "").strip()

        parts: list[tuple[str, str]] = []
        if full_name:
            parts.append((full_name, "white"))
        if role:
            parts.append((role, "dim"))
        if linkedin_url:
            parts.append((linkedin_url, "underline blue"))

        if not parts:
            continue

        body.append("\n👤 ")
        for i, (text, style) in enumerate(parts):
            if i > 0:
                body.append("  ·  ", style="dim")
            body.append(text, style=style)


# ---------------------------------------------------------------------------
# Job renderer
# ---------------------------------------------------------------------------


def render_job(console: Console, job: dict, index: int) -> None:
    title = job.get("job_title", "Unknown Role")
    company = job.get("company", "Unknown Company")
    location = job.get("location") or "Unknown Location"
    url = job.get("final_url") or job.get("source_url") or job.get("url", "")
    date_posted = fmt_date(job.get("date_posted"))
    salary = fmt_salary(
        job.get("min_annual_salary_usd"), job.get("max_annual_salary_usd")
    )
    employment = ", ".join(job.get("employment_statuses", []))
    techs = job.get("technology_slugs", [])
    tech_str = ", ".join(techs)
    remote = "Remote" if job.get("remote") else None
    hybrid = "Hybrid" if job.get("hybrid") else None
    work_type = remote or hybrid or ""
    company_domain = job.get("company_domain")
    easy_apply = "✓ Easy Apply" if job.get("easy_apply") else ""
    company_object = job.get("company_object")
    hiring_team = job.get("hiring_team") or []

    header = Text()
    header.append(f"#{index}  ", style="bold dim")
    header.append(title, style="bold cyan")
    header.append("  @  ", style="dim")
    header.append(company, style="bold yellow")
    if work_type:
        header.append(f"  {work_type}", style="bold yellow")
    if easy_apply:
        header.append(f"  {easy_apply}", style="bold green")

    body = Text()
    body.append("📍 ")
    body.append(f"{location}\n", style="white")
    body.append("💰 ")
    body.append(f"{salary}   ", style="bold green")
    body.append(f"⏱ {employment}   ", style="dim")
    body.append(f"📅 {date_posted}\n", style="dim")
    if tech_str:
        body.append("🔧 ")
        body.append(f"{tech_str}\n", style="dim cyan")
    if url:
        body.append("🔗 ")
        body.append(url, style="underline blue")
    if company_domain:
        body.append(f"  {company_domain}", style="dim")

    if company_object:
        render_section_rule(body)
        render_company_section(body, company_object)

    if hiring_team:
        render_section_rule(body)
        render_hiring_team_section(body, hiring_team)

    console.print(
        Panel(Text.assemble(header, "\n", body), expand=False, box=box.ROUNDED)
    )


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

app = typer.Typer(help="TheirStack Job Search CLI — NYC senior backend/Python roles.")


@app.command()
def search(
    page: int = typer.Option(0, help="Page number (0-indexed)."),
    limit: int = typer.Option(25, help="Results per page."),
    offset: int = typer.Option(0, help="Results offset."),
    order_by: str = typer.Option(
        "date_posted", help="Sort field (date_posted | discovered_at)."
    ),
    dry_run: bool = typer.Option(
        True, "--dry-run/--no-dry-run", help="Blur company data in API response."
    ),
    local: bool = typer.Option(
        False, "--local/--no-local", help="Load from local jobs.json (skip API call)."
    ),
    response_log: Path = typer.Option(
        Path(".response.log.jsonl"),
        "--response-log",
        help="Append API responses to file.",
    ),
) -> None:
    console = Console()

    if local:
        try:
            with open("jobs.json") as f:
                data = json.load(f)
        except FileNotFoundError:
            console.print(
                "[bold red]Error:[/] jobs.json not found. Run without --local first."
            )
            raise typer.Exit(1)
    else:
        if not API_KEY:
            console.print(
                "[bold red]Error:[/] Set the THEIRSTACK_API_KEY environment variable."
            )
            raise typer.Exit(1)

        payload = {
            **PAYLOAD,
            "page": page,
            "limit": limit,
            "offset": offset,
            "blur_company_data": dry_run,
            "order_by": [{"desc": True, "field": order_by}],
        }

        with console.status(
            "[bold cyan]Searching TheirStack for jobs in NYC...[/]", spinner="dots"
        ):
            try:
                resp = httpx.post(
                    API_URL,
                    json=payload,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {API_KEY}",
                    },
                    timeout=30,
                )
                resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                console.print(
                    f"[bold red]HTTP error {e.response.status_code}:[/] {e.response.text}"
                )
                raise typer.Exit(1)
            except httpx.RequestError as e:
                console.print(f"[bold red]Request failed:[/] {e}")
                raise typer.Exit(1)

        data = resp.json()

        with open(response_log, "at") as fd:
            jsonl.dump(data, fd, text_mode=True)

    jobs = data.get("data", [])

    if not jobs:
        console.print("[yellow]No jobs found matching your criteria.[/]")
        return

    console.print()
    console.rule(
        f"[bold cyan]TheirStack Results[/] — [dim]{len(jobs)} jobs · min $160k · NYC · ≤15 days old[/]"
    )
    console.print()

    for i, job in enumerate(jobs, start=1):
        render_job(console, job, i)
        console.print()

    console.rule("[dim]End of results[/]")
    console.print()


if __name__ == "__main__":
    app()
