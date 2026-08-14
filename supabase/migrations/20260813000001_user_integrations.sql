CREATE TABLE user_integrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  api_key         TEXT,
  status          TEXT NOT NULL DEFAULT 'unconfigured',
  last_error      TEXT,
  last_checked_at TIMESTAMPTZ,
  error_class     TEXT,
  retry_after     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own" ON user_integrations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own" ON user_integrations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own" ON user_integrations
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_user_integrations_user ON user_integrations(user_id);

CREATE TRIGGER user_integrations_updated_at
  BEFORE UPDATE ON user_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
