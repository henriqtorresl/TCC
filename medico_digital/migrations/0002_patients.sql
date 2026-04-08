CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE NULL,
  cpf TEXT NULL,
  phone TEXT NULL,
  gender TEXT NULL CHECK (gender IN ('male', 'female', 'other', 'unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
