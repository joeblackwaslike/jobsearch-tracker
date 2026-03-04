-- ===========================================================
-- Seed data for local development
-- ===========================================================
-- Two workflows:
--
-- Quick start (auto-creates a dev account):
--   pnpm db:seed          — resets DB, then runs this file
--   Log in as: joeblackwaslike@me.com / toor
--
-- Seed under your own account:
--   pnpm db:reset         — resets DB (no seed data)
--   Sign up at http://localhost:3000
--   pnpm db:reseed        — runs this file against your account
-- ===========================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Use the first existing user so seed data appears under your account.
  -- If no user exists (fresh db:reset), creates a local dev account instead.
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, is_anonymous
    ) VALUES (
      v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'joeblackwaslike@me.com', crypt('toor', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{}',
      false, false, false
    );
    RAISE NOTICE 'No user found — created dev account: joeblackwaslike@me.com / toor';
  ELSE
    RAISE NOTICE 'Seeding data for existing user: %', v_user_id;
  END IF;

  -- =========================================================
  -- COMPANIES (15)
  -- =========================================================
  INSERT INTO companies (id, user_id, name, description, links, industry, size, location, founded, culture, benefits, pros, cons, tech_stack, ratings, tags, researched)
  VALUES
    (
      'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', v_user_id,
      'TechCorp Inc',
      'Leading cloud infrastructure provider specializing in scalable web applications and developer tooling. Powers 40% of Fortune 500 developer workflows.',
      '{"website":"https://www.techcorp.io","careers":"https://www.techcorp.io/careers","news":"https://www.techcorp.io/blog","linkedin":"https://www.linkedin.com/company/techcorp-inc","glassdoor":"https://www.glassdoor.com/Overview/Working-at-TechCorp.htm","crunchbase":"https://www.crunchbase.com/organization/techcorp-inc"}',
      'Cloud Infrastructure', '1000-5000', 'San Francisco, CA', '2010-01-01',
      'Fast-paced and collaborative engineering culture with strong emphasis on ownership and autonomy. Engineers are full owners of their features from design to production. Regular tech talks, quarterly hackathons, and open-source contributions are actively encouraged. Remote-first with optional hub offices.',
      'Competitive salary with equity refresh grants. Comprehensive health/dental/vision with 100% premium coverage. $3,000/year learning budget. Unlimited PTO with encouraged minimums. Home office stipend $1,200 one-time plus $100/month. 401k with 4% match. 16-week parental leave.',
      'Top-tier engineering team, strong mentorship culture, excellent internal mobility, modern tech stack, remote-first, competitive comp package',
      'High performance bar can create pressure, fast pace means frequent context switching, on-call rotation required for senior engineers',
      'React, TypeScript, Node.js, AWS, Kubernetes, PostgreSQL, Redis, Go',
      '{"overall":4.2,"workLifeBalance":4.0,"compensation":4.5,"careerGrowth":4.3,"culture":4.0,"management":4.1}',
      '["cloud","infrastructure","remote-first","series-d","developer-tools"]',
      true
    ),
    (
      '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', v_user_id,
      'StartupXYZ',
      'Innovative fintech startup disrupting B2B payments with real-time settlement infrastructure. Series B, growing 3x YoY.',
      '{"website":"https://www.startupxyz.com","careers":"https://www.startupxyz.com/careers","news":"https://www.startupxyz.com/press","linkedin":"https://www.linkedin.com/company/startupxyz","glassdoor":"https://www.glassdoor.com/Overview/Working-at-StartupXYZ.htm","crunchbase":"https://www.crunchbase.com/organization/startupxyz"}',
      'Fintech', '50-200', 'New York, NY', '2020-01-01',
      'High-energy startup culture where everyone ships and everyone matters. Flat hierarchy with direct access to founders. Weekly all-hands, transparent roadmap, and a strong bias toward action over process. Equity is a real part of the conversation.',
      'Competitive salary + meaningful early-stage equity. Full health/dental/vision. $2,000/year learning stipend. Unlimited PTO. Monthly team dinners. Home office setup budget $1,500. 12-week parental leave.',
      'Meaningful equity upside, direct impact on product, talented and driven team, fast shipping culture, founders are accessible and technical',
      'Benefits not as comprehensive as big tech, some processes still maturing, workload can be intense during fundraising cycles',
      'React, TypeScript, Node.js, GraphQL, PostgreSQL, Stripe, Kafka',
      '{"overall":3.9,"workLifeBalance":3.5,"compensation":4.0,"careerGrowth":4.2,"culture":3.8,"management":3.7}',
      '["fintech","payments","series-b","startup","remote-hybrid"]',
      true
    ),
    (
      '9b4bf110-deb1-4481-8056-d040a57fd757', v_user_id,
      'BigTech Solutions',
      'Global enterprise software leader with comprehensive cloud, AI, and productivity solutions. Trusted by 95% of Fortune 100 companies.',
      '{"website":"https://www.bigtechsolutions.com","careers":"https://www.bigtechsolutions.com/careers","news":"https://news.bigtechsolutions.com","linkedin":"https://www.linkedin.com/company/bigtech-solutions","glassdoor":"https://www.glassdoor.com/Overview/Working-at-BigTech-Solutions.htm","crunchbase":"https://www.crunchbase.com/organization/bigtech-solutions"}',
      'Enterprise Software', '10000+', 'Seattle, WA', '1998-01-01',
      'Structured enterprise culture with strong process rigor and long-term thinking. Large collaborative teams, thriving internal open-source communities, and dedicated 15% innovation time. Clear career ladders with documented promotion criteria. D&I programs are well-funded and genuinely active.',
      'Industry-leading total comp with RSU grants. 100% healthcare premium coverage. $5,000/year education budget. 20 days PTO plus 12 holidays. 6-month parental leave for primary caregivers. ESPP at 15% discount. Extensive onsite amenities and wellness programs.',
      'Brand recognition opens doors, massive scope of impact, excellent benefits, strong job security, deep internal transfer opportunities across divisions',
      'Enterprise bureaucracy slows decision-making, can feel siloed in large orgs, some legacy codebases persist, promotion cycles can be slow',
      'React, TypeScript, Java, .NET, Azure, Kubernetes, GraphQL, Cosmos DB',
      '{"overall":4.4,"workLifeBalance":4.2,"compensation":4.7,"careerGrowth":4.4,"culture":4.1,"management":4.2}',
      '["enterprise","cloud","public","faang-adjacent","relocation-available"]',
      true
    ),
    (
      '4769b594-1f5a-4207-8123-deea2272668d', v_user_id,
      'CloudScale Systems',
      'Cloud-native platform for building, deploying, and observing microservices at scale. Used by 8,000+ engineering teams worldwide.',
      '{"website":"https://www.cloudscale.dev","careers":"https://www.cloudscale.dev/jobs","news":"https://www.cloudscale.dev/blog","linkedin":"https://www.linkedin.com/company/cloudscale-systems","glassdoor":"https://www.glassdoor.com/Overview/Working-at-CloudScale.htm","crunchbase":"https://www.crunchbase.com/organization/cloudscale-systems"}',
      'DevOps / Platform Engineering', '500-1000', 'Austin, TX', '2015-01-01',
      'Engineering-driven culture where the best idea wins regardless of title. Deep technical excellence is valued and rewarded. Distributed team across 12 time zones with async-first communication. Strong documentation culture and blameless post-mortems.',
      'Competitive base + equity. Medical/dental/vision fully covered. $2,500/year conference and learning budget. Flexible PTO. Annual team retreat. $800 home office stipend. 4% 401k match. 14-week parental leave.',
      'Truly remote-first culture, exceptional technical challenges, excellent work-life balance, smart colleagues, product is used by engineers so team understands the domain deeply',
      'Smaller company means fewer resources, compensation slightly below FAANG, career growth can plateau without self-advocacy',
      'Go, TypeScript, React, Kubernetes, Prometheus, Terraform, PostgreSQL, gRPC',
      '{"overall":4.1,"workLifeBalance":4.4,"compensation":4.0,"careerGrowth":4.0,"culture":4.3,"management":4.1}',
      '["devops","kubernetes","remote-first","series-c","open-source"]',
      true
    ),
    (
      '71a24a14-8c4f-45ca-8193-ed3ffb709072', v_user_id,
      'InnovateLabs',
      'Design systems and component library company helping engineering teams build beautiful, accessible, and consistent UIs at scale.',
      '{"website":"https://www.innovatelabs.design","careers":"https://www.innovatelabs.design/careers","news":"https://www.innovatelabs.design/blog","linkedin":"https://www.linkedin.com/company/innovatelabs","glassdoor":"https://www.glassdoor.com/Overview/Working-at-InnovateLabs.htm","crunchbase":"https://www.crunchbase.com/organization/innovatelabs"}',
      'Developer Tools / Design', '200-500', 'Remote', '2018-01-01',
      'Craft-obsessed culture where quality, accessibility, and developer experience are sacred. Small autonomous teams with genuine ownership. Design and engineering collaborate as equals. Open source is core to our identity — most of what we build ships publicly.',
      'Market-rate salary plus equity. Full benefits. $3,500/year learning and conference budget. Fully remote with annual company retreat. $1,500 home office setup. 16-week parental leave. Flexible working hours across time zones.',
      'World-class design and frontend culture, fully remote, open-source credibility, genuine craft focus, strong brand in the frontend community',
      'Smaller company means wearing many hats, growth-stage challenges with process, compensation below FAANG but competitive for remote-first',
      'React, TypeScript, Storybook, CSS-in-JS, Radix UI, Figma, Vite, Vitest',
      '{"overall":4.5,"workLifeBalance":4.6,"compensation":4.1,"careerGrowth":4.2,"culture":4.6,"management":4.3}',
      '["design-systems","open-source","remote-only","series-b","frontend-focused"]',
      true
    ),
    (
      '834e566f-4e01-4844-a7b6-eaf8025f81b0', v_user_id,
      'GreenTech Solutions',
      'Building technology solutions for environmental sustainability — carbon tracking, ESG reporting, and climate action tooling for enterprises.',
      '{"website":"https://www.greentech.solutions","careers":"https://www.greentech.solutions/jobs","news":"https://www.greentech.solutions/news","linkedin":"https://www.linkedin.com/company/greentech-solutions","glassdoor":"https://www.glassdoor.com/Overview/Working-at-GreenTech-Solutions.htm","crunchbase":"https://www.crunchbase.com/organization/greentech-solutions"}',
      'Climate Tech / SaaS', '200-500', 'Portland, OR', '2019-01-01',
      'Mission-driven culture where the work feels meaningful. Collaborative and inclusive team with a genuine commitment to sustainability in operations too. Flexible work arrangements, low hierarchy, and high trust. Team retreats happen in low-carbon-footprint locations.',
      'Competitive salary with equity. Full benefits package. $2,000/year learning stipend. Flexible and remote-friendly. Carbon offset for all business travel. 14-week parental leave. Volunteer days 3x/year.',
      'Meaningful mission, great work-life balance, flexible remote work, inclusive culture, growing market with regulatory tailwinds',
      'Compensation not at FAANG levels, some technical debt from fast early growth, market education still required for some enterprise sales',
      'TypeScript, React, Node.js, PostgreSQL, Python, AWS, dbt, Terraform',
      '{"overall":4.1,"workLifeBalance":4.5,"compensation":3.8,"careerGrowth":3.9,"culture":4.3,"management":4.0}',
      '["climate-tech","mission-driven","remote-hybrid","series-a","b2b-saas"]',
      true
    ),
    (
      'f7219323-187e-47ba-9d65-8a0a1953c3d1', v_user_id,
      'MediaStream Co',
      'Leading video streaming infrastructure platform delivering live and on-demand content to 200M+ concurrent viewers globally.',
      '{"website":"https://www.mediastream.co","careers":"https://www.mediastream.co/careers","news":"https://www.mediastream.co/press","linkedin":"https://www.linkedin.com/company/mediastream-co","glassdoor":"https://www.glassdoor.com/Overview/Working-at-MediaStream.htm","crunchbase":"https://www.crunchbase.com/organization/mediastream-co"}',
      'Media Technology', '1000-5000', 'Los Angeles, CA', '2012-01-01',
      'High-performance engineering culture with a strong focus on reliability and scale. The team takes pride in solving genuinely hard distributed systems problems. On-call culture is taken seriously but rotation is balanced. Internal hackathons produce features that ship.',
      'Above-market salary and equity. Full health coverage. $4,000/year education budget. Generous PTO. Premium home office allowance. 401k with match. 16-week parental leave. Free streaming subscriptions.',
      'Cutting-edge technical challenges, strong engineering brand, good compensation, great scale, smart colleagues across infra and product',
      'On-call expectations can be demanding, some legacy real-time systems are complex to onboard, LA office costs are high',
      'React, TypeScript, WebRTC, Node.js, Go, FFmpeg, Kafka, AWS CloudFront, Redis',
      '{"overall":4.2,"workLifeBalance":3.7,"compensation":4.5,"careerGrowth":4.3,"culture":4.0,"management":3.9}',
      '["streaming","media","public","scale","real-time"]',
      true
    ),
    (
      'f4d4155e-e02a-4230-8684-2da4a79d9b46', v_user_id,
      'CyberSecure Systems',
      'Enterprise cybersecurity platform protecting Fortune 500 companies from modern threats with zero-trust architecture and AI-powered threat detection.',
      '{"website":"https://www.cybersecure.io","careers":"https://www.cybersecure.io/careers","news":"https://www.cybersecure.io/blog","linkedin":"https://www.linkedin.com/company/cybersecure-systems","glassdoor":"https://www.glassdoor.com/Overview/Working-at-CyberSecure.htm","crunchbase":"https://www.crunchbase.com/organization/cybersecure-systems"}',
      'Cybersecurity', '500-1000', 'Austin, TX', '2016-01-01',
      'Security-first culture where paranoia is a virtue and everyone thinks like an attacker. Rigorous code review process, mandatory security training, and red team exercises. Competitive but collaborative — the enemy is outside, not inside.',
      'Top-of-market compensation including equity. Comprehensive benefits. $3,000/year security conference budget (DEF CON, Black Hat). Flexible work. 401k with 4% match. 14-week parental leave.',
      'Fascinating security challenges, strong technical culture, top-of-market comp, mission-critical work, excellent team caliber',
      'Security clearance requirements for some roles slow hiring, culture can be intense, limited flexibility on tech stack choices',
      'TypeScript, React, Go, Rust, Kubernetes, Zero Trust, Terraform, PostgreSQL',
      '{"overall":4.1,"workLifeBalance":3.9,"compensation":4.4,"careerGrowth":4.0,"culture":3.9,"management":4.0}',
      '["security","zero-trust","series-c","enterprise","compliance"]',
      true
    ),
    (
      '42228724-76ee-463e-9ea4-c5d0dc4142a6', v_user_id,
      'HealthTech Innovations',
      'Digital health platform improving patient outcomes through clinical decision support, remote monitoring, and EHR integrations.',
      '{"website":"https://www.healthtechinnovations.com","careers":"https://www.healthtechinnovations.com/careers","news":"https://www.healthtechinnovations.com/news","linkedin":"https://www.linkedin.com/company/healthtech-innovations","glassdoor":"https://www.glassdoor.com/Overview/Working-at-HealthTech-Innovations.htm","crunchbase":"https://www.crunchbase.com/organization/healthtech-innovations"}',
      'Health Technology', '500-1000', 'Boston, MA', '2017-01-01',
      'Mission-driven culture with the weight of real patient impact behind every release. Rigorous compliance culture (HIPAA, SOC2) balanced with genuine care for team wellbeing. Multidisciplinary teams include clinicians, engineers, and product specialists.',
      'Competitive salary with equity. Full benefits plus HSA matching. $2,500/year learning budget. Flexible hours. 16-week parental leave. Mental health days and EAP coverage.',
      'Meaningful patient impact, interesting compliance challenges, strong mission alignment, good benefits, collaborative multidisciplinary teams',
      'Compliance requirements slow some engineering decisions, on-premise deployment for some hospital clients adds complexity',
      'React, TypeScript, Node.js, Python, FHIR, HL7, AWS, PostgreSQL, Redis',
      '{"overall":3.9,"workLifeBalance":4.1,"compensation":3.9,"careerGrowth":3.8,"culture":4.0,"management":3.8}',
      '["healthtech","hipaa","mission-driven","series-b","b2b-saas"]',
      false
    ),
    (
      'de4a4b86-16e8-4131-bc47-71093119b869', v_user_id,
      'AI Innovations',
      'Applied AI company building large-scale machine learning infrastructure and LLM-powered products for enterprise customers.',
      '{"website":"https://www.aiinnovations.ai","careers":"https://www.aiinnovations.ai/careers","news":"https://www.aiinnovations.ai/research","linkedin":"https://www.linkedin.com/company/ai-innovations","glassdoor":"https://www.glassdoor.com/Overview/Working-at-AI-Innovations.htm","crunchbase":"https://www.crunchbase.com/organization/ai-innovations"}',
      'Artificial Intelligence', '200-500', 'San Francisco, CA', '2021-01-01',
      'Research-adjacent culture where curiosity and rigor are equally valued. Engineers work alongside ML researchers on cutting-edge problems. Move fast but think deeply — shipping matters but so does doing it right. Strong publication and conference presence.',
      'Top-tier compensation including equity at pre-IPO valuation. Full benefits. $5,000/year learning and conference budget. Flexible remote work. GPU compute budget for personal projects. 16-week parental leave.',
      'Cutting-edge AI work, exceptional colleagues from top research labs, pre-IPO equity upside, strong publication culture, fascinating problems',
      'Work-life balance can suffer during crunch periods, high expectations, product direction sometimes shifts with AI landscape changes',
      'Python, TypeScript, React, PyTorch, LangChain, FastAPI, PostgreSQL, Kubernetes, CUDA',
      '{"overall":4.2,"workLifeBalance":3.6,"compensation":4.7,"careerGrowth":4.5,"culture":4.1,"management":3.9}',
      '["ai","ml","llm","series-c","pre-ipo","research"]',
      true
    ),
    (
      '55bc02c0-f600-4b25-9e0a-1c51504ae241', v_user_id,
      'EduTech Platform',
      'Online learning platform making professional education accessible to 12M+ learners worldwide with AI-powered personalization.',
      '{"website":"https://www.edutechplatform.com","careers":"https://www.edutechplatform.com/careers","news":"https://www.edutechplatform.com/blog","linkedin":"https://www.linkedin.com/company/edutech-platform","glassdoor":"https://www.glassdoor.com/Overview/Working-at-EduTech-Platform.htm","crunchbase":"https://www.crunchbase.com/organization/edutech-platform"}',
      'EdTech', '500-1000', 'Remote', '2018-01-01',
      'Learning-oriented culture that practices what it preaches. Psychological safety is high and mistakes are treated as opportunities. Monthly lunch-and-learns, cross-team knowledge sharing, and a strong culture of documentation.',
      'Competitive salary with equity. Full benefits. $2,500/year professional development. Fully remote with async-first culture. Annual team summit. 14-week parental leave. Free platform access for team and family.',
      'Great work-life balance, fully remote, meaningful mission, learning-first culture, solid benefits',
      'Compensation below FAANG, growth-stage process gaps, video infrastructure can be technically challenging',
      'React, TypeScript, Node.js, Python, MongoDB, AWS, WebRTC, FFmpeg',
      '{"overall":3.9,"workLifeBalance":4.3,"compensation":3.7,"careerGrowth":3.7,"culture":4.1,"management":3.8}',
      '["edtech","remote-only","mission-driven","series-b","consumer"]',
      false
    ),
    (
      'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', v_user_id,
      'FinServ Tech',
      'Financial services technology powering modern banking — payment processing, lending, and treasury management for 300+ institutions.',
      '{"website":"https://www.finservtech.com","careers":"https://www.finservtech.com/careers","news":"https://www.finservtech.com/press","linkedin":"https://www.linkedin.com/company/finserv-tech","glassdoor":"https://www.glassdoor.com/Overview/Working-at-FinServ-Tech.htm","crunchbase":"https://www.crunchbase.com/organization/finserv-tech"}',
      'Financial Technology', '1000-5000', 'New York, NY', '2005-01-01',
      'Structured and process-driven culture reflecting the regulatory environment of financial services. Strong emphasis on reliability and correctness. Clear career progression. Formal mentorship programs and leadership development tracks.',
      'Above-market base salary. Comprehensive benefits including FSA and HRA. Annual performance bonus. $2,000/year education budget. 20 days PTO. 401k with 5% match. 12-week parental leave.',
      'Excellent compensation, stable and established company, interesting compliance challenges, strong career ladders, good benefits',
      'Enterprise bureaucracy, some legacy Java/COBOL systems, slower deployment cycles due to compliance, limited remote flexibility',
      'React, TypeScript, Java, Spring Boot, Oracle, Kafka, Kubernetes, AWS',
      '{"overall":3.8,"workLifeBalance":3.5,"compensation":4.4,"careerGrowth":3.7,"culture":3.5,"management":3.6}',
      '["fintech","banking","enterprise","public","compliance","hybrid"]',
      false
    ),
    (
      'cba81a67-8f47-4089-8aba-886e8d36d9b9', v_user_id,
      'GameDev Studios',
      'Independent game development studio creating immersive browser-based and mobile gaming experiences. 4 titles in top-50 App Store charts.',
      '{"website":"https://www.gamedevstudios.io","careers":"https://www.gamedevstudios.io/jobs","news":"https://www.gamedevstudios.io/devlog","linkedin":"https://www.linkedin.com/company/gamedev-studios","glassdoor":"https://www.glassdoor.com/Overview/Working-at-GameDev-Studios.htm","crunchbase":"https://www.crunchbase.com/organization/gamedev-studios"}',
      'Gaming', '200-500', 'Seattle, WA', '2014-01-01',
      'Creative and passionate culture where everyone plays games and is motivated by player delight. Crunch culture has been explicitly addressed with a no-mandatory-crunch policy. Cross-disciplinary teams of artists, engineers, and designers work closely.',
      'Competitive base salary. Full benefits. $1,500/year learning budget. Flexible hours. Free games library and gaming hardware. 12-week parental leave. Annual game jam.',
      'Creative and fun work, passionate team, no mandatory crunch, strong cross-disciplinary collaboration, unique technical challenges in WebGL and performance',
      'Below-market comp compared to SaaS, project timelines can shift, revenue tied to game performance which fluctuates',
      'TypeScript, React, Three.js, WebGL, WebAssembly, Unity, C#, Node.js',
      '{"overall":3.9,"workLifeBalance":3.6,"compensation":3.6,"careerGrowth":3.5,"culture":4.0,"management":3.7}',
      '["gaming","creative","webgl","series-a","consumer"]',
      false
    ),
    (
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890', v_user_id,
      'Apex Analytics',
      'Real-time data analytics platform helping enterprises turn operational data into actionable insights. Processing 500B events per day.',
      '{"website":"https://www.apexanalytics.io","careers":"https://www.apexanalytics.io/careers","news":"https://www.apexanalytics.io/blog","linkedin":"https://www.linkedin.com/company/apex-analytics","glassdoor":"https://www.glassdoor.com/Overview/Working-at-Apex-Analytics.htm","crunchbase":"https://www.crunchbase.com/organization/apex-analytics"}',
      'Data Analytics', '200-500', 'Chicago, IL', '2017-01-01',
      'Data-obsessed culture that measures everything, including team health. Intellectually rigorous and collaborative. Engineers have strong product influence. Blameless post-mortems, thorough RFCs, and a culture of learning from failure.',
      'Competitive salary with meaningful Series C equity. Full benefits. $3,000/year learning budget. Remote-flexible. $1,000 home office stipend. 401k with 4% match. 14-week parental leave.',
      'Fascinating data problems at scale, strong engineering culture, meaningful equity at Series C, excellent team caliber, good compensation',
      'On-call requirements can be demanding during incidents, data pipeline complexity adds cognitive load, Chicago location less desirable for some candidates',
      'React, TypeScript, Python, Apache Flink, ClickHouse, Kafka, Kubernetes, dbt',
      '{"overall":4.2,"workLifeBalance":4.0,"compensation":4.2,"careerGrowth":4.1,"culture":4.2,"management":4.0}',
      '["data","analytics","series-c","real-time","enterprise"]',
      true
    ),
    (
      'b2c3d4e5-f6a7-8901-bcde-f12345678901', v_user_id,
      'NovaMobile',
      'Mobile-first SaaS platform for field service management, enabling 50,000+ field technicians to work efficiently without connectivity.',
      '{"website":"https://www.novamobile.app","careers":"https://www.novamobile.app/careers","news":"https://www.novamobile.app/blog","linkedin":"https://www.linkedin.com/company/novamobile-app","glassdoor":"https://www.glassdoor.com/Overview/Working-at-NovaMobile.htm","crunchbase":"https://www.crunchbase.com/organization/novamobile"}',
      'Mobile / Field Service', '50-200', 'Denver, CO', '2020-01-01',
      'Scrappy and mission-driven startup culture with high ownership and direct impact. Everyone talks to customers. Technical decisions are made close to the engineers doing the work. Moving fast with intentionality.',
      'Competitive salary with early-stage equity. Full benefits. $1,500/year learning stipend. Remote-first. 12-week parental leave. Flexible PTO.',
      'Meaningful equity at early stage, high ownership, direct customer impact, interesting offline-first technical challenges, close-knit team',
      'Benefits less comprehensive than larger companies, startup uncertainty, on-call expectations broader due to small team size',
      'React Native, TypeScript, Expo, Redux, Node.js, PostgreSQL, AWS, WatermelonDB',
      '{"overall":4.0,"workLifeBalance":3.8,"compensation":3.7,"careerGrowth":4.1,"culture":4.2,"management":4.0}',
      '["mobile","react-native","series-a","startup","offline-first"]',
      true
    )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- DOCUMENTS (5: 2 resumes + 3 cover letters)
  -- =========================================================
  INSERT INTO documents (id, user_id, name, type, content, uri, mime_type, revision, parent_id, tags, archived_at)
  VALUES
    (
      'dd000001-0000-4000-8000-000000000001', v_user_id,
      'Senior Frontend Engineer Resume',
      'resume',
      E'# Alex Rivera\n\nSan Francisco, CA · alex.rivera@email.com · github.com/alexrivera · linkedin.com/in/alexrivera\n\n---\n\n## Summary\n\nSenior Frontend Engineer with 7 years of experience building high-performance, accessible web applications. Deep expertise in React, TypeScript, and modern frontend architecture. Led teams of 4–8 engineers and delivered products used by millions of users.\n\n## Experience\n\n### Senior Frontend Engineer — Acme Corp (2022–Present)\n- Led frontend architecture for a real-time collaboration platform serving 2M+ users\n- Reduced initial bundle size by 47% through code splitting, lazy loading, and tree shaking\n- Designed and implemented a component library adopted by 6 product teams\n- Mentored 4 mid-level engineers through structured 1:1s and code reviews\n\n### Frontend Engineer — DevTools Inc (2020–2022)\n- Built a drag-and-drop workflow builder processing 10M+ automations per day\n- Migrated a 120k-line codebase from JavaScript to TypeScript with zero downtime\n- Improved Lighthouse performance score from 54 to 94 across core user flows\n\n### Junior Frontend Engineer — WebAgency Co (2018–2020)\n- Delivered 20+ client projects using React, Vue, and vanilla JavaScript\n- Introduced automated accessibility testing, reducing a11y issues by 80%\n\n## Skills\n\n**Frontend:** React, TypeScript, Next.js, Vite, TanStack Query, Zustand, Tailwind CSS\n**Testing:** Vitest, Testing Library, Playwright, Storybook\n**Backend:** Node.js, PostgreSQL, REST, GraphQL\n**Tooling:** Git, GitHub Actions, Vercel, AWS, Docker\n\n## Education\n\nB.S. Computer Science — UC Berkeley (2018)',
      NULL, NULL, '3',
      NULL,
      '["resume","primary","senior-frontend"]',
      NULL
    ),
    (
      'dd000002-0000-4000-8000-000000000001', v_user_id,
      'Full Stack Engineer Resume',
      'resume',
      E'# Alex Rivera\n\nSan Francisco, CA · alex.rivera@email.com · github.com/alexrivera\n\n---\n\n## Summary\n\nFull Stack Engineer with 7 years building production web applications end-to-end. Strong React and TypeScript frontend skills paired with solid Node.js, PostgreSQL, and cloud infrastructure experience.\n\n## Experience\n\n### Senior Frontend Engineer — Acme Corp (2022–Present)\n- Owned full-stack development of a data pipeline monitoring dashboard (React + Node.js + PostgreSQL)\n- Built internal REST and GraphQL APIs consumed by web and mobile clients\n- Led migration from a monolith to a microservices architecture for the billing domain\n\n### Frontend Engineer — DevTools Inc (2020–2022)\n- Built real-time collaboration features using WebSockets and CRDT algorithms\n- Designed PostgreSQL schemas for multi-tenant SaaS application\n- Developed Node.js ETL pipelines processing 500GB+ of data daily\n\n## Skills\n\n**Frontend:** React, TypeScript, Next.js, TanStack Router, Tailwind CSS\n**Backend:** Node.js, Python, PostgreSQL, Redis, GraphQL, REST APIs\n**Infrastructure:** AWS (EC2, RDS, S3, Lambda), Docker, Kubernetes, Terraform\n**Testing:** Jest, Vitest, Playwright, pytest\n\n## Education\n\nB.S. Computer Science — UC Berkeley (2018)',
      NULL, NULL, '2',
      'dd000001-0000-4000-8000-000000000001',
      '["resume","full-stack","alternate"]',
      NULL
    ),
    (
      'dd000003-0000-4000-8000-000000000001', v_user_id,
      'TechCorp Inc — Cover Letter',
      'cover-letter',
      E'Dear TechCorp Hiring Team,\n\nI am excited to apply for the Senior Frontend Developer role at TechCorp Inc. Your work on cloud infrastructure tooling is exactly the space I have been wanting to contribute to — building developer-facing products that improve the lives of engineering teams at scale.\n\nAt Acme Corp, I led the frontend architecture for our real-time collaboration platform, reducing bundle size by 47% and building a component library now used by six product teams. I have a deep appreciation for the performance and reliability requirements that come with infrastructure-grade software, and I would bring that same rigor to TechCorp.\n\nYour engineering blog post on your distributed component caching system caught my attention — I have faced similar challenges and would love to discuss how I approached them.\n\nThank you for your consideration.\n\nBest,\nAlex Rivera',
      NULL, NULL, '1',
      NULL,
      '["cover-letter","techcorp"]',
      NULL
    ),
    (
      'dd000004-0000-4000-8000-000000000001', v_user_id,
      'BigTech Solutions — Cover Letter',
      'cover-letter',
      E'Dear BigTech Solutions Hiring Team,\n\nI am writing to express my strong interest in the React Developer position. BigTech Solutions represents the kind of scale and scope I have been working toward — building interfaces that millions of enterprise users depend on daily.\n\nMy experience leading the frontend rebuild of a mission-critical dashboard at Acme Corp — where reliability and accessibility were non-negotiable — prepared me well for the standards BigTech holds. I have also contributed to internal design systems, which I understand is central to how BigTech engineering operates.\n\nI am particularly drawn to your commitment to developer experience and internal open-source culture. I have been an active contributor to the React and TypeScript ecosystems and would thrive in that environment.\n\nLooking forward to the conversation.\n\nBest,\nAlex Rivera',
      NULL, NULL, '1',
      NULL,
      '["cover-letter","bigtech"]',
      NULL
    ),
    (
      'dd000005-0000-4000-8000-000000000001', v_user_id,
      'InnovateLabs — Cover Letter',
      'cover-letter',
      E'Dear InnovateLabs Team,\n\nI have admired InnovateLabs from a distance for years — your open-source component library is part of my daily toolkit, and your commitment to accessibility and design craft aligns exactly with my own values as an engineer.\n\nI am applying for the Senior Frontend Engineer role because I want to work at the frontier of design systems — not just consuming them, but shaping how thousands of other teams build UI. At Acme Corp, I built a design system from scratch and know intimately the tradeoffs in API design, theming, and documentation.\n\nBeyond the craft, I am drawn to your fully remote, async-first culture. I have worked remote for four years and built strong habits around async communication and deep-work time management.\n\nI would love to talk about how I can contribute.\n\nWarm regards,\nAlex Rivera',
      NULL, NULL, '1',
      NULL,
      '["cover-letter","innovatelabs"]',
      NULL
    )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- APPLICATIONS (20)
  -- a01 BigTech / React Developer / accepted (full journey)
  -- a02 InnovateLabs / Senior Frontend / offer (current)
  -- a03 TechCorp / Senior Frontend / interviewing (upcoming technical Mar 10)
  -- a04 StartupXYZ / Full Stack / interviewing (upcoming behavioral Mar 15)
  -- a05 CloudScale / Software Eng / interviewing (upcoming behavioral Mar 20)
  -- a06 MediaStream / Senior Frontend / rejected (after technical)
  -- a07 CyberSecure / Security Eng / rejected (after technical)
  -- a08 GreenTech / Full Stack Dev / applied
  -- a09 AI Innovations / ML Frontend / applied (upcoming screening Mar 8)
  -- a10 EduTech / Frontend Dev / applied
  -- a11 HealthTech / Frontend Dev / applied
  -- a12 GameDev / Web Dev / rejected (after screening)
  -- a13 FinServ / React Dev / bookmarked
  -- a14 Apex Analytics / Data Viz Eng / archived (declined offer)
  -- a15 NovaMobile / React Native Dev / applied
  -- a16 TechCorp / Staff Frontend Eng / bookmarked
  -- a17 GreenTech / Senior Frontend / interviewing (upcoming technical Mar 25)
  -- a18 AI Innovations / Frontend Eng / rejected (after screening)
  -- a19 FinServ / TypeScript Eng / applied
  -- a20 Apex Analytics / Frontend Arch / applied
  -- =========================================================
  INSERT INTO applications (id, user_id, company_id, position, status, work_type, employment_type, locations, salary, url, job_description, interest, source, tags, applied_at, archived_at, archived_reason)
  VALUES
    (
      'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8', v_user_id,
      '9b4bf110-deb1-4481-8056-d040a57fd757',
      'React Developer',
      'accepted', 'remote', 'full-time',
      ARRAY['Seattle, WA', 'Remote'],
      '{"min":150000,"max":185000,"currency":"USD"}',
      'https://www.bigtechsolutions.com/careers/react-developer',
      E'## React Developer — BigTech Solutions\n\n**Location:** Remote (US)\n**Type:** Full-time\n**Compensation:** $150,000–$185,000 + RSUs + bonus\n\n### About the Role\n\nJoin BigTech Solutions'' Core UI Platform team and build the interfaces that 500,000+ enterprise users interact with daily. You will own significant surface area across our flagship productivity suite and contribute to our internal React component library used by 40+ product teams.\n\n### Responsibilities\n\n- Build and maintain high-performance React applications with a focus on reliability and accessibility\n- Contribute to and extend our internal design system (Fluent-based)\n- Partner with product and design to translate complex workflows into intuitive UI\n- Lead technical discussions and architecture reviews within the team\n- Mentor engineers and contribute to team engineering standards\n\n### Requirements\n\n- 5+ years of frontend development experience\n- Expert-level React and TypeScript\n- Strong understanding of performance optimization (bundle analysis, memoization, virtualization)\n- Experience building or consuming design systems\n- Excellent written communication for a distributed team\n\n### Nice to Have\n\n- Experience with Azure services\n- GraphQL API experience\n- Familiarity with accessibility standards (WCAG 2.1)\n\n### Benefits\n\nComprehensive health coverage · $5,000 education budget · 6-month parental leave · ESPP · 20 days PTO',
      'high', 'LinkedIn',
      '["react","typescript","design-systems","enterprise","remote"]',
      '2024-01-05T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110002-0000-4000-8000-000000000001', v_user_id,
      '71a24a14-8c4f-45ca-8193-ed3ffb709072',
      'Senior Frontend Engineer',
      'offer', 'remote', 'full-time',
      ARRAY['Remote'],
      '{"min":155000,"max":175000,"currency":"USD"}',
      'https://www.innovatelabs.design/careers/senior-frontend-engineer',
      E'## Senior Frontend Engineer — InnovateLabs\n\n**Location:** Fully Remote\n**Type:** Full-time\n**Compensation:** $155,000–$175,000 + equity\n\n### About the Role\n\nWe are looking for a Senior Frontend Engineer to join our core platform team and help build the next generation of our open-source design system. You will own significant features, collaborate directly with designers, and shape the API surface that thousands of teams use every day.\n\n### Responsibilities\n\n- Develop and maintain components in our open-source React library (8k+ GitHub stars)\n- Design public APIs with a focus on developer experience and long-term stability\n- Write comprehensive documentation, usage examples, and migration guides\n- Contribute to accessibility architecture and testing infrastructure\n- Review community PRs and engage with open-source contributors\n\n### Requirements\n\n- 5+ years React and TypeScript experience\n- Deep understanding of accessibility (WCAG, ARIA, keyboard navigation)\n- Experience with design tokens, theming systems, and CSS architecture\n- Strong open-source communication and documentation skills\n- Experience with testing component libraries (Storybook, Vitest, Testing Library)\n\n### Nice to Have\n\n- Prior open-source contributions or maintainership\n- Experience with Radix UI, Headless UI, or similar primitives\n- Figma API or design token tooling experience\n\n### Benefits\n\nFully remote · $3,500 learning budget · 16-week parental leave · Annual company retreat',
      'high', 'Company Website',
      '["react","typescript","design-systems","open-source","remote","accessibility"]',
      '2026-01-10T00:00:00.000Z',
      NULL, NULL
    ),
    (
      'baffa47e-f414-4850-89f1-80467ea53046', v_user_id,
      'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5',
      'Senior Frontend Developer',
      'interviewing', 'remote', 'full-time',
      ARRAY['San Francisco, CA', 'Remote'],
      '{"min":140000,"max":175000,"currency":"USD"}',
      'https://www.techcorp.io/careers/senior-frontend-developer',
      E'## Senior Frontend Developer — TechCorp Inc\n\n**Location:** Remote (US-based, SF hub optional)\n**Type:** Full-time\n**Compensation:** $140,000–$175,000 + equity\n\n### About the Role\n\nThe Core Platform team at TechCorp is hiring a Senior Frontend Developer to own the developer dashboard — the primary interface for 200,000+ engineering teams managing their cloud infrastructure. This is high-visibility, high-ownership work.\n\n### Responsibilities\n\n- Own the frontend architecture for the TechCorp developer dashboard\n- Lead the migration from our current React class components to a modern hooks-based architecture\n- Collaborate with the design systems team to implement and extend our component library\n- Define frontend performance budgets and lead efforts to meet them\n- Conduct technical interviews and grow the frontend team\n\n### Requirements\n\n- 6+ years of frontend development\n- Expert React and TypeScript\n- Strong grasp of web performance (Core Web Vitals, bundle optimization)\n- Experience with complex state management at scale\n- Familiarity with WebSocket or real-time data patterns\n\n### Nice to Have\n\n- Experience with developer tooling or infrastructure products\n- Contributions to open-source projects\n- GraphQL experience\n\n### Benefits\n\nUnlimited PTO · $3,000 learning budget · Remote-first · 16-week parental leave · Equity refresh grants',
      'high', 'LinkedIn',
      '["react","typescript","cloud","developer-tools","remote","senior"]',
      '2026-01-15T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '85eb0794-443b-4af0-ae86-c341aca2c8db', v_user_id,
      '29d82696-d691-49ec-bcd9-dc1a9c2aadcc',
      'Full Stack Engineer',
      'interviewing', 'hybrid-2day', 'full-time',
      ARRAY['New York, NY'],
      '{"min":130000,"max":160000,"currency":"USD"}',
      'https://www.startupxyz.com/careers/full-stack-engineer',
      E'## Full Stack Engineer — StartupXYZ\n\n**Location:** New York, NY (Hybrid 2x/week)\n**Type:** Full-time\n**Compensation:** $130,000–$160,000 + meaningful equity\n\n### About the Role\n\nJoin our 8-person engineering team and help build the payment infrastructure that moves $2B+ per year. You will work across the full stack — React frontends, Node.js APIs, and PostgreSQL data models — with high autonomy and direct founder access.\n\n### Responsibilities\n\n- Build and ship full-stack features across our merchant dashboard and payment APIs\n- Own the data models and API contracts for new product areas\n- Collaborate with founders on product direction and technical architecture\n- Write tests, review code, and hold a high bar for production quality\n- Participate in a lightweight on-call rotation\n\n### Requirements\n\n- 4+ years full stack development (React + Node.js preferred)\n- Strong TypeScript skills across frontend and backend\n- PostgreSQL experience including schema design and query optimization\n- Comfort with ambiguity and ability to drive features end-to-end\n- Excellent product sense\n\n### Nice to Have\n\n- Fintech or payments domain experience\n- GraphQL API design\n- Experience with Stripe, Plaid, or similar payment APIs\n\n### Benefits\n\nMeaningful early-stage equity · Full health coverage · $2,000 learning stipend · Monthly team dinners',
      'medium', 'Referral',
      '["full-stack","react","node","fintech","startup","equity"]',
      '2026-01-20T00:00:00.000Z',
      NULL, NULL
    ),
    (
      'e7adb4ab-dba0-4500-924b-bfddb80c3aeb', v_user_id,
      '4769b594-1f5a-4207-8123-deea2272668d',
      'Software Engineer',
      'interviewing', 'remote', 'full-time',
      ARRAY['Austin, TX', 'Remote'],
      '{"min":135000,"max":165000,"currency":"USD"}',
      'https://www.cloudscale.dev/jobs/software-engineer',
      E'## Software Engineer — CloudScale Systems\n\n**Location:** Remote (US/EU)\n**Type:** Full-time\n**Compensation:** $135,000–$165,000 + equity\n\n### About the Role\n\nCloudScale is looking for a Software Engineer to join our Observability team. You will build the UI and backend for our metrics and tracing dashboards — the interfaces through which engineers understand and debug their distributed systems.\n\n### Responsibilities\n\n- Build the frontend for our real-time metrics dashboards (React + TypeScript)\n- Develop Go microservices for data aggregation and API endpoints\n- Contribute to our open-source SDKs (TypeScript, Go, Python)\n- Participate in design reviews, RFCs, and architectural discussions\n- Join a lightweight on-call rotation for services you own\n\n### Requirements\n\n- 4+ years of software engineering experience\n- Strong React and TypeScript for frontend work\n- Proficiency in at least one backend language (Go preferred, Node.js acceptable)\n- Experience with time-series data, metrics systems, or observability tooling\n- Excellent async communication skills for a distributed team\n\n### Nice to Have\n\n- Contributions to open-source projects\n- Experience with Prometheus, Grafana, or OpenTelemetry\n- Kubernetes operator experience\n\n### Benefits\n\nFully remote · $2,500 conference budget · Annual team retreat · Flexible hours',
      'high', 'Indeed',
      '["go","react","typescript","observability","remote","open-source"]',
      '2025-10-28T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110006-0000-4000-8000-000000000001', v_user_id,
      'f7219323-187e-47ba-9d65-8a0a1953c3d1',
      'Senior Frontend Engineer',
      'rejected', 'remote', 'full-time',
      ARRAY['Los Angeles, CA', 'Remote'],
      '{"min":145000,"max":180000,"currency":"USD"}',
      'https://www.mediastream.co/careers/senior-frontend-engineer',
      E'## Senior Frontend Engineer — MediaStream Co\n\n**Location:** Remote (Los Angeles hub)\n**Type:** Full-time\n**Compensation:** $145,000–$180,000 + equity\n\n### About the Role\n\nJoin the Player Experience team at MediaStream and build the video player interfaces used by 200M+ concurrent viewers. Performance, reliability, and latency are core concerns — this is frontend engineering at its most demanding.\n\n### Responsibilities\n\n- Own and evolve the web player UI (React + WebRTC)\n- Build real-time analytics overlays and viewer engagement features\n- Collaborate with backend teams on streaming protocols and CDN optimization\n- Ensure playback performance across a wide range of devices and network conditions\n\n### Requirements\n\n- 6+ years frontend engineering\n- Expert React and TypeScript\n- Experience with media APIs (MediaSource Extensions, WebRTC, HLS.js)\n- Strong understanding of browser performance profiling\n- Experience with real-time data and WebSocket connections\n\n### Benefits\n\nPremium health coverage · $4,000 education budget · 16-week parental leave · Free streaming',
      'medium', 'LinkedIn',
      '["react","webrtc","streaming","media","remote","senior"]',
      '2025-11-05T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110007-0000-4000-8000-000000000001', v_user_id,
      'f4d4155e-e02a-4230-8684-2da4a79d9b46',
      'Frontend Security Engineer',
      'rejected', 'hybrid-3day', 'full-time',
      ARRAY['Austin, TX'],
      '{"min":140000,"max":170000,"currency":"USD"}',
      'https://www.cybersecure.io/careers/frontend-security-engineer',
      E'## Frontend Security Engineer — CyberSecure Systems\n\n**Location:** Austin, TX (Hybrid 3x/week)\n**Type:** Full-time\n**Compensation:** $140,000–$170,000 + equity\n\n### About the Role\n\nBuild the dashboards and investigative interfaces that security analysts use to detect, triage, and respond to threats in real time. Your work directly enables security teams to protect their organizations.\n\n### Responsibilities\n\n- Build threat visualization and incident response UIs (React + TypeScript)\n- Implement secure data handling and display of sensitive security telemetry\n- Collaborate with backend teams on real-time alert streaming\n- Build complex data tables, graph visualizations, and timeline components\n- Apply security best practices to all frontend code (CSP, XSS prevention, etc.)\n\n### Requirements\n\n- 5+ years React and TypeScript\n- Understanding of web security fundamentals (XSS, CSRF, CSP, OAuth2)\n- Experience with data visualization (D3.js, Recharts, or similar)\n- Comfort working with complex, high-stakes real-time data\n\n### Benefits\n\nTop-of-market comp · DEF CON/Black Hat conference budget · 401k 4% match',
      'medium', 'LinkedIn',
      '["react","security","typescript","visualization","hybrid"]',
      '2026-01-25T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110008-0000-4000-8000-000000000001', v_user_id,
      '834e566f-4e01-4844-a7b6-eaf8025f81b0',
      'Full Stack Developer',
      'applied', 'remote', 'full-time',
      ARRAY['Portland, OR', 'Remote'],
      '{"min":120000,"max":150000,"currency":"USD"}',
      'https://www.greentech.solutions/jobs/full-stack-developer',
      E'## Full Stack Developer — GreenTech Solutions\n\n**Location:** Remote (Portland hub)\n**Type:** Full-time\n**Compensation:** $120,000–$150,000 + equity\n\n### About the Role\n\nHelp build the carbon tracking and ESG reporting platform that enterprise sustainability teams use to measure and reduce their environmental impact. You will own full-stack features from API to UI.\n\n### Responsibilities\n\n- Build React dashboards for carbon tracking and sustainability reporting\n- Develop Node.js APIs and data pipelines for ESG data ingestion\n- Design PostgreSQL schemas for complex time-series environmental data\n- Integrate with third-party data providers (energy grids, logistics APIs)\n\n### Requirements\n\n- 4+ years full stack development\n- Strong React, TypeScript, and Node.js\n- PostgreSQL and REST API experience\n- Interest in sustainability and climate tech\n\n### Benefits\n\nFully remote · Mission-driven · $2,000 learning stipend · 3 volunteer days/year',
      'medium', 'Glassdoor',
      '["full-stack","react","node","climate-tech","remote","mission-driven"]',
      '2026-02-01T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110009-0000-4000-8000-000000000001', v_user_id,
      'de4a4b86-16e8-4131-bc47-71093119b869',
      'Frontend Engineer, AI Platform',
      'applied', 'remote', 'full-time',
      ARRAY['San Francisco, CA', 'Remote'],
      '{"min":160000,"max":200000,"currency":"USD"}',
      'https://www.aiinnovations.ai/careers/frontend-engineer-ai-platform',
      E'## Frontend Engineer, AI Platform — AI Innovations\n\n**Location:** Remote (SF hub)\n**Type:** Full-time\n**Compensation:** $160,000–$200,000 + pre-IPO equity\n\n### About the Role\n\nBuild the interfaces through which enterprise teams interact with our AI platform — prompt playgrounds, model evaluation dashboards, RAG pipeline builders, and API usage analytics. You will be the bridge between ML researchers and end users.\n\n### Responsibilities\n\n- Build the AI platform developer portal and evaluation UIs (React + TypeScript)\n- Implement streaming UI patterns for LLM responses (SSE, WebSockets)\n- Create rich data visualizations for model performance and usage analytics\n- Collaborate directly with ML researchers to make complex outputs interpretable\n\n### Requirements\n\n- 5+ years React and TypeScript\n- Experience with streaming data patterns in UI (SSE, WebSockets, real-time updates)\n- Strong data visualization skills\n- Curiosity about AI/ML systems and ability to quickly understand technical concepts\n\n### Nice to Have\n\n- Experience building LLM-facing developer tools\n- Python familiarity for reading ML code\n- Prior work at AI/ML companies\n\n### Benefits\n\nPre-IPO equity · $5,000 learning budget · GPU compute credits · 16-week parental leave',
      'high', 'Company Website',
      '["react","typescript","ai","llm","streaming","pre-ipo","remote"]',
      '2026-02-10T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110010-0000-4000-8000-000000000001', v_user_id,
      '55bc02c0-f600-4b25-9e0a-1c51504ae241',
      'Frontend Developer',
      'applied', 'remote', 'full-time',
      ARRAY['Remote'],
      '{"min":110000,"max":135000,"currency":"USD"}',
      'https://www.edutechplatform.com/careers/frontend-developer',
      NULL,
      'low', 'Indeed',
      '["react","typescript","edtech","remote","consumer"]',
      '2026-03-01T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110011-0000-4000-8000-000000000001', v_user_id,
      '42228724-76ee-463e-9ea4-c5d0dc4142a6',
      'Frontend Developer',
      'applied', 'hybrid-2day', 'full-time',
      ARRAY['Boston, MA'],
      '{"min":115000,"max":145000,"currency":"USD"}',
      'https://www.healthtechinnovations.com/careers/frontend-developer',
      NULL,
      'medium', 'LinkedIn',
      '["react","typescript","healthtech","hipaa","hybrid","boston"]',
      '2026-02-18T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110012-0000-4000-8000-000000000001', v_user_id,
      'cba81a67-8f47-4089-8aba-886e8d36d9b9',
      'Web Developer',
      'rejected', 'hybrid-2day', 'full-time',
      ARRAY['Seattle, WA'],
      '{"min":100000,"max":125000,"currency":"USD"}',
      NULL,
      NULL,
      'low', 'Indeed',
      '["webgl","threejs","javascript","gaming","hybrid"]',
      '2025-09-22T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110013-0000-4000-8000-000000000001', v_user_id,
      'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11',
      'React Developer',
      'bookmarked', 'hybrid-3day', 'full-time',
      ARRAY['New York, NY'],
      '{"min":130000,"max":160000,"currency":"USD"}',
      'https://www.finservtech.com/careers/react-developer',
      NULL,
      'medium', NULL,
      '["react","typescript","fintech","banking","hybrid","nyc"]',
      NULL,
      NULL, NULL
    ),
    (
      '11110014-0000-4000-8000-000000000001', v_user_id,
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'Data Visualization Engineer',
      'archived', 'remote', 'full-time',
      ARRAY['Chicago, IL', 'Remote'],
      '{"min":145000,"max":175000,"currency":"USD"}',
      'https://www.apexanalytics.io/careers/data-viz-engineer',
      E'## Data Visualization Engineer — Apex Analytics\n\n**Location:** Remote (Chicago hub)\n**Type:** Full-time\n**Compensation:** $145,000–$175,000 + equity\n\n### About the Role\n\nBuild the visualization layer for a platform processing 500 billion events per day. Engineers at Apex see and understand their data through the interfaces you build.\n\n### Responsibilities\n\n- Build real-time charts and dashboards (React + D3.js + TypeScript)\n- Implement performant rendering for large-scale time-series data\n- Design reusable visualization components for the internal library\n- Collaborate with data engineers on query API design\n\n### Requirements\n\n- 5+ years React and TypeScript\n- Strong data visualization experience (D3.js, Recharts, Victory, or similar)\n- Experience rendering large datasets efficiently (virtualization, canvas, WebGL)\n- Understanding of time-series data and analytics concepts\n\n### Benefits\n\nSeries C equity · $3,000 learning budget · Remote-flexible · $1,000 home office stipend',
      'high', 'AngelList',
      '["react","d3","data-viz","analytics","remote","series-c"]',
      '2025-12-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      'Declined offer — accepted BigTech Solutions position'
    ),
    (
      '11110015-0000-4000-8000-000000000001', v_user_id,
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      'React Native Developer',
      'applied', 'remote', 'full-time',
      ARRAY['Denver, CO', 'Remote'],
      '{"min":115000,"max":140000,"currency":"USD"}',
      'https://www.novamobile.app/careers/react-native-developer',
      NULL,
      'medium', 'LinkedIn',
      '["react-native","mobile","typescript","offline-first","startup"]',
      '2026-02-20T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110016-0000-4000-8000-000000000001', v_user_id,
      'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5',
      'Staff Frontend Engineer',
      'bookmarked', 'remote', 'full-time',
      ARRAY['San Francisco, CA', 'Remote'],
      '{"min":185000,"max":230000,"currency":"USD"}',
      'https://www.techcorp.io/careers/staff-frontend-engineer',
      NULL,
      'high', NULL,
      '["react","typescript","staff","cloud","remote","senior-ic"]',
      NULL,
      NULL, NULL
    ),
    (
      '11110017-0000-4000-8000-000000000001', v_user_id,
      '834e566f-4e01-4844-a7b6-eaf8025f81b0',
      'Senior Frontend Engineer',
      'interviewing', 'remote', 'full-time',
      ARRAY['Portland, OR', 'Remote'],
      '{"min":130000,"max":160000,"currency":"USD"}',
      'https://www.greentech.solutions/jobs/senior-frontend-engineer',
      NULL,
      'medium', 'Glassdoor',
      '["react","typescript","climate-tech","remote","senior","mission-driven"]',
      '2026-02-05T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110018-0000-4000-8000-000000000001', v_user_id,
      'de4a4b86-16e8-4131-bc47-71093119b869',
      'Frontend Engineer',
      'rejected', 'remote', 'full-time',
      ARRAY['San Francisco, CA', 'Remote'],
      '{"min":140000,"max":175000,"currency":"USD"}',
      NULL,
      NULL,
      'low', 'LinkedIn',
      '["react","typescript","ai","remote"]',
      '2025-10-15T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110019-0000-4000-8000-000000000001', v_user_id,
      'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11',
      'TypeScript Engineer',
      'applied', 'hybrid-2day', 'full-time',
      ARRAY['New York, NY'],
      '{"min":135000,"max":165000,"currency":"USD"}',
      'https://www.finservtech.com/careers/typescript-engineer',
      NULL,
      'medium', 'Company Website',
      '["typescript","react","fintech","banking","hybrid","nyc"]',
      '2026-03-02T00:00:00.000Z',
      NULL, NULL
    ),
    (
      '11110020-0000-4000-8000-000000000001', v_user_id,
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'Frontend Architect',
      'applied', 'remote', 'full-time',
      ARRAY['Chicago, IL', 'Remote'],
      '{"min":160000,"max":195000,"currency":"USD"}',
      'https://www.apexanalytics.io/careers/frontend-architect',
      NULL,
      'high', 'AngelList',
      '["react","typescript","data-viz","analytics","architecture","remote"]',
      '2026-02-25T00:00:00.000Z',
      NULL, NULL
    )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- CONTACTS (14)
  -- =========================================================
  INSERT INTO contacts (id, user_id, company_id, name, title, email, phone, linkedin_url, notes)
  VALUES
    (
      'cc000001-0000-4000-8000-000000000001', v_user_id,
      'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5',
      'Sarah Johnson', 'Senior Technical Recruiter',
      'sarah.johnson@techcorp.io', NULL,
      'https://www.linkedin.com/in/sarahjohnson',
      'Initial contact via LinkedIn. Very responsive, usually replies same day. Prefers email for scheduling. Mentioned the team is growing fast and the hiring bar is high but fair. Good to mention the dashboard performance work in interviews.'
    ),
    (
      'cc000002-0000-4000-8000-000000000001', v_user_id,
      '9b4bf110-deb1-4481-8056-d040a57fd757',
      'Michael Chen', 'Principal Engineer, Core UI',
      'michael.chen@bigtechsolutions.com', '+1 (206) 555-0142',
      'https://www.linkedin.com/in/michaelchen-bigtech',
      'Conducted behavioral, technical, and onsite rounds. Deep expertise in React performance and distributed UI systems. Very direct feedback style — appreciated the design systems discussion. Would be direct manager if offer is accepted. Mentioned team runs bi-weekly architecture reviews.'
    ),
    (
      'cc000003-0000-4000-8000-000000000001', v_user_id,
      '29d82696-d691-49ec-bcd9-dc1a9c2aadcc',
      'Emily Rodriguez', 'Senior Software Engineer',
      'emily@startupxyz.com', NULL,
      NULL,
      'University friend who provided the referral. Said the team is small but very strong. Mentioned the founders are ex-Stripe and deeply technical. She likes it there. Heads up: the technical round involves a live coding exercise on their internal codebase.'
    ),
    (
      'cc000004-0000-4000-8000-000000000001', v_user_id,
      '834e566f-4e01-4844-a7b6-eaf8025f81b0',
      'Tom Wilson', 'Engineering Manager',
      'tom.wilson@greentech.solutions', '+1 (503) 555-0187',
      'https://www.linkedin.com/in/tomwilson-greentech',
      'Will be the hiring manager for the senior frontend role. Passionate about the climate mission — good to lead with that in conversations. Mentioned the team is small (4 engineers) and values autonomy and ownership. Prefers engineers who write well.'
    ),
    (
      'cc000005-0000-4000-8000-000000000001', v_user_id,
      'f7219323-187e-47ba-9d65-8a0a1953c3d1',
      'Rachel Kim', 'Principal Engineer, Player Experience',
      'rachel.kim@mediastream.co', NULL,
      'https://www.linkedin.com/in/rachelkim-media',
      'Conducted both the screening and technical rounds. Expert in WebRTC and streaming protocols — the technical questions focused on browser performance and media APIs. Process ultimately ended in rejection; said the team needed deeper streaming experience. Left a positive impression — keep in touch.'
    ),
    (
      'cc000006-0000-4000-8000-000000000001', v_user_id,
      'f4d4155e-e02a-4230-8684-2da4a79d9b46',
      'Amanda Lee', 'Engineering Manager, Platform UI',
      'amanda.lee@cybersecure.io', '+1 (512) 555-0219',
      'https://www.linkedin.com/in/amandalee-cybersecure',
      'Ran all three rounds. Very professional and structured process. Rejection was due to compensation expectations gap — she indicated budget was firm. Said she was impressed overall. Worth revisiting if they repost at a higher band.'
    ),
    (
      'cc000007-0000-4000-8000-000000000001', v_user_id,
      '834e566f-4e01-4844-a7b6-eaf8025f81b0',
      'Emma Brown', 'Talent Acquisition Specialist',
      'emma.brown@greentech.solutions', NULL,
      NULL,
      'Coordinating the senior frontend search. Very communicative and organized. Mentioned two other candidates in process. Good to reference the climate mission in follow-ups.'
    ),
    (
      'cc000008-0000-4000-8000-000000000001', v_user_id,
      '71a24a14-8c4f-45ca-8193-ed3ffb709072',
      'David Park', 'Head of Engineering',
      'david.park@innovatelabs.design', NULL,
      'https://www.linkedin.com/in/davidpark-innovatelabs',
      'Conducted all three interview rounds personally. Open-source enthusiast — mentioned our shared interest in Radix UI. The offer is strong. He emphasized team culture and craft as differentiators. Would be direct manager. Very thoughtful, considered leader.'
    ),
    (
      'cc000009-0000-4000-8000-000000000001', v_user_id,
      '9b4bf110-deb1-4481-8056-d040a57fd757',
      'Lisa Chen', 'Senior Technical Recruiter',
      'lisa.chen@bigtechsolutions.com', '+1 (206) 555-0308',
      'https://www.linkedin.com/in/lisachen-bigtech',
      'Primary recruiter contact for BigTech. Very organized and responsive. Sent prep materials before each round. Coordinated the onsite logistics seamlessly. Good relationship — she pushed internally for the strong offer that was ultimately accepted.'
    ),
    (
      'cc000010-0000-4000-8000-000000000001', v_user_id,
      '4769b594-1f5a-4207-8123-deea2272668d',
      'James Williams', 'Engineering Manager, Observability',
      'james.williams@cloudscale.dev', '+1 (512) 555-0156',
      'https://www.linkedin.com/in/jameswilliams-cloudscale',
      'Would be direct manager. Very technical — came from Prometheus core team. Interested in the observability dashboard work at Acme Corp. Behavioral round scheduled. Mentioned the team is expanding from 5 to 8 engineers over the next quarter.'
    ),
    (
      'cc000011-0000-4000-8000-000000000001', v_user_id,
      'de4a4b86-16e8-4131-bc47-71093119b869',
      'Maria Garcia', 'Technical Recruiter',
      'maria.garcia@aiinnovations.ai', NULL,
      'https://www.linkedin.com/in/mariagarcia-ai',
      'Recruiter contact for both AI Innovations applications. The senior role (a09) is moving to screening — she will coordinate scheduling. Previously rejected for the earlier frontend engineer role (a18) after screening round.'
    ),
    (
      'cc000012-0000-4000-8000-000000000001', v_user_id,
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'Kevin O''Brien', 'CTO and Co-Founder',
      'kevin@apexanalytics.io', '+1 (312) 555-0174',
      'https://www.linkedin.com/in/kevino-apex',
      'Interviewed for the Data Viz Engineer role — went through screening, technical, and a full onsite. Offer was strong but ultimately declined to accept BigTech offer. Kevin was gracious about it and said to reach out if things change. Strong connection worth maintaining. The frontend architect role (a20) is a second attempt.'
    ),
    (
      'cc000013-0000-4000-8000-000000000001', v_user_id,
      '42228724-76ee-463e-9ea4-c5d0dc4142a6',
      'Priya Patel', 'Talent Acquisition Lead',
      'priya.patel@healthtechinnovations.com', NULL,
      'https://www.linkedin.com/in/priyapatel-healthtech',
      'Initial contact via LinkedIn InMail. Mentioned the team is specifically looking for someone comfortable navigating HIPAA constraints in frontend work. Application submitted, waiting to hear back.'
    ),
    (
      'cc000014-0000-4000-8000-000000000001', v_user_id,
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      'Marcus Johnson', 'CEO and Co-Founder',
      NULL, '+1 (720) 555-0293',
      'https://www.linkedin.com/in/marcusjohnson-novamobile',
      'Reached out directly via LinkedIn. Company is Series A, 40 people. Marcus is hands-on and doing engineering screening calls personally. Mentioned they need someone who can own the entire mobile frontend. Equity package is early-stage attractive.'
    )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- EVENTS
  -- =========================================================
  INSERT INTO events (id, user_id, application_id, type, status, url, title, description, duration_minutes, scheduled_at, notes)
  VALUES
    -- a01: BigTech / React Developer / ACCEPTED (full journey Jan 2024)
    (
      'ee000001-0000-4000-8000-000000000001', v_user_id,
      'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2024-01-08T14:00:00Z',
      'Intro call with Lisa Chen (recruiter). Covered background, motivations, and role overview. Went well — she said she would fast-track to the hiring manager round. Compensation expectations aligned.'
    ),
    (
      'ee000002-0000-4000-8000-000000000001', v_user_id,
      'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8',
      'behavioral-interview', 'completed', 'https://teams.microsoft.com/l/meeting/abc123', NULL, NULL, 60,
      '2024-01-14T15:00:00Z',
      'Video call with Michael Chen. STAR-format questions: conflict resolution, mentoring, delivering under ambiguity. He also asked about design system experience in depth. Good signal at the end — asked about my timeline.'
    ),
    (
      'ee000003-0000-4000-8000-000000000001', v_user_id,
      'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8',
      'technical-interview', 'completed', 'https://teams.microsoft.com/l/meeting/def456', NULL, NULL, 90,
      '2024-01-20T16:00:00Z',
      'Live coding with Michael Chen. Built a virtualized list component from scratch in TypeScript — focused on performance characteristics and API design. Follow-up questions about memoization strategies and React Fiber reconciliation. Strong round.'
    ),
    (
      'ee000004-0000-4000-8000-000000000001', v_user_id,
      'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8',
      'onsite', 'completed', NULL, NULL, NULL, 240,
      '2024-01-27T09:00:00Z',
      'Full-day virtual onsite: 4 rounds with the team. System design (distributed component caching), deep dive on past projects, coding (accessibility-focused component), and culture fit with VP Eng. Lisa called same afternoon with positive feedback. Offer expected within a week.'
    ),

    -- a02: InnovateLabs / Senior Frontend / OFFER
    (
      'ee000005-0000-4000-8000-000000000001', v_user_id,
      '11110002-0000-4000-8000-000000000001',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2026-01-13T14:00:00Z',
      'Intro call with David Park (Head of Engineering). Relaxed, conversational — we talked about open-source philosophy and the design system landscape for 20 minutes. He clearly cares deeply about API design quality. Strong mutual interest. Moving to technical round.'
    ),
    (
      'ee000006-0000-4000-8000-000000000001', v_user_id,
      '11110002-0000-4000-8000-000000000001',
      'technical-interview', 'completed', 'https://meet.google.com/innova-tech-01', NULL, NULL, 75,
      '2026-01-21T15:00:00Z',
      'Pair programming session — built an accessible combobox component with keyboard navigation from scratch. David asked about ARIA patterns and focus management in detail. Also reviewed a PR from their open-source repo and gave live feedback. Very collaborative feel.'
    ),
    (
      'ee000007-0000-4000-8000-000000000001', v_user_id,
      '11110002-0000-4000-8000-000000000001',
      'behavioral-interview', 'completed', 'https://meet.google.com/innova-behav-01', NULL, NULL, 45,
      '2026-01-29T16:00:00Z',
      'Culture and values round with David and two senior engineers. Discussed remote working style, async communication, and how I handle disagreements on API design. Very aligned on values. David mentioned the offer was coming and asked about start date preferences.'
    ),

    -- a03: TechCorp / Senior Frontend / INTERVIEWING (technical UPCOMING Mar 10)
    (
      'ee000008-0000-4000-8000-000000000001', v_user_id,
      'baffa47e-f414-4850-89f1-80467ea53046',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2026-01-20T11:00:00Z',
      'Call with Sarah Johnson. Role overview and background check. She highlighted that the dashboard performance work is a priority — good fit signal. Said the team is mid-cycle and wants to move quickly. Compensation aligned.'
    ),
    (
      'ee000009-0000-4000-8000-000000000001', v_user_id,
      'baffa47e-f414-4850-89f1-80467ea53046',
      'behavioral-interview', 'completed', 'https://meet.google.com/techcorp-beh-01', NULL, NULL, 45,
      '2026-02-03T14:00:00Z',
      'Behavioral round with the engineering manager. Questions about leading architectural migrations, handling ambiguous requirements, and cross-team collaboration. Went well — he mentioned he was impressed with the class-to-hooks migration story at Acme. Moving to technical.'
    ),
    (
      'ee000010-0000-4000-8000-000000000001', v_user_id,
      'baffa47e-f414-4850-89f1-80467ea53046',
      'technical-interview', 'scheduled', 'https://meet.google.com/techcorp-tech-01', NULL, NULL, 90,
      now() + interval '7 days',
      'Live coding + system design. Sarah said to expect: React performance optimization scenario and a component API design exercise. Review useMemo/useCallback tradeoffs, virtual scrolling, and how to architect a multi-step form with validation.'
    ),

    -- a04: StartupXYZ / Full Stack / INTERVIEWING (behavioral UPCOMING Mar 15)
    (
      'ee000011-0000-4000-8000-000000000001', v_user_id,
      '85eb0794-443b-4af0-ae86-c341aca2c8db',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2026-01-24T10:00:00Z',
      'Intro call. Emily connected us directly with the CTO. Very technical screening — he asked about PostgreSQL schema design immediately. Good energy. Mentioned they need someone who can own backend and frontend without hand-holding.'
    ),
    (
      'ee000012-0000-4000-8000-000000000001', v_user_id,
      '85eb0794-443b-4af0-ae86-c341aca2c8db',
      'technical-interview', 'completed', 'https://meet.google.com/startupxyz-tech-01', NULL, NULL, 90,
      '2026-02-01T15:00:00Z',
      'Live coding on their staging codebase — added a new payment method to the checkout flow (React + Node.js + Stripe). CTO was watching silently. Finished in time and tests passed. Post-session conversation about GraphQL migration they are planning. Strong round.'
    ),
    (
      'ee000013-0000-4000-8000-000000000001', v_user_id,
      '85eb0794-443b-4af0-ae86-c341aca2c8db',
      'behavioral-interview', 'scheduled', 'https://meet.google.com/startupxyz-beh-01', NULL, NULL, 45,
      now() + interval '12 days',
      'Final round with CEO and CTO together. Emily mentioned this is a culture and values conversation — they want to understand decision-making style and startup mindset. Prepare examples of shipping under ambiguity and handling conflicting stakeholder priorities.'
    ),

    -- a05: CloudScale / Software Eng / INTERVIEWING (behavioral UPCOMING Mar 20)
    (
      'ee000014-0000-4000-8000-000000000001', v_user_id,
      'e7adb4ab-dba0-4500-924b-bfddb80c3aeb',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2025-11-02T13:00:00Z',
      'Call with James Williams. He is technical and got into specifics quickly — asked about observability experience and time-series data rendering. Mentioned the team is async-first and values written communication. He sent a writing exercise as a follow-up. Completed and received positive feedback.'
    ),
    (
      'ee000015-0000-4000-8000-000000000001', v_user_id,
      'e7adb4ab-dba0-4500-924b-bfddb80c3aeb',
      'behavioral-interview', 'scheduled', 'https://meet.google.com/cloudscale-beh-01', NULL, NULL, 60,
      now() + interval '17 days',
      'Values and working style round with James and two team members. Expect questions about async communication, remote work habits, and how I approach technical disagreements in a distributed team. Review their engineering blog posts and RFC process beforehand.'
    ),

    -- a06: MediaStream / Senior Frontend / REJECTED (after technical Nov 2025)
    (
      'ee000016-0000-4000-8000-000000000001', v_user_id,
      '11110006-0000-4000-8000-000000000001',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2025-11-10T11:00:00Z',
      'Intro call with Rachel Kim directly (unusual for a principal to do screening). She was testing for streaming knowledge early. I held my own on WebRTC basics but gaps in HLS adaptive bitrate were apparent. She decided to move forward anyway to see the full picture.'
    ),
    (
      'ee000017-0000-4000-8000-000000000001', v_user_id,
      '11110006-0000-4000-8000-000000000001',
      'technical-interview', 'completed', 'https://meet.google.com/mediastream-tech-01', NULL, NULL, 75,
      '2025-11-20T14:00:00Z',
      'Deep technical round focused on browser video APIs. Questions about MSE (MediaSource Extensions), buffering strategies, and network condition simulation in tests. The gap in HLS/DASH experience was the deciding factor. Rejection email arrived 3 days later. Note to self: invest time in media streaming APIs if this direction remains interesting.'
    ),

    -- a07: CyberSecure / Security Eng / REJECTED (after technical Feb 2026)
    (
      'ee000018-0000-4000-8000-000000000001', v_user_id,
      '11110007-0000-4000-8000-000000000001',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2026-01-28T10:00:00Z',
      'Call with Amanda Lee. Role overview and culture fit discussion. She mentioned the team values security-first thinking in every code decision. Compensation expectations were slightly above their initial range — she said she would check internally.'
    ),
    (
      'ee000019-0000-4000-8000-000000000001', v_user_id,
      '11110007-0000-4000-8000-000000000001',
      'behavioral-interview', 'completed', 'https://meet.google.com/cybersecure-beh-01', NULL, NULL, 45,
      '2026-02-10T14:00:00Z',
      'Behavioral round with Amanda and a staff engineer. Questions focused on handling security vulnerabilities in production, working with security researchers, and threat modeling for UI features. Good energy throughout. Moving to technical round.'
    ),
    (
      'ee000020-0000-4000-8000-000000000001', v_user_id,
      '11110007-0000-4000-8000-000000000001',
      'technical-interview', 'completed', 'https://meet.google.com/cybersecure-tech-01', NULL, NULL, 90,
      '2026-02-20T15:00:00Z',
      'Technical round with two senior engineers. Built a CSP configuration UI with real-time policy validation. Solid execution but they probed deep on XSS mitigation patterns and browser security headers. Rejection came 5 days later citing compensation budget as the primary reason. Amanda confirmed this privately.'
    ),

    -- a09: AI Innovations / Frontend Engineer AI Platform / APPLIED (screening UPCOMING Mar 8)
    (
      'ee000021-0000-4000-8000-000000000001', v_user_id,
      '11110009-0000-4000-8000-000000000001',
      'screening-interview', 'scheduled', 'https://meet.google.com/aiinn-screen-01', NULL, NULL, 30,
      now() + interval '5 days',
      'Intro call with Maria Garcia. Research the company: read their recent LLM evaluation blog post and the streaming UI architecture post. Prepare to discuss SSE and WebSocket patterns in React. They care about both technical depth and curiosity about AI.'
    ),

    -- a12: GameDev / Web Dev / REJECTED (after screening Sep 2025)
    (
      'ee000022-0000-4000-8000-000000000001', v_user_id,
      '11110012-0000-4000-8000-000000000001',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2025-09-26T11:00:00Z',
      'Intro call with a recruiter. The conversation revealed a compensation gap early — they offered below expectations. Three.js and WebGL experience was not deep enough for the specific role. Mutual decision not to proceed to next round.'
    ),

    -- a14: Apex Analytics / Data Viz / ARCHIVED (full journey through offer Dec 2025 - Jan 2026)
    (
      'ee000023-0000-4000-8000-000000000001', v_user_id,
      '11110014-0000-4000-8000-000000000001',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2025-12-05T14:00:00Z',
      'Call with Kevin O''Brien (CTO) directly. He wanted to understand the data viz background immediately. We talked about rendering strategies for large datasets and D3 vs Recharts tradeoffs for 30 minutes. Very technical CTO. Strong start.'
    ),
    (
      'ee000024-0000-4000-8000-000000000001', v_user_id,
      '11110014-0000-4000-8000-000000000001',
      'technical-interview', 'completed', 'https://meet.google.com/apex-tech-01', NULL, NULL, 90,
      '2025-12-15T15:00:00Z',
      'Built a real-time time-series chart using React and D3 with WebSocket data updates. Kevin reviewed the implementation live and asked about canvas vs SVG performance tradeoffs. Also a system design round on paginated/virtualized chart data. Excellent round overall.'
    ),
    (
      'ee000025-0000-4000-8000-000000000001', v_user_id,
      '11110014-0000-4000-8000-000000000001',
      'onsite', 'completed', NULL, NULL, NULL, 240,
      '2026-01-05T09:00:00Z',
      'Virtual onsite: 4 sessions over 4 hours. Deep dive on past data viz projects, frontend architecture review with the team, product sense round with PM, and a comp/offer discussion with Kevin. Offer came 2 days later. Competitive but ultimately declined to take the BigTech offer.'
    ),

    -- a17: GreenTech Senior Frontend / INTERVIEWING (technical UPCOMING Mar 25)
    (
      'ee000026-0000-4000-8000-000000000001', v_user_id,
      '11110017-0000-4000-8000-000000000001',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2026-02-10T11:00:00Z',
      'Intro call with Emma Brown. She emphasized the mission-driven culture and asked about personal interest in sustainability. Mentioned Tom Wilson (EM) is looking for someone with strong React fundamentals who can also contribute to the backend occasionally. Good fit indicators throughout.'
    ),
    (
      'ee000027-0000-4000-8000-000000000001', v_user_id,
      '11110017-0000-4000-8000-000000000001',
      'technical-interview', 'scheduled', 'https://meet.google.com/greentech-tech-01', NULL, NULL, 90,
      now() + interval '22 days',
      'Technical round with Tom Wilson. Emma mentioned: expect a React component architecture exercise and possibly a Node.js API design question. Review GreenTech''s public API documentation before the call. Tom appreciates engineers who think about API consumers, not just implementation.'
    ),

    -- a18: AI Innovations / Frontend Eng / REJECTED (screening Oct 2025)
    (
      'ee000028-0000-4000-8000-000000000001', v_user_id,
      '11110018-0000-4000-8000-000000000001',
      'screening-interview', 'completed', NULL, NULL, NULL, 30,
      '2025-10-20T10:00:00Z',
      'Screening call with Maria Garcia. She mentioned the role required deeper Python and ML familiarity than expected. The rejection came quickly — within 48 hours. No specific feedback beyond "not the right fit at this time." The newer AI Platform role (a09) is a better-scoped match.'
    )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- APPLICATION_DOCUMENTS
  -- =========================================================
  INSERT INTO application_documents (id, application_id, document_id, name, type, content, uri, mime_type, revision)
  VALUES
    -- a01 BigTech: resume + BigTech cover letter
    (
      'ad000001-0000-4000-8000-000000000001',
      'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8',
      'dd000001-0000-4000-8000-000000000001',
      'Senior Frontend Engineer Resume', 'resume', '', NULL, NULL, '3'
    ),
    (
      'ad000002-0000-4000-8000-000000000001',
      'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8',
      'dd000004-0000-4000-8000-000000000001',
      'BigTech Solutions — Cover Letter', 'cover-letter', '', NULL, NULL, '1'
    ),
    -- a02 InnovateLabs: resume + InnovateLabs cover letter
    (
      'ad000003-0000-4000-8000-000000000001',
      '11110002-0000-4000-8000-000000000001',
      'dd000001-0000-4000-8000-000000000001',
      'Senior Frontend Engineer Resume', 'resume', '', NULL, NULL, '3'
    ),
    (
      'ad000004-0000-4000-8000-000000000001',
      '11110002-0000-4000-8000-000000000001',
      'dd000005-0000-4000-8000-000000000001',
      'InnovateLabs — Cover Letter', 'cover-letter', '', NULL, NULL, '1'
    ),
    -- a03 TechCorp: resume + TechCorp cover letter
    (
      'ad000005-0000-4000-8000-000000000001',
      'baffa47e-f414-4850-89f1-80467ea53046',
      'dd000001-0000-4000-8000-000000000001',
      'Senior Frontend Engineer Resume', 'resume', '', NULL, NULL, '3'
    ),
    (
      'ad000006-0000-4000-8000-000000000001',
      'baffa47e-f414-4850-89f1-80467ea53046',
      'dd000003-0000-4000-8000-000000000001',
      'TechCorp Inc — Cover Letter', 'cover-letter', '', NULL, NULL, '1'
    ),
    -- a04 StartupXYZ: full stack resume
    (
      'ad000007-0000-4000-8000-000000000001',
      '85eb0794-443b-4af0-ae86-c341aca2c8db',
      'dd000002-0000-4000-8000-000000000001',
      'Full Stack Engineer Resume', 'resume', '', NULL, NULL, '2'
    ),
    -- a05 CloudScale: resume
    (
      'ad000008-0000-4000-8000-000000000001',
      'e7adb4ab-dba0-4500-924b-bfddb80c3aeb',
      'dd000002-0000-4000-8000-000000000001',
      'Full Stack Engineer Resume', 'resume', '', NULL, NULL, '2'
    ),
    -- a06 MediaStream: resume
    (
      'ad000009-0000-4000-8000-000000000001',
      '11110006-0000-4000-8000-000000000001',
      'dd000001-0000-4000-8000-000000000001',
      'Senior Frontend Engineer Resume', 'resume', '', NULL, NULL, '3'
    ),
    -- a07 CyberSecure: resume
    (
      'ad000010-0000-4000-8000-000000000001',
      '11110007-0000-4000-8000-000000000001',
      'dd000001-0000-4000-8000-000000000001',
      'Senior Frontend Engineer Resume', 'resume', '', NULL, NULL, '3'
    ),
    -- a14 Apex Analytics: resume
    (
      'ad000011-0000-4000-8000-000000000001',
      '11110014-0000-4000-8000-000000000001',
      'dd000001-0000-4000-8000-000000000001',
      'Senior Frontend Engineer Resume', 'resume', '', NULL, NULL, '3'
    ),
    -- a17 GreenTech Senior: resume
    (
      'ad000012-0000-4000-8000-000000000001',
      '11110017-0000-4000-8000-000000000001',
      'dd000001-0000-4000-8000-000000000001',
      'Senior Frontend Engineer Resume', 'resume', '', NULL, NULL, '3'
    )
  ON CONFLICT (id) DO NOTHING;

  -- =========================================================
  -- EVENT_CONTACTS
  -- =========================================================
  INSERT INTO event_contacts (id, event_id, contact_id)
  VALUES
    -- a01 BigTech events
    ('ec000001-0000-4000-8000-000000000001', 'ee000001-0000-4000-8000-000000000001', 'cc000009-0000-4000-8000-000000000001'), -- screening: Lisa Chen
    ('ec000002-0000-4000-8000-000000000001', 'ee000002-0000-4000-8000-000000000001', 'cc000002-0000-4000-8000-000000000001'), -- behavioral: Michael Chen
    ('ec000003-0000-4000-8000-000000000001', 'ee000003-0000-4000-8000-000000000001', 'cc000002-0000-4000-8000-000000000001'), -- technical: Michael Chen
    ('ec000004-0000-4000-8000-000000000001', 'ee000004-0000-4000-8000-000000000001', 'cc000002-0000-4000-8000-000000000001'), -- onsite: Michael Chen
    ('ec000005-0000-4000-8000-000000000001', 'ee000004-0000-4000-8000-000000000001', 'cc000009-0000-4000-8000-000000000001'), -- onsite: Lisa Chen
    -- a02 InnovateLabs events
    ('ec000006-0000-4000-8000-000000000001', 'ee000005-0000-4000-8000-000000000001', 'cc000008-0000-4000-8000-000000000001'), -- screening: David Park
    ('ec000007-0000-4000-8000-000000000001', 'ee000006-0000-4000-8000-000000000001', 'cc000008-0000-4000-8000-000000000001'), -- technical: David Park
    ('ec000008-0000-4000-8000-000000000001', 'ee000007-0000-4000-8000-000000000001', 'cc000008-0000-4000-8000-000000000001'), -- behavioral: David Park
    -- a03 TechCorp events
    ('ec000009-0000-4000-8000-000000000001', 'ee000008-0000-4000-8000-000000000001', 'cc000001-0000-4000-8000-000000000001'), -- screening: Sarah Johnson
    ('ec000010-0000-4000-8000-000000000001', 'ee000009-0000-4000-8000-000000000001', 'cc000001-0000-4000-8000-000000000001'), -- behavioral: Sarah Johnson
    ('ec000011-0000-4000-8000-000000000001', 'ee000010-0000-4000-8000-000000000001', 'cc000001-0000-4000-8000-000000000001'), -- technical (upcoming): Sarah Johnson
    -- a04 StartupXYZ events
    ('ec000012-0000-4000-8000-000000000001', 'ee000011-0000-4000-8000-000000000001', 'cc000003-0000-4000-8000-000000000001'), -- screening: Emily Rodriguez
    ('ec000013-0000-4000-8000-000000000001', 'ee000012-0000-4000-8000-000000000001', 'cc000003-0000-4000-8000-000000000001'), -- technical: Emily Rodriguez
    ('ec000014-0000-4000-8000-000000000001', 'ee000013-0000-4000-8000-000000000001', 'cc000003-0000-4000-8000-000000000001'), -- behavioral (upcoming): Emily Rodriguez
    -- a05 CloudScale events
    ('ec000015-0000-4000-8000-000000000001', 'ee000014-0000-4000-8000-000000000001', 'cc000010-0000-4000-8000-000000000001'), -- screening: James Williams
    ('ec000016-0000-4000-8000-000000000001', 'ee000015-0000-4000-8000-000000000001', 'cc000010-0000-4000-8000-000000000001'), -- behavioral (upcoming): James Williams
    -- a06 MediaStream events
    ('ec000017-0000-4000-8000-000000000001', 'ee000016-0000-4000-8000-000000000001', 'cc000005-0000-4000-8000-000000000001'), -- screening: Rachel Kim
    ('ec000018-0000-4000-8000-000000000001', 'ee000017-0000-4000-8000-000000000001', 'cc000005-0000-4000-8000-000000000001'), -- technical: Rachel Kim
    -- a07 CyberSecure events
    ('ec000019-0000-4000-8000-000000000001', 'ee000018-0000-4000-8000-000000000001', 'cc000006-0000-4000-8000-000000000001'), -- screening: Amanda Lee
    ('ec000020-0000-4000-8000-000000000001', 'ee000019-0000-4000-8000-000000000001', 'cc000006-0000-4000-8000-000000000001'), -- behavioral: Amanda Lee
    ('ec000021-0000-4000-8000-000000000001', 'ee000020-0000-4000-8000-000000000001', 'cc000006-0000-4000-8000-000000000001'), -- technical: Amanda Lee
    -- a09 AI Innovations (upcoming screening)
    ('ec000022-0000-4000-8000-000000000001', 'ee000021-0000-4000-8000-000000000001', 'cc000011-0000-4000-8000-000000000001'), -- screening: Maria Garcia
    -- a14 Apex Analytics events
    ('ec000023-0000-4000-8000-000000000001', 'ee000023-0000-4000-8000-000000000001', 'cc000012-0000-4000-8000-000000000001'), -- screening: Kevin O''Brien
    ('ec000024-0000-4000-8000-000000000001', 'ee000024-0000-4000-8000-000000000001', 'cc000012-0000-4000-8000-000000000001'), -- technical: Kevin O''Brien
    ('ec000025-0000-4000-8000-000000000001', 'ee000025-0000-4000-8000-000000000001', 'cc000012-0000-4000-8000-000000000001'), -- onsite: Kevin O''Brien
    -- a17 GreenTech Senior events
    ('ec000026-0000-4000-8000-000000000001', 'ee000026-0000-4000-8000-000000000001', 'cc000007-0000-4000-8000-000000000001'), -- screening: Emma Brown
    ('ec000027-0000-4000-8000-000000000001', 'ee000027-0000-4000-8000-000000000001', 'cc000004-0000-4000-8000-000000000001'), -- technical (upcoming): Tom Wilson
    ('ec000028-0000-4000-8000-000000000001', 'ee000027-0000-4000-8000-000000000001', 'cc000007-0000-4000-8000-000000000001'), -- technical (upcoming): Emma Brown
    -- a18 AI Innovations rejected
    ('ec000029-0000-4000-8000-000000000001', 'ee000028-0000-4000-8000-000000000001', 'cc000011-0000-4000-8000-000000000001')  -- screening: Maria Garcia
  ON CONFLICT (id) DO NOTHING;

END $$;
