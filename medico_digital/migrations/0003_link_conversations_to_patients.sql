INSERT INTO patients (user_id, full_name)
SELECT u.id, u.full_name
FROM users u
LEFT JOIN patients p ON p.user_id = u.id
WHERE p.user_id IS NULL;

ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS patient_id BIGINT;

UPDATE conversations c
SET patient_id = p.id
FROM patients p
WHERE c.patient_id IS NULL
  AND p.user_id = c.user_id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_conversations_patient_id'
  ) THEN
    ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_patient_id
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT;
  END IF;
END;
$$;

ALTER TABLE conversations
ALTER COLUMN patient_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_patient_id ON conversations(patient_id);
