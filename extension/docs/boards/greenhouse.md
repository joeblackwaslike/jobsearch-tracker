# Greenhouse.io board

## domains:

* job-boards.greenhouse.io
* boards.greenhouse.io

## Detection

1. job domain ends in greenhouse.io, example: https://job-boards.greenhouse.io or https://boards.greenhouse.io
2. application url contains query param named `gh_jid`

## URL Patterns

```text
https://job-boards.greenhouse.io/{companyName}/jobs/{jobId}
https://boards.greenhouse.io/{companyName}/jobs/{jobId}
```

## Form Submission

1. Load Job Application `GET https://job-boards.greenhouse.io/adyen/jobs/7573921`
2. Form submits to: `POST https://boards.greenhouse.io/adyen/jobs/7573921`

```json
{
    "job_application": {
        "first_name":"Joseph",
        "last_name":"Black",
        "email":"joeblackwaslike@gmail.com",
        "answers_attributes": {
            "63100392": {
                "question_id": "63100392", 
                "priority": 1, 
                "text_value": "it looked nice"
            },
            "63100393": {
                "question_id": "63100393",
                "priority": 2,
                "text_value": "yes"
            },
            "63100394": {
                "question_id": "63100394",
                "priority": 3,
                "text_value": "no"
            },
            "63100395": {
                "question_id": "63100395",
                "priority":4,
                "answer_selected_options_attributes": {
                    "0": {
                        "question_option_id": "622837397"
                    }
                }
            },
            "63100396": {
                "question_id": "63100396",
                "priority": 5
            },
            "63276854": {
                "question_id": "63276854",
                "priority":0,
                "text_value":"nope"
            }
        },
        "demographic_answers": [],
        "data_compliance": {},
        "attachments": {},
        "from_job_board_renderer": true,
        "employments":[
            {
                "start_date": {
                    "month": null,
                    "year": null
                },
                "end_date": {
                    "month": null,
                    "year": null
                },
                "current": false
            }
        ],
        "preferred_name": "Joe",
        "phone": "+16469247718",
        "resume_url": "https://grnhse-use1-prod-job-seekers.s3.amazonaws.com/resumes/1450610/09356059931b66b56c04e67b7f3870ee/file?response-content-disposition=attachment%3B%20filename%3D%22Joe_Black_v3.5.pdf%22%3B%20filename%2A%3DUTF-8%27%27Joe_Black_v3.5.pdf&response-content-type=application%2Foctet-stream&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAVQGOLGY33DYV5YI2%2F20260306%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260306T072931Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEBcaCXVzLWVhc3QtMSJGMEQCIEI3OdIkYWJIKt8jEl0d7Bu%2BVliczWbFiiRSWQbgZ9a1AiAzckGANwC3jPWiym3MJmVUe8IjioJD3CW2hI8ieSuPuCr3BAjg%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F8BEAUaDDM3ODM4OTg3MDEzNSIMJTKDXun6v89glg7bKssE2x%2B3H8AMWr%2B4YsiFuiV%2BYekXIEGWgwKUNdsK0mODnjGAa1QHL1KCamUr3b5F%2F1mMZB38IZuD%2Fp0m7ytxVfjzAu1OewGRgUhXMx1AIN48aPsMnd4Laf4RLKI1i3MNyHotlIZX4pgSZIcfuCO070%2FtFuiQJE2nrcItlcbCx5e2ER6INEv2Y6EvrB4%2BtxQVmUY1rhO5xMurJLaAUvF9Mn4nVeoucUuRgEOBhLWJVNvi5wlpjvtvLnuIlpNOiEnrFGsuYEt3ZhlDdyPzs6nsZhQ1MixJavoUDt9RgxuFUwac4Wv1%2BpgGW7KNLfjhDZJAS%2Bnvb6kGzww%2Fkgv9Y6qviio4cjHxnMePJLktUpIs97pIV9Ws%2BqblosH%2BnSmqFGmZNoPWUIc%2FiUrt01nf6CJXT4M9ObmA6%2B6SgfjyjFl3VkjoU%2BWWu%2B%2BaYVOSuEf7JNki0T1TpGZWQrvHHXH1fzsB49grrdsVNWnk2rA8iLKg2HiPJVzvk9MAJv2Au1Gz9oI41iRtv9cUcBPpe3uaRbBv%2B2bu24LPICJ8Lcoa9bDoCCFx3ttjDIklvwsp3Adscultiv%2BfPPlm%2BYP5gVWiSnagifcTbLQs9dZrhLkspsAYydW6yS%2FwocoPXpmaTLSk%2FVpF%2FBSVHAPoxxwuGwDsja4WI3KbeC2Nn%2BGKeOVNboKe37PS%2B8JgvqUkyYHuCbkHGfqPe4ZVLur08%2BiwkTH2DsaxpvESSCeAQ%2BCn0ToAaQO1JHiczgvhwzhPob2RheeGf0rYm0wA2jtaL8P9jkrWBmUwgu%2BpzQY6lQH4syWpqec6xBEqn%2BC1RSh46O0bx8Sls5q8t6D4udxXhp5wOwpD6niGttv38prEKnixwQD8I77tGY6m7iNlCdzrh%2Flphzn8sAywCaH%2BwH5qAagpbRBg4rKWA2IcQgmQw6KgxfDPLkGB5%2FekM4H%2BHVQuidj1scSWj1HSfVPp5wbUPFT%2B3bvohMjWGXuYC6e%2FDiKrjC123Q%3D%3D&X-Amz-SignedHeaders=host&X-Amz-Signature=57100dfdf132ebd956e1c85a0de49465fe49ecc7ab881cfd9bfb9824c8080efa",
        "resume_url_filename": "Joe_Black_v3.5.pdf",
        "educations": [
            {
                "school_name_id": null,
                "degree_id": null,
                "discipline_id": null,
                "start_date": {
                    "month": null,
                    "year": null
                },
                "end_date": {
                    "month": null,
                    "year": null
                }
            }
        ],
        "mapped_url_token": null,
        "appcast_click_id": null,
        "time_zone": "America/New_York"
    },
    "g-recaptcha-enterprise-token": "0cAFcWeA7L6LjF-Dflg-QgZ9E83D6I2U5pCkB4B3sB9aTVXwxd8FvtHsenW3tuN4oO6TMPlrJJBGUTnFbsE9xx1eqGKXHCwgkPA3UTQaA2E-gG-SFaxQYoWE9VboZ17pEL1kMRIK0Wb9E8YbJI3_lzOxioN_lRijBS9U9Ezjoh2HRVCiXbSmWrTRpgUYjACTFPodx4EJhAPeNubGQYE1vn25H3ftIfMcuI96-PSyBKecSmnv1aHjdMjZCI3fyb68rIqEZu5v3G8T7heGJ-Zhq0TwOP1pTTN0wW3afzHgK-2zIYYv_rSdp3sZcNi-iq4zKzIB0nzIx-Av7sCk_pvhC_xyyflbVFl8-yk9iHjhhN68pFxD5h14WGOq79Tt9FBMiIikWJiwHCpMeWssVbypTdFYhWrO6LXsU5Fy6mfK3Mv-igKhS2_KMzVDWF9ZaIVBdbIg7pqyQpk4M4jMAr0VQDLAhf2oUZHKfDeRptVrOEHdQowg4PgyAQhrbPnrZrmIygKGmJGuoiOX0dln0q-TdVP-F4kXm6xBXmVDfbFAONERDRiHWhgu95nJLu05hh4oCeKhK_BXQp9vvewkLKIdaDgP2YTHsRl5ae3SgW195lG40-T2eHjv8k0ou6DMCjuhKw3JELx9sQOTRmpOPGWaDRR4xlZxi1G6eeZ8Lzfm4hp9uOkKFjj8xEzmOMwRETarJD_qiaCi45icwaQ0QFcp74eyBrffQQK7UI0PNHrMLJQ_1eXqTaum6fBPSCvQ8j6-Ztr6M8S3fWAyebsx8eq9m6TOcB8BrV2ccwHfabPNmczEJsklrehj7UPutw2NYxTfXKk9W_2iSdOEZVgqZZodWIZ_9ob7i7-zcN0MjeRoN0cZkbfiDI4S3tPyDj6bp53LlL61NSBiPkmERs2t79l-F2CIWUyKh3tclwMtUhHib9TSzM-4yUQdnLDQDV0Gy_5FXMNMIs2Vg5L7kHKP9vHiTFSBoMNAlx3z0B8d2ij2UNEvtFrEreRPgMe9DF6GR7vb6OX3AYV7h1Ltx05RT4jqCHXfcICweyG2FKjB12YpEVecAeHj4YSVCNNx4W_ZGDW0TWS17xIQTf1iDY43R-hNh5Go-drn2NFEA1Jxd_f-7d41L2ujWaMuVZQeMcv5Oy7-Bblor76XFGJFCX0njty2eI2v50RTqarncoEcS9KFfBRBpdZ-m8TfMGSnVNDNruiIZ63rE0p6s8W1pBMgmkxr9ilKUAPxvfA1YXefKLEV-wcFu32na8dp2gGu_xJMbW7XnUjfX0-R_Tfsf2ut_q1RcOAL1GjyhohjmrtM-lm6vuXBlq4OAVcyyvy-y1ig-bHEYNciEnA1BYZOdxC6Xi88te6PjGc4Hpt2Ymqx5b5IlqrT-V5BW6OOwTFEMmjKMcHRA8UfLYWSkdj38to5kG537Vp-vwbAJ8wLWBERJrJa0u0X0U2qguwBD1jQCJqHFb1eEa5jDqm_zrIGDO8bR6Ti-vhWnx1dnVFfgHKC7_vj4530TotUFdGFOwpvRV8Y4dR5EHBlStnkz_R9E4sTIM1gqxUXwoouA1Xzi6nP_NNb5kR6zoCadTe5USZE5BRdOJ9lOgECcDO0PpMml5NpHVvXWbmVvwpEiRzdVEmEWHl8M7xPM7jQtsjGZMyvhBKLXmCFrx8LJZIESP5JYLLs59l8RPAIixWxitG3KsfurJXA0KVgy390Lc_FL1ytY6IbN_n8qiGPB32Rn6I1PSVG1tESFJdcN6DuhTSRwMUjy8GhimRF14k0Tb7W_LwKe5qQn4tOlYdR74fECmfRt-nl1XRGkxwsRFnokG_pwblBx8HV3Ox4BDpCC2faBU1H3xhyg8sUBMf23HgHMR_iplPNooMonBmeVVgLdP-eRMJnhxELpWe62FN2yjIqjdMAO57w7JxyE9zr4vT-zPERAN2neeE6UYotAlIkF7ngWEDPaIzy7O-56Zeu7257x4jree0blb19AwQfOQ_ttJCi5hqAeckTNT3aEP1b2nhrUurUfibV9azSKCQwSSNCjB_PpnuTHtzc8gVrkp_Ing1lV_Suf5QNTognFXAOC4arToFc9U4zcgFLftcSf2H6Qm3z_Ez3Yfa9dDJqDbyyA4KytX4xY94OANz5JRc9cggYlJd9_1LOpkE2ysQDfqikG70C8",
    "fingerprint": "1671de7276130b2f6d1fac10d83b80d6e4dacec2"
}
```

