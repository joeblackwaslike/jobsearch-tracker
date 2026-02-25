# JobSearch CLI Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Company Details and Hiring Team sections to each job box, replace the bare `main()` with a Typer CLI, and add `--local` / `--dry-run` flags.

**Architecture:** All changes are in `scripts/jobsearch-ts-nyc.py`. Three new pure helper functions (`render_section_rule`, `render_company_section`, `render_hiring_team_section`) each accept a `rich.text.Text` body and append to it — matching the existing append pattern. A companion test file imports the script via `importlib` and tests each helper in isolation. A Typer app replaces the bare `main()`.

**Tech Stack:** Python 3.12+, `uv run --script` (inline deps), Rich, Typer, pytest (for tests run with `uv run pytest`)

**Design Doc:** `docs/plans/2026-02-18-jobsearch-cli-enhancements-design.md`

---

## Context and File Map

**Script to modify:** `scripts/jobsearch-ts-nyc.py`
- Lines 1–5: `uv run --script` shebang + inline deps declaration
- Lines 21–80: `API_KEY`, `API_URL`, `PAYLOAD` constants
- Lines 83–100: `fmt_salary()`, `fmt_date()` helpers
- Lines 103–167: `render_job()` — builds header + body Text, wraps in Panel
- Lines 170–229: `main()` + `if __name__ == "__main__"` guard

**Test file to create:** `scripts/tests/test_jobsearch_cli.py`

**Sample data available:** `jobs.json` in repo root — use with `--local` for manual testing

**Key data shapes from `jobs.json`:**

```python
# company_object (may be null)
{
  "industry": "Software Development",
  "employee_count": 1743,
  "founded_year": 2000,
  "linkedin_url": "https://linkedin.com/company/acme",
  "yc_batch": None,               # or e.g. "W21"
  "is_recruiting_agency": False,  # or True
  "last_funding_round_amount_readable": "$12.5M",
  "last_funding_round_date": "2021-12-23",
}

# hiring_team (list, may be empty)
[
  {
    "full_name": "Jane Smith",
    "role": "Director of Engineering",
    "linkedin_url": "https://linkedin.com/in/janesmith",
    # also: first_name, image_url, thumbnail_url — not used
  }
]
```

**Importing the script in tests:**

```python
import importlib.util, sys, pathlib

def load_script():
    path = pathlib.Path(__file__).parent.parent / "jobsearch-ts-nyc.py"
    spec = importlib.util.spec_from_file_location("jobsearch", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
```

> **Note:** The script calls `main()` at module load if `__name__ == "__main__"` — this guard means import is safe.

---

## Task 1: Set up test infrastructure

**Files:**
- Create: `scripts/tests/__init__.py`
- Create: `scripts/tests/test_jobsearch_cli.py`

**Step 1: Create the tests directory and empty `__init__.py`**

```bash
mkdir -p scripts/tests
touch scripts/tests/__init__.py
```

**Step 2: Write a smoke test that confirms the script can be imported**

Write `scripts/tests/test_jobsearch_cli.py`:

```python
"""Tests for scripts/jobsearch-ts-nyc.py helper functions."""
import importlib.util
import pathlib
import sys

import pytest
from rich.text import Text


def load_script():
    """Import the script module without executing main()."""
    path = pathlib.Path(__file__).parent.parent / "jobsearch-ts-nyc.py"
    spec = importlib.util.spec_from_file_location("jobsearch", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def script():
    return load_script()


def test_script_imports_without_error(script):
    assert hasattr(script, "render_job")
```

**Step 3: Run the test to confirm it fails (render_job exists but import may fail)**

```bash
cd /path/to/repo
uv run pytest scripts/tests/test_jobsearch_cli.py -v
```

Expected: PASS (the import works and `render_job` exists already)

**Step 4: Commit**

```bash
git add scripts/tests/__init__.py scripts/tests/test_jobsearch_cli.py
git commit -m "test: add test infrastructure for jobsearch CLI script"
```

