CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE CHECK (email = lower(email)),
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  pending_email VARCHAR(255),
  verification_token VARCHAR(255),
  token_expiration TIMESTAMPTZ,
  has_password BOOLEAN NOT NULL DEFAULT true,
  reset_password_token VARCHAR(255),
  reset_password_expiration TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE escaperooms (
  id SERIAL PRIMARY KEY,
  theme VARCHAR(255) NOT NULL UNIQUE,
  genre VARCHAR(255) NOT NULL CHECK (genre IN ('Horror', 'Detective', 'Adventure', 'Fantasy', 'Crime', 'Sci-Fi', 'Historical', 'Comedy')),
  difficulty VARCHAR(255) NOT NULL,
  age_group VARCHAR(255) NOT NULL,
  players_min INTEGER NOT NULL CHECK (players_min > 0),
  players_max INTEGER NOT NULL CHECK (players_max >= players_min AND players_max <= 20),
  price INTEGER NOT NULL CHECK (price >= 0 AND price <= 1000000),
  description TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration BETWEEN 15 AND 240),
  image_url TEXT NOT NULL,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(gallery) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  escape_room_id INTEGER NOT NULL REFERENCES escaperooms(id) ON DELETE CASCADE,
  number_of_players INTEGER NOT NULL CHECK (number_of_players BETWEEN 1 AND 20),
  date DATE NOT NULL,
  time TIME NOT NULL,
  payment_status VARCHAR(255) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled')),
  payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (payment_amount >= 0),
  payment_method VARCHAR(255),
  transaction_id VARCHAR(255) UNIQUE,
  paypal_order_id VARCHAR(255) UNIQUE,
  paypal_amount NUMERIC(12, 2),
  status VARCHAR(255) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX bookings_occupied_slot ON bookings (escape_room_id, date, time)
  WHERE status IN ('active', 'completed');
CREATE INDEX bookings_user_status_date ON bookings (user_id, status, date);
CREATE INDEX bookings_room_date ON bookings (escape_room_id, date);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  escape_room_id INTEGER NOT NULL REFERENCES escaperooms(id) ON DELETE CASCADE,
  rating REAL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  reply TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (rating IS NOT NULL OR length(trim(comment)) > 0)
);
CREATE INDEX reviews_room_created ON reviews (escape_room_id, created_at DESC);
CREATE INDEX reviews_user ON reviews (user_id);

CREATE TABLE auth_challenges (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code_hash VARCHAR(64) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX auth_challenges_expiry ON auth_challenges (expires_at);
