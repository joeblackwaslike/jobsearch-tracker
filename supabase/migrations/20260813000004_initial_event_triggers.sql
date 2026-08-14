CREATE OR REPLACE FUNCTION create_initial_application_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO events (
    user_id,
    application_id,
    type,
    title,
    status,
    notes
  ) VALUES (
    NEW.user_id,
    NEW.id,
    CASE WHEN NEW.status = 'applied' THEN 'applied' ELSE 'bookmarked' END,
    CASE WHEN NEW.status = 'applied' THEN 'Applied' ELSE 'Bookmarked' END,
    'completed',
    'Automatically created when application was added.'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER application_insert_event
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_application_event();

CREATE OR REPLACE FUNCTION create_applied_event_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'bookmarked' AND NEW.status = 'applied' THEN
    INSERT INTO events (
      user_id,
      application_id,
      type,
      title,
      status,
      notes
    ) VALUES (
      NEW.user_id,
      NEW.id,
      'applied',
      'Applied',
      'completed',
      'Automatically created when status changed to applied.'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER application_status_change_event
  AFTER UPDATE OF status ON applications
  FOR EACH ROW
  EXECUTE FUNCTION create_applied_event_on_status_change();