Response: `200 OK` (HTML — redirects to a "Thank you for applying" page; no JSON body)

## Extension Interception Strategy

Intercept `POST https://boards.greenhouse.io/{company}/jobs/{jobId}`.

* **Company**: path segment 1 (`adyen` in example)
* **Job ID**: path segment 3 (`7573921` in example) — matches the `gh_jid` param used in embedded iframes
* **Applicant**: `job_application.first_name`, `last_name`, `email`, `phone`, `resume_url_filename` from request body
* **Confirmation**: HTTP 200 response

Job title is not in the submit payload — read it from the page DOM before submission (typically an `h1` on `job-boards.greenhouse.io/{company}/jobs/{jobId}`).

## Notes

* Greenhouse is not a job board or aggregator — boards, aggregators, Google searches, Otta, and company career sites link to it. For attribution, capture the referring URL or parse `utm_source` from the URL before the form load (Otta passes it, but it disappears on navigation).
* Both `job-boards.greenhouse.io` (newer) and `boards.greenhouse.io` (older, submit target) are in use.
* Greenhouse also offers a **hosted career site CMS** product where companies serve the full application on their own domain (e.g., `careers.withwaymo.com`). Detection: `gh_jid` in URL + domain is NOT `greenhouse.io`. Submit goes to `{company-domain}/call_to_actions/{ctaId}/form_submissions`. See `greenhouse-careers.md`.
