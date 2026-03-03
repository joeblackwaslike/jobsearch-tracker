alter table user_settings
  add column if not exists email_reminders boolean not null default true;