---

## Task 2: Add `fmt_date` and `fmt_salary` tests (establish baseline)

**Files:**
- Modify: `scripts/tests/test_jobsearch_cli.py`

**Step 1: Add tests for existing helpers**

Append to `test_jobsearch_cli.py`:

```python
def test_fmt_date_valid(script):
    assert script.fmt_date("2021-12-23") == "Dec 23, 2021"

def test_fmt_date_iso_with_z(script):
    assert script.fmt_date("2026-02-18T10:58:32.985000Z") == "Feb 18, 2026"

def test_fmt_date_none(script):
    assert script.fmt_date(None) == "—"

def test_fmt_salary_both(script):
    assert script.fmt_salary(160000, 200000) == "$160,000 – $200,000"

def test_fmt_salary_min_only(script):
    assert script.fmt_salary(160000, None) == "$160,000+"

def test_fmt_salary_none(script):
    assert script.fmt_salary(None, None) == "—"
```

**Step 2: Run tests**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py -v
```

Expected: All PASS

**Step 3: Commit**

```bash
git add scripts/tests/test_jobsearch_cli.py
git commit -m "test: add baseline tests for fmt_date and fmt_salary helpers"
```

---

## Task 3: Add Typer and CLI arguments

**Files:**
- Modify: `scripts/jobsearch-ts-nyc.py` (lines 1–5 deps, lines 170–229 main)

**Step 1: Write tests for CLI flag defaults**

Append to `test_jobsearch_cli.py`:

```python
from typer.testing import CliRunner

def test_cli_has_local_flag(script):
    """--help should mention --local."""
    runner = CliRunner()
    result = runner.invoke(script.app, ["--help"])
    assert "--local" in result.output

def test_cli_has_dry_run_flag(script):
    runner = CliRunner()
    result = runner.invoke(script.app, ["--help"])
    assert "--dry-run" in result.output

def test_cli_has_page_option(script):
    runner = CliRunner()
    result = runner.invoke(script.app, ["--help"])
    assert "--page" in result.output
```

**Step 2: Run tests to confirm they FAIL (app doesn't exist yet)**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py::test_cli_has_local_flag -v
```

Expected: FAIL — `AttributeError: module 'jobsearch' has no attribute 'app'`

**Step 3: Update the inline deps comment (line 4)**

Change:
```python
# dependencies = ["httpx", "rich"]
```
To:
```python
# dependencies = ["httpx", "rich", "typer"]
```

**Step 4: Add Typer app and replace `main()` — replace lines 170–229**

```python
import typer

app = typer.Typer(help="TheirStack Job Search CLI — NYC senior backend/Python roles.")


@app.command()
def search(
    page: int = typer.Option(0, help="Page number (0-indexed)."),
    limit: int = typer.Option(25, help="Results per page."),
    offset: int = typer.Option(0, help="Results offset."),
    order_by: str = typer.Option("date_posted", help="Sort field (date_posted | discovered_at)."),
    dry_run: bool = typer.Option(True, "--dry-run/--no-dry-run", help="Blur company data in API response."),
    local: bool = typer.Option(False, "--local/--no-local", help="Load from local jobs.json (skip API call)."),
) -> None:
    console = Console()

    if local:
        try:
            with open("jobs.json") as f:
                data = json.load(f)
        except FileNotFoundError:
            console.print("[bold red]Error:[/] jobs.json not found. Run without --local first.")
            raise typer.Exit(1)
    else:
        if not API_KEY:
            console.print("[bold red]Error:[/] Set the THEIRSTACK_API_KEY environment variable.")
            raise typer.Exit(1)

        payload = {**PAYLOAD, "page": page, "limit": limit, "blur_company_data": dry_run}
        payload["order_by"] = [{"desc": True, "field": order_by}]

        with console.status("[bold cyan]Searching TheirStack for jobs in NYC...[/]", spinner="dots"):
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
                console.print(f"[bold red]HTTP error {e.response.status_code}:[/] {e.response.text}")
                raise typer.Exit(1)
            except httpx.RequestError as e:
                console.print(f"[bold red]Request failed:[/] {e}")
                raise typer.Exit(1)

        data = resp.json()
        with open("jobs.json", "w") as fd:
            json.dump(data, fd, indent=2)

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
```

