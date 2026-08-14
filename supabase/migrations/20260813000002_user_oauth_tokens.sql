CREATE TABLE user_oauth_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT,
  token_expiry    TIMESTAMPTZ,
  granted_scopes  TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, provider)
);

ALTER TABLE user_oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own" ON user_oauth_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own" ON user_oauth_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own" ON user_oauth_tokens
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "delete_own" ON user_oauth_tokens
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_user_oauth_tokens_user ON user_oauth_tokens(user_id);

CREATE TRIGGER user_oauth_tokens_updated_at
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
