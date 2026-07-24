import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });

router.get("/:slug/comments", (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE slug = ?").get(req.params.slug);
  if (!post) return res.status(404).json({ error: "That post doesn't exist." });

  const rows = db
    .prepare(
      `SELECT comments.*, users.username AS author_username
       FROM comments JOIN users ON users.id = comments.author_id
       WHERE post_id = ? ORDER BY comments.created_at ASC`
    )
    .all(post.id);

  res.json({
    comments: rows.map((r) => ({
      id: r.id,
      body: r.body,
      created_at: r.created_at,
      author: { id: r.author_id, username: r.author_username },
    })),
  });
});

router.post("/:slug/comments", requireAuth, (req, res) => {
  const post = db.prepare("SELECT id FROM posts WHERE slug = ?").get(req.params.slug);
  if (!post) return res.status(404).json({ error: "That post doesn't exist." });

  const { body } = req.body || {};
  if (!body || !body.trim()) {
    return res.status(400).json({ error: "A comment can't be empty." });
  }

  const info = db
    .prepare("INSERT INTO comments (post_id, author_id, body) VALUES (?, ?, ?)")
    .run(post.id, req.user.id, body.trim());

  const row = db
    .prepare(
      `SELECT comments.*, users.username AS author_username
       FROM comments JOIN users ON users.id = comments.author_id
       WHERE comments.id = ?`
    )
    .get(info.lastInsertRowid);

  res.status(201).json({
    comment: {
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      author: { id: row.author_id, username: row.author_username },
    },
  });
});

export default router;
