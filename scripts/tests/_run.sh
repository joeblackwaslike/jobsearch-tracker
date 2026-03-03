#!/bin/bash
git log --oneline -3 > /Users/joeblack/github/joeblackwaslike/jobsearch-tracker/scripts/tests/_git_log.txt 2>&1
uv run pytest /Users/joeblack/github/joeblackwaslike/jobsearch-tracker/scripts/tests/test_jobsearch_cli.py -v > /Users/joeblack/github/joeblackwaslike/jobsearch-tracker/scripts/tests/_test_output.txt 2>&1
