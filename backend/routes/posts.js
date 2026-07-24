import { Router } from "express";
import db from "../db.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = Router();

function slugify(title) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "post"}-${suffix}`;
}

function serializePost(row, viewerId) {
  const likeCount = db.prepare("SELECT COUNT(*) c FROM likes WHERE post_id = ?").get(row.id).c;
  const commentCount = db.prepare("SELECT COUNT(*) c FROM comments WHERE post_id = ?").get(row.id).c;
  const likedByViewer = viewerId
    ? !!db.prepare("SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?").get(row.id, viewerId)
    : false;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    content: row.content,
    tags: JSON.parse(row.tags || "[]"),
    published: !!row.published,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: { id: row.author_id, username: row.author_username },
    likeCount,
    commentCount,
    likedByViewer,
  };
}

const POST_SELECT = `
  SELECT posts.*, users.username AS author_username
  FROM posts JOIN users ON users.id = posts.author_id
`;

// GET /api/posts?author=username&tag=xyz&page=1
router.get("/", optionalAuth, (req, res) => {
  const { author, tag } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = 10;
  const offset = (page - 1) * pageSize;

  let query = POST_SELECT + " WHERE posts.published = 1";
  const params = [];

  if (author) {
    query += " AND users.username = ?";
    params.push(author);
  }
  if (tag) {
    query += " AND posts.tags LIKE ?";
    params.push(`%"${tag}"%`);
  }

  query += " ORDER BY posts.created_at DESC LIMIT ? OFFSET ?";
  params.push(pageSize, offset);

  const rows = db.prepare(query).all(...params);
  const viewerId = req.user?.id;
  res.json({ posts: rows.map((r) => serializePost(r, viewerId)), page });
});

router.get("/:slug", optionalAuth, (req, res) => {
  const row = db.prepare(POST_SELECT + " WHERE posts.slug = ?").get(req.params.slug);
  if (!row) return res.status(404).json({ error: "That post doesn't exist." });
  res.json({ post: serializePost(row, req.user?.id) });
});

router.post("/", requireAuth, (req, res) => {
  const { title, subtitle = "", content, tags = [], published = true } = req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: "A title and some content are required to publish." });
  }
  if (!Array.isArray(tags)) {
    return res.status(400).json({ error: "Tags must be a list of strings." });
  }

  const slug = slugify(title);
  const info = db
    .prepare(
      "INSERT INTO posts (slug, title, subtitle, content, tags, published, author_id) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(slug, title, subtitle, content, JSON.stringify(tags), published ? 1 : 0, req.user.id);

  const row = db.prepare(POST_SELECT + " WHERE posts.id = ?").get(info.lastInsertRowid);
  res.status(201).json({ post: serializePost(row, req.user.id) });
});

router.put("/:slug", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  if (!existing) return res.status(404).json({ error: "That post doesn't exist." });
  if (existing.author_id !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own posts." });
  }

  const {
    title = existing.title,
    subtitle = existing.subtitle,
    content = existing.content,
    tags = JSON.parse(existing.tags || "[]"),
    published = !!existing.published,
  } = req.body || {};

  db.prepare(
    `UPDATE posts SET title = ?, subtitle = ?, content = ?, tags = ?, published = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(title, subtitle, content, JSON.stringify(tags), published ? 1 : 0, existing.id);

  const row = db.prepare(POST_SELECT + " WHERE posts.id = ?").get(existing.id);
  res.json({ post: serializePost(row, req.user.id) });
});

router.delete("/:slug", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  if (!existing) return res.status(404).json({ error: "That post doesn't exist." });
  if (existing.author_id !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own posts." });
  }
  db.prepare("DELETE FROM posts WHERE id = ?").run(existing.id);
  res.status(204).send();
});

router.post("/:slug/like", requireAuth, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  if (!post) return res.status(404).json({ error: "That post doesn't exist." });

  const already = db.prepare("SELECT 1 FROM likes WHERE post_id = ? AND user_id = ?").get(post.id, req.user.id);
  if (already) {
    db.prepare("DELETE FROM likes WHERE post_id = ? AND user_id = ?").run(post.id, req.user.id);
  } else {
    db.prepare("INSERT INTO likes (post_id, user_id) VALUES (?, ?)").run(post.id, req.user.id);
  }

  const likeCount = db.prepare("SELECT COUNT(*) c FROM likes WHERE post_id = ?").get(post.id).c;
  res.json({ liked: !already, likeCount });
});

export default router;
