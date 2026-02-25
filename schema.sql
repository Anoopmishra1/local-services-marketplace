-- ============================================================
-- LOCAL SERVICES MARKETPLACE - DATABASE SCHEMA
-- Supabase / PostgreSQL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- for geolocation queries

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICE CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,   -- e.g. 'Electrician', 'Plumber', 'Tutor'
  icon_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICE PROVIDERS TABLE
-- ============================================================
CREATE TABLE providers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id),
  bio             TEXT,
  skills          TEXT[],             -- e.g. ['wiring', 'fan installation']
  hourly_rate     NUMERIC(10,2) NOT NULL DEFAULT 0,
  experience_yrs  INT DEFAULT 0,
  location        GEOGRAPHY(POINT,4326),  -- lat/lng for proximity search
  address         TEXT,
  city            TEXT,
  state           TEXT,
  rating          NUMERIC(3,2) DEFAULT 0.00,
  total_reviews   INT DEFAULT 0,
  is_approved     BOOLEAN DEFAULT FALSE,
  documents_url   TEXT[],             -- ID proof, certificates
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX providers_location_idx ON providers USING GIST(location);

-- ============================================================
-- PROVIDER AVAILABILITY TABLE
-- ============================================================
CREATE TABLE availability (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun, 6=Sat
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS TABLE
-- ============================================================
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id),
  service_type    TEXT NOT NULL,
  description     TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL,
  duration_hours  NUMERIC(4,2) DEFAULT 1,
  address         TEXT NOT NULL,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  status          TEXT DEFAULT 'pending' CHECK (
                    status IN ('pending','accepted','rejected','in_progress','completed','cancelled')
                  ),
  total_amount    NUMERIC(10,2),
  is_paid         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount                NUMERIC(10,2) NOT NULL,
  currency              TEXT DEFAULT 'INR',
  razorpay_order_id     TEXT UNIQUE,
  razorpay_payment_id   TEXT UNIQUE,
  razorpay_signature    TEXT,
  status                TEXT DEFAULT 'pending' CHECK (
                          status IN ('pending','captured','failed','refunded')
                        ),
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVIEWS TABLE
-- ============================================================
CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MESSAGES (CHAT) TABLE
-- ============================================================
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISPUTES TABLE
-- ============================================================
CREATE TABLE disputes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  raised_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  status        TEXT DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','closed')),
  admin_notes   TEXT,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMISSIONS TABLE
-- ============================================================
CREATE TABLE commissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  gross_amount  NUMERIC(10,2) NOT NULL,
  percentage    NUMERIC(5,2) DEFAULT 15.00,   -- platform fee %
  commission    NUMERIC(10,2) NOT NULL,        -- calculated: gross * percentage/100
  provider_payout NUMERIC(10,2) NOT NULL,      -- gross - commission
  is_settled    BOOLEAN DEFAULT FALSE,
  settled_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS: update `updated_at` automatically
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER providers_updated_at BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: auto-update provider rating after review insert
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET
    rating = (SELECT AVG(rating) FROM reviews WHERE provider_id = NEW.provider_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_provider_rating();

-- ============================================================
-- TRIGGER: auto-create commission record after payment capture
-- ============================================================
CREATE OR REPLACE FUNCTION create_commission_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  booking_record  bookings%ROWTYPE;
  comm_pct        NUMERIC := 15.00;
  comm_amount     NUMERIC;
  prov_payout     NUMERIC;
BEGIN
  IF NEW.status = 'captured' AND OLD.status != 'captured' THEN
    SELECT * INTO booking_record FROM bookings WHERE id = NEW.booking_id;
    comm_amount := NEW.amount * comm_pct / 100;
    prov_payout := NEW.amount - comm_amount;
    INSERT INTO commissions (booking_id, provider_id, gross_amount, percentage, commission, provider_payout)
    VALUES (NEW.booking_id, booking_record.provider_id, NEW.amount, comm_pct, comm_amount, prov_payout);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_payment_captured AFTER UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION create_commission_on_payment();

-- ============================================================
-- SEED DATA: Categories
-- ============================================================
INSERT INTO categories (name, icon_url) VALUES
  ('Electrician',   'https://cdn.icons8.com/electrician.png'),
  ('Plumber',       'https://cdn.icons8.com/plumber.png'),
  ('Tutor',         'https://cdn.icons8.com/tutor.png'),
  ('Carpenter',     'https://cdn.icons8.com/carpenter.png'),
  ('Painter',       'https://cdn.icons8.com/painter.png'),
  ('Cleaner',       'https://cdn.icons8.com/cleaner.png'),
  ('AC Technician', 'https://cdn.icons8.com/ac.png');
