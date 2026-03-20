"""Tests for scripts/jobsearch-ts-nyc.py helper functions."""
import importlib.util
import pathlib
from io import StringIO

import pytest
from rich.console import Console
from rich.text import Text


def load_script():
    """Import the script module without executing main()."""
    path = pathlib.Path(__file__).parent.parent / "js-nyc.py"
    spec = importlib.util.spec_from_file_location("jobsearch", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def script():
    return load_script()


def test_script_imports_without_error(script):
    assert hasattr(script, "render_job")


# ---------------------------------------------------------------------------
# fmt_date / fmt_salary baseline tests
# ---------------------------------------------------------------------------

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


def test_fmt_salary_max_only(script):
    assert script.fmt_salary(None, 200000) == "up to $200,000"


def test_fmt_salary_none(script):
    assert script.fmt_salary(None, None) == "—"


# ---------------------------------------------------------------------------
# Typer CLI tests
# ---------------------------------------------------------------------------

from typer.testing import CliRunner


def test_cli_has_local_flag(script):
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


# ---------------------------------------------------------------------------
# render_section_rule tests
# ---------------------------------------------------------------------------

def test_render_section_rule_appends_dim_content(script):
    body = Text()
    script.render_section_rule(body)
    assert "─" in body.plain


def test_render_section_rule_has_newlines(script):
    body = Text()
    script.render_section_rule(body)
    assert body.plain.startswith("\n")
    assert body.plain.endswith("\n")


# ---------------------------------------------------------------------------
# render_company_section tests
# ---------------------------------------------------------------------------

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
    assert body.plain is not None


def test_company_section_omits_zero_employee_count(script):
    body = Text()
    script.render_company_section(body, {**SAMPLE_COMPANY, "employee_count": 0})
    assert "employees" not in body.plain


# ---------------------------------------------------------------------------
# render_hiring_team_section tests
# ---------------------------------------------------------------------------

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
    lines = body.plain.split("\n")
    bob_line = next((l for l in lines if "Bob Jones" in l), "")
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


# ---------------------------------------------------------------------------
# render_job integration tests
# ---------------------------------------------------------------------------

def test_render_job_includes_company_section(script):
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