> **Note:** Remove the `import typer` line from inside the function — add it at the top with the other imports (around line 18). Also remove the old `main()` function entirely.

**Step 5: Run tests**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py -v
```

Expected: All PASS including the three new CLI tests

**Step 6: Manual smoke test**

```bash
uv run scripts/jobsearch-ts-nyc.py --help
```

Expected: Typer help output listing `--page`, `--limit`, `--offset`, `--order-by`, `--dry-run/--no-dry-run`, `--local/--no-local`

**Step 7: Commit**

```bash
git add scripts/jobsearch-ts-nyc.py scripts/tests/test_jobsearch_cli.py
git commit -m "feat: replace main() with Typer CLI (--page, --limit, --offset, --order-by, --dry-run, --local)"
```

---

## Task 4: Add `render_section_rule` helper

**Files:**
- Modify: `scripts/jobsearch-ts-nyc.py` (add function after `fmt_date`)
- Modify: `scripts/tests/test_jobsearch_cli.py`

**Step 1: Write failing tests**

Append to `test_jobsearch_cli.py`:

```python
def test_render_section_rule_appends_dim_content(script):
    body = Text()
    script.render_section_rule(body)
    plain = body.plain
    # Should contain repeated rule characters
    assert "─" in plain

def test_render_section_rule_has_newlines(script):
    body = Text()
    script.render_section_rule(body)
    assert body.plain.startswith("\n")
    assert body.plain.endswith("\n")
```

**Step 2: Run to confirm FAIL**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py::test_render_section_rule_appends_dim_content -v
```

Expected: FAIL — `AttributeError: module has no attribute 'render_section_rule'`

**Step 3: Add the function to the script (insert after `fmt_date`, before `render_job`)**

```python
def render_section_rule(body: Text) -> None:
    body.append("\n")
    body.append("─ " * 30, style="dim")
    body.append("\n")
```

**Step 4: Run tests**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py -v
```

Expected: All PASS

**Step 5: Commit**

```bash
git add scripts/jobsearch-ts-nyc.py scripts/tests/test_jobsearch_cli.py
git commit -m "feat: add render_section_rule helper for dim section dividers"
```

---

## Task 5: Add `render_company_section` helper

**Files:**
- Modify: `scripts/jobsearch-ts-nyc.py`
- Modify: `scripts/tests/test_jobsearch_cli.py`

**Step 1: Write failing tests**

Append to `test_jobsearch_cli.py`:

```python
SAMPLE_COMPANY = {
    "industry": "Software Development",
    "employee_count": 1743,
    "founded_year": 2000,
    "linkedin_url": "https://linkedin.com/company/acme",
    "yc_batch": None,
    "is_recruiting_agency": False,
    "last_funding_round_amount_readable": "$12.5M",
    "last_funding_round_date": "2021-12-23",
}

def test_company_section_industry(script):
    body = Text()
    script.render_company_section(body, SAMPLE_COMPANY)
    assert "Software Development" in body.plain

def test_company_section_employee_count_formatted(script):
    body = Text()
    script.render_company_section(body, SAMPLE_COMPANY)
    assert "1,743" in body.plain

def test_company_section_founded_year(script):
    body = Text()
    script.render_company_section(body, SAMPLE_COMPANY)
    assert "2000" in body.plain

def test_company_section_funding(script):
    body = Text()
    script.render_company_section(body, SAMPLE_COMPANY)
    assert "$12.5M" in body.plain
    assert "Dec 23, 2021" in body.plain

def test_company_section_omits_false_recruiting_agency(script):
    body = Text()
    script.render_company_section(body, SAMPLE_COMPANY)
    assert "Recruiting Agency" not in body.plain

