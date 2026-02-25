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
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users. Sign up at http://localhost:3000 then run supabase db reset.';
  END IF;
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
    ('cd630cbb-3509-4fcc-8bab-82e46ceaeaa0', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Senior Frontend Developer', 'interviewing', 'remote', 'full-time', 'San Francisco, CA', '{"min":120000,"max":160000,"currency":"USD"}', 'https://techcorp.com/jobs/123', NULL, 'high', NULL, '["react","typescript","remote"]', '2024-01-15T00:00:00.000Z'),
    ('74dc5bb0-b84f-43f2-b79d-db671979db04', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Full Stack Engineer', 'interviewing', 'hybrid-1day', 'full-time', 'New York, NY', '{"min":100000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["node","react","mongodb"]', '2024-01-20T00:00:00.000Z'),
    ('cc2702f4-731b-4e0f-82ee-11638b94cf75', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'React Developer', 'offer', 'onsite', 'full-time', 'Seattle, WA', '{"min":150000,"max":180000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","redux","graphql"]', '2024-01-05T00:00:00.000Z'),
    ('3182d1c9-987d-4cfa-8552-97597b5f8ca2', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Software Engineer', 'interviewing', 'remote', 'full-time', 'Austin, TX', NULL, NULL, NULL, 'medium', NULL, '["aws","microservices"]', '2025-10-28T00:00:00.000Z'),
    ('a9d8d3d8-2150-4281-8cbf-55603f08a6bd', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Frontend Architect', 'rejected', 'hybrid-2day', 'contract', 'Boston, MA', '{"min":90,"max":120,"currency":"USD"}', NULL, NULL, 'low', NULL, '["angular","rxjs"]', '2024-01-10T00:00:00.000Z'),
    ('45929941-9785-4301-b455-e548a501f089', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'UI/UX Engineer', 'interviewing', 'remote', 'full-time', 'Remote', NULL, NULL, NULL, 'high', NULL, '["design-systems","react","figma"]', '2025-10-20T00:00:00.000Z'),
    ('362a5fcc-2331-44ea-89a8-88b4abd9a7f0', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'JavaScript Developer', 'accepted', 'hybrid-3day', 'full-time', 'Chicago, IL', '{"min":130000,"max":150000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["typescript","vue","jest"]', '2023-12-20T00:00:00.000Z'),
    ('bbbc202c-4bf3-4a48-b03a-0b3c8643913d', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'React Native Developer', 'offer', 'remote', 'full-time', 'Los Angeles, CA', NULL, NULL, NULL, 'low', NULL, '["react-native","mobile"]', '2024-01-08T00:00:00.000Z'),
    ('19cf7fe9-a280-4d0f-be3c-3721e729dd4c', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","javascript","css"]', '2025-06-15T00:00:00.000Z'),
    ('e80399ec-177a-4fc0-8f30-f909ec1d0eb4', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Full Stack Developer', 'rejected', 'hybrid-4day', 'full-time', 'San Francisco, CA', '{"min":140000,"max":180000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["python","react","ai","ml"]', '2025-07-01T00:00:00.000Z'),
    ('9887d06a-50fe-4e17-b391-36e59c0b81f3', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Software Engineer', 'interviewing', 'remote', 'full-time', 'Portland, OR', '{"min":125000,"max":155000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["sustainability","typescript","node"]', '2025-08-10T00:00:00.000Z'),
    ('0b5f12bb-4ed3-49a4-b3aa-bb40615e965f', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Senior Frontend Engineer', 'applied', 'onsite', 'full-time', 'New York, NY', '{"min":145000,"max":175000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","finance","typescript"]', '2025-08-22T00:00:00.000Z'),
    ('91d76d0e-b7aa-4f8e-b2dd-60305729341a', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'UI Developer', 'rejected', 'remote', 'full-time', 'Remote', NULL, NULL, NULL, 'low', NULL, '["ui","css","design"]', '2025-09-05T00:00:00.000Z'),
    ('9e47147b-1c1e-4b73-b1c8-431e18eba24d', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Frontend Architect', 'interviewing', 'hybrid-4day', 'full-time', 'Los Angeles, CA', '{"min":160000,"max":200000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["streaming","performance","react"]', '2025-09-18T00:00:00.000Z'),
    ('5fe6bdc3-e655-4eee-a068-a06249d4738a', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Senior Software Engineer', 'applied', 'remote', 'full-time', 'Remote', '{"min":130000,"max":160000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["education","react","node"]', '2025-10-01T00:00:00.000Z'),
    ('243188d0-19d0-4bb9-9dc4-ddb8e50e9fb0', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Full Stack Engineer', 'interviewing', 'remote', 'full-time', 'Austin, TX', '{"min":135000,"max":170000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["security","typescript","golang"]', '2025-10-08T00:00:00.000Z'),
    ('6a11b6a9-a922-42b3-88f5-c0cfc5581ca7', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Frontend Developer', 'applied', 'hybrid-1day', 'full-time', 'Boston, MA', '{"min":125000,"max":150000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["healthcare","react","hipaa"]', '2025-10-15T00:00:00.000Z'),
    ('322ec6a2-d248-41e8-b2c1-721799ddde67', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Web Developer', 'applied', 'onsite', 'full-time', 'Seattle, WA', NULL, NULL, NULL, 'low', NULL, '["gaming","webgl","three.js"]', '2025-10-20T00:00:00.000Z'),
    ('023ada9e-e97d-4bb7-bdea-994ccb735071', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Backend Developer', 'rejected', 'remote', 'full-time', 'San Francisco, CA', '{"min":115000,"max":145000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["node","python","aws"]', '2025-05-10T00:00:00.000Z'),
    ('4b463230-7786-4d35-9758-37555cb88757', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'DevOps Engineer', 'rejected', 'hybrid-2day', 'full-time', 'New York, NY', NULL, NULL, NULL, 'low', NULL, '["kubernetes","docker","ci-cd"]', '2025-06-20T00:00:00.000Z'),
    ('d36a9db4-30d3-49d6-92f4-607ace45637a', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Software Engineer II', 'applied', 'onsite', 'full-time', 'Seattle, WA', '{"min":140000,"max":170000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["java","microservices","azure"]', '2025-09-25T00:00:00.000Z'),
    ('bf15fd1f-88d2-4b09-b7f3-ec35360b25f0', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'UI Engineer', 'rejected', 'remote', 'contract', 'Remote', NULL, NULL, NULL, 'low', NULL, '["css","design","react"]', '2025-07-05T00:00:00.000Z'),
    ('43f54c63-b613-454f-b60e-3499743fefe6', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Platform Engineer', 'applied', 'remote', 'full-time', 'Austin, TX', '{"min":130000,"max":160000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["aws","terraform","kubernetes"]', '2025-10-18T00:00:00.000Z'),
    ('98f2a450-2fa3-43a0-a3ca-bde12144940f', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Boston, MA', '{"min":120000,"max":150000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","data-viz","d3"]', '2025-08-15T00:00:00.000Z'),
    ('58bfec7d-92f3-43eb-850d-6c046a79115d', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Senior Software Engineer', 'rejected', 'hybrid-3day', 'full-time', 'San Jose, CA', '{"min":160000,"max":200000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","node","postgres"]', '2025-07-20T00:00:00.000Z'),
    ('25ace9f4-d585-4401-842b-ef5dd326bf66', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'Full Stack Developer', 'applied', 'onsite', 'full-time', 'New York, NY', NULL, NULL, NULL, 'medium', NULL, '["angular","java","spring"]', '2025-10-05T00:00:00.000Z'),
    ('32599543-617f-4d34-ac63-d5667c956e92', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Frontend Engineer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":140000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["vue","typescript","real-estate"]', '2025-09-10T00:00:00.000Z'),
    ('b98f2eda-fd4f-4350-99fc-e65747f3fa8b', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Software Engineer', 'rejected', 'hybrid-4day', 'full-time', 'Denver, CO', NULL, NULL, NULL, 'medium', NULL, '["react","maps","travel"]', '2025-06-10T00:00:00.000Z'),
    ('e1c237ae-48b7-4b8a-8b67-7dffbcb05aa7', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Lead Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":145000,"max":175000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","leadership","education"]', '2025-10-12T00:00:00.000Z'),
    ('5daad65a-5c10-474b-9f21-8ab0b0f9298a', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Web Developer', 'rejected', 'onsite', 'full-time', 'Pittsburgh, PA', NULL, NULL, NULL, 'low', NULL, '["javascript","robotics","iot"]', '2025-05-25T00:00:00.000Z'),
    ('3a37e653-3ae5-42c9-8426-8bdff0ba47d9', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Frontend Developer', 'applied', 'hybrid-1day', 'full-time', 'Los Angeles, CA', '{"min":115000,"max":145000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","e-commerce","fashion"]', '2025-09-20T00:00:00.000Z'),
    ('14aafc93-f263-4cc8-ac8b-f76a3f2c607e', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Machine Learning Engineer', 'applied', 'hybrid-2day', 'full-time', 'San Francisco, CA', '{"min":150000,"max":190000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["python","ml","pytorch"]', '2025-10-10T00:00:00.000Z'),
    ('fbabe648-85f4-4639-86a0-27a9103e4764', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Software Engineer', 'rejected', 'onsite', 'full-time', 'Menlo Park, CA', '{"min":170000,"max":210000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","graphql","social"]', '2025-06-01T00:00:00.000Z'),
    ('4fbaf88c-364f-4cf0-ba73-8a38c4487f4b', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Senior Frontend Engineer', 'applied', 'hybrid-3day', 'full-time', 'Boston, MA', '{"min":140000,"max":170000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["react","healthcare","senior"]', '2025-10-22T00:00:00.000Z'),
    ('db19b869-be51-4795-acd0-18e8e9ad3315', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'Full Stack Engineer', 'applied', 'remote', 'full-time', 'Chicago, IL', '{"min":125000,"max":155000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["node","react","logistics"]', '2025-09-01T00:00:00.000Z'),
    ('2d588573-1ef2-4ee5-9a95-48ee0bd8e5c7', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Software Developer', 'rejected', 'onsite', 'full-time', 'San Diego, CA', NULL, NULL, NULL, 'low', NULL, '["python","biotech","data"]', '2025-07-15T00:00:00.000Z'),
    ('6c63dd12-7bdd-484c-abc8-fd10899f2d27', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Portland, OR', '{"min":120000,"max":145000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","sustainability","clean-energy"]', '2025-08-25T00:00:00.000Z'),
    ('d18949a9-546f-415a-a832-000e1eb9f6f3', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Web Developer', 'rejected', 'hybrid-4day', 'full-time', 'Atlanta, GA', NULL, NULL, NULL, 'low', NULL, '["react","sports","analytics"]', '2025-06-15T00:00:00.000Z'),
    ('b0b8503f-b240-470e-ba9e-30af0a3dca50', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'Senior Software Engineer', 'applied', 'remote', 'full-time', 'Remote', '{"min":135000,"max":165000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["typescript","insurance","react"]', '2025-09-15T00:00:00.000Z'),
    ('fef3ca6b-299c-4cc4-8e61-7e91791068c0', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Frontend Engineer', 'applied', 'hybrid-1day', 'full-time', 'Nashville, TN', '{"min":115000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","music","audio"]', '2025-10-08T00:00:00.000Z'),
    ('60e18b94-78ba-46c8-a08f-e965c6724d5c', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Software Engineer', 'rejected', 'onsite', 'full-time', 'Miami, FL', NULL, NULL, NULL, 'low', NULL, '["react","maps","real-estate"]', '2025-05-15T00:00:00.000Z'),
    ('be966679-73f3-4b07-84ea-f956688f0353', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Full Stack Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":135000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["node","react","agriculture"]', '2025-08-05T00:00:00.000Z'),
    ('d5692efa-0e7c-4a30-877c-6ec95fc41b4f', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Washington, DC', '{"min":125000,"max":150000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","legal","compliance"]', '2025-09-28T00:00:00.000Z'),
    ('346ec3c1-bf8b-4e21-a253-87c7996a2016', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Software Engineer', 'rejected', 'hybrid-2day', 'full-time', 'San Francisco, CA', NULL, NULL, NULL, 'medium', NULL, '["react","advertising","analytics"]', '2025-06-25T00:00:00.000Z'),
    ('13e031c8-e0bd-4e5e-820a-a7ac88c2922d', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Frontend Engineer', 'applied', 'hybrid-3day', 'full-time', 'San Francisco, CA', '{"min":130000,"max":160000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","maps","food-delivery"]', '2025-10-01T00:00:00.000Z'),
    ('3d477a8f-7214-42b7-88e8-989757de6add', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Web Developer', 'applied', 'remote', 'full-time', 'Remote', NULL, NULL, NULL, 'low', NULL, '["react","marketing","analytics"]', '2025-08-20T00:00:00.000Z'),
    ('e287aa0a-dc82-4e14-977d-99ec15dda28b', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Software Engineer', 'rejected', 'onsite', 'full-time', 'Detroit, MI', '{"min":130000,"max":165000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["javascript","automotive","iot"]', '2025-07-10T00:00:00.000Z'),
    ('583cb5aa-b3a3-4e33-8aab-2d13cc121880', v_user_id, '42228724-76ee-463e-9ea4-c5d0dc4142a6', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":105000,"max":130000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","pets","e-commerce"]', '2025-09-05T00:00:00.000Z'),
    ('ba5e0849-eba0-4472-9b16-4b24b687d510', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Software Engineer', 'applied', 'hybrid-4day', 'full-time', 'New York, NY', '{"min":120000,"max":145000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","cms","news"]', '2025-10-14T00:00:00.000Z'),
    ('980f957b-2fc5-4116-a1e4-56b9009107a2', v_user_id, '55bc02c0-f600-4b25-9e0a-1c51504ae241', 'Full Stack Developer', 'rejected', 'onsite', 'full-time', 'Dallas, TX', NULL, NULL, NULL, 'low', NULL, '["node","react","construction"]', '2025-05-20T00:00:00.000Z'),
    ('3ec979b6-4692-437f-b9c5-bd8915c94352', v_user_id, 'fd9b24f0-8f72-4aeb-a8a3-23b91f420a11', 'Software Developer', 'applied', 'onsite', 'full-time', 'Houston, TX', '{"min":125000,"max":155000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["javascript","aerospace","data-viz"]', '2025-08-10T00:00:00.000Z'),
    ('3cc0407e-c3be-4028-bbb3-87c0d0ca06f0', v_user_id, 'cba81a67-8f47-4089-8aba-886e8d36d9b9', 'Frontend Engineer', 'applied', 'hybrid-1day', 'full-time', 'Minneapolis, MN', '{"min":115000,"max":140000,"currency":"USD"}', NULL, NULL, 'medium', NULL, '["react","retail","pos"]', '2025-09-18T00:00:00.000Z'),
    ('70f9a8d1-0480-43c9-956f-9104bb7a12db', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Senior Software Engineer', 'rejected', 'remote', 'full-time', 'Remote', '{"min":150000,"max":190000,"currency":"USD"}', NULL, NULL, 'high', NULL, '["typescript","blockchain","crypto"]', '2025-06-05T00:00:00.000Z'),
    ('a24db58d-15ad-464f-b464-6b5aac44d57e', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Frontend Developer', 'applied', 'remote', 'full-time', 'Remote', '{"min":110000,"max":135000,"currency":"USD"}', NULL, NULL, 'low', NULL, '["react","hr","saas"]', '2025-10-16T00:00:00.000Z'),
    ('4feadbc2-384f-42c7-8e87-e14c1418c8fe', v_user_id, '9b4bf110-deb1-4481-8056-d040a57fd757', 'Web Developer', 'applied', 'hybrid-2day', 'contract', 'Las Vegas, NV', NULL, NULL, NULL, 'low', NULL, '["javascript","events","ticketing"]', '2025-09-22T00:00:00.000Z');

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
    ('b4753530-28cb-41e2-81f9-b508c54cf873', v_user_id, 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, 2, '7aea7a25-c222-4b54-a262-3406c3be2097', '["techcorp","final"]', NULL),
    ('937b457e-b249-4a49-bd9e-2e8cf7e8b855', v_user_id, 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, 1, NULL, '["startup","fintech"]', NULL),
    ('943fc4bc-69f6-488e-ab9a-b82442325a16', v_user_id, 'BigTech Cover Letter', 'cover-letter', 'Dear Michael Chen,

I am excited to apply for the React Developer position at BigTech Solutions. With a proven track record of building enterprise-scale applications and deep expertise in React, Redux, and GraphQL, I am confident I can contribute to your team from day one.

Your company''s commitment to engineering excellence and innovation resonates with my professional values...

Best regards,
[Your Name]', NULL, NULL, 1, NULL, '["bigtech","enterprise"]', NULL),
    ('07ffd204-a1a0-43ee-b530-38b859db109f', v_user_id, 'Portfolio Website', 'other', NULL, NULL, NULL, 1, NULL, '["portfolio","projects"]', NULL),
    ('44edf3cf-5d4b-4ea3-a08d-c864317b81d8', v_user_id, 'GitHub Portfolio', 'other', 'GitHub Profile

Open Source Contributions:
- React Component Library (2.3k stars)
- TypeScript Utilities Package (890 stars)
- Code review participation in 50+ repositories', 'https://github.com/yourname', NULL, 1, NULL, '["github","opensource"]', NULL),
    ('6a0dc2dd-c6ec-4de6-8649-aee2e61ce4b7', v_user_id, 'AWS Solutions Architect Certificate', 'other', NULL, '/documents/aws-certification.pdf', 'application/pdf', 1, NULL, '["aws","cloud","certification"]', NULL),
    ('8b03fb1f-cab2-4eab-83f6-fb5f7c8480a2', v_user_id, 'University Transcript', 'other', NULL, '/documents/transcript.pdf', 'application/pdf', 1, NULL, '["education","official"]', NULL),
    ('85604bda-059a-4a9d-a714-ccfabe4ac71f', v_user_id, 'React Advanced Certification', 'other', NULL, NULL, 'application/pdf', 1, NULL, '["react","frontend","certification"]', NULL),
    ('6f704b82-e309-40f2-b264-6eecccf9c04a', v_user_id, 'References List', 'other', 'PROFESSIONAL REFERENCES

1. Jane Smith - Former Manager
   Senior Engineering Manager, Tech Company
   jane.smith@example.com | (555) 123-4567

2. Robert Johnson - Tech Lead
   Principal Engineer, Innovation Labs
   robert.j@example.com | (555) 234-5678

3. Maria Garcia - Director of Engineering
   VP Engineering, StartupCo
   maria.garcia@example.com | (555) 345-6789', NULL, NULL, 1, NULL, '["references","contacts"]', NULL),
    ('49eef80b-d237-40c1-998f-950831580eb5', v_user_id, 'Side Projects Showcase', 'other', 'SIDE PROJECTS

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
    ('c3b68046-a40f-4dbd-8f3a-766f6175f5c1', v_user_id, 'Salary Research Document', 'other', 'SALARY RESEARCH NOTES

Senior Frontend Developer - Bay Area
- Average: $150k-180k
- Top companies: $180k-220k
- Equity typically: 0.1-0.5%

Sources: Levels.fyi, Glassdoor, Blind', NULL, NULL, 1, NULL, '["research","salary","negotiation"]', NULL),
    ('57c64bbf-6fec-4406-ac87-41352f6f4a3f', v_user_id, 'Technical Blog Posts', 'other', 'PUBLISHED TECHNICAL CONTENT

- "Advanced React Patterns" (15k views)
- "Building Scalable Frontend Architecture" (8k views)
- "TypeScript Best Practices" (12k views)
- "State Management Deep Dive" (6k views)', NULL, NULL, 1, NULL, '["blog","writing","technical"]', NULL),
    ('fdc8ece0-98c0-4102-a2a8-2c0984b94fbe', v_user_id, 'Old Resume 2020', 'resume', 'PROFESSIONAL SUMMARY

Junior developer with 2 years experience...', NULL, NULL, 1, NULL, '["old","outdated"]', '2024-12-01T00:00:00.000Z'),
    ('d2e01c08-145f-4f18-b605-acf3309bbc0a', v_user_id, 'Generic Cover Letter', 'cover-letter', 'To Whom It May Concern,

I am writing to apply for the position...', NULL, NULL, 1, NULL, '["generic","template"]', '2024-11-15T00:00:00.000Z'),
    ('5883bf98-3393-4025-a164-65fb399b023b', v_user_id, 'Incomplete Project Portfolio', 'other', NULL, NULL, NULL, 1, NULL, '["incomplete","draft"]', '2025-01-10T00:00:00.000Z'),
    ('29b2bce7-88ab-4b5a-b67b-82e64ea81de0', v_user_id, 'DataDriven Cover Letter Draft', 'cover-letter', 'Dear Hiring Manager,

I am interested in the Frontend Architect position...', NULL, NULL, 1, NULL, '["draft","datadriven"]', '2024-01-12T00:00:00.000Z'),
    ('697e9aaf-32ee-4909-8eb9-bf897ecd8073', v_user_id, 'Expired Security Clearance', 'other', NULL, NULL, NULL, 1, NULL, '["clearance","expired"]', '2024-10-01T00:00:00.000Z'),
    ('0c34ed36-7850-4ca1-8516-885510545473', v_user_id, 'Old Portfolio Website 2021', 'other', NULL, 'https://old-portfolio.example.com', NULL, 1, NULL, '["outdated","portfolio"]', '2024-11-20T00:00:00.000Z'),
    ('7b1c06ac-d426-4155-9430-a1c04c85cd40', v_user_id, 'Undergraduate Transcript', 'other', NULL, NULL, NULL, 1, NULL, '["education","old"]', '2025-09-15T00:00:00.000Z'),
    ('c5aa420d-09c2-4064-8d3d-18f9ccdc5345', v_user_id, 'Old References 2022', 'other', 'OLD REFERENCES

1. John Doe - Former colleague (contact lost)
2. Sarah Wilson - Moved to different company', NULL, NULL, 1, NULL, '["references","outdated"]', '2024-12-20T00:00:00.000Z');

  INSERT INTO contacts (id, user_id, company_id, name, title, email, phone, linkedin_url, notes)
  VALUES
    ('60960277-af39-4c43-9c3b-4f3eb2a3d936', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Sarah Johnson', 'Senior Recruiter', 'sarah.johnson@techcorp.com', NULL, 'https://linkedin.com/in/sarahjohnson', 'Very responsive, initial contact via LinkedIn'),
    ('eb2b4071-0c99-4645-b0b2-377d3c5b275e', v_user_id, 'ca7dd4f3-6f7d-4f46-8328-d8bf663448b5', 'Michael Chen', 'Engineering Manager', 'michael.chen@bigtech.com', NULL, 'https://linkedin.com/in/michaelchen', 'Will be conducting technical interview'),
    ('367d64cb-a7e5-490a-a929-dba50e568b4c', v_user_id, '29d82696-d691-49ec-bcd9-dc1a9c2aadcc', 'Emily Rodriguez', 'Software Engineer', 'emily@startupxyz.com', NULL, NULL, 'Friend from university, provided referral'),
    ('f11634cc-9e59-453e-b20c-7f9aa33be748', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Tom Wilson', 'Engineering Manager', 'tom.wilson@greentech.com', NULL, 'https://linkedin.com/in/tomwilson', 'Passionate about environmental tech'),
    ('7c00321c-a360-4fb8-aba1-87abe78e2dfd', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Rachel Kim', 'Principal Engineer', 'rachel.kim@mediastream.co', NULL, 'https://linkedin.com/in/rachelkim', 'Expert in video streaming technology'),
    ('0879c270-c9ce-40be-80f3-921114cbd3c2', v_user_id, '71a24a14-8c4f-45ca-8193-ed3ffb709072', 'Olivia Taylor', 'Design Systems Lead', 'olivia.taylor@innovatelabs.com', NULL, 'https://linkedin.com/in/oliviataylor', 'Leading the design systems team'),
    ('a4cf23cf-65a9-4cbb-8214-c2e2494a93a0', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Daniel Roberts', 'Security Architect', 'daniel.roberts@cybersecure.com', NULL, 'https://linkedin.com/in/danielroberts', 'Security expert with 15+ years experience'),
    ('5c6c795d-2176-433b-beb8-27c14ae452ff', v_user_id, '4769b594-1f5a-4207-8123-deea2272668d', 'Marcus Johnson', 'Staff Engineer', 'marcus.johnson@cloudscale.io', NULL, 'https://linkedin.com/in/marcusjohnson', 'Met at a tech conference last year'),
    ('1dcf5c80-bd7a-4acf-bcb2-42d701b50b93', v_user_id, 'de4a4b86-16e8-4131-bc47-71093119b869', 'Jessica Wang', 'Technical Recruiter', 'jessica.wang@ai-innovations.com', NULL, NULL, 'Initial phone screen contact'),
    ('eedea308-53a9-4ca1-a42a-3a9dcf73e7b6', v_user_id, 'f7219323-187e-47ba-9d65-8a0a1953c3d1', 'Kevin Martinez', 'Senior Recruiter', 'kevin.martinez@mediastream.co', NULL, NULL, 'Friendly and professional recruiter'),
    ('3b215fff-c28a-4914-b717-6695c5fe9142', v_user_id, 'f4d4155e-e02a-4230-8684-2da4a79d9b46', 'Amanda Lee', 'Engineering Manager', 'amanda.lee@cybersecure.com', NULL, 'https://linkedin.com/in/amandalee', 'Will conduct technical interview'),
    ('15473287-dedd-43b1-860d-1f66f1ae5da0', v_user_id, '834e566f-4e01-4844-a7b6-eaf8025f81b0', 'Emma Brown', 'Talent Acquisition Specialist', 'emma.brown@greentech.com', NULL, NULL, 'Great communication throughout process');

  INSERT INTO events (id, user_id, application_id, type, status, url, title, description, duration_minutes, scheduled_at, notes)
  VALUES
    ('f989043d-90a9-4fd1-93c2-e7906899e605', v_user_id, 'cd630cbb-3509-4fcc-8bab-82e46ceaeaa0', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2026-01-15T10:00:00Z', ''),
    ('dbe8742f-0367-4c2c-a817-990590802ad4', v_user_id, 'cd630cbb-3509-4fcc-8bab-82e46ceaeaa0', 'behavioral-interview', 'completed', NULL, NULL, NULL, 45, '2026-01-22T14:00:00Z', ''),
    ('85369e54-061d-4cdd-9a02-80b8a0bc7244', v_user_id, 'cd630cbb-3509-4fcc-8bab-82e46ceaeaa0', 'technical-interview', 'scheduled', NULL, NULL, NULL, 90, '2026-02-05T15:00:00Z', ''),
    ('92927659-2d9f-41bc-8448-58e9fd1d907d', v_user_id, '74dc5bb0-b84f-43f2-b79d-db671979db04', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2026-01-10T10:00:00Z', ''),
    ('d07a3d3a-33e5-4a3e-aa16-84a3a744ed68', v_user_id, '74dc5bb0-b84f-43f2-b79d-db671979db04', 'technical-interview', 'completed', 'https://meet.google.com/abc-defg-hij', NULL, NULL, 60, '2026-01-18T14:00:00Z', ''),
    ('5dd1f32b-3be0-472a-929c-cab85b7c1ca2', v_user_id, '74dc5bb0-b84f-43f2-b79d-db671979db04', 'behavioral-interview', 'completed', 'https://zoom.us/j/123456789', NULL, NULL, 45, '2026-01-25T11:00:00Z', ''),
    ('ae6bf2cf-8361-41f7-9801-786ae7ac1b1a', v_user_id, '74dc5bb0-b84f-43f2-b79d-db671979db04', 'onsite', 'scheduled', NULL, NULL, NULL, 90, '2026-02-12T09:00:00Z', ''),
    ('20c7bfb0-e6c4-4472-a286-8b4eac77ae01', v_user_id, 'cc2702f4-731b-4e0f-82ee-11638b94cf75', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2025-11-01T10:00:00Z', ''),
    ('442aee48-d391-452e-8f11-f50e9c2d47e0', v_user_id, 'cc2702f4-731b-4e0f-82ee-11638b94cf75', 'technical-interview', 'completed', 'https://teams.microsoft.com/l/meetup-join/19%3ameeting', NULL, NULL, 75, '2025-11-10T14:00:00Z', ''),
    ('a23c9daa-df62-4fe9-8143-04c9fe1cbddf', v_user_id, 'cc2702f4-731b-4e0f-82ee-11638b94cf75', 'behavioral-interview', 'completed', 'https://meet.google.com/xyz-abcd-efg', NULL, NULL, 60, '2025-11-18T15:00:00Z', ''),
    ('ac73b835-0c7f-4ff6-8a8f-fcf2eb726d3f', v_user_id, 'cc2702f4-731b-4e0f-82ee-11638b94cf75', 'onsite', 'completed', 'https://meet.google.com/final-round-abc', NULL, NULL, 30, '2025-11-25T09:00:00Z', ''),
    ('0519dcad-9a91-4a75-8297-87b260c29530', v_user_id, '362a5fcc-2331-44ea-89a8-88b4abd9a7f0', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2025-10-01T10:00:00Z', ''),
    ('e90e4c61-f4f7-48e4-9727-8f224f733e45', v_user_id, '362a5fcc-2331-44ea-89a8-88b4abd9a7f0', 'behavioral-interview', 'completed', 'https://zoom.us/j/greentech-interview', NULL, NULL, 45, '2025-10-10T14:00:00Z', ''),
    ('3afd00ba-749b-431d-a4a4-d279d75f59c3', v_user_id, '362a5fcc-2331-44ea-89a8-88b4abd9a7f0', 'technical-interview', 'completed', NULL, NULL, NULL, 60, '2025-10-18T15:00:00Z', ''),
    ('e208bf7e-6835-4e4b-ab29-9998d7ccff51', v_user_id, 'a9d8d3d8-2150-4281-8cbf-55603f08a6bd', 'screening-interview', 'completed', NULL, NULL, NULL, 30, '2025-11-15T10:00:00Z', ''),
    ('fac31db0-8b86-4efa-bd3d-5882de3c3909', v_user_id, 'a9d8d3d8-2150-4281-8cbf-55603f08a6bd', 'technical-interview', 'completed', 'https://meet.google.com/mediastream-tech', NULL, NULL, 75, '2025-11-22T14:00:00Z', ''),
    ('81f241be-5487-4c28-a7b7-27fb13738fe0', v_user_id, '3182d1c9-987d-4cfa-8552-97597b5f8ca2', 'screening-interview', 'completed', NULL, NULL, NULL, NULL, '2026-01-20T10:00:00Z', ''),
    ('18566cad-7674-4c1e-a7c9-58af98d1d0aa', v_user_id, '3182d1c9-987d-4cfa-8552-97597b5f8ca2', 'behavioral-interview', 'scheduled', NULL, NULL, NULL, 45, '2026-02-03T14:00:00Z', '');

  INSERT INTO application_documents (id, application_id, document_id, name, type, content, uri, mime_type, revision)
  VALUES
    ('106cf933-84f3-4691-b21d-23a756426801', 'cd630cbb-3509-4fcc-8bab-82e46ceaeaa0', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('d7037e55-ec16-4681-90c1-4690eca9cdaa', 'cd630cbb-3509-4fcc-8bab-82e46ceaeaa0', '7039c702-a60f-4329-8da7-31d323fa9de5', 'TechCorp Cover Letter', 'cover-letter', 'Dear Hiring Manager,

I am excited to apply for the Senior Frontend Developer position at TechCorp...', NULL, NULL, '1'),
    ('8cb8f951-4fc7-4e71-8e0b-7bd01949768f', '74dc5bb0-b84f-43f2-b79d-db671979db04', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('bc9c5555-b105-4dd6-8228-d97e5ba60dcc', 'cc2702f4-731b-4e0f-82ee-11638b94cf75', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('ffbc81ed-9bd2-4d36-b069-8ef5f22a67c4', '3182d1c9-987d-4cfa-8552-97597b5f8ca2', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('4e974f28-12dd-4e80-89be-3e5db410c536', 'a9d8d3d8-2150-4281-8cbf-55603f08a6bd', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('c1aff150-c489-4e13-baca-4c04fb3f61fc', '45929941-9785-4301-b455-e548a501f089', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('17c5e78a-f905-4cec-969a-339e4b383951', '45929941-9785-4301-b455-e548a501f089', 'b4753530-28cb-41e2-81f9-b508c54cf873', 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, '2'),
    ('1d6ce70c-2589-4f17-aa12-cb49fd566077', '362a5fcc-2331-44ea-89a8-88b4abd9a7f0', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('23727bd4-a8e6-4262-ae95-7a375fe7840e', 'bbbc202c-4bf3-4a48-b03a-0b3c8643913d', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('6a819916-9d1a-4720-9daf-f7eba753a769', '19cf7fe9-a280-4d0f-be3c-3721e729dd4c', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('8faa5e1f-de4a-4476-956f-0438d751e508', 'e80399ec-177a-4fc0-8f30-f909ec1d0eb4', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('2e34bb9f-ba8a-4e79-a618-10442277c810', '9887d06a-50fe-4e17-b391-36e59c0b81f3', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('89a5ae6e-825a-4588-b2b8-28aaab6a0399', '9887d06a-50fe-4e17-b391-36e59c0b81f3', '937b457e-b249-4a49-bd9e-2e8cf7e8b855', 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, '1'),
    ('cdd1af6c-004a-4130-9793-7d0be5fdd0a5', '0b5f12bb-4ed3-49a4-b3aa-bb40615e965f', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('6ad9f074-a46c-484f-b109-72c6ce754dad', '91d76d0e-b7aa-4f8e-b2dd-60305729341a', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('d5e82d30-4578-4c7b-ab25-d33648f47cc8', '9e47147b-1c1e-4b73-b1c8-431e18eba24d', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('d73143e8-7bf1-461c-86a8-bbc0152bcd47', '5fe6bdc3-e655-4eee-a068-a06249d4738a', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('95e54e1b-6eae-446c-9c62-709abe54f85f', '243188d0-19d0-4bb9-9dc4-ddb8e50e9fb0', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('b2e73ea7-9083-47f1-a0cf-7449cf0b8638', '243188d0-19d0-4bb9-9dc4-ddb8e50e9fb0', '943fc4bc-69f6-488e-ab9a-b82442325a16', 'BigTech Cover Letter', 'cover-letter', 'Dear Michael Chen,

I am excited to apply for the React Developer position at BigTech Solutions. With a proven track record of building enterprise-scale applications and deep expertise in React, Redux, and GraphQL, I am confident I can contribute to your team from day one.

Your company''s commitment to engineering excellence and innovation resonates with my professional values...

Best regards,
[Your Name]', NULL, NULL, '1'),
    ('acfcf3de-0939-472e-8b60-6ef444363849', '6a11b6a9-a922-42b3-88f5-c0cfc5581ca7', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('ea894203-985c-4c94-be05-85b09b86e1b7', '322ec6a2-d248-41e8-b2c1-721799ddde67', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('deab5a3e-8ede-4ba9-bf48-f2599071f1fb', '023ada9e-e97d-4bb7-bdea-994ccb735071', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('0606dd54-3e65-49c3-bacc-6a31416d4d00', '4b463230-7786-4d35-9758-37555cb88757', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('93125eb2-df57-4cdf-a326-4f052d98e0f5', 'd36a9db4-30d3-49d6-92f4-607ace45637a', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('9588dce5-2858-4b94-9515-1c16ec2ad621', 'd36a9db4-30d3-49d6-92f4-607ace45637a', '7039c702-a60f-4329-8da7-31d323fa9de5', 'TechCorp Cover Letter', 'cover-letter', 'Dear Hiring Manager,

I am excited to apply for the Senior Frontend Developer position at TechCorp...', NULL, NULL, '1'),
    ('70f78c4d-aeab-4b0d-bf19-f81a1c1a34f9', 'bf15fd1f-88d2-4b09-b7f3-ec35360b25f0', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('2cf8da0d-704e-41c1-b258-2db1862e3f5b', '43f54c63-b613-454f-b60e-3499743fefe6', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('7c110c9f-c92a-4260-8cd3-c530acdaba63', '98f2a450-2fa3-43a0-a3ca-bde12144940f', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('b7f844ad-424d-433e-9af4-74663cb4c675', '58bfec7d-92f3-43eb-850d-6c046a79115d', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('565c554a-244a-4a94-93a9-f54bcd83eef0', '25ace9f4-d585-4401-842b-ef5dd326bf66', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('83e3a4ad-bd2f-41c1-b5a8-66eeaa36ccfe', '25ace9f4-d585-4401-842b-ef5dd326bf66', 'b4753530-28cb-41e2-81f9-b508c54cf873', 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, '2'),
    ('33436553-f073-4efe-a8c7-3c51cc1b5683', '32599543-617f-4d34-ac63-d5667c956e92', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('707c9b0d-dfae-473f-aef0-d6b2148531f5', 'b98f2eda-fd4f-4350-99fc-e65747f3fa8b', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('b88f2ed9-91a8-471e-897c-96e2e92d906d', 'e1c237ae-48b7-4b8a-8b67-7dffbcb05aa7', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('0f64694c-c55f-4c72-9a00-4f021a3c3392', '5daad65a-5c10-474b-9f21-8ab0b0f9298a', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('a21bebd2-7f7d-401d-8096-bb6193a53738', '3a37e653-3ae5-42c9-8426-8bdff0ba47d9', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('8d00d306-0560-4a79-b734-c1b220de3c94', '3a37e653-3ae5-42c9-8426-8bdff0ba47d9', '937b457e-b249-4a49-bd9e-2e8cf7e8b855', 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, '1'),
    ('ab41a8a6-2161-4641-9c40-3e189392f2a9', '14aafc93-f263-4cc8-ac8b-f76a3f2c607e', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('e5b1c9e1-4bfe-4bc3-9100-9e98d7b9143f', 'fbabe648-85f4-4639-86a0-27a9103e4764', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('3b77a34e-f49b-4d3e-8778-04409befd3d5', '4fbaf88c-364f-4cf0-ba73-8a38c4487f4b', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('30d3b285-d68a-4aeb-bb76-16a0a40fdc4f', 'db19b869-be51-4795-acd0-18e8e9ad3315', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('d0d94dd2-cf03-46b4-a3a9-f8e86ce318eb', '2d588573-1ef2-4ee5-9a95-48ee0bd8e5c7', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('fd95e367-243c-4aae-8f64-65e9ab655dd0', '2d588573-1ef2-4ee5-9a95-48ee0bd8e5c7', '943fc4bc-69f6-488e-ab9a-b82442325a16', 'BigTech Cover Letter', 'cover-letter', 'Dear Michael Chen,

I am excited to apply for the React Developer position at BigTech Solutions. With a proven track record of building enterprise-scale applications and deep expertise in React, Redux, and GraphQL, I am confident I can contribute to your team from day one.

Your company''s commitment to engineering excellence and innovation resonates with my professional values...

Best regards,
[Your Name]', NULL, NULL, '1'),
    ('d6689f95-37f9-430a-bb17-bda73db3f611', '6c63dd12-7bdd-484c-abc8-fd10899f2d27', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('c27d6211-6d5a-4841-a03b-42028a61614c', 'd18949a9-546f-415a-a832-000e1eb9f6f3', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('cdfa98b6-7ed4-40c8-b01d-e31b1a043c5a', 'b0b8503f-b240-470e-ba9e-30af0a3dca50', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('e3cffcf1-498d-4d49-b8aa-c51bf297fa14', 'fef3ca6b-299c-4cc4-8e61-7e91791068c0', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('006fb382-a2d0-4a91-9eb6-ef2cdfc17119', '60e18b94-78ba-46c8-a08f-e965c6724d5c', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('32c4c270-1dd7-4bce-a366-52fd1414fc0d', '60e18b94-78ba-46c8-a08f-e965c6724d5c', '7039c702-a60f-4329-8da7-31d323fa9de5', 'TechCorp Cover Letter', 'cover-letter', 'Dear Hiring Manager,

I am excited to apply for the Senior Frontend Developer position at TechCorp...', NULL, NULL, '1'),
    ('c4d12667-03bd-461d-a816-4343337f5673', 'be966679-73f3-4b07-84ea-f956688f0353', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('4f65cb7d-f08c-4b2d-bf5f-27327914ab1d', 'd5692efa-0e7c-4a30-877c-6ec95fc41b4f', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('2d19d5fd-0e3a-41a2-beb4-f80caa93833e', '346ec3c1-bf8b-4e21-a253-87c7996a2016', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('f79ed3b3-55f4-4a20-9205-3f1b021d0664', '13e031c8-e0bd-4e5e-820a-a7ac88c2922d', 'bef42652-e0b3-451f-90b3-3241a994b340', 'Full Stack Resume', 'resume', 'PROFESSIONAL SUMMARY

Versatile full stack engineer comfortable working across the entire technology stack...

SKILLS
- Frontend: React, Vue.js, Angular
- Backend: Node.js, Python, Java
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, CI/CD, AWS', NULL, NULL, '1'),
    ('bad5e0b3-5032-45ab-addf-6e5fe083430d', '3d477a8f-7214-42b7-88e8-989757de6add', 'bd48c3fb-8517-4467-86b4-91ca95faceba', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Experienced software engineer with 5+ years building web applications...

SKILLS
- JavaScript, React, Node.js
- HTML, CSS, SQL', NULL, NULL, '1'),
    ('a78dd531-dc54-46f5-8227-915bfb3d0441', '3d477a8f-7214-42b7-88e8-989757de6add', 'b4753530-28cb-41e2-81f9-b508c54cf873', 'TechCorp Cover Letter', 'cover-letter', 'Dear Sarah Johnson,

I am thrilled to apply for the Senior Frontend Developer position at TechCorp. With over 5 years of experience building scalable React applications and a passion for creating exceptional user experiences, I am confident I would be a valuable addition to your team.

Your focus on cloud infrastructure and modern development practices aligns perfectly with my background in AWS, TypeScript, and component-driven architecture...

Best regards,
[Your Name]', NULL, NULL, '2'),
    ('dd5616fc-7261-49de-81ea-7a4b1c5f8883', 'e287aa0a-dc82-4e14-977d-99ec15dda28b', '1dc79247-d306-454a-b039-b8569f1c483f', 'Software Engineer Resume', 'resume', 'PROFESSIONAL SUMMARY

Software Engineer with 5+ years of experience building scalable web applications using modern frameworks. Strong background in React, TypeScript, and cloud architecture...

SKILLS
- Frontend: React, TypeScript, Next.js, Redux
- Backend: Node.js, Express, PostgreSQL
- Cloud: AWS, Docker, Kubernetes', NULL, NULL, '2'),
    ('c1c5d15b-cd2a-4456-90cd-f55f27dc91a6', '583cb5aa-b3a3-4e33-8aab-2d13cc121880', '7aea7a25-c222-4b54-a262-3406c3be2097', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with deep expertise in React, TypeScript...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built responsive web applications', NULL, NULL, '1'),
    ('c95947d7-0620-4966-896b-15998771ad26', 'ba5e0849-eba0-4472-9b16-4b24b687d510', '18d07bb1-aa87-48b1-a5d1-8e058b535bed', 'Frontend Specialist Resume', 'resume', 'PROFESSIONAL SUMMARY

Frontend specialist with 6+ years crafting exceptional user experiences. Deep expertise in React, TypeScript, state management, and component architecture...

EXPERIENCE
Senior Frontend Developer - Current Company (2022-Present)
- Built 15+ responsive web applications serving 100K+ users
- Reduced initial load time by 40% through code splitting and optimization
- Led migration from JavaScript to TypeScript across 50+ components', NULL, NULL, '2'),
    ('f385bb52-20a2-423d-acff-8d32074296ee', '3ec979b6-4692-437f-b9c5-bd8915c94352', '937b457e-b249-4a49-bd9e-2e8cf7e8b855', 'StartupXYZ Cover Letter', 'cover-letter', 'Dear Hiring Team,

I am writing to express my strong interest in the Full Stack Engineer position at StartupXYZ. As someone passionate about fintech innovation, I am excited about the opportunity to contribute to your mission of disrupting the payments industry.

My experience with Node.js, React, and MongoDB makes me well-suited for this role...

Sincerely,
[Your Name]', NULL, NULL, '1');

  INSERT INTO event_contacts (id, event_id, contact_id)
  VALUES
    ('56ecce87-e9f1-4e0c-b745-1a7330df1f54', 'f989043d-90a9-4fd1-93c2-e7906899e605', '60960277-af39-4c43-9c3b-4f3eb2a3d936'),
    ('135eab2e-410d-4ff6-b6bb-7cf1234c8755', 'dbe8742f-0367-4c2c-a817-990590802ad4', '60960277-af39-4c43-9c3b-4f3eb2a3d936'),
    ('0d67c098-79ca-4aa8-9d09-e5ccb1f79350', 'dbe8742f-0367-4c2c-a817-990590802ad4', 'eb2b4071-0c99-4645-b0b2-377d3c5b275e'),
    ('ab776f2d-7da4-47a8-9a1a-d646a6ebe169', '85369e54-061d-4cdd-9a02-80b8a0bc7244', '60960277-af39-4c43-9c3b-4f3eb2a3d936'),
    ('9a702cf1-cf00-40e8-9e15-8767f6f7b68c', '85369e54-061d-4cdd-9a02-80b8a0bc7244', 'eb2b4071-0c99-4645-b0b2-377d3c5b275e'),
    ('164b3192-cb34-48dd-99df-e9e119c5b69e', '92927659-2d9f-41bc-8448-58e9fd1d907d', '367d64cb-a7e5-490a-a929-dba50e568b4c'),
    ('e4480f5d-dcb2-4fe9-a5c1-4c3d851d0309', 'd07a3d3a-33e5-4a3e-aa16-84a3a744ed68', '367d64cb-a7e5-490a-a929-dba50e568b4c'),
    ('ffafcd69-dfac-415a-84f7-079cb58c8e8b', '5dd1f32b-3be0-472a-929c-cab85b7c1ca2', '367d64cb-a7e5-490a-a929-dba50e568b4c'),
    ('441f4be9-0238-4257-bdc9-34dc6bb680c9', 'ae6bf2cf-8361-41f7-9801-786ae7ac1b1a', '367d64cb-a7e5-490a-a929-dba50e568b4c'),
    ('9999f63a-4bb2-4f86-a178-a3e3e89e6817', '0519dcad-9a91-4a75-8297-87b260c29530', '7c00321c-a360-4fb8-aba1-87abe78e2dfd'),
    ('e5b25c21-abc0-454d-91bd-7356f625a22c', '0519dcad-9a91-4a75-8297-87b260c29530', 'eedea308-53a9-4ca1-a42a-3a9dcf73e7b6'),
    ('8b86a5c2-f190-4f87-b90a-9a97a4359d67', 'e90e4c61-f4f7-48e4-9727-8f224f733e45', '7c00321c-a360-4fb8-aba1-87abe78e2dfd'),
    ('071a4773-fce6-40fe-b437-bfe0a6d91a25', '3afd00ba-749b-431d-a4a4-d279d75f59c3', '7c00321c-a360-4fb8-aba1-87abe78e2dfd'),
    ('af8c5208-b189-4840-a482-610d3e03164b', '3afd00ba-749b-431d-a4a4-d279d75f59c3', 'eedea308-53a9-4ca1-a42a-3a9dcf73e7b6'),
    ('b7520daf-0638-4b91-b2a9-1b0a329c7490', 'e208bf7e-6835-4e4b-ab29-9998d7ccff51', '0879c270-c9ce-40be-80f3-921114cbd3c2'),
    ('9d95f414-64a7-4975-a00e-3a13413090c4', 'fac31db0-8b86-4efa-bd3d-5882de3c3909', '0879c270-c9ce-40be-80f3-921114cbd3c2'),
    ('c9e450bd-5d02-4af8-a086-a94259eea076', '81f241be-5487-4c28-a7b7-27fb13738fe0', '5c6c795d-2176-433b-beb8-27c14ae452ff'),
    ('1eaee9a6-db7b-4e0d-8a61-a2de4b61d73f', '18566cad-7674-4c1e-a7c9-58af98d1d0aa', '5c6c795d-2176-433b-beb8-27c14ae452ff');

END $$;
