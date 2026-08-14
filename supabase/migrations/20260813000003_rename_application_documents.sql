ALTER TABLE application_documents RENAME TO application_events_documents;

ALTER INDEX idx_application_documents_app RENAME TO idx_application_events_documents_app;

ALTER TABLE application_events_documents
  ADD COLUMN event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX idx_application_events_documents_event ON application_events_documents(event_id);
