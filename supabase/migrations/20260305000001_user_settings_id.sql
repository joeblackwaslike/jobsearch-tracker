-- Add surrogate PK to user_settings.
-- user_id was the PK; it remains a FK to auth.users with a UNIQUE constraint.
ALTER TABLE user_settings ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE user_settings DROP CONSTRAINT user_settings_pkey;
ALTER TABLE user_settings ADD PRIMARY KEY (id);
ALTER TABLE user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);