def test_company_section_shows_recruiting_agency_when_true(script):
    body = Text()
    script.render_company_section(body, {**SAMPLE_COMPANY, "is_recruiting_agency": True})
    assert "Recruiting Agency" in body.plain

def test_company_section_omits_null_yc_batch(script):
    body = Text()
    script.render_company_section(body, SAMPLE_COMPANY)
    assert "YC" not in body.plain

def test_company_section_shows_yc_batch_when_set(script):
    body = Text()
    script.render_company_section(body, {**SAMPLE_COMPANY, "yc_batch": "W21"})
    assert "YC W21" in body.plain

def test_company_section_omits_missing_fields_gracefully(script):
    body = Text()
    script.render_company_section(body, {})
    # Should not raise; output may be nearly empty
    assert body.plain is not None

def test_company_section_omits_zero_employee_count(script):
    body = Text()
    script.render_company_section(body, {**SAMPLE_COMPANY, "employee_count": 0})
    assert "employees" not in body.plain
```

**Step 2: Run to confirm FAIL**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py::test_company_section_industry -v
```

Expected: FAIL — `AttributeError: module has no attribute 'render_company_section'`

**Step 3: Add the function to the script (insert after `render_section_rule`)**

```python
def render_company_section(body: Text, company: dict) -> None:
    industry = company.get("industry") or ""
    employee_count = company.get("employee_count") or 0
    founded_year = company.get("founded_year") or 0
    linkedin_url = company.get("linkedin_url") or ""
    yc_batch = company.get("yc_batch") or ""
    is_recruiting_agency = company.get("is_recruiting_agency") or False
    funding_amount = company.get("last_funding_round_amount_readable") or ""
    funding_date_raw = company.get("last_funding_round_date") or ""

    # Line 1: industry · employee count · founded year
    line1_parts = []
    if industry:
        line1_parts.append(("🏢 ", ""), (industry, "white"))
    if employee_count:
        line1_parts.append(("   👥 ", "dim"))
        line1_parts.append((f"{employee_count:,} employees", "white"))
    if founded_year:
        line1_parts.append(("   📅 ", "dim"))
        line1_parts.append((f"Founded {founded_year}", "white"))
    if line1_parts:
        body.append("\n")
        for text, style in line1_parts:
            body.append(text, style=style)

    # Line 2: last funding round
    funding_date = fmt_date(funding_date_raw) if funding_date_raw else ""
    if funding_amount or funding_date:
        body.append("\n💰 ", style="")
        body.append("Last round: ", style="dim")
        if funding_amount:
            body.append(funding_amount, style="bold green")
        if funding_date:
            body.append(f"  ({funding_date})", style="dim")

    # Line 3: LinkedIn URL
    if linkedin_url:
        body.append("\n🔗 ")
        body.append(linkedin_url, style="underline blue")

    # Line 4: badges (recruiting agency, YC batch)
    badges: list[tuple[str, str]] = []
    if is_recruiting_agency:
        badges.append(("⚠ Recruiting Agency", "bold yellow"))
    if yc_batch:
        badges.append((f"[YC {yc_batch}]", "bold cyan"))
    if badges:
        body.append("\n")
        for i, (label, style) in enumerate(badges):
            if i > 0:
                body.append("   ", style="")
            body.append(label, style=style)
```

**Step 4: Run tests**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py -v
```

Expected: All PASS

**Step 5: Commit**

```bash
git add scripts/jobsearch-ts-nyc.py scripts/tests/test_jobsearch_cli.py
git commit -m "feat: add render_company_section helper"
```

---

## Task 6: Add `render_hiring_team_section` helper

**Files:**
- Modify: `scripts/jobsearch-ts-nyc.py`
- Modify: `scripts/tests/test_jobsearch_cli.py`

**Step 1: Write failing tests**

Append to `test_jobsearch_cli.py`:

```python
SAMPLE_TEAM = [
    {
        "full_name": "Jane Smith",
        "role": "Director of Engineering",
        "linkedin_url": "https://linkedin.com/in/janesmith",
    },
    {
        "full_name": "Bob Jones",
        "role": "Senior Recruiter",
        "linkedin_url": "",
    },
]

