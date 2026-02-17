-- ===========================================================
-- Seed data for local development
-- ===========================================================
-- Prerequisites:
--   1. Run `supabase start`
--   2. Sign up at least one user via the app (http://localhost:3000)
--   3. Run `supabase db reset` (this file runs automatically)
--
-- The seed looks up the FIRST user in auth.users and assigns
-- all data to that user. If no user exists it raises an error.
-- ===========================================================

DO $$
DECLARE
  v_user_id UUID;

  -- Company IDs (deterministic for referencing below)
  v_stripe_id    UUID := 'a0000000-0000-0000-0000-000000000001';
  v_vercel_id    UUID := 'a0000000-0000-0000-0000-000000000002';
  v_supabase_id  UUID := 'a0000000-0000-0000-0000-000000000003';
  v_figma_id     UUID := 'a0000000-0000-0000-0000-000000000004';
  v_linear_id    UUID := 'a0000000-0000-0000-0000-000000000005';

  -- Application IDs
  v_app_stripe_sr  UUID := 'b0000000-0000-0000-0000-000000000001';
  v_app_stripe_be  UUID := 'b0000000-0000-0000-0000-000000000002';
  v_app_vercel_fe  UUID := 'b0000000-0000-0000-0000-000000000003';
  v_app_supabase   UUID := 'b0000000-0000-0000-0000-000000000004';
  v_app_figma      UUID := 'b0000000-0000-0000-0000-000000000005';
  v_app_linear     UUID := 'b0000000-0000-0000-0000-000000000006';
  v_app_vercel_pd  UUID := 'b0000000-0000-0000-0000-000000000007';

  -- Document IDs
  v_doc_resume UUID := 'c0000000-0000-0000-0000-000000000001';
  v_doc_cover  UUID := 'c0000000-0000-0000-0000-000000000002';
  v_doc_portfolio UUID := 'c0000000-0000-0000-0000-000000000003';

BEGIN
  -- ---------------------------------------------------------
  -- Resolve user
  -- ---------------------------------------------------------
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users. Please sign up first at http://localhost:3000 and then run `supabase db reset`.';
  END IF;

  RAISE NOTICE 'Seeding data for user %', v_user_id;

  -- ---------------------------------------------------------
  -- Companies
  -- ---------------------------------------------------------
  INSERT INTO companies (id, user_id, name, description, links, industry, size, location, founded, culture, benefits, pros, cons, tech_stack, ratings, tags, researched)
  VALUES
    -- Stripe: fully researched
    (
      v_stripe_id, v_user_id, 'Stripe',
      'Financial infrastructure platform for the internet. Stripe builds economic infrastructure for the internet, helping millions of companies of all sizes accept payments and manage their businesses online.',
      '{"website": "https://stripe.com", "careers": "https://stripe.com/jobs", "glassdoor": "https://www.glassdoor.com/Overview/Working-at-Stripe-EI_IE671932.htm", "linkedin": "https://www.linkedin.com/company/stripe"}',
      'Fintech', '5001-10000', 'San Francisco, CA (Remote-friendly)',
      '2010-01-01',
      'Engineering-driven culture with strong emphasis on writing and clear thinking. Known for rigorous hiring and high bar for code quality. Regular hackathons and 20% time for exploration projects.',
      'Competitive salary, equity, 401k match, unlimited PTO, $10k annual learning budget, home office stipend, premium health/dental/vision, 20 weeks parental leave',
      'World-class engineering team, interesting technical challenges at scale, strong compensation, great documentation culture, impactful work',
      'High expectations and fast pace can be intense, complex codebase with steep learning curve, some teams have on-call rotations',
      'Ruby, Go, TypeScript, React, GraphQL, AWS, Kubernetes, Terraform',
      '{"overall": 4.5, "engineering": 4.7, "culture": 4.3, "compensation": 4.8, "worklife": 3.9}',
      '["top-tier", "fintech", "remote-friendly"]',
      true
    ),
    -- Vercel: partially researched
    (
      v_vercel_id, v_user_id, 'Vercel',
      'Vercel provides the developer experience and infrastructure to build, scale, and secure a faster, more personalized web.',
      '{"website": "https://vercel.com", "careers": "https://vercel.com/careers", "github": "https://github.com/vercel"}',
      'Developer Tools', '501-1000', 'San Francisco, CA (Remote-first)',
      '2015-11-01',
      'Remote-first company with async communication. Strong open-source ethos.',
      '',
      'Creators of Next.js, strong open-source community, remote-first',
      'Fast-moving startup pace, smaller company resources',
      'TypeScript, Next.js, React, Go, Rust, Turborepo',
      '{"overall": 4.2, "engineering": 4.5}',
      '["developer-tools", "remote-first", "open-source"]',
      true
    ),
    -- Supabase: minimal
    (
      v_supabase_id, v_user_id, 'Supabase',
      '',
      '{}',
      '', '', '',
      NULL,
      '', '', '', '', '',
      '{}',
      '[]',
      false
    ),
    -- Figma: researched
    (
      v_figma_id, v_user_id, 'Figma',
      'Figma is a collaborative design platform that helps teams create, test, and ship better designs from start to finish.',
      '{"website": "https://figma.com", "careers": "https://www.figma.com/careers", "linkedin": "https://www.linkedin.com/company/figma"}',
      'Design Tools', '1001-5000', 'San Francisco, CA (Hybrid)',
      '2012-01-01',
      'Design-centric culture that values craft and collaboration. Regular design critiques and maker weeks.',
      'Top-tier compensation, equity, annual learning budget, wellness stipend, catered meals',
      'Best-in-class design tool, creative and talented team, strong product-market fit, excellent compensation',
      'Hybrid model requires some in-office time, competitive internal culture',
      'TypeScript, C++, WebAssembly, React, Node.js, Ruby on Rails, PostgreSQL',
      '{"overall": 4.4, "engineering": 4.3, "culture": 4.6, "compensation": 4.7, "worklife": 4.1}',
      '["design", "collaboration", "high-growth"]',
      true
    ),
    -- Linear: minimal
    (
      v_linear_id, v_user_id, 'Linear',
      'Linear is a purpose-built tool for planning and building products.',
      '{"website": "https://linear.app"}',
      'Developer Tools', '51-200', '',
      NULL,
      '', '', '', '', '',
      '{}',
      '["startup", "developer-tools"]',
      false
    );

  -- ---------------------------------------------------------
  -- Applications
  -- ---------------------------------------------------------
  INSERT INTO applications (id, user_id, company_id, position, status, work_type, employment_type, location, salary, url, job_description, interest, source, tags, applied_at, archived_at, archived_reason)
  VALUES
    -- Stripe: Senior Frontend Engineer (interviewing)
    (
      v_app_stripe_sr, v_user_id, v_stripe_id,
      'Senior Frontend Engineer', 'interviewing',
      'remote', 'full-time', 'San Francisco, CA (Remote)',
      '{"min": 190000, "max": 250000, "currency": "USD", "period": "yearly"}',
      'https://stripe.com/jobs/listing/senior-frontend-engineer/12345',
      'We are looking for a Senior Frontend Engineer to join our Payments team. You will work on the Stripe Dashboard, building tools that help millions of businesses manage their payments.',
      'high', 'LinkedIn',
      '["frontend", "react", "typescript"]',
      now() - interval '12 days',
      NULL, NULL
    ),
    -- Stripe: Backend Engineer (applied)
    (
      v_app_stripe_be, v_user_id, v_stripe_id,
      'Backend Engineer', 'applied',
      'hybrid', 'full-time', 'San Francisco, CA',
      '{"min": 180000, "max": 240000, "currency": "USD", "period": "yearly"}',
      'https://stripe.com/jobs/listing/backend-engineer/12346',
      'Join the API Platform team to build and maintain the core APIs that power Stripe.',
      'medium', 'Company website',
      '["backend", "ruby", "go"]',
      now() - interval '5 days',
      NULL, NULL
    ),
    -- Vercel: Frontend Engineer (offer)
    (
      v_app_vercel_fe, v_user_id, v_vercel_id,
      'Frontend Engineer', 'offer',
      'remote', 'full-time', 'Remote (US)',
      '{"min": 170000, "max": 220000, "currency": "USD", "period": "yearly"}',
      'https://vercel.com/careers/frontend-engineer',
      'Help build the future of the web platform. You will work on the Vercel Dashboard and contribute to Next.js.',
      'high', 'Referral',
      '["frontend", "nextjs", "react"]',
      now() - interval '30 days',
      NULL, NULL
    ),
    -- Supabase: Full Stack Developer (bookmarked)
    (
      v_app_supabase, v_user_id, v_supabase_id,
      'Full Stack Developer', 'bookmarked',
      'remote', 'full-time', 'Remote',
      '{}',
      'https://boards.greenhouse.io/supabase/jobs/12345',
      '',
      'medium', 'Job board',
      '["fullstack"]',
      NULL,
      NULL, NULL
    ),
    -- Figma: Product Designer (interviewing)
    (
      v_app_figma, v_user_id, v_figma_id,
      'Product Designer', 'interviewing',
      'hybrid', 'full-time', 'San Francisco, CA',
      '{"min": 160000, "max": 210000, "currency": "USD", "period": "yearly"}',
      'https://www.figma.com/careers/product-designer',
      'We are looking for a Product Designer to join our Editor team. You will design features used by millions of designers and developers worldwide.',
      'high', 'Company website',
      '["design", "product"]',
      now() - interval '18 days',
      NULL, NULL
    ),
    -- Linear: Software Engineer (archived / rejected)
    (
      v_app_linear, v_user_id, v_linear_id,
      'Software Engineer', 'rejected',
      'remote', 'full-time', 'Remote',
      '{}',
      'https://linear.app/careers',
      '',
      'low', 'LinkedIn',
      '["fullstack"]',
      now() - interval '45 days',
      now() - interval '20 days', 'Position filled internally'
    ),
    -- Vercel: Product Designer (bookmarked)
    (
      v_app_vercel_pd, v_user_id, v_vercel_id,
      'Product Designer', 'bookmarked',
      'remote', 'full-time', 'Remote',
      '{}',
      'https://vercel.com/careers/product-designer',
      '',
      'low', 'Job board',
      '["design"]',
      NULL,
      NULL, NULL
    );

  -- ---------------------------------------------------------
  -- Events
  -- ---------------------------------------------------------
  INSERT INTO events (user_id, application_id, type, status, title, description, url, scheduled_at, duration_minutes)
  VALUES
    -- Stripe Senior FE: recruiter screen (completed)
    (
      v_user_id, v_app_stripe_sr,
      'phone_screen', 'completed',
      'Recruiter Screen with Sarah',
      'Initial call with recruiter Sarah Kim. Discussed role expectations, team structure, and timeline.',
      'https://meet.google.com/abc-defg-hij',
      now() - interval '8 days', 30
    ),
    -- Stripe Senior FE: technical interview (scheduled)
    (
      v_user_id, v_app_stripe_sr,
      'technical_interview', 'scheduled',
      'Technical Interview - Frontend Systems',
      'Live coding session focused on building a payment form component with accessibility considerations.',
      'https://meet.google.com/xyz-abcd-efg',
      now() + interval '3 days', 60
    ),
    -- Stripe Senior FE: system design (TBD)
    (
      v_user_id, v_app_stripe_sr,
      'technical_interview', 'pending',
      'System Design Interview',
      'System design round focusing on frontend architecture. To be scheduled after technical interview.',
      NULL,
      NULL, 60
    ),
    -- Vercel FE: all interviews completed, offer stage
    (
      v_user_id, v_app_vercel_fe,
      'phone_screen', 'completed',
      'Hiring Manager Call',
      'Call with hiring manager. Discussed team, culture, and role specifics.',
      NULL,
      now() - interval '25 days', 45
    ),
    (
      v_user_id, v_app_vercel_fe,
      'technical_interview', 'completed',
      'Technical Interview - React & Next.js',
      'Pair programming session building a dashboard component with Next.js App Router.',
      NULL,
      now() - interval '20 days', 90
    ),
    (
      v_user_id, v_app_vercel_fe,
      'final_interview', 'completed',
      'Final Round - Team Fit',
      'Met with three team members. Discussed past projects, collaboration style, and team dynamics.',
      NULL,
      now() - interval '14 days', 60
    ),
    -- Figma: screening done, technical scheduled
    (
      v_user_id, v_app_figma,
      'phone_screen', 'completed',
      'Recruiter Intro',
      'Introductory call with recruiter. Reviewed portfolio and discussed design process.',
      NULL,
      now() - interval '10 days', 30
    ),
    (
      v_user_id, v_app_figma,
      'technical_interview', 'scheduled',
      'Design Challenge Presentation',
      'Present take-home design challenge to a panel of 3 designers. Prepare a 20-minute presentation.',
      'https://figma.zoom.us/j/123456789',
      now() + interval '5 days', 90
    );

  -- ---------------------------------------------------------
  -- Documents
  -- ---------------------------------------------------------
  INSERT INTO documents (id, user_id, name, type, content, uri, mime_type, revision, tags)
  VALUES
    (
      v_doc_resume, v_user_id,
      'Software Engineer Resume - 2026', 'resume',
      'Jane Doe
Senior Software Engineer

Experience:
- Senior Frontend Engineer at Acme Corp (2023-present)
- Frontend Engineer at TechStart Inc (2020-2023)
- Junior Developer at WebAgency (2018-2020)

Skills: TypeScript, React, Next.js, Node.js, PostgreSQL, GraphQL, Tailwind CSS, AWS

Education:
- B.S. Computer Science, UC Berkeley (2018)',
      NULL, 'application/pdf', 'v3',
      '["active", "2026"]'
    ),
    (
      v_doc_cover, v_user_id,
      'Generic Cover Letter', 'cover_letter',
      'Dear Hiring Manager,

I am writing to express my strong interest in the [Position] role at [Company]. With over 6 years of experience building modern web applications, I bring a combination of technical expertise and product sensibility that I believe would be valuable to your team.

In my current role as Senior Frontend Engineer at Acme Corp, I have led the development of a real-time collaborative editing platform serving 50,000+ users. I architected the frontend using React and TypeScript, achieving a 40% improvement in performance metrics.

I am particularly drawn to [Company] because of [reason]. I would welcome the opportunity to discuss how my experience aligns with your team''s goals.

Best regards,
Jane Doe',
      NULL, 'text/plain', 'v2',
      '["template"]'
    ),
    (
      v_doc_portfolio, v_user_id,
      'Design Portfolio', 'other',
      '',
      'https://janedoe.design',
      'text/uri-list', 'v1',
      '["design", "portfolio"]'
    );

  -- ---------------------------------------------------------
  -- Application Documents (link docs to applications)
  -- ---------------------------------------------------------
  INSERT INTO application_documents (application_id, document_id, name, type, content, uri, mime_type, revision)
  VALUES
    (v_app_stripe_sr, v_doc_resume, 'Software Engineer Resume - 2026', 'resume', '', NULL, 'application/pdf', 'v3'),
    (v_app_stripe_sr, v_doc_cover, 'Stripe Cover Letter', 'cover_letter', 'Customized cover letter for Stripe Senior Frontend Engineer position.', NULL, 'text/plain', 'v1'),
    (v_app_vercel_fe, v_doc_resume, 'Software Engineer Resume - 2026', 'resume', '', NULL, 'application/pdf', 'v3'),
    (v_app_figma, v_doc_resume, 'Software Engineer Resume - 2026', 'resume', '', NULL, 'application/pdf', 'v3'),
    (v_app_figma, v_doc_portfolio, 'Design Portfolio', 'other', '', 'https://janedoe.design', 'text/uri-list', 'v1');

  -- ---------------------------------------------------------
  -- Contacts
  -- ---------------------------------------------------------
  INSERT INTO contacts (user_id, name, title, company_id, email, phone, linkedin_url, notes)
  VALUES
    (v_user_id, 'Sarah Kim', 'Technical Recruiter', v_stripe_id, 'sarah.kim@stripe.com', NULL, 'https://linkedin.com/in/sarahkim', 'Very responsive. Reached out via LinkedIn.'),
    (v_user_id, 'Marcus Chen', 'Engineering Manager', v_vercel_id, 'marcus@vercel.com', NULL, 'https://linkedin.com/in/marcuschen', 'Hiring manager for the frontend team. Met during final round.'),
    (v_user_id, 'Priya Patel', 'Senior Designer', v_figma_id, NULL, NULL, 'https://linkedin.com/in/priyapatel', 'Connected at a design meetup. Referred me to the product designer role.');

  -- ---------------------------------------------------------
  -- User Settings (upsert in case trigger already created it)
  -- ---------------------------------------------------------
  INSERT INTO user_settings (user_id, theme, language, compact_mode)
  VALUES (v_user_id, 'dark', 'en', false)
  ON CONFLICT (user_id) DO UPDATE SET
    theme = 'dark',
    language = 'en',
    compact_mode = false;

  RAISE NOTICE 'Seed complete! Created 5 companies, 7 applications, 8 events, 3 documents, and 3 contacts.';
END $$;
