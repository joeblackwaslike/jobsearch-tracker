ALTER TABLE companies
  ADD CONSTRAINT companies_user_id_name_unique UNIQUE (user_id, name);