def test_hiring_team_shows_full_name(script):
    body = Text()
    script.render_hiring_team_section(body, SAMPLE_TEAM)
    assert "Jane Smith" in body.plain

def test_hiring_team_shows_role(script):
    body = Text()
    script.render_hiring_team_section(body, SAMPLE_TEAM)
    assert "Director of Engineering" in body.plain

def test_hiring_team_shows_linkedin_when_present(script):
    body = Text()
    script.render_hiring_team_section(body, SAMPLE_TEAM)
    assert "linkedin.com/in/janesmith" in body.plain

def test_hiring_team_omits_linkedin_when_empty(script):
    body = Text()
    script.render_hiring_team_section(body, SAMPLE_TEAM)
    # Bob Jones has no linkedin; separator should not appear after his role
    lines = body.plain.split("\n")
    bob_line = next((l for l in lines if "Bob Jones" in l), "")
    # Should end after the role, no trailing ·
    assert not bob_line.strip().endswith("·")

def test_hiring_team_renders_multiple_members(script):
    body = Text()
    script.render_hiring_team_section(body, SAMPLE_TEAM)
    assert "Jane Smith" in body.plain
    assert "Bob Jones" in body.plain

def test_hiring_team_empty_list_renders_nothing(script):
    body = Text()
    script.render_hiring_team_section(body, [])
    assert body.plain == ""
```

**Step 2: Run to confirm FAIL**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py::test_hiring_team_shows_full_name -v
```

Expected: FAIL — `AttributeError: module has no attribute 'render_hiring_team_section'`

**Step 3: Add the function to the script (insert after `render_company_section`)**

```python
def render_hiring_team_section(body: Text, team: list[dict]) -> None:
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
```

**Step 4: Run tests**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py -v
```

Expected: All PASS

**Step 5: Commit**

```bash
git add scripts/jobsearch-ts-nyc.py scripts/tests/test_jobsearch_cli.py
git commit -m "feat: add render_hiring_team_section helper"
```

---

## Task 7: Wire sections into `render_job` and clean up

**Files:**
- Modify: `scripts/jobsearch-ts-nyc.py` — `render_job()` function (lines ~103–167)

**Step 1: Write a test that checks the full render_job output includes company data**

Append to `test_jobsearch_cli.py`:

```python
def test_render_job_includes_company_section(script):
    from rich.console import Console
    from io import StringIO
    console = Console(file=StringIO(), force_terminal=True)
    job = {
        "job_title": "Senior Engineer",
        "company": "Acme",
        "location": "New York, NY",
        "company_object": {
            "industry": "Software Development",
            "employee_count": 500,
            "founded_year": 2010,
        },
        "hiring_team": [],
    }
    script.render_job(console, job, 1)
    output = console.file.getvalue()
    assert "Software Development" in output

def test_render_job_includes_hiring_team_when_present(script):
    from rich.console import Console
    from io import StringIO
    console = Console(file=StringIO(), force_terminal=True)
    job = {
        "job_title": "Senior Engineer",
        "company": "Acme",
        "location": "New York, NY",
        "company_object": None,
        "hiring_team": [{"full_name": "Jane Smith", "role": "Recruiter", "linkedin_url": ""}],
    }
    script.render_job(console, job, 1)
    output = console.file.getvalue()
    assert "Jane Smith" in output

def test_render_job_skips_hiring_team_when_empty(script):
    from rich.console import Console
    from io import StringIO
    console = Console(file=StringIO(), force_terminal=True)
    job = {
        "job_title": "Senior Engineer",
        "company": "Acme",
        "location": "New York, NY",
        "company_object": None,
        "hiring_team": [],
    }
    script.render_job(console, job, 1)
    output = console.file.getvalue()
    assert "👤" not in output
