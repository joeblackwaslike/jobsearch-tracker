-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-----------------------------------------------------------
-- COMPANIES
-----------------------------------------------------------
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  links JSONB DEFAULT '{}',
  industry VARCHAR(100) DEFAULT '',
  size VARCHAR(50) DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  founded DATE,
  culture TEXT DEFAULT '',
  benefits TEXT DEFAULT '',
  pros TEXT DEFAULT '',
  cons TEXT DEFAULT '',
  tech_stack TEXT DEFAULT '',
  ratings JSONB DEFAULT '{}',
  tags JSONB DEFAULT '[]',
  researched BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON companies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON companies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON companies FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON companies FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- APPLICATIONS
-----------------------------------------------------------
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  position VARCHAR(255) NOT NULL,
  status TEXT NOT NULL DEFAULT 'bookmarked',
  work_type TEXT DEFAULT '',
  employment_type TEXT DEFAULT '',
  location VARCHAR(255) DEFAULT '',
  salary JSONB DEFAULT '{}',
  url TEXT DEFAULT '',
  job_description TEXT DEFAULT '',
  interest TEXT DEFAULT 'medium',
  source VARCHAR(100) DEFAULT '',
  tags JSONB DEFAULT '[]',
  applied_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archived_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON applications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON applications FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON applications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON applications FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- EVENTS (interviews + timeline)
-----------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  title VARCHAR(255) DEFAULT '',
  description TEXT DEFAULT '',
  url TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON events FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON events FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- DOCUMENTS
-----------------------------------------------------------
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  content TEXT DEFAULT '',
  uri TEXT,
  mime_type VARCHAR(100),
  revision VARCHAR(50) DEFAULT '',
  parent_id UUID REFERENCES documents(id),
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  archived_at TIMESTAMPTZ
);

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON documents FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- APPLICATION_DOCUMENTS (snapshot / line-item)
-----------------------------------------------------------
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type TEXT NOT NULL,
  content TEXT DEFAULT '',
  uri TEXT,
  mime_type VARCHAR(100),
  revision VARCHAR(50) DEFAULT '',
  linked_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_via_application" ON application_documents
  FOR SELECT USING (
    application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
  );
CREATE POLICY "insert_via_application" ON application_documents
  FOR INSERT WITH CHECK (
    application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
  );
CREATE POLICY "delete_via_application" ON application_documents
  FOR DELETE USING (
    application_id IN (SELECT id FROM applications WHERE user_id = auth.uid())
  );

-----------------------------------------------------------
-- CONTACTS
-----------------------------------------------------------
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255) DEFAULT '',
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "delete_own" ON contacts FOR DELETE USING (user_id = auth.uid());

-----------------------------------------------------------
-- USER_SETTINGS
-----------------------------------------------------------
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark' NOT NULL,
  language TEXT DEFAULT 'en' NOT NULL,
  calendar_type TEXT DEFAULT 'gregorian' NOT NULL,
  date_format TEXT DEFAULT 'MM/DD/YYYY' NOT NULL,
  time_format TEXT DEFAULT '12h' NOT NULL,
  compact_mode BOOLEAN DEFAULT false NOT NULL,
  show_avatars BOOLEAN DEFAULT true NOT NULL,
  notify_backup BOOLEAN DEFAULT true NOT NULL,
  notify_status BOOLEAN DEFAULT true NOT NULL,
  notify_deadline BOOLEAN DEFAULT true NOT NULL,
  notify_interview BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "insert_own" ON user_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_own" ON user_settings FOR UPDATE USING (user_id = auth.uid());

-- Auto-create settings row when a new user signs up
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_settings();

-----------------------------------------------------------
-- DASHBOARD RPC
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_applications', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND archived_at IS NULL),
    'interviews_upcoming', (SELECT count(*) FROM events WHERE user_id = auth.uid() AND type LIKE '%interview%' AND scheduled_at > now()),
    'active_applications', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status IN ('applied', 'interviewing') AND archived_at IS NULL),
    'offers', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status = 'offer'),
    'rejections', (SELECT count(*) FROM applications WHERE user_id = auth.uid() AND status = 'rejected'),
    'contacts', (SELECT count(*) FROM contacts WHERE user_id = auth.uid()),
    'companies', (SELECT count(*) FROM companies WHERE user_id = auth.uid()),
    'response_rate', (
      SELECT CASE WHEN total = 0 THEN 0 ELSE round((with_interviews::numeric / total * 100), 1) END
      FROM (
        SELECT count(*) as total,
               count(*) FILTER (WHERE status IN ('interviewing', 'offer', 'accepted')) as with_interviews
        FROM applications WHERE user_id = auth.uid() AND archived_at IS NULL
      ) s
    )
  );
$$;

-----------------------------------------------------------
-- INDEXES
-----------------------------------------------------------
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_company_id ON applications(company_id);
CREATE INDEX idx_applications_status ON applications(user_id, status);
CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_name ON companies(user_id, name);
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_application_id ON events(application_id);
CREATE INDEX idx_events_scheduled ON events(user_id, scheduled_at);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_application_documents_app ON application_documents(application_id);

-----------------------------------------------------------
-- STORAGE
-----------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

CREATE POLICY "Users can manage own files"
  ON storage.objects FOR ALL
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
