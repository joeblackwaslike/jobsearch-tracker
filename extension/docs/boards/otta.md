# Otta aka welcometothejungle.com

## domains:

* https://app.welcometothejungle.com

## Example URL

* https://app.welcometothejungle.com/jobs/kapfRdOI

## Detection

1. User loads job result: https://app.welcometothejungle.com/jobs/kapfRdOI
2. clicks link to: https://jobs.ashbyhq.com/herondata/b7b46673-d526-4cae-8495-f9e5858ef458?utm_source=Otta
3. Parse utm_source query param before it disappears
4. user submits to greenhouse.io

## Notes

Otta requires users to register, fill out extensive profiles, upload resumes, and setup filtering criteria.  When you revisit you can request to be shown jobs that best fit your profile and filters.  You get 10-12 results per round, you can apply to them and then track them through the dashboard.  When you click apply on a job, it will launch a modal giving you options, sometimes you can apply with your profile, but you can always apply directly through the provided ats web url.

### Example Flow

1. Get results, goto first result
2. Taken to: https://app.welcometothejungle.com/jobs/kapfRdOI
3. Click apply button
4. Choose "Apply on Heron Data's website"
5. Taken to https://jobs.ashbyhq.com/herondata/b7b46673-d526-4cae-8495-f9e5858ef458?utm_source=Otta
6. Page loads as https://jobs.ashbyhq.com/herondata/b7b46673-d526-4cae-8495-f9e5858ef458
7. Form submits as greenhouse to greenhouse