```

**Step 2: Run to confirm first test FAILS**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py::test_render_job_includes_company_section -v
```

Expected: FAIL — `render_job` doesn't call `render_company_section` yet

**Step 3: Rewrite `render_job` to wire in the new sections**

Replace the entire `render_job` function:

```python
def render_job(console: Console, job: dict, index: int) -> None:
    title = job.get("job_title", "Unknown Role")
    company = job.get("company", "Unknown Company")
    location = job.get("location") or "Unknown Location"
    url = job.get("final_url") or job.get("source_url") or job.get("url", "")
    date_posted = fmt_date(job.get("date_posted"))
    salary = fmt_salary(
        job.get("min_annual_salary_usd"), job.get("max_annual_salary_usd")
    )
    employment = "".join(job.get("employment_statuses", [])).rstrip(",")
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
```

> **Important change:** The old code had `if tech_str != "—":` — but `tech_str` is never `"—"`, it's either an empty string or a comma-joined list. Changed to `if tech_str:`.

**Step 4: Run all tests**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py -v
```

Expected: All PASS

**Step 5: Full manual visual test**

```bash
uv run scripts/jobsearch-ts-nyc.py --local
```

Expected: 25 job boxes, most with a Company Details section below a dim rule. Jobs #3 and #8 (from jobs.json) should show a Hiring Team section.

**Step 6: Commit**

```bash
git add scripts/jobsearch-ts-nyc.py scripts/tests/test_jobsearch_cli.py
git commit -m "feat: wire company details and hiring team sections into render_job"
```

---

## Task 8: Final cleanup and full test run

**Files:**
- Modify: `scripts/jobsearch-ts-nyc.py` — remove dead code comments

**Step 1: Remove the commented-out debug blocks in the old render_job location**

The old script had:
```python
# if company_object:
#     body.append("\n")
#     body.append(json.dumps(company_object, indent=2))
# if hiring_team:
#     ...
# body.append("\n")
```

These were already removed in Task 7's rewrite — confirm they are gone.

**Step 2: Run the full test suite**

```bash
uv run pytest scripts/tests/test_jobsearch_cli.py -v --tb=short
```

Expected: All tests PASS, no warnings

**Step 3: Check `--help` output is clean**

```bash
uv run scripts/jobsearch-ts-nyc.py --help
```

Expected output (approximately):
```
Usage: jobsearch-ts-nyc.py [OPTIONS]

  TheirStack Job Search CLI — NYC senior backend/Python roles.

Options:
  --page INTEGER             Page number (0-indexed).  [default: 0]
  --limit INTEGER            Results per page.  [default: 25]
  --offset INTEGER           Results offset.  [default: 0]
  --order-by TEXT            Sort field (date_posted | discovered_at).  [default: date_posted]
  --dry-run / --no-dry-run   Blur company data in API response.  [default: dry-run]
  --local / --no-local       Load from local jobs.json (skip API call).  [default: no-local]
  --help                     Show this message and exit.
```

**Step 4: Commit**

```bash
git add scripts/jobsearch-ts-nyc.py
git commit -m "chore: final cleanup of jobsearch CLI script"
```

---

## Summary

| Task | Commit |
|------|--------|
| 1. Test infrastructure | `test: add test infrastructure for jobsearch CLI script` |
| 2. Baseline helper tests | `test: add baseline tests for fmt_date and fmt_salary helpers` |
| 3. Typer CLI | `feat: replace main() with Typer CLI` |
| 4. render_section_rule | `feat: add render_section_rule helper` |
| 5. render_company_section | `feat: add render_company_section helper` |
| 6. render_hiring_team_section | `feat: add render_hiring_team_section helper` |
| 7. Wire into render_job | `feat: wire company details and hiring team sections into render_job` |
| 8. Cleanup | `chore: final cleanup of jobsearch CLI script` |
