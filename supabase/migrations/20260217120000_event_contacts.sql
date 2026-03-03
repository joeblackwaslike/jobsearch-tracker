-- Event-contacts junction table (interviewers per interview)
CREATE TABLE event_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, contact_id)
);

ALTER TABLE event_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_via_event" ON event_contacts
  FOR SELECT USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );
CREATE POLICY "insert_via_event" ON event_contacts
  FOR INSERT WITH CHECK (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );
CREATE POLICY "delete_via_event" ON event_contacts
  FOR DELETE USING (
    event_id IN (SELECT id FROM events WHERE user_id = auth.uid())
  );

CREATE INDEX idx_event_contacts_event ON event_contacts(event_id);
CREATE INDEX idx_event_contacts_contact ON event_contacts(contact_id);
