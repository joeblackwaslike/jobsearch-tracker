select cron.schedule(
  'send-interview-reminders',
  '0 11 * * *',  -- 6am EST = 11am UTC
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/send-interview-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  )
  $$
);
