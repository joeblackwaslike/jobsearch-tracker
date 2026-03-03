# Design: JobSearch CLI Enhancements

**Date:** 2026-02-18
**File:** `scripts/jobsearch-ts-nyc.py`
**Status:** Approved

## Overview

Enhance the TheirStack job search CLI to:
1. Add company details and hiring team sections to each job box
2. Replace ad-hoc argument handling with Typer
3. Add a `--local` flag for testing without API calls

## CLI Interface

Replace the bare `main()` with a Typer app:

```python
@app.command()
def search(
    page: int = typer.Option(0, help="Page number"),
    limit: int = typer.Option(25, help="Results per page"),
    offset: int = typer.Option(0, help="Results offset"),
    order_by: str = typer.Option("date_posted", help="Sort field"),
    dry_run: bool = typer.Option(True, "--dry-run/--no-dry-run", help="Blur company data in API response"),
    local: bool = typer.Option(False, "--local/--no-local", help="Load from local jobs.json instead of calling API"),
)
```

- `--local` short-circuits the HTTP call and reads `jobs.json` from the current directory
- `--dry-run / --no-dry-run` maps to `blur_company_data` in the request payload (default `True` preserves existing behavior)
- `--order-by` accepts a field name string; the payload builds `[{"desc": True, "field": order_by}]`
- Script dependencies updated: `httpx`, `rich`, `typer`

## Rendering Architecture

**Approach:** Single `Panel(box=box.ROUNDED)` per job, containing up to 3 sections assembled with `Text.assemble()`. Sections are separated by a dim horizontal rule.

### Section 1 — Job (existing, no structural changes)

```
#1  Software Engineer II  @  Acme Corp  Hybrid  ✓ Easy Apply
📍 New York, NY
💰 $160,000 – $200,000   ⏱ full_time   📅 Feb 18, 2026
🔧 python, golang, postgresql
🔗 https://...  acme.com
```

### Section 2 — Company Details

Always rendered when `company_object` is present and non-null.

Fields rendered (all optional — silently omitted if null/empty):
- `industry` — plain text with 🏢 icon
- `employee_count` — formatted with commas (`1,743 employees`) with 👥 icon
- `founded_year` — `Founded 2000` with 📅 icon
- `last_funding_round_amount_readable` + `last_funding_round_date` — shown together on one line when at least one is present: `💰 Last round: $12.5M  (Dec 23, 2021)`
- `linkedin_url` — shown with 🔗 icon as styled underline link
- `is_recruiting_agency=True` → amber `⚠ Recruiting Agency` badge; `False` → omitted
- `yc_batch` non-null → cyan `[YC W21]` badge inline; null → omitted

Example output:
```
─ ─ ─ ─ ─ ─ ─ ─  (dim rule)
🏢 Software Development   👥 1,743 employees   📅 Founded 2000
💰 Last round: $12.5M  (Dec 23, 2021)
🔗 linkedin.com/company/acme
⚠ Recruiting Agency   [YC W21]
```

### Section 3 — Hiring Team

Only rendered when `hiring_team` list is non-empty.

Each entry: one line per person. Fields omitted if empty:
```
👤 Jane Smith  ·  Director of Engineering  ·  linkedin.com/in/janesmith
```
- Name: `full_name` field
- Role: `role` field
- Link: `linkedin_url` field

## Implementation Details

### `render_section_rule(body: Text) -> None`
Appends a dim horizontal rule as `"\n" + "─ " * 30 + "\n"` with `style="dim"`.

### `render_company_section(body: Text, company: dict) -> None`
Builds company lines from the fields described above. Each field is conditionally appended. Uses same `body.append()` pattern as the job section.

### `render_hiring_team_section(body: Text, team: list[dict]) -> None`
Iterates over team entries, builds one line per person using `·` separator between non-empty fields.

### `render_job(console, job, index)`
Refactored to:
1. Build header (unchanged)
2. Build job body (unchanged content)
3. If `company_object` present: append rule + call `render_company_section`
4. If `hiring_team` non-empty: append rule + call `render_hiring_team_section`
5. Wrap in single `Panel`

## Field Formatting

| Field | Format |
|-------|--------|
| `employee_count` | `f"{n:,} employees"` |
| `founded_year` | `f"Founded {year}"` |
| `last_funding_round_date` | `fmt_date()` (existing helper) |
| `is_recruiting_agency=True` | `"⚠ Recruiting Agency"` in `"bold yellow"` |
| `yc_batch` non-null | `f"[YC {batch}]"` in `"bold cyan"` |
| `full_name` / `role` / `linkedin_url` | dim `·` separator, linkedin in `"underline blue"` |

## Missing Data Rules

- Any field that is `None`, `""`, `0`, or missing from the dict is silently omitted
- If `company_object` is missing entirely, Section 2 is skipped
- If `hiring_team` is `[]` or missing, Section 3 is skipped
- No "N/A" or placeholder text anywhere

## Dependencies

Update the inline script header:
```python
# dependencies = ["httpx", "rich", "typer"]
```
