-- 在 Supabase SQL Editor 中执行以下 SQL

-- 旅行表
CREATE TABLE travels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  cover_url   TEXT,
  location    TEXT NOT NULL,
  travel_date DATE NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  content     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 旅行相册
CREATE TABLE travel_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id   UUID REFERENCES travels(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  caption     TEXT,
  sort_order  INTEGER DEFAULT 0
);

-- 电影表
CREATE TABLE movies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  poster_url  TEXT,
  year        INTEGER,
  overview    TEXT,
  rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
  review      TEXT,
  watched_at  DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 游戏表
CREATE TABLE games (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  cover_url   TEXT,
  platform    TEXT[] DEFAULT '{}',
  status      TEXT DEFAULT 'want_to_play' CHECK (status IN ('want_to_play', 'playing', 'completed', 'dropped')),
  rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
  steam_url   TEXT,
  categories  TEXT[] DEFAULT '{}',
  review      TEXT,
  play_time   INTEGER DEFAULT 0,
  started_at  DATE,
  completed_at DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX idx_travels_slug ON travels(slug);
CREATE INDEX idx_travels_date ON travels(travel_date DESC);
CREATE INDEX idx_movies_slug ON movies(slug);
CREATE INDEX idx_movies_year ON movies(year DESC);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_completed ON games(completed_at DESC);

-- 存储桶 (在 Supabase Storage 中手动创建)
-- 1. travel-covers   (Public)
-- 2. travel-photos   (Public)
-- 3. movie-posters   (Public)
-- 4. game-covers     (Public)

-- Row Level Security 策略（可选，如果只用 anon key 公开读取）
ALTER TABLE travels ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- 公开读取策略
CREATE POLICY "public_read_travels" ON travels FOR SELECT USING (true);
CREATE POLICY "public_read_travel_photos" ON travel_photos FOR SELECT USING (true);
CREATE POLICY "public_read_movies" ON movies FOR SELECT USING (true);
CREATE POLICY "public_read_games" ON games FOR SELECT USING (true);
