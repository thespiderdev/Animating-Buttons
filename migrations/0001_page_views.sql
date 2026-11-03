CREATE TABLE page_views (
  path TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE site_views (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  views INTEGER NOT NULL DEFAULT 0
);

INSERT INTO site_views (id, views) VALUES (1, 0);
