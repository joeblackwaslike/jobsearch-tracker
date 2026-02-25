import httpx


API_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2VibGFja3dhc2xpa2VAZ21haWwuY29tIiwicGVybWlzc2lvbnMiOiJ1c2VyIiwiY3JlYXRlZF9hdCI6IjIwMjUtMTEtMjdUMDI6MTY6MjcuMDYzNDEwKzAwOjAwIn0.TPiRFsVwnL8TQi1DM1oDvDkTtArRY4d9c4xuus-D8tU"
API_URL = "https://api.theirstack.com/v1/jobs/search"

payload = {
    # --- Pagination & Output ---
    "page": 0,
    "limit": 25,
    "order_by": [{"desc": True, "field": "date_posted"}],
    "include_total_results": True,
    "blur_company_data": True,
    # --- Recency ---
    "posted_at_max_age_days": 15,  # Date posted max age in days. If 0, only return jobs posted today. If 1, from today and yesterday, etc.
    # "discovered_at_max_age_days": 7,  # If 0, only return jobs added to our database in the current day. If 1, from today and yesterday, etc.
    # --- Job Title Targeting ---
    # Broad OR match to cast a wide net across common title variants
    "job_title_or": [
        "backend engineer",
        "senior backend engineer",
        "software engineer",
        "senior software engineer",
        "python engineer",
        "senior python engineer",
        # "staff software engineer",
        # "staff backend engineer",
    ],
    # Exclude titles that are clearly not a fit
    "job_title_pattern_not": [
        ".*frontend.*",
        ".*front-end.*",
        ".*front end.*",
        ".*analytics.*",
        ".*full-stack.*",
        ".*full stack.*",
        ".*android.*",
        ".*ios.*",
        ".*mobile.*",
        ".*machine learning.*",
        ".*data engineer.*",
        ".*data scientist.*",
        ".*devops.*",
        ".*site reliability.*",
        ".*QA.*",
        ".*quality assurance.*",
        ".*Test.*",
        ".*principal.*",
        ".*staff.*",
        ".*java.*",
        ".*embedded.*",
        ".*systems.*",
        ".*security.*",
        ".*compiler.*",
        ".*manager.*",
        ".*rust.*",
        ".*c\+\+.*",
    ],
    # --- Seniority ---
    "job_seniority_or": ["senior", "staff", "mid_level"],
    # --- Location & Remote ---
    "job_country_code_or": ["US"],
    # "remote": None,  # include both remote and on-site; filter manually or set True for remote-only
    "job_location_pattern_or": [
        ".*New York.*",
        ".*Remote.*",
        ".*San Francisco.*",
    ],
    # --- Technology: Python must appear in the job ---
    "job_technology_slug_and": ["python"],  # AND = required
    "job_technology_slug_or": [  # OR = nice to have signals (boosts relevance via filtering)
        "fastapi",
        "django",
        "postgresql",
        "redis",
        "docker",
        "kubernetes",
        "aws",
    ],
    "job_technology_slug_not": [
        "php",
        ".net",
    ],
    # --- Description: must mention backend-relevant terms ---
    "job_description_contains_or": [
        "REST",
        "microservices",
        "distributed systems",
        "backend",
        "back-end",
        "API development",
        "Postgres",
        "FastAPI",
        "Django",
        "distributed",
    ],
    # Filter out pure data/ML roles that sometimes match on Python
    "job_description_pattern_not": [
        ".*spark.*",
        ".*hadoop.*",
        ".*tableau.*",
    ],
    # --- Salary ---
    "min_salary_usd": 160000,
    # --- Employment Type ---
    "employment_statuses_or": ["full_time", "part_time", "contract"],
    # --- Company Filters ---
    # "company_type": "direct_employer",  # skip recruiting agencies
    "min_employee_count": 20,  # skip micro-startups
    # "max_employee_count": 10000,        # skip mega-corps if desired; set None to include all
    # --- Ensure quality results ---
    # "property_exists_or": ["final_url", "company_object.domain"],
    # "url_domain_or": "",  # Include jobs only if their URL domain is in the provided case-insensitive list.
}


def search_jobs() -> dict:
    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            API_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_TOKEN}",
            },
            json=payload,
        )
        response.raise_for_status()
        return response.json()


def display_results(data: dict) -> None:
    jobs = data.get("data", [])
    total = data.get("total", "unknown")

    print(f"\n{'=' * 60}")
    print(f"Found {total} total results, showing {len(jobs)}")
    print(f"{'=' * 60}\n")

    for job in jobs:
        company = job.get("company_object", {})
        print(f"  {job.get('job_title', 'N/A')}")
        print(f"  {company.get('name', 'N/A')} — {company.get('domain', '')}")
        print(f"  📍 {job.get('job_location', 'N/A')}")
        if job.get("min_annual_salary_usd"):
            print(
                f"  💰 ${job['min_annual_salary_usd']:,} – ${job.get('max_annual_salary_usd', '?'):,}"
            )
        print(f"  📅 Posted: {job.get('date_posted', 'N/A')}")
        print(f"  🔗 {job.get('final_url') or job.get('url', 'N/A')}")
        print()


if __name__ == "__main__":
    data = search_jobs()
    display_results(data)
