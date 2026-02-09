-- records Edge Function 用: ログインユーザーの記録（食事・運動など）を保持するトランザクション
CREATE TABLE public.t_record (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  food_name VARCHAR(200) NOT NULL,
  weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
  intake_kcal NUMERIC(10, 2) NOT NULL CHECK (intake_kcal >= 0),
  exercise_id TEXT,
  duration_minutes NUMERIC(10, 2),
  burned_kcal NUMERIC(10, 2),
  memo TEXT,
  image_url TEXT,
  create_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  update_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  create_user TEXT NOT NULL,
  update_user TEXT NOT NULL
);

CREATE INDEX idx_t_record_auth_user_id_create_date ON public.t_record (auth_user_id, create_date DESC);
