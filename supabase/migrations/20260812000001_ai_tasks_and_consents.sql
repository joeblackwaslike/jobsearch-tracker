-- Task types for AI-assisted workflows
CREATE TYPE task_type AS ENUM ('company_research', 'email_draft', 'contact_research', 'thank_you_draft');

-- Task status lifecycle
CREATE TYPE task_status AS ENUM (
  'pending',
  'running',
  'needs_input',
  'blocked',
  'awaiting_approval',
  'approved',
  'terminated',
  'completed',
  'failed'
);

-- Document source (user-created vs AI-generated)
CREATE TYPE document_source AS ENUM ('user', 'ai_generated');

-- Document status
CREATE TYPE document_status AS ENUM ('draft', 'approved', 'sent', 'archived');

-- Tasks table: core orchestration entity
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  type task_type NOT NULL,
  status task_status NOT NULL DEFAULT 'pending',
  payload JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  termination_reason TEXT,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_tasks" ON tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own_tasks" ON tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_tasks" ON tasks
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own_tasks" ON tasks
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_application_id ON tasks(application_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Auto-update updated_at
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- User consents table: append-only privacy audit trail
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_consents" ON user_consents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own_consents" ON user_consents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add source and status columns to documents
ALTER TABLE documents ADD COLUMN source document_source NOT NULL DEFAULT 'user';
ALTER TABLE documents ADD COLUMN status document_status NOT NULL DEFAULT 'draft';

-- Add AI feature flags to user_settings
ALTER TABLE user_settings ADD COLUMN ai_features_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN ai_company_research BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE user_settings ADD COLUMN anthropic_api_key TEXT;
