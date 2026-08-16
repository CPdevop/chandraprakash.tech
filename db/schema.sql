-- Chandraprakash Jha portfolio site — backend schema
-- Run once via `npm run db:migrate` (reads DATABASE_URL from .env)

CREATE TABLE IF NOT EXISTS comments (
  id              SERIAL PRIMARY KEY,
  post_slug       TEXT NOT NULL,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL,
  body            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_reply     TEXT,
  admin_reply_at  TIMESTAMPTZ,
  admin_reaction  TEXT,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_comments_slug_status ON comments (post_slug, status);
CREATE INDEX IF NOT EXISTS idx_comments_ip_created ON comments (ip_address, created_at);

-- Safe to re-run against an existing table created before these columns existed
ALTER TABLE comments ADD COLUMN IF NOT EXISTS admin_reply TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS admin_reaction TEXT;

CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  post_slug     TEXT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  question      TEXT NOT NULL,
  answer        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'rejected')),
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions (status);
CREATE INDEX IF NOT EXISTS idx_questions_ip_created ON questions (ip_address, created_at);

-- Ready for the ebook phase, unused until that's built
CREATE TABLE IF NOT EXISTS ebooks (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  file_url      TEXT NOT NULL,
  published     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ebook_leads (
  id            SERIAL PRIMARY KEY,
  ebook_slug    TEXT NOT NULL,
  name          TEXT,
  email         TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Structured lead capture for freelance/job inquiries (separate from the plain contact mailto)
CREATE TABLE IF NOT EXISTS inquiries (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  message       TEXT NOT NULL,
  inquiry_type  TEXT NOT NULL DEFAULT 'general' CHECK (inquiry_type IN ('freelance', 'job', 'general')),
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inquiries_ip_created ON inquiries (ip_address, created_at);

-- One emoji reaction per visitor (by IP) per post. Clicking an already-set
-- reaction removes it (toggle), so this also acts as the "undo" record.
CREATE TABLE IF NOT EXISTS post_reactions (
  id            SERIAL PRIMARY KEY,
  post_slug     TEXT NOT NULL,
  emoji         TEXT NOT NULL,
  ip_address    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_slug, emoji, ip_address)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_slug ON post_reactions (post_slug);
