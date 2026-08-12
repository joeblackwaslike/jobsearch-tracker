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
    'contacts', (SELECT count(*) FROM contacts WHERE user_id = auth.uid() AND archived_at IS NULL),
    'companies', (SELECT count(*) FROM companies WHERE user_id = auth.uid() AND archived_at IS NULL),
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
