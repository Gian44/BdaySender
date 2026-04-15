CREATE TABLE IF NOT EXISTS people (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  birthdate DATE NOT NULL,
  custom_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS nickname TEXT NOT NULL DEFAULT '';

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS custom_template TEXT;

CREATE TABLE IF NOT EXISTS message_template (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS send_logs (
  id BIGSERIAL PRIMARY KEY,
  person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  sent_local_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS send_logs_person_day_unique
  ON send_logs(person_id, sent_local_date)
  WHERE status = 'success';
