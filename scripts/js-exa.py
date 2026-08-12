#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["python-dotenv", "exa-py", "rich"]
# ///

import os
from datetime import datetime, timezone, timedelta

from rich.columns import Columns
from rich.console import Console
from rich.markdown import Markdown
from dotenv import load_dotenv
from exa_py import Exa


load_dotenv()
exa = Exa(os.getenv("EXA_API_KEY"))
console = Console()


def main():
    after_date = (datetime.now(timezone.utc) - timedelta(days=60)).date().isoformat()
    results = exa.search(
        "job Software engineer backend python",
        type="auto",
        user_location="US",
        num_results=100,
        include_domains=[
            "jobs.ashbyhq.com",
            "jobs.lever.co",
            "job-boards.greenhouse.io",
            "boards.greenhouse.io",
            "myworkdayjobs.com",
            "workable.com",
            "hire.withgoogle.com",
            "hire.jobvite.com",
            "jobs.smartrecruiters.com",
            "bamboohr.com",
        ],
        start_published_date=after_date,
        include_text=["engineer python"],
        contents=dict(
            text=True,
            livecrawl="preferred",
            summary=dict(
                query=(
                    "Please include the foloowing line of metadata at the top followed by an empty line: `company | job title | location | salary or hourlyrange | application url | work type (remote, hybrid (ex 2 d/wk in office), onsite) | employment type (full-time, part-time, contract) | company website url`.\n"
                    "Then title the next section job requirements and list the job requirements in bulletpoints (include specifics such as YOE, experience level, educatiional requirements), specific language, framework, or technology requirements, etc):\n"
                    "Then title the next section nice to haves and list the nice to haves in bulletpoints (include specifics such as YOE, experience level, educatiional requirements), specific language, framework, or technology requirements, etc):\n"
                    "Then title the next section about <company name> and include a quick summary of the company.  If you can find year founded, headcount, funding status, core product, culture, etc then include them..\n"
                )
            ),
            extras=dict(links=6),
        ),
    )
    parsed = [
        dict(
            title=result.title,
            url=result.url,
            published_date=result.published_date,
            summary=result.summary,
            text=result.text,
        )
        for result in results.results
    ]

    for res in parsed:
        with console.pager():
            console.print(
                Columns(
                    [
                        res[key]
                        for key in sorted(res.keys())
                        if key not in ("summary", "published_date")
                    ],
                    expand=True,
                )
            )
            console.print(Markdown(res["summary"]))
            console.line()


if __name__ == "__main__":
    main()
