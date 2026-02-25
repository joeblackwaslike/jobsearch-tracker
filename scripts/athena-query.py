#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["boto3"]
# ///
import time
import csv

import boto3

client = boto3.client("athena", region_name="us-east-1")

GH_PATH = "greenhouse_slugs.csv"
GH_QUERY = """
    SELECT
        SPLIT_PART(url_path, '/', 2) AS slugs
    FROM "ccindex"."ccindex"
    WHERE crawl in (
        'CC-MAIN-2026-04',
        'CC-MAIN-2025-51',
        'CC-MAIN-2025-47',
        'CC-MAIN-2025-43',
        'CC-MAIN-2025-38',
        'CC-MAIN-2025-33',
        'CC-MAIN-2025-30',
        'CC-MAIN-2025-26',
        'CC-MAIN-2025-18',
        'CC-MAIN-2025-08'
    )    AND subset = 'warc'
            AND url_host_name = 'job-boards.greenhouse.io'
    GROUP BY SPLIT_PART(url_path, '/', 2)
"""

ASH_PATH = "ashby_slugs.csv"
ASH_QUERY = """
    SELECT
        SPLIT_PART(url_path, '/', 2) AS slugs
    FROM "ccindex"."ccindex"
    WHERE crawl in (
        'CC-MAIN-2026-04',
        'CC-MAIN-2025-51',
        'CC-MAIN-2025-47',
        'CC-MAIN-2025-43',
        'CC-MAIN-2025-38',
        'CC-MAIN-2025-33',
        'CC-MAIN-2025-30',
        'CC-MAIN-2025-26',
        'CC-MAIN-2025-18',
        'CC-MAIN-2025-08'
    )    AND subset = 'warc'
            AND url_host_name = 'jobs.ashbyhq.com'
    GROUP BY SPLIT_PART(url_path, '/', 2)
"""

QUERY = ASH_QUERY
PATH = ASH_PATH

response = client.start_query_execution(
    QueryString=ASH_QUERY,
    QueryExecutionContext={"Database": "ccindex"},
    ResultConfiguration={"OutputLocation": "s3://joeblackwaslike/"},
)

execution_id = response["QueryExecutionId"]

# Poll until complete
while True:
    result = client.get_query_execution(QueryExecutionId=execution_id)
    state = result["QueryExecution"]["Status"]["State"]
    if state in ("SUCCEEDED", "FAILED", "CANCELLED"):
        break
    time.sleep(2)

if state != "SUCCEEDED":
    reason = result["QueryExecution"]["Status"]["StateChangeReason"]
    raise RuntimeError(f"Query {state}: {reason}")

# Print cost
stats = result["QueryExecution"]["Statistics"]
bytes_scanned = stats["DataScannedInBytes"]
print(f"Bytes scanned: {bytes_scanned:,}")
print(f"GB scanned:    {bytes_scanned / 1e9:.2f} GB")
print(f"Cost:          ${(bytes_scanned / 1e12) * 5:.4f}")

# Paginate through results and write to CSV
paginator = client.get_paginator("get_query_results")
pages = paginator.paginate(QueryExecutionId=execution_id)

with open(PATH, "w", newline="") as f:
    writer = None
    for page in pages:
        rows = page["ResultSet"]["Rows"]
        if writer is None:
            # First row is the header
            headers = [col["VarCharValue"] for col in rows[0]["Data"]]
            writer = csv.writer(f)
            writer.writerow(headers)
            rows = rows[1:]  # skip header row
        for row in rows:
            writer.writerow([col.get("VarCharValue", "") for col in row["Data"]])

print(f"Saved to {PATH}")
