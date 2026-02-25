-- ===========================================================
-- Seed data for local development
-- ===========================================================
-- Prerequisites:
--   1. Run `supabase start`
--   2. Sign up at least one user via the app (http://localhost:3000)
--   3. Run `supabase db reset` (this file runs automatically)
-- ===========================================================

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Ensure a seed user exists in auth.users
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous
  ) VALUES (
    v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'seed@example.com', crypt('password123', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    false, false, false
  ) ON CONFLICT (id) DO NOTHING;
  RAISE NOTICE 'Seeding data for user %', v_user_id;

  INSERT INTO companies (id, user_id, name, description, links, industry, size, location, founded, culture, benefits, pros, cons, tech_stack, ratings, tags, researched)
  VALUES
    ('ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', v_user_id, 'TechCorp Inc', 'Leading cloud infrastructure provider specializing in scalable web applications', NULL, 'Analytics', '1000-5000', 'San Francisco, CA', '2010-01-01', NULL, NULL, NULL, NULL, 'React, TypeScript, AWS, Kubernetes', '{"overall":4.2,"workLifeBalance":4,"compensation":4.5,"careerGrowth":4.3}', NULL, true),
    ('29d82696-d691-49ec-bcd9-dc1a9c2aadcc', v_user_id, 'StartupXYZ', 'Innovative fintech startup disrupting payments with cutting-edge technology', NULL, 'Engineering, Product and Design', '50-200', 'New York, NY', '2020-01-01', NULL, NULL, NULL, NULL, 'Node.js, React, MongoDB, GraphQL', '{"overall":3.8,"workLifeBalance":3.5,"compensation":4}', NULL, true),
    ('9b4bf110-deb1-4481-8056-d040a57fd757', v_user_id, 'BigTech Solutions', 'Global enterprise software leader with comprehensive business solutions', NULL, 'Finance and Accounting', '10000+', 'Seattle, WA', '1998-01-01', NULL, NULL, NULL, NULL, 'React, Redux, GraphQL, Azure', '{"overall":4.5,"workLifeBalance":4.2,"compensation":4.8,"careerGrowth":4.6}', NULL, true),
    ('4769b594-1f5a-4207-8123-deea2272668d', v_user_id, 'CloudScale Systems', 'Cloud-native platform for building and deploying microservices at scale', NULL, 'Human Resources', '500-1000', 'Austin, TX', '2015-01-01', NULL, NULL, NULL, NULL, 'AWS, Docker, Kubernetes, Go, Python', '{"overall":4.1,"workLifeBalance":4.3,"compensation":4.2,"careerGrowth":4}', NULL, true),
    ('71a24a14-8c4f-45ca-8193-ed3ffb709072', v_user_id, 'InnovateLabs', 'Design systems company creating beautiful, accessible user interfaces', NULL, 'Infrastructure', '200-500', 'Remote', '2018-01-01', NULL, NULL, NULL, NULL, 'React, Figma, Storybook, TypeScript, CSS-in-JS', '{"overall":4.4,"workLifeBalance":4.6,"compensation":4.1,"careerGrowth":4.2}', NULL, true),
    ('834e566f-4e01-4844-a7b6-eaf8025f81b0', v_user_id, 'GreenTech Solutions', 'Building technology solutions for environmental sustainability and climate action', NULL, 'Legal', '200-500', 'Portland, OR', '2019-01-01', NULL, NULL, NULL, NULL, 'TypeScript, Node.js, React, PostgreSQL', '{"overall":4,"workLifeBalance":4.4,"compensation":3.7,"careerGrowth":3.9}', NULL, true),
    ('f7219323-187e-47ba-9d65-8a0a1953c3d1', v_user_id, 'MediaStream Co', 'Leading video streaming platform delivering high-quality content globally', NULL, 'Marketing', '1000-5000', 'Los Angeles, CA', '2012-01-01', NULL, NULL, NULL, NULL, 'React, WebRTC, CDN, Node.js, FFmpeg', '{"overall":4.3,"workLifeBalance":3.8,"compensation":4.6,"careerGrowth":4.4}', NULL, true),
    ('f4d4155e-e02a-4230-8684-2da4a79d9b46', v_user_id, 'CyberSecure Systems', 'Cybersecurity solutions protecting businesses from modern threats', NULL, 'Office Management', '500-1000', 'Austin, TX', '2016-01-01', NULL, NULL, NULL, NULL, 'TypeScript, Go, Rust, Kubernetes, Zero Trust', '{"overall":4.2,"workLifeBalance":4,"compensation":4.4,"careerGrowth":4.1}', NULL, true),
    ('42228724-76ee-463e-9ea4-c5d0dc4142a6', v_user_id, 'HealthTech Innovations', 'Healthcare technology improving patient outcomes through digital solutions', NULL, 'Operations', '500-1000', 'Boston, MA', '2017-01-01', NULL, NULL, NULL, NULL, 'React, HIPAA-compliant, FHIR, Node.js, AWS', '{"overall":3.9,"workLifeBalance":4.1,"compensation":4}', NULL, false),
    ('de4a4b86-16e8-4131-bc47-71093119b869', v_user_id, 'AI Innovations', 'Cutting-edge AI and machine learning solutions for enterprise', NULL, 'Productivity', '200-500', 'San Francisco, CA', '2021-01-01', NULL, NULL, NULL, NULL, 'Python, TensorFlow, PyTorch, React, Kubernetes', '{"overall":4.1,"workLifeBalance":3.6,"compensation":4.7,"careerGrowth":4.5}', NULL, true),
    ('55bc02c0-f600-4b25-9e0a-1c51504ae241', v_user_id, 'EduTech Platform', 'Online learning platform making education accessible to everyone', NULL, 'Recruiting and Talent', '500-1000', 'Remote', '2018-01-01', NULL, NULL, NULL, NULL, 'React, Node.js, MongoDB, WebRTC, LMS', '{"overall":3.8,"workLifeBalance":4.2,"compensation":3.6}', NULL, false),
    ('fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', v_user_id, 'FinServ Tech', 'Financial services technology powering modern banking', NULL, 'Retail', '1000-5000', 'New York, NY', '2005-01-01', NULL, NULL, NULL, NULL, 'React, TypeScript, Java, Microservices', '{"overall":3.9,"workLifeBalance":3.5,"compensation":4.5}', NULL, false),
    ('cba81a67-8f47-4089-8aba-886e8d36d9b9', v_user_id, 'GameDev Studios', 'Game development studio creating immersive web-based gaming experiences', NULL, 'Sales', '200-500', 'Seattle, WA', '2014-01-01', NULL, NULL, NULL, NULL, 'Three.js, WebGL, React, WebAssembly, Unity', '{"overall":4,"workLifeBalance":3.4,"compensation":3.8}', NULL, false);

  INSERT INTO applications (id, user_id, company_id, position, status, work_type, employment_type, location, salary, url, job_description, interest, source, tags, applied_at)
  VALUES
    ('baffa47e-f414-4850-89f1-80467ea53046', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Senior Frontend Developer', 'interviewing', 'remote', 'full-time', 'San Francisco, CA', '{"min":120000,"max":160000,"currency":"USD"}', 'https://techcorp.com/jobs/123', NULL, 'high', NULL, '["react","typescript","remote"]', '2024-01-15T00:00:00.000Z'),
    ('85eb0794-443b-4af0-ae86-c341aca2c8db', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Full Stack Engineer', 'interviewing', 'hybrid-1day', 'full-time', 'New York, NY', '{"min":100000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["node","react","mongodb"]', '2024-01-20T00:00:00.000Z'),
    ('e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'React Developer', 'offer', 'onsite', 'full-time', 'Seattle, WA', '{"min":150000,"max":180000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","redux","graphql"]', '2024-01-05T00:00:00.000Z'),
    ('e7adb4ab-dba0-4500-924b-bfddb80c3aeb', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Software Engineer', 'interviewing', 'remote', 'full-time', 'Austin, TX', NULL, NULL, NULL, 'medium', NULL, '["aws","microservices"]', '2025-10-28T00:00:00.000Z'),
    ('11e31b4d-f3e9-428e-953c-67f9b055189e', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Frontend Architect', 'rejected', 'hybrid-2day', 'contract', 'Boston, MA', '{"min":90,"max":120,"currency":"USD"}', NULL, NULL, 'low', NULL, '["angular","rxjs"]', '2024-01-10T00:00:00.000Z'),
    ('3afe4b10-0e37-48e3-bafb-49b71f3ddf09', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'UI/UX Engineer', 'interviewing', 'remote', 'full-time', 'Remote', NULL, NULL, NULL, 'high', NULL, '["design-systems","react","figma"]', '2025-10-20T00:00:00.000Z'),
    ('96b8180f-8b23-4c45-923d-c0f1ff6c9a7d', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'JavaScript Developer', 'accepted', 'hybrid-3day', 'full-time', 'Chicago, IL', '{"min":130000,"max":150000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["typescript","vue","jest"]', '2023-12-20T00:00:00.000Z'),
    ('9ae6bfae-9149-4c5d-bfac-40e9da2dda7a', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'React Native Developer', 'offer', 'remote', 'full-time', 'Los Angeles, CA', NULL, NULL, NULL, 'low', NULL, '["react-native","mobile"]', '2024-01-08T00:00:00.000Z'),
    ('6a967ef9-36bb-46cb-8f0a-f9523ade25b7', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","javascript","css"]', '2025-06-15T00:00:00.000Z'),
    ('8f9e06d3-9d92-4f27-992c-09f168739579', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Full Stack Developer', 'rejected', 'hybrid-4day', 'full-time', 'San Francisco, CA', '{"min":140000,"max":180000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["python","react","ai","ml"]', '2025-07-01T00:00:00.000Z'),
    ('c30cacc3-f7b0-4058-a011-5d4ee787777f', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Software Engineer', 'interviewing', 'remote', 'full-time', 'Portland, OR', '{"min":125000,"max":155000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["sustainability","typescript","node"]', '2025-08-10T00:00:00.000Z'),
    ('91bc2fb4-c24a-4dd4-ad39-022cdf3f6abd', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Senior Frontend Engineer', 'applied', 'onsite', 'full-time', 'New York, NY', '{"min":145000,"max":175000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","finance","typescript"]', '2025-08-22T00:00:00.000Z'),
    ('df322dcd-a5cf-409a-9a4e-afb58dd6005f', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'UI Developer', 'rejected', 'remote', 'full-time', 'Remote', NULL, NULL, NULL, 'low', NULL, '["ui","css","design"]', '2025-09-05T00:00:00.000Z'),
    ('4c2df2df-7f39-44aa-9739-fd404d5aa8fb', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Frontend Architect', 'interviewing', 'hybrid-4day', 'full-time', 'Los Angeles, CA', '{"min":160000,"max":200000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["streaming","performance","react"]', '2025-09-18T00:00:00.000Z'),
    ('e6a16121-1df2-400b-8724-434eef09cff4', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Senior Software Engineer', 'applied', 'remote', 'full-time', 'Remote', '{"min":130000,"max":160000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["education","react","node"]', '2025-10-01T00:00:00.000Z'),
    ('31a6cc53-2961-46e9-a733-ee8522e37af0', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Full Stack Engineer', 'interviewing', 'remote', 'full-time', 'Austin, TX', '{"min":135000,"max":170000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["security","typescript","golang"]', '2025-10-08T00:00:00.000Z'),
    ('0dc2637c-3291-41b0-a107-9d3a0d82a968', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Frontend Developer', 'applied', 'hybrid-1day', 'full-time', 'Boston, MA', '{"min":125000,"max":150000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["healthcare","react","hipaa"]', '2025-10-15T00:00:00.000Z'),
    ('f29f8d1c-3d7e-4597-9885-dbf763f60948', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Web Developer', 'applied', 'onsite', 'full-time', 'Seattle, WA', NULL, NULL, NULL, 'low', NULL, '["gaming","webgl","three.js"]', '2025-10-20T00:00:00.000Z'),
    ('2653df10-bde8-4aa7-9a8e-30eb90f155cb', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Backend Developer', 'rejected', 'remote', 'full-time', 'San Francisco, CA', '{"min":115000,"max":145000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["node","python","aws"]', '2025-05-10T00:00:00.000Z'),
    ('9244774d-c446-4631-b4dc-725dc8d49a47', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'DevOps Engineer', 'rejected', 'hybrid-2day', 'full-time', 'New York, NY', NULL, NULL, NULL, 'low', NULL, '["kubernetes","docker","ci-cd"]', '2025-06-20T00:00:00.000Z'),
    ('8f1de3da-a93d-4290-bbf0-659eeda3ad8e', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Software Engineer II', 'applied', 'onsite', 'full-time', 'Seattle, WA', '{"min":140000,"max":170000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["java","microservices","azure"]', '2025-09-25T00:00:00.000Z'),
    ('6d784e73-bb5f-4ce8-be5a-c3ead25b7a04', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'UI Engineer', 'rejected', 'remote', 'contract', 'Remote', NULL, NULL, NULL, 'low', NULL, '["css","design","react"]', '2025-07-05T00:00:00.000Z'),
    ('283d56dd-a33d-4ea0-b197-6addcfa1812b', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Platform Engineer', 'applied', 'remote', 'full-time', 'Austin, TX', '{"min":130000,"max":160000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["aws","terraform","kubernetes"]', '2025-10-18T00:00:00.000Z'),
    ('77556f2a-c4fb-4c66-b7aa-6a10b3eec3bc', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Boston, MA', '{"min":120000,"max":150000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","data-viz","d3"]', '2025-08-15T00:00:00.000Z'),
    ('6d52c9e0-2914-4c2d-b1bd-a3f60190ecaf', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Senior Software Engineer', 'rejected', 'hybrid-3day', 'full-time', 'San Jose, CA', '{"min":160000,"max":200000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","node","postgres"]', '2025-07-20T00:00:00.000Z'),
    ('f5eac682-01e1-442c-afe1-a58aa772b38b', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'Full Stack Developer', 'applied', 'onsite', 'full-time', 'New York, NY', NULL, NULL, NULL, 'medium', NULL, '["angular","java","spring"]', '2025-10-05T00:00:00.000Z'),
    ('2303787a-ed2e-4c98-a012-a712035404e7', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Frontend Engineer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":140000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["vue","typescript","real-estate"]', '2025-09-10T00:00:00.000Z'),
    ('c321fb5c-5d33-4e27-89a3-b8d33e644796', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Software Engineer', 'rejected', 'hybrid-4day', 'full-time', 'Denver, CO', NULL, NULL, NULL, 'medium', NULL, '["react","maps","travel"]', '2025-06-10T00:00:00.000Z'),
    ('f85cf3cf-ba79-4aa7-8c9c-6372233ed02c', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Lead Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":145000,"max":175000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","leadership","education"]', '2025-10-12T00:00:00.000Z'),
    ('f9366360-e051-4bad-8ffd-2e26e5d5e1ac', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Web Developer', 'rejected', 'onsite', 'full-time', 'Pittsburgh, PA', NULL, NULL, NULL, 'low', NULL, '["javascript","robotics","iot"]', '2025-05-25T00:00:00.000Z'),
    ('e386c730-c866-4800-9913-93f1577acb92', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Frontend Developer', 'applied', 'hybrid-1day', 'full-time', 'Los Angeles, CA', '{"min":115000,"max":145000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","e-commerce","fashion"]', '2025-09-20T00:00:00.000Z'),
    ('23d5080d-3ccd-477d-9375-bf70a0987f11', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Machine Learning Engineer', 'applied', 'hybrid-2day', 'full-time', 'San Francisco, CA', '{"min":150000,"max":190000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["python","ml","pytorch"]', '2025-10-10T00:00:00.000Z'),
    ('9c77ac14-e24c-49dd-bc55-74e192aaef54', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Software Engineer', 'rejected', 'onsite', 'full-time', 'Menlo Park, CA', '{"min":170000,"max":210000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","graphql","social"]', '2025-06-01T00:00:00.000Z'),
    ('1e0951fc-55ea-45de-82e1-8d4700607cc4', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Senior Frontend Engineer', 'applied', 'hybrid-3day', 'full-time', 'Boston, MA', '{"min":140000,"max":170000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","healthcare","senior"]', '2025-10-22T00:00:00.000Z'),
    ('1cc23a96-5219-4de7-944c-82479288dbe3', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'Full Stack Engineer', 'applied', 'remote', 'full-time', 'Chicago, IL', '{"min":125000,"max":155000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["node","react","logistics"]', '2025-09-01T00:00:00.000Z'),
    ('3c4ec27b-f694-4d65-89a6-3d5b130ea7fe', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Software Developer', 'rejected', 'onsite', 'full-time', 'San Diego, CA', NULL, NULL, NULL, 'low', NULL, '["python","biotech","data"]', '2025-07-15T00:00:00.000Z'),
    ('f1e20662-a013-46fa-9ff2-edcf841d6167', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Portland, OR', '{"min":120000,"max":145000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","sustainability","clean-energy"]', '2025-08-25T00:00:00.000Z'),
    ('a94c6cc4-cf81-4cff-aa33-7d55172dbfb6', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Web Developer', 'rejected', 'hybrid-4day', 'full-time', 'Atlanta, GA', NULL, NULL, NULL, 'low', NULL, '["react","sports","analytics"]', '2025-06-15T00:00:00.000Z'),
    ('6e87c0ea-4e1d-4bfe-94b4-f12089038f07', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'Senior Software Engineer', 'applied', 'remote', 'full-time', 'Remote', '{"min":135000,"max":165000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["typescript","insurance","react"]', '2025-09-15T00:00:00.000Z'),
    ('268e3cee-51a6-4a0b-a696-11a210cce9c2', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Frontend Engineer', 'applied', 'hybrid-1day', 'full-time', 'Nashville, TN', '{"min":115000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","music","audio"]', '2025-10-08T00:00:00.000Z'),
    ('c0830f89-79fe-4f4c-8276-3ce1f8805e41', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Software Engineer', 'rejected', 'onsite', 'full-time', 'Miami, FL', NULL, NULL, NULL, 'low', NULL, '["react","maps","real-estate"]', '2025-05-15T00:00:00.000Z'),
    ('a116902f-76db-4c88-a4db-97bab87d0d0f', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Full Stack Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":135000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["node","react","agriculture"]', '2025-08-05T00:00:00.000Z'),
    ('9948a221-9ff5-4565-8f18-ef17ce5e5c21', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Washington, DC', '{"min":125000,"max":150000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","legal","compliance"]', '2025-09-28T00:00:00.000Z'),
    ('e23a96b7-43bb-4eb3-bd77-1353de0f4dbb', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Software Engineer', 'rejected', 'hybrid-2day', 'full-time', 'San Francisco, CA', NULL, NULL, NULL, 'medium', NULL, '["react","advertising","analytics"]', '2025-06-25T00:00:00.000Z'),
    ('3f7f8735-e861-4701-a7e4-570bc776141f', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Frontend Engineer', 'applied', 'hybrid-3day', 'full-time', 'San Francisco, CA', '{"min":130000,"max":160000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","maps","food-delivery"]', '2025-10-01T00:00:00.000Z'),
    ('5a9630a6-ac24-4400-8de2-8ab81789e132', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Web Developer', 'applied', 'remote', 'full-time', 'Remote', NULL, NULL, NULL, 'low', NULL, '["react","marketing","analytics"]', '2025-08-20T00:00:00.000Z'),
    ('b2ad6862-a162-4256-ba9d-f2863d6bc21a', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Software Engineer', 'rejected', 'onsite', 'full-time', 'Detroit, MI', '{"min":130000,"max":165000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["javascript","automotive","iot"]', '2025-07-10T00:00:00.000Z'),
    ('f327eb6a-94e6-4817-a42d-d1e10b3635ef', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":105000,"max":130000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","pets","e-commerce"]', '2025-09-05T00:00:00.000Z'),
    ('7506bfa4-b574-4364-828f-ebc72b31f443', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Software Engineer', 'applied', 'hybrid-4day', 'full-time', 'New York, NY', '{"min":120000,"max":145000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","cms","news"]', '2025-10-14T00:00:00.000Z'),
    ('7313d647-ed0b-4e40-907b-51bc3b7eff7c', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Full Stack Developer', 'rejected', 'onsite', 'full-time', 'Dallas, TX', NULL, NULL, NULL, 'low', NULL, '["node","react","construction"]', '2025-05-20T00:00:00.000Z'),
    ('a1a226f8-cdb9-49f5-a6f5-09d7d9ae3cab', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Software Developer', 'applied', 'onsite', 'full-time', 'Houston, TX', '{"min":125000,"max":155000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["javascript","aerospace","data-viz"]', '2025-08-10T00:00:00.000Z'),
    ('94cf5d23-1e06-4cb8-a30b-2a8a1713a7f8', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'Frontend Engineer', 'applied', 'hybrid-1day', 'full-time', 'Minneapolis, MN', '{"min":115000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","retail","pos"]', '2025-09-18T00:00:00.000Z'),
    ('23915037-f2ec-4103-aa03-c8168418c037', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Senior Software Engineer', 'rejected', 'remote', 'full-time', 'Remote', '{"min":150000,"max":190000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["typescript","blockchain","crypto"]', '2025-06-05T00:00:00.000Z'),
    ('f14ac807-fd6f-4572-ab8d-77fd774b33d4', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":135000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","hr","saas"]', '2025-10-16T00:00:00.000Z'),
    ('f2e80d52-bbbf-460d-bed9-c91ac0c1e5a8', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Web Developer', 'applied', 'hybrid-2day', 'contract', 'Las Vegas, NV', NULL, NULL, NULL, 'low', NULL, '["javascript","events","ticketing"]', '2025-09-22T00:00:00.000Z');

  INSERT INTO documents (id, user_id, name, type, content, uri, mime_type, revision, parent_id, tags, archived_at)
  VALUES
    ('bd48c3fb-8517-4467-86b4-91ca95faceba', v_user_id, 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, 1, NULL, '["tech","general"]', NULL),
    ('1dc79247-d306-454a-b039-b8569f1c483f', v_user_id, 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, 2, 'bd48c3fb-8517-4467-86b4-91ca95faceba', '["tech","general","updated"]', NULL),
    ('7aea7a25-c222-4b54-a262-3406c3be2097', v_user_id, 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, 1, NULL, '["frontend","react"]', NULL),
    ('18d07bb1-aa87-48b1-a5d1-8e058b535bed', v_user_id, 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, 2, '1dc79247-d306-454a-b039-b8569f1c483f', '["frontend","react","senior"]', NULL),
    ('bef42652-e0b3-451f-90b3-3241a994b340', v_user_id, 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, 1, NULL, '["fullstack","backend","frontend"]', NULL),
    ('7039c702-a60f-4329-8da7-31d323fa9de5', v_user_id, 'TechCorp Cover Letter', 'cover-letter', 'Dear Hiring Manager,

I am excited to apply for the Senior Frontend Developer position at TechCorp...', NULL, NULL, 1, NULL, '["techcorp","draft"]', NULL),
    ('42adf777-bac7-42f1-bb69-bbff4ce511c0', v_user_id, 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, 2, '7aea7a25-c222-4b54-a262-3406c3be2097', '["techcorp","final"]', NULL),
    ('2d975ce1-eba3-4c15-9307-9f82056526f8', v_user_id, 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, 1, NULL, '["startup","fintech"]', NULL),
    ('52994dc8-3c09-446d-9e77-bd92f38fd539', v_user_id, 'BigTech Cover Letter', 'cover-letter', 'Dear Michael Chen,

I am excited to apply for the React Developer position at BigTech Solutions. With a proven track record of building enterprise-scale applications and deep expertise in React, Redux, and GraphQL, I am confident I can contribute to your team from day one.

Your company''s commitment to engineering excellence and innovation resonates with my professional values...

Best regards,
[Your Name]', NULL, NULL, 1, NULL, '["bigtech","enterprise"]', NULL),
    ('3c3cfc8f-b56b-4880-b9ca-d469d4df7191', v_user_id, 'Portfolio Website', 'other', NULL, NULL, NULL, 1, NULL, '["portfolio","projects"]', NULL),
    ('9be91f69-62a6-4867-bd17-6f6228c1a8a2', v_user_id, 'GitHub Portfolio', 'other', 'GitHub Profile

Open Source Contributions:
- React Component Library (2.3k stars)
- TypeScript Utilities Package (890 stars)
- Code review participation in 50+ repositories', 'https://github.com/yourname', NULL, 1, NULL, '["github","opensource"]', NULL),
    ('3d04f7fb-da7e-4ad1-a44f-b268b1bd8aa5', v_user_id, 'AWS Solutions Architect Certificate', 'other', NULL, '/documents/aws-certification.pdf', 'application/pdf', 1, NULL, '["aws","cloud","certification"]', NULL),
    ('94acc4f7-a648-420f-bbc9-6cb32bd8f88d', v_user_id, 'University Transcript', 'other', NULL, '/documents/transcript.pdf', 'application/pdf', 1, NULL, '["education","official"]', NULL),
    ('a215e4da-75cf-42e4-b6e8-dba2b2a28a19', v_user_id, 'React Advanced Certification', 'other', NULL, NULL, 'application/pdf', 1, NULL, '["react","frontend","certification"]', NULL),
    ('ed7e82ce-b845-4461-a24b-16d3061426bd', v_user_id, 'References List', 'other', 'PROFESSIONAL REFERENCES

1. Jane Smith - Former Manager
   Senior Engineering Manager, Tech Company
   jane.smith@example.com | (555) 123-4567

2. Robert Johnson - Tech Lead
   Principal Engineer, Innovation Labs
   robert.j@example.com | (555) 234-5678

3. Maria Garcia - Director of Engineering
   VP Engineering, StartupCo
   maria.garcia@example.com | (555) 345-6789', NULL, NULL, 1, NULL, '["references","contacts"]', NULL),
    ('5698d3fb-285c-4bd1-8304-d32c8566fc5e', v_user_id, 'Side Projects Showcase', 'other', 'SIDE PROJECTS

1. Task Management App
   - Full-stack React + Node.js application
   - 500+ active users
   - Tech: React, TypeScript, PostgreSQL, AWS

2. Open Source Component Library
   - 2.3k GitHub stars
   - 50+ contributors
   - Used by 100+ projects

3. Dev Tools Chrome Extension
   - 10k+ downloads
   - 4.5 star rating', NULL, NULL, 1, NULL, '["projects","opensource","portfolio"]', NULL),
    ('ba2caf90-800d-4594-9824-081d2b004a71', v_user_id, 'Salary Research Document', 'other', 'SALARY RESEARCH NOTES

Senior Frontend Developer - Bay Area
- Average: $150k-180k
- Top companies: $180k-220k
- Equity typically: 0.1-0.5%

Sources: Levels.fyi, Glassdoor, Blind', NULL, NULL, 1, NULL, '["research","salary","negotiation"]', NULL),
    ('07445bc6-63bc-44a0-8dcf-e2ff50caef51', v_user_id, 'Technical Blog Posts', 'other', 'PUBLISHED TECHNICAL CONTENT

- "Advanced React Patterns" (15k views)
- "Building Scalable Frontend Architecture" (8k views)
- "TypeScript Best Practices" (12k views)
- "State Management Deep Dive" (6k views)', NULL, NULL, 1, NULL, '["blog","writing","technical"]', NULL),
    ('6bec0322-aa18-474f-8332-934ea8e9359a', v_user_id, 'Old Resume 2020', 'resume', 'PROFESSIONAL SUMMARY

Junior developer with 2 years experience...', NULL, NULL, 1, NULL, '["old","outdated"]', '2024-12-01T00:00:00.000Z'),
    ('4b7883f5-481e-4e65-9664-636d6797929b', v_user_id, 'Generic Cover Letter', 'cover-letter', 'To Whom It May Concern,

I am writing to apply for the position...', NULL, NULL, 1, NULL, '["generic","template"]', '2024-11-15T00:00:00.000Z'),
    ('3e417f78-7e48-4cd1-940a-981785277cb5', v_user_id, 'Incomplete Project Portfolio', 'other', NULL, NULL, NULL, 1, NULL, '["incomplete","draft"]', '2025-01-10T00:00:00.000Z'),
    ('e97bf993-f671-4ccc-896f-bb93600543f7', v_user_id, 'DataDriven Cover Letter Draft', 'cover-letter', 'Dear Hiring Manager,

I am interested in the Frontend Architect position...', NULL, NULL, 1, NULL, '["draft","datadriven"]', '2024-01-12T00:00:00.000Z'),
    ('ce592393-042c-413f-97d5-8a6f76d5fece', v_user_id, 'Expired Security Clearance', 'other', NULL, NULL, NULL, 1, NULL, '["clearance","expired"]', '2024-10-01T00:00:00.000Z'),
    ('b26dc902-f2d0-4973-860c-433e0a098d8a', v_user_id, 'Old Portfolio Website 2021', 'other', NULL, 'https://old-portfolio.example.com', NULL, 1, NULL, '["outdated","portfolio"]', '2024-11-20T00:00:00.000Z'),
    ('952c7d52-9e69-45e2-aa74-d3fe859c4e15', v_user_id, 'Undergraduate Transcript', 'other', NULL, NULL, NULL, 1, NULL, '["education","old"]', '2025-09-15T00:00:00.000Z'),
    ('afe75396-78df-4ff0-85ed-3e80a51d5420', v_user_id, 'Old References 2022', 'other', 'OLD REFERENCES

1. John Doe - Former colleague (contact lost)
2. Sarah Wilson - Moved to different company', NULL, NULL, 1, NULL, '["references","outdated"]', '2024-12-20T00:00:00.000Z');

  INSERT INTO contacts (id, user_id, company_id, name, title, email, phone, linkedin_url, notes)
  VALUES
    ('f378c69d-bf05-470b-bc75-a52d38c18e10', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Sarah Johnson', 'Senior Recruiter', 'sarah.johnson@techcorp.com', NULL, 'https://linkedin.com/in/sarahjohnson', 'Very responsive, initial contact via LinkedIn'),
    ('998a7e09-43e2-4c90-8b71-4dc7b9df30be', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Michael Chen', 'Engineering Manager', 'michael.chen@bigtech.com', NULL, 'https://linkedin.com/in/michaelchen', 'Will be conducting technical interview'),
    ('b63ba65e-4dfc-43b5-bf2c-696bda5c35f7', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Emily Rodriguez', 'Software Engineer', 'emily@startupxyz.com', NULL, NULL, 'Friend from university, provided referral'),
    ('4021912a-8f5e-4d3f-8bc4-53005be6784f', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Tom Wilson', 'Engineering Manager', 'tom.wilson@greentech.com', NULL, 'https://linkedin.com/in/tomwilson', 'Passionate about environmental tech'),
    ('3d331f78-006a-4325-9318-e732d10327b1', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Rachel Kim', 'Principal Engineer', 'rachel.kim@mediastream.co', NULL, 'https://linkedin.com/in/rachelkim', 'Expert in video streaming technology'),
    ('dca9cfba-190e-4734-a99d-01c82f6112df', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Olivia Taylor', 'Design Systems Lead', 'olivia.taylor@innovatelabs.com', NULL, 'https://linkedin.com/in/oliviataylor', 'Leading the design systems team'),
    ('4834fdda-c72e-49b0-bfc7-e418fad1b6ee', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Daniel Roberts', 'Security Architect', 'daniel.roberts@cybersecure.com', NULL, 'https://linkedin.com/in/danielroberts', 'Security expert with 15+ years experience'),
    ('fe3af885-3f18-4291-815b-207938b94920', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Marcus Johnson', 'Staff Engineer', 'marcus.johnson@cloudscale.io', NULL, 'https://linkedin.com/in/marcusjohnson', 'Met at a tech conference last year'),
    ('fb5903f2-b782-484f-b1f3-dd3c8db7b551', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Jessica Wang', 'Technical Recruiter', 'jessica.wang@ai-innovations.com', NULL, NULL, 'Initial phone screen contact'),
    ('a249bb54-d709-409a-b338-03cc9cc99fc9', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Kevin Martinez', 'Senior Recruiter', 'kevin.martinez@mediastream.co', NULL, NULL, 'Friendly and professional recruiter'),
    ('a2be2688-876b-4f30-9516-fb604e35e67e', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Amanda Lee', 'Engineering Manager', 'amanda.lee@cybersecure.com', NULL, 'https://linkedin.com/in/amandalee', 'Will conduct technical interview'),
    ('996d9e01-bcae-4e26-9700-8f601ed1aeea', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Emma Brown', 'Talent Acquisition Specialist', 'emma.brown@greentech.com', NULL, NULL, 'Great communication throughout process');

  INSERT INTO events (id, user_id, application_id, type, status, url, title, description, duration_minutes, scheduled_at, notes)
  VALUES
    ('378fea3e-fef2-4def-987c-24b712b978fb', v_user_id, 'baffa47e-f414-4850-89f1-80467ea53046', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2026-01-15T10:00:00Z', ''),
    ('50df186c-70a1-41f7-bcc8-a6c8e4de53b6', v_user_id, 'baffa47e-f414-4850-89f1-80467ea53046', 'behavioral-interview', 'completed', NULL, NULL, NULL, 45, '2026-01-22T14:00:00Z', ''),
    ('10a8b66b-8de1-44d3-aaa1-5b7ef2b94c91', v_user_id, 'baffa47e-f414-4850-89f1-80467ea53046', 'technical-interview', 'scheduled', NULL, NULL, NULL, 90, '2026-02-05T15:00:00Z', ''),
    ('c11f48e1-35d4-4422-b069-15aac19fd04d', v_user_id, '85eb0794-443b-4af0-ae86-c341aca2c8db', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2026-01-10T10:00:00Z', ''),
    ('1d8f3730-622b-48a5-a546-b3fa4c51392c', v_user_id, '85eb0794-443b-4af0-ae86-c341aca2c8db', 'technical-interview', 'completed', 'https://meet.google.com/abc-defg-hij', NULL, NULL, 60, '2026-01-18T14:00:00Z', ''),
    ('547f8a0b-6353-40d2-b4ed-7769360d141a', v_user_id, '85eb0794-443b-4af0-ae86-c341aca2c8db', 'behavioral-interview', 'completed', 'https://zoom.us/j/123456789', NULL, NULL, 45, '2026-01-25T11:00:00Z', ''),
    ('b9406a2d-9542-4eae-a5e3-a302bff05d65', v_user_id, '85eb0794-443b-4af0-ae86-c341aca2c8db', 'onsite', 'scheduled', NULL, NULL, NULL, 90, '2026-02-12T09:00:00Z', ''),
    ('514d55f9-3be8-47ef-88c5-b6a97f89db6f', v_user_id, 'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2025-11-01T10:00:00Z', ''),
    ('6e7b21b7-af1f-4a3f-bb1f-e6a8fc73bef6', v_user_id, 'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8', 'technical-interview', 'completed', 'https://teams.microsoft.com/l/meetup-join/19%3ameeting', NULL, NULL, 75, '2025-11-10T14:00:00Z', ''),
    ('7f2477f0-e3b9-4501-a09a-20239522c32f', v_user_id, 'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8', 'behavioral-interview', 'completed', 'https://meet.google.com/xyz-abcd-efg', NULL, NULL, 60, '2025-11-18T15:00:00Z', ''),
    ('94a5b5a0-1c5d-425c-a28b-b1726509f815', v_user_id, 'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8', 'onsite', 'completed', 'https://meet.google.com/final-round-abc', NULL, NULL, 30, '2025-11-25T09:00:00Z', ''),
    ('fd11a563-2c5e-41b9-8fba-e94b80a04f9c', v_user_id, '96b8180f-8b23-4c45-923d-c0f1ff6c9a7d', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2025-10-01T10:00:00Z', ''),
    ('70ae2cf7-c438-42e5-99ba-186ad923227f', v_user_id, '96b8180f-8b23-4c45-923d-c0f1ff6c9a7d', 'behavioral-interview', 'completed', 'https://zoom.us/j/greentech-interview', NULL, NULL, 45, '2025-10-10T14:00:00Z', ''),
    ('c818dc92-ac93-4d53-ac46-9019f480b4e1', v_user_id, '96b8180f-8b23-4c45-923d-c0f1ff6c9a7d', 'technical-interview', 'completed', NULL, NULL, NULL, 60, '2025-10-18T15:00:00Z', ''),
    ('edcc0834-8bd9-4979-9a06-150e8a6b3d6f', v_user_id, '11e31b4d-f3e9-428e-953c-67f9b055189e', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2025-11-15T10:00:00Z', ''),
    ('892c0b32-45d8-4af6-a548-54222d9e14dd', v_user_id, '11e31b4d-f3e9-428e-953c-67f9b055189e', 'technical-interview', 'completed', 'https://meet.google.com/mediastream-tech', NULL, NULL, 75, '2025-11-22T14:00:00Z', ''),
    ('583644d2-ef7b-42ca-ad59-13b3a9add2c9', v_user_id, 'e7adb4ab-dba0-4500-924b-bfddb80c3aeb', 'screening-interview', 'completed', NULL, NULL, NULL, NULL, '2026-01-20T10:00:00Z', ''),
    ('7b95538d-0e1a-4531-92da-bb41f02d2b88', v_user_id, 'e7adb4ab-dba0-4500-924b-bfddb80c3aeb', 'behavioral-interview', 'scheduled', NULL, NULL, NULL, 45, '2026-02-03T14:00:00Z', '');

  INSERT INTO application_documents (id, application_id, document_id, name, type, content, uri, mime_type, revision)
  VALUES
    ('38800821-196d-477a-b7e6-82b8453647d5', 'baffa47e-f414-4850-89f1-80467ea53046', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('3c76948f-e7f8-40df-b4b9-20cb39e3fe64', 'baffa47e-f414-4850-89f1-80467ea53046', '7039c702-a60f-4329-8da7-31d323fa9de5', 'TechCorp Cover Letter', 'cover-letter', 'Dear Hiring Manager,

I am excited to apply for the Senior Frontend Developer position at TechCorp...', NULL, NULL, '1'),
    ('356f07d4-c0a2-4fdd-831e-ded934c535ca', '85eb0794-443b-4af0-ae86-c341aca2c8db', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('aad4db15-0972-4d0a-b9f4-8d84f6395d0b', 'e3acf459-2c0e-4e6a-be71-d6c5c8c79cc8', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('886564f1-e7a5-4d6f-a658-1530c86cf35a', 'e7adb4ab-dba0-4500-924b-bfddb80c3aeb', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('77ff0695-705a-4015-82f4-f94061771283', '11e31b4d-f3e9-428e-953c-67f9b055189e', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('0d403c5a-601d-4e22-9018-a4b83cb2f006', '3afe4b10-0e37-48e3-bafb-49b71f3ddf09', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('7d595c7a-8e71-4c7c-8985-da0fcb385201', '3afe4b10-0e37-48e3-bafb-49b71f3ddf09', '42adf777-bac7-42f1-bb69-bbff4ce511c0', 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, '2'),
    ('7221aca4-c344-43c7-a5b6-3966a0129c18', '96b8180f-8b23-4c45-923d-c0f1ff6c9a7d', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('f5d0f09b-7c67-4e2f-b862-778a9e2452cf', '9ae6bfae-9149-4c5d-bfac-40e9da2dda7a', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('a3740ecf-0ac3-4299-b39c-5411510f13bb', '6a967ef9-36bb-46cb-8f0a-f9523ade25b7', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('f23813d5-1d42-4059-90da-f7d783d603b9', '8f9e06d3-9d92-4f27-992c-09f168739579', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('2ac7600b-9f64-4987-a7aa-3f7d5c695004', 'c30cacc3-f7b0-4058-a011-5d4ee787777f', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('f5a07f33-78d7-4199-b784-d46ad0ff10d1', 'c30cacc3-f7b0-4058-a011-5d4ee787777f', '2d975ce1-eba3-4c15-9307-9f82056526f8', 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, '1'),
    ('2d520cda-a740-43b8-a7cc-50bb5cffddca', '91bc2fb4-c24a-4dd4-ad39-022cdf3f6abd', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('f69a3b99-6673-465c-a5b2-ce277b693884', 'df322dcd-a5cf-409a-9a4e-afb58dd6005f', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('245fcf8d-c74c-4746-b69b-5b52bd44af1a', '4c2df2df-7f39-44aa-9739-fd404d5aa8fb', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('13ca76d4-bc96-41fb-add1-8f2cb5ee2b86', 'e6a16121-1df2-400b-8724-434eef09cff4', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('b957b769-7d32-42c4-9e66-be431e91b67d', '31a6cc53-2961-46e9-a733-ee8522e37af0', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('5592518d-c791-41a6-a839-188886b24baf', '31a6cc53-2961-46e9-a733-ee8522e37af0', '52994dc8-3c09-446d-9e77-bd92f38fd539', 'BigTech Cover Letter', 'cover-letter', 'Dear Michael Chen,

I am excited to apply for the React Developer position at BigTech Solutions. With a proven track record of building enterprise-scale applications and deep expertise in React, Redux, and GraphQL, I am confident I can contribute to your team from day one.

Your company''s commitment to engineering excellence and innovation resonates with my professional values...

Best regards,
[Your Name]', NULL, NULL, '1'),
    ('e189f10e-3d78-480d-88ec-8858ef26d38e', '0dc2637c-3291-41b0-a107-9d3a0d82a968', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('3b478a97-4cbe-4b1b-8e21-e275021c185a', 'f29f8d1c-3d7e-4597-9885-dbf763f60948', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('d874288d-8680-4268-b493-98a8c941f42a', '2653df10-bde8-4aa7-9a8e-30eb90f155cb', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('2f89fde1-c27f-4ba2-b138-de9428859ae7', '9244774d-c446-4631-b4dc-725dc8d49a47', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('f7665d2d-bd09-44ee-bfaa-8de4f2641ee0', '8f1de3da-a93d-4290-bbf0-659eeda3ad8e', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('9c59b860-3b6e-43be-8262-5cb5ac06365e', '8f1de3da-a93d-4290-bbf0-659eeda3ad8e', '7039c702-a60f-4329-8da7-31d323fa9de5', 'TechCorp Cover Letter', 'cover-letter', 'Dear Hiring Manager,

I am excited to apply for the Senior Frontend Developer position at TechCorp...', NULL, NULL, '1'),
    ('75a42b0c-911d-4fc6-8a8f-ee724fb202a5', '6d784e73-bb5f-4ce8-be5a-c3ead25b7a04', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('33b226cb-66d2-4739-b362-5aa03b934f66', '283d56dd-a33d-4ea0-b197-6addcfa1812b', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('259262f5-70bb-4dc3-8314-e0bb3c90e7e5', '77556f2a-c4fb-4c66-b7aa-6a10b3eec3bc', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('a8f5993e-db21-489a-85d5-e5aba01ec8c0', '6d52c9e0-2914-4c2d-b1bd-a3f60190ecaf', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('e4cb5e24-d9c8-4d19-9091-fbe28903d39b', 'f5eac682-01e1-442c-afe1-a58aa772b38b', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('35091aa0-e093-4f68-a2d5-252003a7247f', 'f5eac682-01e1-442c-afe1-a58aa772b38b', '42adf777-bac7-42f1-bb69-bbff4ce511c0', 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, '2'),
    ('9b5381d4-8377-4f95-b5d9-27af599f05b0', '2303787a-ed2e-4c98-a012-a712035404e7', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('d51157a2-df9d-4aed-826d-26b91396f258', 'c321fb5c-5d33-4e27-89a3-b8d33e644796', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('dc5fdf7c-7e68-4cec-ad3f-8a5d896a7551', 'f85cf3cf-ba79-4aa7-8c9c-6372233ed02c', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('c15caf5c-ecb8-4a59-8f1e-d70a8a49c428', 'f9366360-e051-4bad-8ffd-2e26e5d5e1ac', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('0caf203c-a4f6-454d-ad24-c5d6df5871e3', 'e386c730-c866-4800-9913-93f1577acb92', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('caf49b90-0344-4d2f-887a-80998790229f', 'e386c730-c866-4800-9913-93f1577acb92', '2d975ce1-eba3-4c15-9307-9f82056526f8', 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, '1'),
    ('77df8086-0768-4a53-bb22-6e7a5d0764dd', '23d5080d-3ccd-477d-9375-bf70a0987f11', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('329df53c-e766-4bee-9a43-958e6f589dac', '9c77ac14-e24c-49dd-bc55-74e192aaef54', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('17abeff9-58e9-4ae6-abf0-1887f54a7440', '1e0951fc-55ea-45de-82e1-8d4700607cc4', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('b6fac323-a192-4439-b528-0dc4b8233e7f', '1cc23a96-5219-4de7-944c-82479288dbe3', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('ef174eda-463d-4d21-bd21-77225383b795', '3c4ec27b-f694-4d65-89a6-3d5b130ea7fe', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('9694f39f-3331-4556-ba04-a2578a4ef48c', '3c4ec27b-f694-4d65-89a6-3d5b130ea7fe', '52994dc8-3c09-446d-9e77-bd92f38fd539', 'BigTech Cover Letter', 'cover-letter', 'Dear Michael Chen,

I am excited to apply for the React Developer position at BigTech Solutions. With a proven track record of building enterprise-scale applications and deep expertise in React, Redux, and GraphQL, I am confident I can contribute to your team from day one.

Your company''s commitment to engineering excellence and innovation resonates with my professional values...

Best regards,
[Your Name]', NULL, NULL, '1'),
    ('999dfd54-1971-4d34-8950-6a0427154c25', 'f1e20662-a013-46fa-9ff2-edcf841d6167', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('7769bb8c-a5e8-4d74-9bb9-e2a2cfde6f51', 'a94c6cc4-cf81-4cff-aa33-7d55172dbfb6', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('fc9b2470-9971-4b12-98a5-c662e7bb8b31', '6e87c0ea-4e1d-4bfe-94b4-f12089038f07', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('f87e30c1-80bb-44d5-92e2-a884b682e78e', '268e3cee-51a6-4a0b-a696-11a210cce9c2', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('d7f27ff6-ff3a-48c8-94ee-80ffbce9ca0c', 'c0830f89-79fe-4f4c-8276-3ce1f8805e41', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('10073187-2dcf-464b-b38b-918408c4ed2d', 'c0830f89-79fe-4f4c-8276-3ce1f8805e41', '7039c702-a60f-4329-8da7-31d323fa9de5', 'TechCorp Cover Letter', 'cover-letter', 'Dear Hiring Manager,

I am excited to apply for the Senior Frontend Developer position at TechCorp...', NULL, NULL, '1'),
    ('adfdca19-6443-4ac3-bdb3-d6f7082f1349', 'a116902f-76db-4c88-a4db-97bab87d0d0f', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('d1a43d7c-ded0-4ed1-a088-4dd5c9d77243', '9948a221-9ff5-4565-8f18-ef17ce5e5c21', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('ee738ad0-cba2-493d-9ee2-a0994b1c109b', 'e23a96b7-43bb-4eb3-bd77-1353de0f4dbb', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('f4185a9d-75e8-4d5f-ab0a-9b2e37ee8946', '3f7f8735-e861-4701-a7e4-570bc776141f', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('f88c46b5-4f64-4e41-aa4a-1bf5db50b252', '5a9630a6-ac24-4400-8de2-8ab81789e132', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('f76c792e-cee9-4730-ba68-c2b6c18bc030', '5a9630a6-ac24-4400-8de2-8ab81789e132', '42adf777-bac7-42f1-bb69-bbff4ce511c0', 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, '2'),
    ('1a8eb48f-404a-433a-8bcf-6756ce965f02', 'b2ad6862-a162-4256-ba9d-f2863d6bc21a', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('3d1d5356-1861-4dc5-941b-4a4dad0e030c', 'f327eb6a-94e6-4817-a42d-d1e10b3635ef', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('cc08f96d-53ed-4f59-b6b2-83e1244ea8c4', '7506bfa4-b574-4364-828f-ebc72b31f443', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('375dda73-3436-470c-aa56-48d5d402e203', 'a1a226f8-cdb9-49f5-a6f5-09d7d9ae3cab', '2d975ce1-eba3-4c15-9307-9f82056526f8', 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, '1');

  INSERT INTO event_contacts (id, event_id, contact_id)
  VALUES
    ('7a50185d-0299-4d4f-89c6-e6a904906e06', '378fea3e-fef2-4def-987c-24b712b978fb', 'f378c69d-bf05-470b-bc75-a52d38c18e10'),
    ('91ea6864-8b6c-434f-8df8-dde58415b8a5', '50df186c-70a1-41f7-bcc8-a6c8e4de53b6', 'f378c69d-bf05-470b-bc75-a52d38c18e10'),
    ('8fdcd61d-c19e-4713-8796-2809aa7d506d', '50df186c-70a1-41f7-bcc8-a6c8e4de53b6', '998a7e09-43e2-4c90-8b71-4dc7b9df30be'),
    ('b1188925-d772-4ec9-a32a-577b16a364b8', '10a8b66b-8de1-44d3-aaa1-5b7ef2b94c91', 'f378c69d-bf05-470b-bc75-a52d38c18e10'),
    ('cbd8259e-38aa-4576-b7cf-82694fe177a4', '10a8b66b-8de1-44d3-aaa1-5b7ef2b94c91', '998a7e09-43e2-4c90-8b71-4dc7b9df30be'),
    ('7dcbc6b2-a864-4292-bdc9-a9b08be1ff93', 'c11f48e1-35d4-4422-b069-15aac19fd04d', 'b63ba65e-4dfc-43b5-bf2c-696bda5c35f7'),
    ('2b19e03c-1dc4-4052-861b-a0e72811af54', '1d8f3730-622b-48a5-a546-b3fa4c51392c', 'b63ba65e-4dfc-43b5-bf2c-696bda5c35f7'),
    ('7ae962b0-42ad-4ed9-9184-3e86b3dd725a', '547f8a0b-6353-40d2-b4ed-7769360d141a', 'b63ba65e-4dfc-43b5-bf2c-696bda5c35f7'),
    ('acc3a33e-edca-484f-b944-ee73dfcdbc4c', 'b9406a2d-9542-4eae-a5e3-a302bff05d65', 'b63ba65e-4dfc-43b5-bf2c-696bda5c35f7'),
    ('874d55e1-31c5-4374-a76f-0e1ef8fd51fb', 'fd11a563-2c5e-41b9-8fba-e94b80a04f9c', '3d331f78-006a-4325-9318-e732d10327b1'),
    ('b52f0f9e-9eba-4854-9fbf-69efb21f25b7', 'fd11a563-2c5e-41b9-8fba-e94b80a04f9c', 'a249bb54-d709-409a-b338-03cc9cc99fc9'),
    ('02c81cef-ddfe-46fb-8249-1934ca47b6a3', '70ae2cf7-c438-42e5-99ba-186ad923227f', '3d331f78-006a-4325-9318-e732d10327b1'),
    ('2fc9b4fb-d8e0-49c1-be80-abdbd0a28577', 'c818dc92-ac93-4d53-ac46-9019f480b4e1', '3d331f78-006a-4325-9318-e732d10327b1'),
    ('2ba834c1-520e-4650-a118-72b33ca43c67', 'c818dc92-ac93-4d53-ac46-9019f480b4e1', 'a249bb54-d709-409a-b338-03cc9cc99fc9'),
    ('d18c47ac-3550-4165-a53c-5b7178c5d5d4', 'edcc0834-8bd9-4979-9a06-150e8a6b3d6f', 'dca9cfba-190e-4734-a99d-01c82f6112df'),
    ('1f9eea36-720e-4b77-a72d-78d0181cd33d', '892c0b32-45d8-4af6-a548-54222d9e14dd', 'dca9cfba-190e-4734-a99d-01c82f6112df'),
    ('9527a51d-903e-4ec6-b010-6d885f9b5eef', '583644d2-ef7b-42ca-ad59-13b3a9add2c9', 'fe3af885-3f18-4291-815b-207938b94920'),
    ('adbbbf9d-bc10-4e57-a012-c6b49db8b361', '7b95538d-0e1a-4531-92da-bb41f02d2b88', 'fe3af885-3f18-4291-815b-207938b94920');

END $$;
